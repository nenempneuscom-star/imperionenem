import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Listar vendas com filtros
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verifica autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Busca dados do usuário e empresa
    const { data: userData } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData?.empresa_id) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    // Parametros de filtro
    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')
    const status = searchParams.get('status')
    const tipoDocumento = searchParams.get('tipoDocumento')
    const clienteId = searchParams.get('clienteId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Query base
    let query = supabase
      .from('vendas')
      .select(`
        *,
        cliente:clientes(id, nome, cpf_cnpj, telefone),
        usuario:usuarios(id, nome),
        venda_itens(
          id,
          quantidade,
          preco_unitario,
          desconto,
          total,
          produto:produtos(id, nome, codigo)
        ),
        venda_pagamentos(
          id,
          forma_pagamento,
          valor
        )
      `, { count: 'exact' })
      .eq('empresa_id', userData.empresa_id)
      .order('data_hora', { ascending: false })

    // Aplicar filtros
    if (dataInicio) {
      query = query.gte('data_hora', `${dataInicio}T00:00:00`)
    }
    if (dataFim) {
      query = query.lte('data_hora', `${dataFim}T23:59:59`)
    }
    if (status && status !== 'todos') {
      query = query.eq('status', status)
    }
    if (tipoDocumento && tipoDocumento !== 'todos') {
      query = query.eq('tipo_documento', tipoDocumento)
    }
    if (clienteId) {
      query = query.eq('cliente_id', clienteId)
    }

    // Paginacao
    query = query.range(offset, offset + limit - 1)

    const { data: vendas, error, count } = await query

    if (error) {
      console.error('Erro ao buscar vendas:', error)
      return NextResponse.json({ error: 'Erro ao buscar vendas' }, { status: 500 })
    }

    // Filtro por numero/cliente (search)
    let vendasFiltradas = vendas || []
    if (search) {
      const searchLower = search.toLowerCase()
      vendasFiltradas = vendasFiltradas.filter((v: any) =>
        v.numero?.toString().includes(search) ||
        v.cliente?.nome?.toLowerCase().includes(searchLower) ||
        v.cliente?.cpf_cnpj?.includes(search)
      )
    }

    return NextResponse.json({
      vendas: vendasFiltradas,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error: any) {
    console.error('Erro ao listar vendas:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
