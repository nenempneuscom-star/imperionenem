import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')
  const clienteId = searchParams.get('cliente_id')
  const dataInicio = searchParams.get('data_inicio')
  const dataFim = searchParams.get('data_fim')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Buscar empresa do usuario
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('auth_id', user.id)
    .single()

  if (!usuario) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  let query = supabase
    .from('orcamentos')
    .select(`
      *,
      clientes (id, nome, telefone, cpf_cnpj),
      usuarios (id, nome),
      orcamento_itens (
        id,
        produto_id,
        servico_id,
        codigo,
        nome,
        descricao,
        unidade,
        quantidade,
        preco_unitario,
        desconto,
        desconto_percentual,
        total,
        ordem
      )
    `)
    .eq('empresa_id', usuario.empresa_id)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (clienteId) {
    query = query.eq('cliente_id', clienteId)
  }

  if (dataInicio) {
    query = query.gte('created_at', `${dataInicio}T00:00:00`)
  }

  if (dataFim) {
    query = query.lte('created_at', `${dataFim}T23:59:59`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erro ao buscar orcamentos:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Buscar usuario
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, empresa_id')
    .eq('auth_id', user.id)
    .single()

  if (!usuario) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  const body = await request.json()
  const {
    cliente_id,
    cliente_nome,
    cliente_telefone,
    cliente_email,
    cliente_cpf_cnpj,
    itens,
    desconto,
    desconto_percentual,
    observacoes,
    condicoes,
    validade_dias,
  } = body

  if (!itens || itens.length === 0) {
    return NextResponse.json({ error: 'O orçamento deve ter pelo menos um item' }, { status: 400 })
  }

  // Calcular totais
  const subtotal = itens.reduce((acc: number, item: any) => {
    const itemTotal = (item.quantidade * item.preco_unitario) - (item.desconto || 0)
    return acc + itemTotal
  }, 0)

  const descontoValor = desconto || 0
  const total = subtotal - descontoValor

  // Criar orcamento
  const { data: orcamento, error: orcamentoError } = await supabase
    .from('orcamentos')
    .insert({
      empresa_id: usuario.empresa_id,
      usuario_id: usuario.id,
      cliente_id: cliente_id || null,
      cliente_nome: cliente_nome || null,
      cliente_telefone: cliente_telefone || null,
      cliente_email: cliente_email || null,
      cliente_cpf_cnpj: cliente_cpf_cnpj || null,
      subtotal,
      desconto: descontoValor,
      desconto_percentual: desconto_percentual || 0,
      total,
      observacoes: observacoes || null,
      condicoes: condicoes || null,
      validade_dias: validade_dias || 7,
      status: 'pendente',
    })
    .select()
    .single()

  if (orcamentoError) {
    console.error('Erro ao criar orcamento:', orcamentoError)
    return NextResponse.json({ error: orcamentoError.message }, { status: 500 })
  }

  // Criar itens
  const itensParaInserir = itens.map((item: any, index: number) => ({
    orcamento_id: orcamento.id,
    produto_id: item.produto_id || null,
    servico_id: item.servico_id || null,
    codigo: item.codigo || '',
    nome: item.nome,
    descricao: item.descricao || null,
    unidade: item.unidade || 'UN',
    quantidade: item.quantidade,
    preco_unitario: item.preco_unitario,
    desconto: item.desconto || 0,
    desconto_percentual: item.desconto_percentual || 0,
    total: (item.quantidade * item.preco_unitario) - (item.desconto || 0),
    ordem: index,
  }))

  const { error: itensError } = await supabase
    .from('orcamento_itens')
    .insert(itensParaInserir)

  if (itensError) {
    console.error('Erro ao criar itens do orcamento:', itensError)
    // Tentar deletar orcamento criado
    await supabase.from('orcamentos').delete().eq('id', orcamento.id)
    return NextResponse.json({ error: itensError.message }, { status: 500 })
  }

  // Buscar orcamento completo
  const { data: orcamentoCompleto } = await supabase
    .from('orcamentos')
    .select(`
      *,
      clientes (id, nome, telefone, cpf_cnpj),
      usuarios (id, nome),
      orcamento_itens (*)
    `)
    .eq('id', orcamento.id)
    .single()

  return NextResponse.json(orcamentoCompleto, { status: 201 })
}
