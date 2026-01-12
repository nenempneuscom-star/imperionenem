import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { gerarXmlRps, gerarXmlLoteRps, calcularValores } from '@/lib/nfse';
import type { RPS, LoteRPS, Prestador, Tomador, Servico } from '@/lib/nfse';

// GET - Listar NFS-e
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_id', user.id)
      .single();

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Filtros
    const status = searchParams.get('status');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const tomador = searchParams.get('tomador');

    let query = supabase
      .from('nfse')
      .select('*')
      .eq('empresa_id', usuario.empresa_id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (dataInicio) {
      query = query.gte('data_emissao', dataInicio);
    }

    if (dataFim) {
      query = query.lte('data_emissao', dataFim);
    }

    if (tomador) {
      query = query.ilike('tomador_razao_social', `%${tomador}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao listar NFS-e:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar/Emitir NFS-e
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, empresa_id')
      .eq('auth_id', user.id)
      .single();

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Buscar dados da empresa
    const { data: empresa } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', usuario.empresa_id)
      .single();

    if (!empresa) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // Buscar configuração de NFS-e
    const { data: config } = await supabase
      .from('config_nfse')
      .select('*')
      .eq('empresa_id', usuario.empresa_id)
      .single();

    if (!config) {
      return NextResponse.json({ error: 'Configuração de NFS-e não encontrada' }, { status: 404 });
    }

    // Validações
    if (!body.tomador_cpf_cnpj || !body.tomador_razao_social) {
      return NextResponse.json({ error: 'Dados do tomador são obrigatórios' }, { status: 400 });
    }

    if (!body.item_lista_servico || !body.discriminacao) {
      return NextResponse.json({ error: 'Dados do serviço são obrigatórios' }, { status: 400 });
    }

    if (!body.valor_servicos || body.valor_servicos <= 0) {
      return NextResponse.json({ error: 'Valor do serviço deve ser maior que zero' }, { status: 400 });
    }

    // Calcular valores
    const valores = calcularValores({
      valorServicos: body.valor_servicos,
      valorDeducoes: body.valor_deducoes || 0,
      valorPis: body.valor_pis || 0,
      valorCofins: body.valor_cofins || 0,
      valorInss: body.valor_inss || 0,
      valorIr: body.valor_ir || 0,
      valorCsll: body.valor_csll || 0,
      outrasRetencoes: body.outras_retencoes || 0,
      aliquotaIss: (body.aliquota_iss || config.aliquota_iss_padrao || 5) / 100,
      descontoIncondicionado: body.desconto_incondicionado || 0,
      descontoCondicionado: body.desconto_condicionado || 0,
    });

    const baseCalculo = body.valor_servicos - (body.valor_deducoes || 0) - (body.desconto_incondicionado || 0);
    const valorLiquido = body.valor_servicos -
      (valores.valorPis || 0) -
      (valores.valorCofins || 0) -
      (valores.valorInss || 0) -
      (valores.valorIr || 0) -
      (valores.valorCsll || 0) -
      (valores.outrasRetencoes || 0) -
      (valores.descontoIncondicionado || 0);

    // Preparar dados do RPS para gerar XML
    const enderecoEmpresa = empresa.endereco || {};
    const enderecoTomador = body.tomador_endereco || {};

    const prestador: Prestador = {
      cnpj: empresa.cnpj || '',
      inscricaoMunicipal: config.inscricao_municipal || '',
      razaoSocial: empresa.razao_social,
      nomeFantasia: empresa.nome_fantasia,
      endereco: {
        logradouro: enderecoEmpresa.logradouro || '',
        numero: enderecoEmpresa.numero || '',
        complemento: enderecoEmpresa.complemento || '',
        bairro: enderecoEmpresa.bairro || '',
        codigoMunicipio: config.codigo_municipio || '4203907',
        uf: config.uf || 'SC',
        cep: enderecoEmpresa.cep || '',
      },
      contato: {
        telefone: empresa.telefone || '',
        email: empresa.email || '',
      },
    };

    const tomador: Tomador = {
      tipoPessoa: body.tomador_tipo_pessoa || 'PF',
      cpfCnpj: body.tomador_cpf_cnpj,
      inscricaoMunicipal: body.tomador_inscricao_municipal || '',
      razaoSocial: body.tomador_razao_social,
      endereco: enderecoTomador.logradouro ? {
        logradouro: enderecoTomador.logradouro || '',
        numero: enderecoTomador.numero || '',
        complemento: enderecoTomador.complemento || '',
        bairro: enderecoTomador.bairro || '',
        codigoMunicipio: enderecoTomador.codigo_municipio || '4203907',
        uf: enderecoTomador.uf || 'SC',
        cep: enderecoTomador.cep || '',
      } : undefined,
      contato: {
        telefone: body.tomador_telefone || '',
        email: body.tomador_email || '',
      },
    };

    const servico: Servico = {
      itemListaServico: body.item_lista_servico,
      codigoTributacao: body.codigo_tributacao || body.item_lista_servico,
      discriminacao: body.discriminacao,
      codigoCnae: body.codigo_cnae || '',
      codigoMunicipio: body.local_prestacao_codigo_municipio || config.codigo_municipio || '4203907',
    };

    const rps: RPS = {
      numero: config.proximo_numero_rps || 1,
      serie: config.serie_rps || 'RPS',
      tipo: 1, // RPS
      dataEmissao: new Date(),
      competencia: body.data_competencia ? new Date(body.data_competencia) : new Date(),
      naturezaOperacao: body.natureza_operacao || config.natureza_operacao || '1',
      regimeEspecialTributacao: config.regime_tributacao || '6',
      optanteSimplesNacional: config.optante_simples_nacional ?? true,
      incentivadorCultural: config.incentivador_cultural ?? false,
      issRetido: body.iss_retido ?? config.reter_iss_padrao ?? false,
      prestador,
      tomador,
      servico,
      valores: {
        valorServicos: body.valor_servicos,
        valorDeducoes: body.valor_deducoes || 0,
        valorPis: body.valor_pis || 0,
        valorCofins: body.valor_cofins || 0,
        valorInss: body.valor_inss || 0,
        valorIr: body.valor_ir || 0,
        valorCsll: body.valor_csll || 0,
        outrasRetencoes: body.outras_retencoes || 0,
        valorIss: valores.valorIss,
        aliquotaIss: (body.aliquota_iss || config.aliquota_iss_padrao || 5) / 100,
        descontoIncondicionado: body.desconto_incondicionado || 0,
        descontoCondicionado: body.desconto_condicionado || 0,
      },
    };

    // Gerar XML do RPS
    const xmlRps = gerarXmlRps(rps);

    // Inserir NFS-e no banco
    const { data: nfse, error } = await supabase
      .from('nfse')
      .insert({
        empresa_id: usuario.empresa_id,
        numero_rps: config.proximo_numero_rps || 1,
        serie_rps: config.serie_rps || 'RPS',
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
        outras_retencoes: body.outras_retencoes || 0,
        valor_iss: valores.valorIss,
        aliquota_iss: (body.aliquota_iss || config.aliquota_iss_padrao || 5) / 100,
        desconto_incondicionado: body.desconto_incondicionado || 0,
        desconto_condicionado: body.desconto_condicionado || 0,
        valor_liquido: valorLiquido,
        base_calculo: baseCalculo,
        iss_retido: body.iss_retido ?? false,
        natureza_operacao: body.natureza_operacao || config.natureza_operacao || '1',
        regime_especial: config.regime_tributacao || '6',
        optante_simples_nacional: config.optante_simples_nacional ?? true,
        incentivador_cultural: config.incentivador_cultural ?? false,
        local_prestacao_codigo_municipio: body.local_prestacao_codigo_municipio || config.codigo_municipio || '4203907',
        local_prestacao_uf: body.local_prestacao_uf || config.uf || 'SC',
        status: body.status || 'rascunho',
        xml_rps: xmlRps,
        usuario_id: usuario.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir NFS-e:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Atualizar próximo número do RPS
    await supabase
      .from('config_nfse')
      .update({ proximo_numero_rps: (config.proximo_numero_rps || 1) + 1 })
      .eq('empresa_id', usuario.empresa_id);

    return NextResponse.json({
      ...nfse,
      mensagem: 'RPS gerado com sucesso. Exporte o XML para enviar pelo portal da prefeitura.',
    });
  } catch (error) {
    console.error('Erro ao criar NFS-e:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
