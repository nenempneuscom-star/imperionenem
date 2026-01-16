/**
 * Script de teste para emissão de NFC-e
 * Executa localmente para debug detalhado
 *
 * Uso: npx ts-node scripts/test-nfce.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import { lerCertificadoA1 } from '../src/lib/fiscal/certificate/index'
import { gerarXMLNFCe, gerarLoteEnvio } from '../src/lib/fiscal/xml/generator'
import { assinarXML } from '../src/lib/fiscal/xml/signer'
import { NFCeData } from '../src/lib/fiscal/types'
import axios from 'axios'
import * as https from 'https'

// Configurações do Supabase
const SUPABASE_URL = 'https://wxtincvnlpawfvmzjnpx.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4dGluY3ZubHBhd2Z2bXpqbnB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODIyODIzNSwiZXhwIjoyMDgzODA0MjM1fQ.DxM4P38uedNRxqSqzs0gTvopuZS_bvcCHIX9fJ5Jw4E'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function main() {
  console.log('='.repeat(80))
  console.log('TESTE DE EMISSÃO NFC-e - DEBUG DETALHADO')
  console.log('='.repeat(80))
  console.log()

  try {
    // 1. Buscar dados da empresa
    console.log('[1] Buscando dados da empresa...')
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .single()

    if (empresaError || !empresa) {
      throw new Error(`Erro ao buscar empresa: ${empresaError?.message}`)
    }

    console.log(`    Empresa: ${empresa.razao_social}`)
    console.log(`    CNPJ: ${empresa.cnpj}`)
    console.log(`    IE: ${empresa.inscricao_estadual}`)
    console.log()

    const configFiscal = empresa.config_fiscal || {}
    console.log('[2] Configuração Fiscal:')
    console.log(`    Ambiente: ${configFiscal.ambiente === 1 ? 'PRODUÇÃO' : 'HOMOLOGAÇÃO'}`)
    console.log(`    Série NFC-e: ${configFiscal.serie_nfce}`)
    console.log(`    Último número: ${configFiscal.ultimo_numero_nfce}`)
    console.log(`    CSC COMPLETO: ${configFiscal.csc_nfce}`)
    console.log(`    ID Token: ${configFiscal.id_token_nfce}`)
    console.log(`    Certificado: ${configFiscal.certificado_nome || 'Configurado'}`)
    console.log()

    // 2. Carregar certificado
    console.log('[3] Carregando certificado digital...')
    const certificado = lerCertificadoA1(
      configFiscal.certificado_base64,
      configFiscal.certificado_senha
    )
    console.log(`    Subject: ${certificado.info.subject.substring(0, 60)}...`)
    console.log(`    Válido até: ${certificado.info.validTo}`)
    console.log(`    CNPJ no cert: ${certificado.info.cnpj}`)
    console.log()

    // 3. Preparar dados de teste
    console.log('[4] Preparando dados de teste...')
    const dadosNFCe: NFCeData = {
      tipo: 'nfce',
      ambiente: configFiscal.ambiente || 2, // Usa ambiente configurado
      serie: configFiscal.serie_nfce || 1,
      numero: (configFiscal.ultimo_numero_nfce || 0) + 1,
      dataEmissao: new Date(),
      idToken: configFiscal.id_token_nfce || 1,
      csc: configFiscal.csc_nfce || '',
      empresa: {
        cnpj: empresa.cnpj,
        razaoSocial: empresa.razao_social,
        nomeFantasia: empresa.nome_fantasia,
        inscricaoEstadual: empresa.inscricao_estadual,
        crt: configFiscal.crt || 1,
        endereco: {
          logradouro: empresa.endereco?.logradouro || '',
          numero: empresa.endereco?.numero || '',
          complemento: empresa.endereco?.complemento,
          bairro: empresa.endereco?.bairro || '',
          codigoMunicipio: empresa.endereco?.codigo_municipio || '',
          nomeMunicipio: empresa.endereco?.cidade || '',
          uf: empresa.endereco?.uf || 'SC',
          cep: empresa.endereco?.cep || '',
          pais: 'BRASIL',
          codigoPais: '1058',
          telefone: empresa.telefone,
        },
      },
      produtos: [
        {
          codigo: 'TESTE001',
          cEAN: 'SEM GTIN',
          // Em homologação, descrição obrigatória. Em produção, pode usar qualquer descrição.
          descricao: (configFiscal.ambiente || 2) === 2
            ? 'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL'
            : 'PRODUTO TESTE NFCE',
          ncm: '40111000',
          cfop: configFiscal.cfop_venda || '5102',
          unidade: 'UN',
          quantidade: 1,
          valorUnitario: 0.01,
          valorTotal: 0.01,
          icms: {
            origem: 0,
            cst: '00',
          },
          pis: { cst: '07' },
          cofins: { cst: '07' },
        },
      ],
      pagamentos: [
        {
          forma: '01', // Dinheiro
          valor: 0.01,
        },
      ],
      valorTotal: 0.01,
    }

    console.log(`    Número da nota: ${dadosNFCe.numero}`)
    console.log(`    Valor total: R$ ${dadosNFCe.valorTotal}`)
    console.log()

    // 4. Gerar XML
    console.log('[5] Gerando XML da NFC-e...')
    const { xml, chave, infNFeSupl } = gerarXMLNFCe(dadosNFCe)
    console.log(`    Chave de acesso: ${chave}`)
    console.log()

    // Salvar XML não assinado
    const xmlDir = path.join(__dirname, 'xml-debug')
    if (!fs.existsSync(xmlDir)) {
      fs.mkdirSync(xmlDir, { recursive: true })
    }
    fs.writeFileSync(path.join(xmlDir, '1-xml-sem-assinatura.xml'), xml)
    console.log(`    Salvo: xml-debug/1-xml-sem-assinatura.xml`)

    // 5. Mostrar info do QR Code (já incluído no XML)
    console.log('[6] Verificando QR Code (infNFeSupl)...')
    console.log(`    infNFeSupl já incluído no XML antes da assinatura`)
    console.log(`    Tamanho: ${infNFeSupl.length} chars`)
    console.log(`    Tem CDATA: ${infNFeSupl.includes('CDATA')}`)

    // 6. Assinar XML (já contém infNFeSupl)
    console.log('[7] Assinando XML...')
    const xmlAssinado = assinarXML(xml, certificado)
    fs.writeFileSync(path.join(xmlDir, '2-xml-assinado.xml'), xmlAssinado)
    console.log(`    Salvo: xml-debug/2-xml-assinado.xml`)

    // 8. Gerar lote
    console.log('[8] Gerando lote de envio...')
    const idLote = Date.now().toString().slice(-15)
    const loteXML = gerarLoteEnvio(xmlAssinado, idLote)
    fs.writeFileSync(path.join(xmlDir, '3-lote-envio.xml'), loteXML)
    console.log(`    ID Lote: ${idLote}`)
    console.log(`    Salvo: xml-debug/3-lote-envio.xml`)

    // 9. Gerar envelope SOAP
    console.log('[9] Gerando envelope SOAP...')
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4">
      ${loteXML}
    </nfeDadosMsg>
  </soap12:Body>
</soap12:Envelope>`
    fs.writeFileSync(path.join(xmlDir, '4-soap-envelope.xml'), soapEnvelope)
    console.log(`    Salvo: xml-debug/4-soap-envelope.xml`)
    console.log()

    // 10. Analisar estrutura do XML
    console.log('[10] Analisando estrutura do XML...')
    const estrutura = analisarEstruturaXML(xmlAssinado)
    console.log(estrutura)
    console.log()

    // 11. Enviar para SEFAZ
    console.log('[11] Enviando para SEFAZ...')
    const url = dadosNFCe.ambiente === 1
      ? 'https://nfce.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx'
      : 'https://nfce-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx'

    console.log(`    URL: ${url}`)
    console.log()

    const httpsAgent = new https.Agent({
      cert: certificado.pem.cert,
      key: certificado.pem.key,
      rejectUnauthorized: false,
      secureProtocol: 'TLSv1_2_method',
    })

    try {
      const response = await axios.post(url, soapEnvelope, {
        httpsAgent,
        headers: {
          'Content-Type': 'application/soap+xml; charset=utf-8',
          'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLote',
        },
        timeout: 60000,
      })

      console.log('[12] RESPOSTA DA SEFAZ:')
      console.log('-'.repeat(80))
      fs.writeFileSync(path.join(xmlDir, '5-resposta-sefaz.xml'), response.data)
      console.log(`    Status HTTP: ${response.status}`)
      console.log(`    Salvo: xml-debug/5-resposta-sefaz.xml`)
      console.log()
      console.log('    Conteúdo:')
      console.log(response.data)
    } catch (axiosError: any) {
      console.log('[12] ERRO NA REQUISIÇÃO:')
      console.log('-'.repeat(80))
      console.log(`    Status: ${axiosError.response?.status || 'N/A'}`)
      console.log(`    Código: ${axiosError.code || 'N/A'}`)
      console.log(`    Mensagem: ${axiosError.message}`)

      if (axiosError.response?.data) {
        fs.writeFileSync(path.join(xmlDir, '5-erro-sefaz.xml'), axiosError.response.data)
        console.log(`    Salvo: xml-debug/5-erro-sefaz.xml`)
        console.log()
        console.log('    Resposta de erro:')
        console.log(axiosError.response.data)
      }
    }

    console.log()
    console.log('='.repeat(80))
    console.log('ARQUIVOS DE DEBUG SALVOS EM: scripts/xml-debug/')
    console.log('='.repeat(80))

  } catch (error: any) {
    console.error('ERRO:', error.message)
    console.error(error.stack)
  }
}

function analisarEstruturaXML(xml: string): string {
  const lines: string[] = []

  // Verificar ordem dos elementos principais
  const nfeMatch = xml.match(/<NFe[^>]*>/)
  const infNFeMatch = xml.match(/<infNFe[^>]*>/)
  const signatureMatch = xml.match(/<Signature[^>]*>/)
  const infNFeSuplMatch = xml.match(/<infNFeSupl>/)

  lines.push('    Elementos encontrados:')
  lines.push(`      - <NFe>: ${nfeMatch ? 'SIM' : 'NÃO'}`)
  lines.push(`      - <infNFe>: ${infNFeMatch ? 'SIM' : 'NÃO'}`)
  lines.push(`      - <Signature>: ${signatureMatch ? 'SIM' : 'NÃO'}`)
  lines.push(`      - <infNFeSupl>: ${infNFeSuplMatch ? 'SIM' : 'NÃO'}`)

  // Verificar ordem
  if (infNFeMatch && signatureMatch && infNFeSuplMatch) {
    const infNFePos = xml.indexOf('<infNFe')
    const signaturePos = xml.indexOf('<Signature')
    const infNFeSuplPos = xml.indexOf('<infNFeSupl')

    lines.push('')
    lines.push('    Ordem dos elementos:')
    lines.push(`      1. infNFe: posição ${infNFePos}`)
    lines.push(`      2. Signature: posição ${signaturePos}`)
    lines.push(`      3. infNFeSupl: posição ${infNFeSuplPos}`)

    // Ordem correta: infNFe -> infNFeSupl -> Signature
    const ordemCorreta = infNFePos < infNFeSuplPos && infNFeSuplPos < signaturePos
    lines.push('')
    lines.push(`    Ordem correta: ${ordemCorreta ? '✅ SIM' : '❌ NÃO'}`)
  }

  // Verificar namespaces
  lines.push('')
  lines.push('    Namespaces:')
  const nsNFe = xml.includes('xmlns="http://www.portalfiscal.inf.br/nfe"')
  const nsSig = xml.includes('xmlns="http://www.w3.org/2000/09/xmldsig#"')
  lines.push(`      - NFe namespace: ${nsNFe ? 'SIM' : 'NÃO'}`)
  lines.push(`      - Signature namespace: ${nsSig ? 'SIM' : 'NÃO'}`)

  return lines.join('\n')
}

main().catch(console.error)
