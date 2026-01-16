import { CODIGOS_UF } from '../types'
import * as crypto from 'crypto'

/**
 * Gera a chave de acesso da NF-e/NFC-e (44 dígitos)
 */
export function gerarChaveAcesso(params: {
  uf: string
  dataEmissao: Date
  cnpj: string
  modelo: '55' | '65' // 55=NF-e, 65=NFC-e
  serie: number
  numero: number
  tipoEmissao: number // 1=Normal, 9=Contingência
  codigoNumerico: number
}): string {
  const { uf, dataEmissao, cnpj, modelo, serie, numero, tipoEmissao, codigoNumerico } = params

  // Código UF (2)
  const cUF = CODIGOS_UF[uf] || '42' // SC default

  // Ano/Mês (4) - AAMM
  const ano = dataEmissao.getFullYear().toString().slice(-2)
  const mes = (dataEmissao.getMonth() + 1).toString().padStart(2, '0')
  const aamm = ano + mes

  // CNPJ (14)
  const cnpjLimpo = cnpj.replace(/\D/g, '').padStart(14, '0')

  // Modelo (2)
  const mod = modelo

  // Série (3)
  const serieStr = serie.toString().padStart(3, '0')

  // Número (9)
  const nNF = numero.toString().padStart(9, '0')

  // Tipo de emissão (1)
  const tpEmis = tipoEmissao.toString()

  // Código numérico (8)
  const cNF = codigoNumerico.toString().padStart(8, '0')

  // Monta a chave sem dígito verificador (43 dígitos)
  const chave43 = cUF + aamm + cnpjLimpo + mod + serieStr + nNF + tpEmis + cNF

  // Calcula dígito verificador (módulo 11)
  const dv = calcularDV(chave43)

  return chave43 + dv
}

/**
 * Calcula o dígito verificador da chave (módulo 11)
 */
export function calcularDV(chave43: string): string {
  const pesos = [2, 3, 4, 5, 6, 7, 8, 9]
  let soma = 0
  let pesoIndex = 0

  // Percorre da direita para esquerda
  for (let i = chave43.length - 1; i >= 0; i--) {
    soma += parseInt(chave43[i]) * pesos[pesoIndex]
    pesoIndex = (pesoIndex + 1) % pesos.length
  }

  const resto = soma % 11
  const dv = resto < 2 ? 0 : 11 - resto

  return dv.toString()
}

/**
 * Gera código numérico aleatório (8 dígitos)
 */
export function gerarCodigoNumerico(): number {
  return Math.floor(Math.random() * 99999999)
}

/**
 * Formata data para padrão da SEFAZ (YYYY-MM-DDTHH:mm:ssZZZ)
 */
export function formatarDataSEFAZ(data: Date): string {
  const offset = -data.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const hours = Math.floor(Math.abs(offset) / 60).toString().padStart(2, '0')
  const minutes = (Math.abs(offset) % 60).toString().padStart(2, '0')

  const ano = data.getFullYear()
  const mes = (data.getMonth() + 1).toString().padStart(2, '0')
  const dia = data.getDate().toString().padStart(2, '0')
  const hora = data.getHours().toString().padStart(2, '0')
  const minuto = data.getMinutes().toString().padStart(2, '0')
  const segundo = data.getSeconds().toString().padStart(2, '0')

  return `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}${sign}${hours}:${minutes}`
}

/**
 * Formata valor numérico para padrão da SEFAZ (2 casas decimais)
 */
export function formatarValor(valor: number, casas: number = 2): string {
  return valor.toFixed(casas)
}

/**
 * Remove acentos e caracteres especiais
 */
export function removerAcentos(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s.,;:!?()-]/g, '')
    .toUpperCase()
}

/**
 * Trunca texto no tamanho máximo
 */
export function truncar(texto: string, tamanho: number): string {
  const limpo = removerAcentos(texto)
  return limpo.substring(0, tamanho)
}

/**
 * Gera hash QR Code NFC-e
 */
export function gerarHashQRCode(
  chave: string,
  ambiente: 1 | 2,
  csc: string,
  idToken: number
): string {
  // Concatena: chave + |2| + idToken + csc
  const dados = `${chave}|2|${idToken}|${csc}`

  // Gera hash SHA1
  const hash = crypto.createHash('sha1').update(dados).digest('hex')

  return hash.toUpperCase()
}

/**
 * URLs de QR Code por UF
 * SC usa SVRS como autorizador, mas tem portal SAT próprio para consulta
 * IMPORTANTE: Testar com URLs do SVRS se SAT não funcionar
 * Referência: http://www.sef.sc.gov.br/arquivos_portal/servicos/136/WEBSERVICE_DA_NFC_E_URL_DO_QR_CODE_E_DA_CONSULTA_EM_SC.pdf
 */
const URLS_QRCODE: Record<string, { producao: string; homologacao: string }> = {
  'SC': {
    // URLs oficiais do SAT SC conforme documento SEF/SC
    producao: 'https://sat.sef.sc.gov.br/nfce/consulta',
    homologacao: 'https://hom.sat.sef.sc.gov.br/nfce/consulta',
  },
  'RS': {
    producao: 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx',
    homologacao: 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx',
  },
  // Adicionar outros estados conforme necessário
}

/**
 * URLs de Consulta por Chave (urlChave) por UF
 * SC usa portal SAT próprio para consulta
 */
const URLS_CONSULTA: Record<string, { producao: string; homologacao: string }> = {
  'SC': {
    // URLs oficiais do SAT SC
    producao: 'https://sat.sef.sc.gov.br/nfce/consulta',
    homologacao: 'https://hom.sat.sef.sc.gov.br/nfce/consulta',
  },
  'RS': {
    producao: 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx',
    homologacao: 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx',
  },
}

/**
 * Gera URL do QR Code NFC-e
 *
 * VERSÃO 2.0 (NT 2019.001) - Mantido para compatibilidade com schema minLength=100
 * Formato: URL?p=chave|2|ambiente|idCSC|hash
 *
 * NOTA: QR Code v3 (NT 2025.001) gera URL de ~94 chars, mas schema SVRS ainda
 * exige minLength=100 para o elemento qrCode. Mantendo v2 até atualização.
 *
 * Referência: NT 2019.001
 */
export function gerarURLQRCode(params: {
  chave: string
  ambiente: 1 | 2
  csc: string
  idToken: number
  uf?: string
}): string {
  const { chave, ambiente, csc, idToken, uf = 'SC' } = params

  // URL base conforme UF e ambiente
  const urls = URLS_QRCODE[uf] || URLS_QRCODE['SC']
  const baseUrl = ambiente === 1 ? urls.producao : urls.homologacao

  // QR Code Versão 2.0 - Gera URL >100 chars (necessário para schema SVRS)
  // Sequência para URL e hash: chave|2|ambiente|idToken
  const seq = `${chave}|2|${ambiente}|${idToken}`

  // Hash: SHA1(sequência + CSC) - CSC exatamente como cadastrado na SEFAZ
  const hash = crypto.createHash('sha1').update(seq + csc).digest('hex').toUpperCase()

  // Formato v2: URL?p=sequência|hash
  const url = `${baseUrl}?p=${seq}|${hash}`

  return url
}

/**
 * Retorna URL de consulta por chave (urlChave) para o elemento infNFeSupl
 * SC usa portal SAT próprio para produção
 */
export function getURLConsulta(params: {
  ambiente: 1 | 2
  uf?: string
}): string {
  const { ambiente, uf = 'SC' } = params
  const urls = URLS_CONSULTA[uf] || URLS_CONSULTA['SC']
  return ambiente === 1 ? urls.producao : urls.homologacao
}

/**
 * Valida CNPJ
 */
export function validarCNPJ(cnpj: string): boolean {
  const cnpjLimpo = cnpj.replace(/\D/g, '')

  if (cnpjLimpo.length !== 14) return false
  if (/^(\d)\1+$/.test(cnpjLimpo)) return false

  let soma = 0
  let peso = 5

  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpjLimpo[i]) * peso
    peso = peso === 2 ? 9 : peso - 1
  }

  let resto = soma % 11
  const dv1 = resto < 2 ? 0 : 11 - resto

  if (parseInt(cnpjLimpo[12]) !== dv1) return false

  soma = 0
  peso = 6

  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpjLimpo[i]) * peso
    peso = peso === 2 ? 9 : peso - 1
  }

  resto = soma % 11
  const dv2 = resto < 2 ? 0 : 11 - resto

  return parseInt(cnpjLimpo[13]) === dv2
}

/**
 * Valida CPF
 */
export function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, '')

  if (cpfLimpo.length !== 11) return false
  if (/^(\d)\1+$/.test(cpfLimpo)) return false

  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo[i]) * (10 - i)
  }

  let resto = (soma * 10) % 11
  const dv1 = resto === 10 ? 0 : resto

  if (parseInt(cpfLimpo[9]) !== dv1) return false

  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo[i]) * (11 - i)
  }

  resto = (soma * 10) % 11
  const dv2 = resto === 10 ? 0 : resto

  return parseInt(cpfLimpo[10]) === dv2
}
