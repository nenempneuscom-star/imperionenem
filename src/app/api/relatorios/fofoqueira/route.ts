import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams
  const tipo = searchParams.get('tipo')
  const dataInicio = searchParams.get('dataInicio')
  const dataFim = searchParams.get('dataFim')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  // Buscar empresa do usuario
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('user_id', user.id)
    .single()

  if (!usuario) {
    return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
  }

  try {
    switch (tipo) {
      case 'descontos':
        return await getRelatorioDescontos(supabase, usuario.empresa_id, dataInicio, dataFim)
      case 'crediario':
        return await getRelatorioCrediario(supabase, usuario.empresa_id, dataInicio, dataFim)
      case 'clientes':
        return await getRelatorioClientes(supabase, usuario.empresa_id, dataInicio, dataFim)
      case 'operacional':
        return await getRelatorioOperacional(supabase, usuario.empresa_id, dataInicio, dataFim)
      case 'estoque-critico':
        return await getRelatorioEstoqueCritico(supabase, usuario.empresa_id)
      case 'saude-financeira':
        return await getRelatorioSaudeFinanceira(supabase, usuario.empresa_id, dataInicio, dataFim)
      case 'fiscal':
        return await getRelatorioFiscal(supabase, usuario.empresa_id, dataInicio, dataFim)
      default:
        return NextResponse.json({ error: 'Tipo de relatorio invalido' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Erro ao gerar relatorio:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}

// RELATORIO DE DESCONTOS
async function getRelatorioDescontos(supabase: any, empresaId: string, dataInicio: string | null, dataFim: string | null) {
  // Descontos gerais nas vendas
  let queryVendas = supabase
    .from('vendas')
    .select(`
      id,
      numero,
      data_hora,
      subtotal,
      desconto,
      desconto_percentual,
      desconto_motivo,
      total,
      usuarios (nome),
      clientes (nome)
    `)
    .eq('empresa_id', empresaId)
    .eq('status', 'finalizada')
    .gt('desconto', 0)

  if (dataInicio) queryVendas = queryVendas.gte('data_hora', `${dataInicio}T00:00:00`)
  if (dataFim) queryVendas = queryVendas.lte('data_hora', `${dataFim}T23:59:59`)

  const { data: vendas, error: vendasError } = await queryVendas.order('data_hora', { ascending: false })
  if (vendasError) throw vendasError

  // Descontos por item
  let queryItens = supabase
    .from('venda_itens')
    .select(`
      id,
      produto_id,
      quantidade,
      preco_unitario,
      desconto,
      desconto_percentual,
      desconto_motivo,
      total,
      produtos (codigo, nome),
      vendas!inner (
        id,
        numero,
        data_hora,
        empresa_id,
        status
      )
    `)
    .eq('vendas.empresa_id', empresaId)
    .eq('vendas.status', 'finalizada')
    .gt('desconto', 0)

  if (dataInicio) queryItens = queryItens.gte('vendas.data_hora', `${dataInicio}T00:00:00`)
  if (dataFim) queryItens = queryItens.lte('vendas.data_hora', `${dataFim}T23:59:59`)

  const { data: itens, error: itensError } = await queryItens
  if (itensError) throw itensError

  // Calcular resumo
  const totalDescontoVendas = vendas?.reduce((acc: number, v: any) => acc + (v.desconto || 0), 0) || 0
  const totalDescontoItens = itens?.reduce((acc: number, i: any) => acc + (i.desconto || 0), 0) || 0
  const totalDesconto = totalDescontoVendas + totalDescontoItens

  // Agrupar por motivo
  const motivosMap: { [key: string]: { motivo: string; quantidade: number; valor: number } } = {}

  vendas?.forEach((v: any) => {
    const motivo = v.desconto_motivo || 'Sem motivo'
    if (!motivosMap[motivo]) {
      motivosMap[motivo] = { motivo, quantidade: 0, valor: 0 }
    }
    motivosMap[motivo].quantidade++
    motivosMap[motivo].valor += v.desconto || 0
  })

  itens?.forEach((i: any) => {
    const motivo = i.desconto_motivo || 'Sem motivo'
    if (!motivosMap[motivo]) {
      motivosMap[motivo] = { motivo, quantidade: 0, valor: 0 }
    }
    motivosMap[motivo].quantidade++
    motivosMap[motivo].valor += i.desconto || 0
  })

  const porMotivo = Object.values(motivosMap).sort((a, b) => b.valor - a.valor)

  // Agrupar por operador
  const operadoresMap: { [key: string]: { operador: string; quantidade: number; valor: number } } = {}
  vendas?.forEach((v: any) => {
    const operador = v.usuarios?.nome || 'Desconhecido'
    if (!operadoresMap[operador]) {
      operadoresMap[operador] = { operador, quantidade: 0, valor: 0 }
    }
    operadoresMap[operador].quantidade++
    operadoresMap[operador].valor += v.desconto || 0
  })

  const porOperador = Object.values(operadoresMap).sort((a, b) => b.valor - a.valor)

  // Produtos que mais recebem desconto
  const produtosMap: { [key: string]: { codigo: string; nome: string; quantidade: number; valor: number } } = {}
  itens?.forEach((i: any) => {
    const id = i.produto_id
    if (!produtosMap[id]) {
      produtosMap[id] = {
        codigo: i.produtos?.codigo || '',
        nome: i.produtos?.nome || 'Produto removido',
        quantidade: 0,
        valor: 0
      }
    }
    produtosMap[id].quantidade++
    produtosMap[id].valor += i.desconto || 0
  })

  const porProduto = Object.values(produtosMap).sort((a, b) => b.valor - a.valor).slice(0, 10)

  return NextResponse.json({
    resumo: {
      totalDesconto,
      totalDescontoVendas,
      totalDescontoItens,
      quantidadeVendas: vendas?.length || 0,
      quantidadeItens: itens?.length || 0,
    },
    porMotivo,
    porOperador,
    porProduto,
    vendas: vendas?.slice(0, 50) || [],
    itens: itens?.slice(0, 50) || [],
  })
}

// RELATORIO DE CREDIARIO
async function getRelatorioCrediario(supabase: any, empresaId: string, dataInicio: string | null, dataFim: string | null) {
  // Buscar vendas com crediario
  let queryPagamentos = supabase
    .from('venda_pagamentos')
    .select(`
      id,
      valor,
      vendas!inner (
        id,
        numero,
        data_hora,
        total,
        empresa_id,
        status,
        clientes (id, nome, telefone)
      )
    `)
    .eq('forma_pagamento', 'crediario')
    .eq('vendas.empresa_id', empresaId)
    .eq('vendas.status', 'finalizada')

  if (dataInicio) queryPagamentos = queryPagamentos.gte('vendas.data_hora', `${dataInicio}T00:00:00`)
  if (dataFim) queryPagamentos = queryPagamentos.lte('vendas.data_hora', `${dataFim}T23:59:59`)

  const { data: pagamentos, error: pagError } = await queryPagamentos
  if (pagError) throw pagError

  // Buscar movimentacoes do crediario
  let queryCrediario = supabase
    .from('crediario')
    .select(`
      id,
      cliente_id,
      tipo,
      valor,
      saldo_anterior,
      saldo_posterior,
      descricao,
      created_at,
      clientes (id, nome, telefone)
    `)
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })

  if (dataInicio) queryCrediario = queryCrediario.gte('created_at', `${dataInicio}T00:00:00`)
  if (dataFim) queryCrediario = queryCrediario.lte('created_at', `${dataFim}T23:59:59`)

  const { data: movimentacoes, error: movError } = await queryCrediario
  if (movError) throw movError

  // Buscar clientes com saldo devedor
  const { data: clientesDevedores } = await supabase
    .from('clientes')
    .select('id, nome, telefone, saldo_devedor')
    .eq('empresa_id', empresaId)
    .gt('saldo_devedor', 0)
    .order('saldo_devedor', { ascending: false })

  // Calcular resumos
  const totalCrediario = pagamentos?.reduce((acc: number, p: any) => acc + p.valor, 0) || 0

  const debitos = movimentacoes?.filter((m: any) => m.tipo === 'debito') || []
  const creditos = movimentacoes?.filter((m: any) => m.tipo === 'credito') || []

  const totalDebitos = debitos.reduce((acc: number, m: any) => acc + m.valor, 0)
  const totalCreditos = creditos.reduce((acc: number, m: any) => acc + m.valor, 0)

  const totalEmAberto = clientesDevedores?.reduce((acc: number, c: any) => acc + (c.saldo_devedor || 0), 0) || 0

  // Taxa de recuperacao
  const taxaRecuperacao = totalDebitos > 0 ? (totalCreditos / totalDebitos) * 100 : 0

  // Formatar clientes devedores
  const devedoresFormatados = clientesDevedores?.map((c: any) => ({
    cliente: c.nome,
    telefone: c.telefone || '',
    totalAberto: c.saldo_devedor,
    totalAtrasado: 0, // Sem controle de vencimento na tabela atual
    parcelas: 0
  })) || []

  return NextResponse.json({
    resumo: {
      totalCrediario,
      totalEmAberto,
      totalAtrasado: 0, // Sem controle de vencimento
      totalRecebido: totalCreditos,
      taxaRecuperacao,
      quantidadeParcelasAbertas: clientesDevedores?.length || 0,
      quantidadeParcelasAtrasadas: 0,
    },
    clientesDevedores: devedoresFormatados.slice(0, 20),
    parcelasAtrasadas: [],
  })
}

// RELATORIO DE CLIENTES
async function getRelatorioClientes(supabase: any, empresaId: string, dataInicio: string | null, dataFim: string | null) {
  // Buscar vendas com clientes
  let queryVendas = supabase
    .from('vendas')
    .select(`
      id,
      cliente_id,
      data_hora,
      total,
      clientes (id, nome, telefone, email, created_at)
    `)
    .eq('empresa_id', empresaId)
    .eq('status', 'finalizada')

  if (dataInicio) queryVendas = queryVendas.gte('data_hora', `${dataInicio}T00:00:00`)
  if (dataFim) queryVendas = queryVendas.lte('data_hora', `${dataFim}T23:59:59`)

  const { data: vendas, error } = await queryVendas
  if (error) throw error

  // Agrupar por cliente
  const clientesMap: { [key: string]: {
    id: string;
    nome: string;
    telefone: string;
    email: string;
    totalCompras: number;
    quantidadeCompras: number;
    ticketMedio: number;
    ultimaCompra: string;
    primeiraCompra: string;
  } } = {}

  vendas?.forEach((v: any) => {
    const clienteId = v.cliente_id || 'consumidor'
    const cliente = v.clientes?.nome || 'Consumidor Final'

    if (!clientesMap[clienteId]) {
      clientesMap[clienteId] = {
        id: clienteId,
        nome: cliente,
        telefone: v.clientes?.telefone || '',
        email: v.clientes?.email || '',
        totalCompras: 0,
        quantidadeCompras: 0,
        ticketMedio: 0,
        ultimaCompra: v.data_hora,
        primeiraCompra: v.data_hora,
      }
    }

    clientesMap[clienteId].totalCompras += v.total
    clientesMap[clienteId].quantidadeCompras++

    if (new Date(v.data_hora) > new Date(clientesMap[clienteId].ultimaCompra)) {
      clientesMap[clienteId].ultimaCompra = v.data_hora
    }
    if (new Date(v.data_hora) < new Date(clientesMap[clienteId].primeiraCompra)) {
      clientesMap[clienteId].primeiraCompra = v.data_hora
    }
  })

  // Calcular ticket medio
  Object.values(clientesMap).forEach(c => {
    c.ticketMedio = c.quantidadeCompras > 0 ? c.totalCompras / c.quantidadeCompras : 0
  })

  const clientes = Object.values(clientesMap)

  // Melhores clientes (por valor)
  const melhoresClientes = [...clientes]
    .filter(c => c.id !== 'consumidor')
    .sort((a, b) => b.totalCompras - a.totalCompras)
    .slice(0, 20)

  // Clientes mais frequentes
  const maisFrequentes = [...clientes]
    .filter(c => c.id !== 'consumidor')
    .sort((a, b) => b.quantidadeCompras - a.quantidadeCompras)
    .slice(0, 20)

  // Clientes que sumiram (ultima compra ha mais de 30 dias)
  const hoje = new Date()
  const clientesSumiram = [...clientes]
    .filter(c => c.id !== 'consumidor')
    .filter(c => {
      const diasSemCompra = Math.floor((hoje.getTime() - new Date(c.ultimaCompra).getTime()) / (1000 * 60 * 60 * 24))
      return diasSemCompra > 30
    })
    .map(c => ({
      ...c,
      diasSemCompra: Math.floor((hoje.getTime() - new Date(c.ultimaCompra).getTime()) / (1000 * 60 * 60 * 24))
    }))
    .sort((a, b) => b.diasSemCompra - a.diasSemCompra)
    .slice(0, 20)

  // Clientes novos no periodo
  const clientesNovos = vendas?.filter((v: any) => {
    if (!v.clientes?.created_at || !dataInicio) return false
    return new Date(v.clientes.created_at) >= new Date(dataInicio)
  }).length || 0

  // Resumo
  const totalVendas = vendas?.reduce((acc: number, v: any) => acc + v.total, 0) || 0
  const vendasConsumidor = vendas?.filter((v: any) => !v.cliente_id).length || 0
  const vendasCliente = vendas?.filter((v: any) => v.cliente_id).length || 0

  return NextResponse.json({
    resumo: {
      totalClientes: clientes.filter(c => c.id !== 'consumidor').length,
      clientesNovos,
      totalVendas,
      vendasConsumidor,
      vendasCliente,
      percentualIdentificado: vendas?.length > 0 ? (vendasCliente / vendas.length) * 100 : 0,
    },
    melhoresClientes,
    maisFrequentes,
    clientesSumiram,
  })
}

// RELATORIO OPERACIONAL
async function getRelatorioOperacional(supabase: any, empresaId: string, dataInicio: string | null, dataFim: string | null) {
  // Buscar todas as vendas (incluindo canceladas)
  let query = supabase
    .from('vendas')
    .select(`
      id,
      numero,
      data_hora,
      total,
      status,
      observacoes,
      usuarios (nome)
    `)
    .eq('empresa_id', empresaId)

  if (dataInicio) query = query.gte('data_hora', `${dataInicio}T00:00:00`)
  if (dataFim) query = query.lte('data_hora', `${dataFim}T23:59:59`)

  const { data: vendas, error } = await query.order('data_hora', { ascending: false })
  if (error) throw error

  // Vendas canceladas
  const vendasCanceladas = vendas?.filter((v: any) => v.status === 'cancelada') || []
  const vendasFinalizadas = vendas?.filter((v: any) => v.status === 'finalizada') || []

  // Horarios de pico
  const horarios: { [key: number]: { hora: number; quantidade: number; valor: number } } = {}
  vendasFinalizadas.forEach((v: any) => {
    const hora = new Date(v.data_hora).getHours()
    if (!horarios[hora]) {
      horarios[hora] = { hora, quantidade: 0, valor: 0 }
    }
    horarios[hora].quantidade++
    horarios[hora].valor += v.total
  })

  const horariosOrdenados = Object.values(horarios).sort((a, b) => b.quantidade - a.quantidade)
  const horariosPico = horariosOrdenados.slice(0, 5)

  // Dias da semana
  const diasSemana = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']
  const dias: { [key: number]: { dia: string; quantidade: number; valor: number } } = {}
  vendasFinalizadas.forEach((v: any) => {
    const dia = new Date(v.data_hora).getDay()
    if (!dias[dia]) {
      dias[dia] = { dia: diasSemana[dia], quantidade: 0, valor: 0 }
    }
    dias[dia].quantidade++
    dias[dia].valor += v.total
  })

  const diasOrdenados = Object.values(dias).sort((a, b) => b.quantidade - a.quantidade)

  // Pagamentos
  let queryPag = supabase
    .from('venda_pagamentos')
    .select(`
      forma_pagamento,
      valor,
      vendas!inner (data_hora, status, empresa_id)
    `)
    .eq('vendas.empresa_id', empresaId)
    .eq('vendas.status', 'finalizada')

  if (dataInicio) queryPag = queryPag.gte('vendas.data_hora', `${dataInicio}T00:00:00`)
  if (dataFim) queryPag = queryPag.lte('vendas.data_hora', `${dataFim}T23:59:59`)

  const { data: pagamentos } = await queryPag

  const formasPagamento: { [key: string]: { forma: string; quantidade: number; valor: number } } = {}
  pagamentos?.forEach((p: any) => {
    const forma = p.forma_pagamento
    if (!formasPagamento[forma]) {
      formasPagamento[forma] = { forma, quantidade: 0, valor: 0 }
    }
    formasPagamento[forma].quantidade++
    formasPagamento[forma].valor += p.valor
  })

  const formasOrdenadas = Object.values(formasPagamento).sort((a, b) => b.valor - a.valor)

  // Vendas com pagamento combinado
  // Agrupar pagamentos por venda_id para identificar vendas com multiplos pagamentos
  const pagamentosPorVenda: { [key: string]: string[] } = {}

  // Buscar pagamentos com venda_id
  const { data: pagamentosDetalhados } = await supabase
    .from('venda_pagamentos')
    .select(`
      id,
      venda_id,
      forma_pagamento,
      valor,
      vendas!inner (id, data_hora, status, empresa_id)
    `)
    .eq('vendas.empresa_id', empresaId)
    .eq('vendas.status', 'finalizada')
    .gte('vendas.data_hora', dataInicio ? `${dataInicio}T00:00:00` : '1900-01-01')
    .lte('vendas.data_hora', dataFim ? `${dataFim}T23:59:59` : '2100-12-31')

  pagamentosDetalhados?.forEach((p: any) => {
    const vendaId = p.venda_id
    if (!pagamentosPorVenda[vendaId]) {
      pagamentosPorVenda[vendaId] = []
    }
    pagamentosPorVenda[vendaId].push(p.forma_pagamento)
  })

  // Contar vendas com pagamento combinado
  const vendasCombinadasInfo = Object.entries(pagamentosPorVenda)
    .filter(([_, formas]) => formas.length > 1)
    .map(([vendaId, formas]) => ({
      vendaId,
      combinacao: formas.sort().join(' + '),
      quantidade: formas.length,
    }))

  const totalVendasCombinadas = vendasCombinadasInfo.length

  // Agrupar por tipo de combinacao
  const combinacoes: { [key: string]: number } = {}
  vendasCombinadasInfo.forEach(v => {
    if (!combinacoes[v.combinacao]) {
      combinacoes[v.combinacao] = 0
    }
    combinacoes[v.combinacao]++
  })

  const combinacoesOrdenadas = Object.entries(combinacoes)
    .map(([combinacao, quantidade]) => ({ combinacao, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)

  // Por operador
  const operadores: { [key: string]: { operador: string; quantidade: number; valor: number } } = {}
  vendasFinalizadas.forEach((v: any) => {
    const operador = v.usuarios?.nome || 'Desconhecido'
    if (!operadores[operador]) {
      operadores[operador] = { operador, quantidade: 0, valor: 0 }
    }
    operadores[operador].quantidade++
    operadores[operador].valor += v.total
  })

  const operadoresOrdenados = Object.values(operadores).sort((a, b) => b.valor - a.valor)

  return NextResponse.json({
    resumo: {
      totalVendas: vendasFinalizadas.length,
      valorTotal: vendasFinalizadas.reduce((acc: number, v: any) => acc + v.total, 0),
      vendasCanceladas: vendasCanceladas.length,
      valorCancelado: vendasCanceladas.reduce((acc: number, v: any) => acc + v.total, 0),
      taxaCancelamento: vendas?.length > 0 ? (vendasCanceladas.length / vendas.length) * 100 : 0,
      vendasPagamentoCombinado: totalVendasCombinadas,
      percentualCombinado: vendasFinalizadas.length > 0 ? (totalVendasCombinadas / vendasFinalizadas.length) * 100 : 0,
    },
    horariosPico,
    diasSemana: diasOrdenados,
    formasPagamento: formasOrdenadas,
    pagamentosCombinados: combinacoesOrdenadas,
    porOperador: operadoresOrdenados,
    vendasCanceladas: vendasCanceladas.slice(0, 20),
  })
}

// RELATORIO DE ESTOQUE CRITICO
async function getRelatorioEstoqueCritico(supabase: any, empresaId: string) {
  // Buscar todos os produtos
  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('id, codigo, nome, estoque_atual, estoque_minimo, preco_venda, preco_custo, unidade')
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .order('estoque_atual', { ascending: true })

  if (error) throw error

  const abaixoMinimo = produtos?.filter((p: any) => p.estoque_atual <= p.estoque_minimo && p.estoque_atual > 0) || []
  const estoqueZerado = produtos?.filter((p: any) => p.estoque_atual <= 0) || []

  // Produtos parados (sem venda nos ultimos 60 dias)
  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() - 60)

  const { data: itensVendidos } = await supabase
    .from('venda_itens')
    .select('produto_id')
    .gte('created_at', dataLimite.toISOString())

  const produtosVendidosIds = new Set(itensVendidos?.map((i: any) => i.produto_id) || [])

  const produtosParados = produtos?.filter((p: any) =>
    p.estoque_atual > 0 && !produtosVendidosIds.has(p.id)
  ) || []

  // Valor em estoque parado
  const valorParado = produtosParados.reduce((acc: number, p: any) =>
    acc + (p.estoque_atual * (p.preco_custo || 0)), 0
  )

  return NextResponse.json({
    resumo: {
      totalProdutos: produtos?.length || 0,
      abaixoMinimo: abaixoMinimo.length,
      estoqueZerado: estoqueZerado.length,
      produtosParados: produtosParados.length,
      valorParado,
    },
    abaixoMinimo: abaixoMinimo.slice(0, 30),
    estoqueZerado: estoqueZerado.slice(0, 30),
    produtosParados: produtosParados.slice(0, 30).map((p: any) => ({
      ...p,
      valorEstoque: p.estoque_atual * (p.preco_custo || 0)
    })),
  })
}

// RELATORIO DE SAUDE FINANCEIRA
async function getRelatorioSaudeFinanceira(supabase: any, empresaId: string, dataInicio: string | null, dataFim: string | null) {
  // Periodo atual
  let queryAtual = supabase
    .from('vendas')
    .select(`
      id,
      total,
      desconto,
      venda_itens (
        quantidade,
        preco_unitario,
        desconto,
        produtos (preco_custo)
      )
    `)
    .eq('empresa_id', empresaId)
    .eq('status', 'finalizada')

  if (dataInicio) queryAtual = queryAtual.gte('data_hora', `${dataInicio}T00:00:00`)
  if (dataFim) queryAtual = queryAtual.lte('data_hora', `${dataFim}T23:59:59`)

  const { data: vendasAtuais, error } = await queryAtual
  if (error) throw error

  // Calcular metricas do periodo atual
  const receitaBruta = vendasAtuais?.reduce((acc: number, v: any) => {
    const subtotalItens = v.venda_itens?.reduce((a: number, i: any) =>
      a + (i.quantidade * i.preco_unitario), 0
    ) || 0
    return acc + subtotalItens
  }, 0) || 0

  const descontos = vendasAtuais?.reduce((acc: number, v: any) => {
    const descontoVenda = v.desconto || 0
    const descontoItens = v.venda_itens?.reduce((a: number, i: any) => a + (i.desconto || 0), 0) || 0
    return acc + descontoVenda + descontoItens
  }, 0) || 0

  const receitaLiquida = receitaBruta - descontos

  const cmv = vendasAtuais?.reduce((acc: number, v: any) => {
    return acc + (v.venda_itens?.reduce((a: number, i: any) =>
      a + (i.quantidade * (i.produtos?.preco_custo || 0)), 0
    ) || 0)
  }, 0) || 0

  const lucroBruto = receitaLiquida - cmv
  const margemBruta = receitaLiquida > 0 ? (lucroBruto / receitaLiquida) * 100 : 0

  // Buscar contas a pagar e receber
  const { data: contasPagar } = await supabase
    .from('contas_pagar')
    .select('valor, data_vencimento, status')
    .eq('empresa_id', empresaId)
    .eq('status', 'pendente')

  const { data: contasReceber } = await supabase
    .from('contas_receber')
    .select('valor, data_vencimento, status')
    .eq('empresa_id', empresaId)
    .eq('status', 'pendente')

  const totalPagar = contasPagar?.reduce((acc: number, c: any) => acc + c.valor, 0) || 0
  const totalReceber = contasReceber?.reduce((acc: number, c: any) => acc + c.valor, 0) || 0

  // Periodo anterior (para comparacao)
  let comparativo = null
  if (dataInicio && dataFim) {
    const inicio = new Date(dataInicio)
    const fim = new Date(dataFim)
    const diffDias = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))

    const inicioAnterior = new Date(inicio)
    inicioAnterior.setDate(inicioAnterior.getDate() - diffDias - 1)
    const fimAnterior = new Date(inicio)
    fimAnterior.setDate(fimAnterior.getDate() - 1)

    const { data: vendasAnteriores } = await supabase
      .from('vendas')
      .select('total')
      .eq('empresa_id', empresaId)
      .eq('status', 'finalizada')
      .gte('data_hora', inicioAnterior.toISOString())
      .lte('data_hora', fimAnterior.toISOString())

    const receitaAnterior = vendasAnteriores?.reduce((acc: number, v: any) => acc + v.total, 0) || 0
    const crescimento = receitaAnterior > 0 ? ((receitaLiquida - receitaAnterior) / receitaAnterior) * 100 : 0

    comparativo = {
      receitaAnterior,
      crescimento,
      diferencaValor: receitaLiquida - receitaAnterior,
    }
  }

  return NextResponse.json({
    periodo: {
      receitaBruta,
      descontos,
      receitaLiquida,
      cmv,
      lucroBruto,
      margemBruta,
      quantidadeVendas: vendasAtuais?.length || 0,
      ticketMedio: vendasAtuais?.length > 0 ? receitaLiquida / vendasAtuais.length : 0,
    },
    comparativo,
    fluxoCaixa: {
      totalReceber,
      totalPagar,
      saldo: totalReceber - totalPagar,
    },
    indicadores: {
      margemBruta,
      percentualDesconto: receitaBruta > 0 ? (descontos / receitaBruta) * 100 : 0,
      cobertura: totalPagar > 0 ? totalReceber / totalPagar : 0,
    },
  })
}

// RELATORIO FISCAL
async function getRelatorioFiscal(supabase: any, empresaId: string, dataInicio: string | null, dataFim: string | null) {
  // Buscar notas fiscais (tabela unificada)
  let queryNotas = supabase
    .from('notas_fiscais')
    .select('id, tipo, numero, status, valor_total, emitida_em, chave')
    .eq('empresa_id', empresaId)

  if (dataInicio) queryNotas = queryNotas.gte('emitida_em', `${dataInicio}T00:00:00`)
  if (dataFim) queryNotas = queryNotas.lte('emitida_em', `${dataFim}T23:59:59`)

  const { data: notas } = await queryNotas

  // Separar por tipo
  const nfces = notas?.filter((n: any) => n.tipo === 'nfce') || []
  const nfes = notas?.filter((n: any) => n.tipo === 'nfe') || []

  const nfceEmitidas = nfces.filter((n: any) => n.status === 'autorizada')
  const nfceCanceladas = nfces.filter((n: any) => n.status === 'cancelada')
  const nfeEmitidas = nfes.filter((n: any) => n.status === 'autorizada')
  const nfeCanceladas = nfes.filter((n: any) => n.status === 'cancelada')

  // Impostos (usando IBPT das vendas)
  let queryVendas = supabase
    .from('vendas')
    .select('total, imposto_aproximado')
    .eq('empresa_id', empresaId)
    .eq('status', 'finalizada')

  if (dataInicio) queryVendas = queryVendas.gte('data_hora', `${dataInicio}T00:00:00`)
  if (dataFim) queryVendas = queryVendas.lte('data_hora', `${dataFim}T23:59:59`)

  const { data: vendas } = await queryVendas

  const totalVendas = vendas?.reduce((acc: number, v: any) => acc + v.total, 0) || 0
  const totalImpostos = vendas?.reduce((acc: number, v: any) => acc + (v.imposto_aproximado || 0), 0) || 0

  return NextResponse.json({
    nfce: {
      emitidas: nfceEmitidas.length,
      valorEmitido: nfceEmitidas.reduce((acc: number, n: any) => acc + (n.valor_total || 0), 0),
      canceladas: nfceCanceladas.length,
      valorCancelado: nfceCanceladas.reduce((acc: number, n: any) => acc + (n.valor_total || 0), 0),
    },
    nfe: {
      emitidas: nfeEmitidas.length,
      valorEmitido: nfeEmitidas.reduce((acc: number, n: any) => acc + (n.valor_total || 0), 0),
      canceladas: nfeCanceladas.length,
      valorCancelado: nfeCanceladas.reduce((acc: number, n: any) => acc + (n.valor_total || 0), 0),
    },
    impostos: {
      totalVendas,
      totalImpostos,
      percentualMedio: totalVendas > 0 ? (totalImpostos / totalVendas) * 100 : 0,
    },
    ultimasNfce: nfceEmitidas.slice(0, 10),
    ultimasNfe: nfeEmitidas.slice(0, 10),
  })
}
