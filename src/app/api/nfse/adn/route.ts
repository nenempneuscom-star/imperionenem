import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  converterParaDPS,
  gerarXMLDPS,
  gerarJSONDPS,
  validarDPS,
  ADNClient,
  type DadosFormularioNFSe,
  type AmbienteADN,
} from '@/lib/nfse/adn'

// =============================================
// API NFS-e ADN - Ambiente de Dados Nacional
// =============================================

// POST - Emitir NFS-e via ADN
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Autenticacao
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    // Buscar usuario e empresa
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, empresa_id')
      .eq('auth_id', user.id)
      .single()

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
    }

    // Buscar dados da empresa
    const { data: empresa } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', usuario.empresa_id)
      .single()

    if (!empresa) {
      return NextResponse.json({ error: 'Empresa nao encontrada' }, { status: 404 })
    }

    // Buscar configuracao de NFS-e/ADN
    const { data: config } = await supabase
      .from('config_nfse')
      .select('*')
      .eq('empresa_id', usuario.empresa_id)
      .single()

    if (!config) {
      return NextResponse.json({
        error: 'Configuracao de NFS-e nao encontrada',
        correcao: 'Configure a NFS-e em Dashboard > Fiscal > Configuracoes',
      }, { status: 404 })
    }

    // Validacoes
    if (!body.tomador_cpf_cnpj || !body.tomador_razao_social) {
      return NextResponse.json({ error: 'Dados do tomador sao obrigatorios' }, { status: 400 })
    }

    if (!body.discriminacao) {
      return NextResponse.json({ error: 'Discriminacao do servico e obrigatoria' }, { status: 400 })
    }

    if (!body.valor_servicos || body.valor_servicos <= 0) {
      return NextResponse.json({ error: 'Valor do servico deve ser maior que zero' }, { status: 400 })
    }

    // Determinar ambiente
    const ambiente: AmbienteADN = config.ambiente === 'producao' ? 1 : 2

    // Preparar dados para DPS
    const enderecoEmpresa = empresa.endereco || {}
    const enderecoTomador = body.tomador_endereco || {}

    const dadosFormulario: DadosFormularioNFSe = {
      prestador: {
        cnpj: empresa.cnpj || '',
        razaoSocial: empresa.razao_social,
        inscricaoMunicipal: config.inscricao_municipal,
        endereco: enderecoEmpresa.logradouro ? {
          logradouro: enderecoEmpresa.logradouro,
          numero: enderecoEmpresa.numero || 'S/N',
          complemento: enderecoEmpresa.complemento,
          bairro: enderecoEmpresa.bairro,
          codigoMunicipio: config.codigo_municipio || '4203907',
          uf: config.uf || 'SC',
          cep: enderecoEmpresa.cep,
        } : undefined,
        telefone: empresa.telefone,
        email: empresa.email,
      },
      tomador: {
        tipoPessoa: body.tomador_tipo_pessoa === 'PJ' ? 'PJ' : 'PF',
        cpfCnpj: body.tomador_cpf_cnpj,
        razaoSocial: body.tomador_razao_social,
        inscricaoMunicipal: body.tomador_inscricao_municipal,
        endereco: enderecoTomador.logradouro ? {
          logradouro: enderecoTomador.logradouro,
          numero: enderecoTomador.numero || 'S/N',
          complemento: enderecoTomador.complemento,
          bairro: enderecoTomador.bairro,
          codigoMunicipio: enderecoTomador.codigo_municipio || '4203907',
          uf: enderecoTomador.uf || 'SC',
          cep: enderecoTomador.cep,
        } : undefined,
        telefone: body.tomador_telefone,
        email: body.tomador_email,
      },
      servico: {
        codigoTributacao: body.item_lista_servico?.replace(/\./g, '') || '1401',
        codigoTributacaoMunicipal: body.codigo_tributacao,
        descricao: body.discriminacao,
        municipioPrestacao: body.local_prestacao_codigo_municipio || config.codigo_municipio || '4203907',
      },
      valores: {
        valorServico: body.valor_servicos,
        descontoIncondicionado: body.desconto_incondicionado || 0,
        deducoes: body.valor_deducoes || 0,
        aliquotaISS: body.aliquota_iss || config.aliquota_iss_padrao || 5,
        issRetido: body.iss_retido || false,
        // IBS/CBS - Reforma Tributaria 2026
        aliquotaIBS: body.aliquota_ibs || 17.7,
        valorIBS: body.valor_ibs,
        ibsRetido: body.ibs_retido || false,
        aliquotaCBS: body.aliquota_cbs || 8.8,
        valorCBS: body.valor_cbs,
        cbsRetido: body.cbs_retido || false,
      },
      serie: config.serie_rps || 'NFSE',
      numero: config.proximo_numero_rps || 1,
      dataCompetencia: body.data_competencia || new Date().toISOString().split('T')[0],
      codigoMunicipioEmissor: config.codigo_municipio || '4203907',
      ambiente,
      infoAdicional: body.info_adicional,
    }

    // Converter para estrutura DPS
    const dps = converterParaDPS(dadosFormulario)

    // Validar DPS
    const validacao = validarDPS(dps)
    if (!validacao.valido) {
      return NextResponse.json({
        error: 'Erro de validacao do DPS',
        erros: validacao.erros,
      }, { status: 400 })
    }

    // Gerar XML e JSON
    const xmlDPS = gerarXMLDPS(dps)
    const jsonDPS = gerarJSONDPS(dps)

    // Calcular valores
    const baseCalculo = body.valor_servicos - (body.valor_deducoes || 0) - (body.desconto_incondicionado || 0)
    const valorIss = baseCalculo * ((body.aliquota_iss || 5) / 100)
    const valorIbs = baseCalculo * ((body.aliquota_ibs || 17.7) / 100)
    const valorCbs = baseCalculo * ((body.aliquota_cbs || 8.8) / 100)

    let totalRetencoes = (body.valor_pis || 0) +
      (body.valor_cofins || 0) +
      (body.valor_inss || 0) +
      (body.valor_ir || 0) +
      (body.valor_csll || 0)

    if (body.ibs_retido) totalRetencoes += valorIbs
    if (body.cbs_retido) totalRetencoes += valorCbs

    const valorLiquido = body.valor_servicos - totalRetencoes - (body.desconto_incondicionado || 0)

    // Se for apenas para gerar rascunho/preview (sem enviar ao ADN)
    if (body.apenas_preview || body.status === 'rascunho') {
      // Inserir no banco como rascunho
      const { data: nfse, error } = await supabase
        .from('nfse')
        .insert({
          empresa_id: usuario.empresa_id,
          numero_rps: config.proximo_numero_rps || 1,
          serie_rps: config.serie_rps || 'NFSE',
          data_emissao: new Date().toISOString(),
          data_competencia: body.data_competencia || new Date().toISOString().split('T')[0],
          tomador_tipo_pessoa: body.tomador_tipo_pessoa || 'PF',
          tomador_cpf_cnpj: body.tomador_cpf_cnpj,
          tomador_inscricao_municipal: body.tomador_inscricao_municipal || '',
          tomador_razao_social: body.tomador_razao_social,
          tomador_email: body.tomador_email || '',
          tomador_telefone: body.tomador_telefone || '',
          tomador_endereco: body.tomador_endereco || {},
          servico_id: body.servico_id || null,
          item_lista_servico: body.item_lista_servico,
          codigo_tributacao: body.codigo_tributacao || body.item_lista_servico,
          discriminacao: body.discriminacao,
          codigo_cnae: body.codigo_cnae || '',
          valor_servicos: body.valor_servicos,
          valor_deducoes: body.valor_deducoes || 0,
          valor_pis: body.valor_pis || 0,
          valor_cofins: body.valor_cofins || 0,
          valor_inss: body.valor_inss || 0,
          valor_ir: body.valor_ir || 0,
          valor_csll: body.valor_csll || 0,
          valor_iss: valorIss,
          aliquota_iss: (body.aliquota_iss || 5) / 100,
          desconto_incondicionado: body.desconto_incondicionado || 0,
          valor_liquido: valorLiquido,
          base_calculo: baseCalculo,
          iss_retido: body.iss_retido || false,
          // IBS/CBS
          aliquota_ibs: body.aliquota_ibs || 17.7,
          valor_ibs: valorIbs,
          ibs_retido: body.ibs_retido || false,
          aliquota_cbs: body.aliquota_cbs || 8.8,
          valor_cbs: valorCbs,
          cbs_retido: body.cbs_retido || false,
          // ADN
          usar_adn: true,
          id_dps: dps.infDPS.Id,
          xml_dps: xmlDPS,
          json_dps: jsonDPS,
          ambiente_adn: ambiente === 1 ? 'producao' : 'homologacao',
          status: 'rascunho',
          usuario_id: usuario.id,
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao inserir NFS-e:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Atualizar proximo numero
      await supabase
        .from('config_nfse')
        .update({ proximo_numero_rps: (config.proximo_numero_rps || 1) + 1 })
        .eq('empresa_id', usuario.empresa_id)

      return NextResponse.json({
        ...nfse,
        dps,
        xmlDPS,
        mensagem: 'DPS gerado com sucesso. Revise os dados e envie ao ADN para autorizacao.',
      })
    }

    // Enviar ao ADN (producao)
    // NOTA: Em producao real, seria necessario:
    // 1. Carregar certificado A1 do banco/arquivo
    // 2. Assinar o XML com XML-Signature
    // 3. Enviar via mTLS

    const cliente = new ADNClient({
      ambiente,
      // certificado seria carregado das configuracoes
    })

    // Por enquanto, simular resposta do ADN em homologacao
    if (ambiente === 2) {
      // Homologacao - simular resposta
      const chaveSimulada = `42${new Date().toISOString().slice(2, 4)}${new Date().toISOString().slice(5, 7)}${empresa.cnpj?.replace(/\D/g, '').padStart(14, '0')}99${(config.serie_rps || 'NFSE').padStart(3, '0')}${(config.proximo_numero_rps || 1).toString().padStart(9, '0')}1${Math.random().toString().slice(2, 10)}0`

      // Inserir no banco
      const { data: nfse, error } = await supabase
        .from('nfse')
        .insert({
          empresa_id: usuario.empresa_id,
          numero_rps: config.proximo_numero_rps || 1,
          serie_rps: config.serie_rps || 'NFSE',
          data_emissao: new Date().toISOString(),
          data_competencia: body.data_competencia || new Date().toISOString().split('T')[0],
          tomador_tipo_pessoa: body.tomador_tipo_pessoa || 'PF',
          tomador_cpf_cnpj: body.tomador_cpf_cnpj,
          tomador_inscricao_municipal: body.tomador_inscricao_municipal || '',
          tomador_razao_social: body.tomador_razao_social,
          tomador_email: body.tomador_email || '',
          tomador_telefone: body.tomador_telefone || '',
          tomador_endereco: body.tomador_endereco || {},
          servico_id: body.servico_id || null,
          item_lista_servico: body.item_lista_servico,
          codigo_tributacao: body.codigo_tributacao || body.item_lista_servico,
          discriminacao: body.discriminacao,
          codigo_cnae: body.codigo_cnae || '',
          valor_servicos: body.valor_servicos,
          valor_deducoes: body.valor_deducoes || 0,
          valor_pis: body.valor_pis || 0,
          valor_cofins: body.valor_cofins || 0,
          valor_inss: body.valor_inss || 0,
          valor_ir: body.valor_ir || 0,
          valor_csll: body.valor_csll || 0,
          valor_iss: valorIss,
          aliquota_iss: (body.aliquota_iss || 5) / 100,
          desconto_incondicionado: body.desconto_incondicionado || 0,
          valor_liquido: valorLiquido,
          base_calculo: baseCalculo,
          iss_retido: body.iss_retido || false,
          // IBS/CBS
          aliquota_ibs: body.aliquota_ibs || 17.7,
          valor_ibs: valorIbs,
          ibs_retido: body.ibs_retido || false,
          aliquota_cbs: body.aliquota_cbs || 8.8,
          valor_cbs: valorCbs,
          cbs_retido: body.cbs_retido || false,
          // ADN
          usar_adn: true,
          id_dps: dps.infDPS.Id,
          xml_dps: xmlDPS,
          json_dps: jsonDPS,
          ambiente_adn: 'homologacao',
          chave_acesso: chaveSimulada,
          status: 'autorizada',
          data_autorizacao: new Date().toISOString(),
          protocolo_autorizacao: `HOMOLOG${Date.now()}`,
          usuario_id: usuario.id,
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao inserir NFS-e:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Atualizar proximo numero
      await supabase
        .from('config_nfse')
        .update({ proximo_numero_rps: (config.proximo_numero_rps || 1) + 1 })
        .eq('empresa_id', usuario.empresa_id)

      return NextResponse.json({
        ...nfse,
        dps,
        xmlDPS,
        chaveAcesso: chaveSimulada,
        mensagem: '[HOMOLOGACAO] NFS-e autorizada com sucesso no ambiente de testes.',
      })
    }

    // Producao - tentar enviar ao ADN
    const resultado = await cliente.enviarDPS(dps)

    if (!resultado.sucesso) {
      return NextResponse.json({
        error: 'Erro ao enviar DPS ao ADN',
        erros: resultado.erros,
      }, { status: 400 })
    }

    // Inserir no banco com dados da autorizacao
    const { data: nfse, error } = await supabase
      .from('nfse')
      .insert({
        empresa_id: usuario.empresa_id,
        numero_rps: config.proximo_numero_rps || 1,
        serie_rps: config.serie_rps || 'NFSE',
        numero_nfse: resultado.retornoNFSe?.nNFSe,
        data_emissao: new Date().toISOString(),
        data_competencia: body.data_competencia || new Date().toISOString().split('T')[0],
        tomador_tipo_pessoa: body.tomador_tipo_pessoa || 'PF',
        tomador_cpf_cnpj: body.tomador_cpf_cnpj,
        tomador_inscricao_municipal: body.tomador_inscricao_municipal || '',
        tomador_razao_social: body.tomador_razao_social,
        tomador_email: body.tomador_email || '',
        tomador_telefone: body.tomador_telefone || '',
        tomador_endereco: body.tomador_endereco || {},
        servico_id: body.servico_id || null,
        item_lista_servico: body.item_lista_servico,
        codigo_tributacao: body.codigo_tributacao || body.item_lista_servico,
        discriminacao: body.discriminacao,
        codigo_cnae: body.codigo_cnae || '',
        valor_servicos: body.valor_servicos,
        valor_deducoes: body.valor_deducoes || 0,
        valor_pis: body.valor_pis || 0,
        valor_cofins: body.valor_cofins || 0,
        valor_inss: body.valor_inss || 0,
        valor_ir: body.valor_ir || 0,
        valor_csll: body.valor_csll || 0,
        valor_iss: valorIss,
        aliquota_iss: (body.aliquota_iss || 5) / 100,
        desconto_incondicionado: body.desconto_incondicionado || 0,
        valor_liquido: valorLiquido,
        base_calculo: baseCalculo,
        iss_retido: body.iss_retido || false,
        // IBS/CBS
        aliquota_ibs: body.aliquota_ibs || 17.7,
        valor_ibs: valorIbs,
        ibs_retido: body.ibs_retido || false,
        aliquota_cbs: body.aliquota_cbs || 8.8,
        valor_cbs: valorCbs,
        cbs_retido: body.cbs_retido || false,
        // ADN
        usar_adn: true,
        id_dps: dps.infDPS.Id,
        xml_dps: xmlDPS,
        json_dps: jsonDPS,
        xml_nfse_autorizada: resultado.retornoNFSe?.xmlNFSe,
        ambiente_adn: 'producao',
        chave_acesso: resultado.retornoNFSe?.chNFSe,
        codigo_verificacao: resultado.retornoNFSe?.cVerif,
        status: 'autorizada',
        data_autorizacao: resultado.retornoNFSe?.dhAut,
        protocolo_autorizacao: resultado.retornoNFSe?.nProt,
        link_danfse: resultado.retornoNFSe?.linkDANFSe,
        usuario_id: usuario.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao inserir NFS-e:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Atualizar proximo numero
    await supabase
      .from('config_nfse')
      .update({ proximo_numero_rps: (config.proximo_numero_rps || 1) + 1 })
      .eq('empresa_id', usuario.empresa_id)

    return NextResponse.json({
      ...nfse,
      chaveAcesso: resultado.retornoNFSe?.chNFSe,
      linkDANFSe: resultado.retornoNFSe?.linkDANFSe,
      mensagem: 'NFS-e autorizada com sucesso!',
    })
  } catch (error: any) {
    console.error('Erro ao emitir NFS-e ADN:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// GET - Consultar NFS-e no ADN
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const chaveAcesso = searchParams.get('chave')
    const id = searchParams.get('id')

    // Autenticacao
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_id', user.id)
      .single()

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
    }

    // Consultar por ID local
    if (id) {
      const { data: nfse, error } = await supabase
        .from('nfse')
        .select('*')
        .eq('id', id)
        .eq('empresa_id', usuario.empresa_id)
        .single()

      if (error || !nfse) {
        return NextResponse.json({ error: 'NFS-e nao encontrada' }, { status: 404 })
      }

      return NextResponse.json(nfse)
    }

    // Consultar por chave de acesso no ADN
    if (chaveAcesso) {
      const { data: config } = await supabase
        .from('config_nfse')
        .select('ambiente')
        .eq('empresa_id', usuario.empresa_id)
        .single()

      const ambiente: AmbienteADN = config?.ambiente === 'producao' ? 1 : 2
      const cliente = new ADNClient({ ambiente })

      const resultado = await cliente.consultarNFSe(chaveAcesso)

      if (!resultado.sucesso) {
        return NextResponse.json({
          error: 'Erro ao consultar NFS-e',
          erros: resultado.erros,
        }, { status: 400 })
      }

      return NextResponse.json(resultado)
    }

    return NextResponse.json({
      error: 'Informe o ID ou a chave de acesso da NFS-e',
    }, { status: 400 })
  } catch (error: any) {
    console.error('Erro ao consultar NFS-e ADN:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Cancelar NFS-e no ADN
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Autenticacao
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_id', user.id)
      .single()

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
    }

    const { chaveAcesso, codigoCancelamento, justificativa } = body

    if (!chaveAcesso) {
      return NextResponse.json({ error: 'Chave de acesso e obrigatoria' }, { status: 400 })
    }

    if (!justificativa || justificativa.length < 15) {
      return NextResponse.json({
        error: 'Justificativa deve ter no minimo 15 caracteres',
      }, { status: 400 })
    }

    // Buscar NFS-e no banco
    const { data: nfse, error: nfseError } = await supabase
      .from('nfse')
      .select('*')
      .eq('chave_acesso', chaveAcesso)
      .eq('empresa_id', usuario.empresa_id)
      .single()

    if (nfseError || !nfse) {
      return NextResponse.json({ error: 'NFS-e nao encontrada' }, { status: 404 })
    }

    if (nfse.status === 'cancelada') {
      return NextResponse.json({ error: 'NFS-e ja esta cancelada' }, { status: 400 })
    }

    const { data: config } = await supabase
      .from('config_nfse')
      .select('ambiente')
      .eq('empresa_id', usuario.empresa_id)
      .single()

    const ambiente: AmbienteADN = config?.ambiente === 'producao' ? 1 : 2

    // Simular cancelamento em homologacao
    if (ambiente === 2) {
      await supabase
        .from('nfse')
        .update({
          status: 'cancelada',
          data_cancelamento: new Date().toISOString(),
          motivo_cancelamento: justificativa,
          protocolo_cancelamento: `CANCEL_HOMOLOG${Date.now()}`,
        })
        .eq('id', nfse.id)

      return NextResponse.json({
        mensagem: '[HOMOLOGACAO] NFS-e cancelada com sucesso no ambiente de testes.',
        protocolo: `CANCEL_HOMOLOG${Date.now()}`,
      })
    }

    // Cancelar no ADN (producao)
    const cliente = new ADNClient({ ambiente })
    const resultado = await cliente.cancelarNFSe(
      chaveAcesso,
      codigoCancelamento || '1',
      justificativa
    )

    if (!resultado.sucesso) {
      return NextResponse.json({
        error: 'Erro ao cancelar NFS-e',
        erros: resultado.erros,
      }, { status: 400 })
    }

    // Atualizar no banco
    await supabase
      .from('nfse')
      .update({
        status: 'cancelada',
        data_cancelamento: resultado.retorno?.dhCanc,
        motivo_cancelamento: justificativa,
        protocolo_cancelamento: resultado.retorno?.nProt,
      })
      .eq('id', nfse.id)

    return NextResponse.json({
      mensagem: 'NFS-e cancelada com sucesso',
      protocolo: resultado.retorno?.nProt,
    })
  } catch (error: any) {
    console.error('Erro ao cancelar NFS-e ADN:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
