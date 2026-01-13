import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Buscar historico completo do cliente
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: clienteId } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData?.empresa_id) {
      return NextResponse.json({ error: 'Empresa nao encontrada' }, { status: 404 })
    }

    // Verificar se cliente pertence a empresa
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id, nome')
      .eq('id', clienteId)
      .eq('empresa_id', userData.empresa_id)
      .single()

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente nao encontrado' }, { status: 404 })
    }

    // Buscar vendas do cliente com itens e pagamentos
    const { data: vendas } = await supabase
      .from('vendas')
      .select(`
        id,
        numero,
        data_hora,
        subtotal,
        desconto,
        total,
        status,
        tipo_documento,
        chave_nfce,
        observacao,
        veiculo_id,
        veiculos:veiculo_id (
          id,
          marca,
          modelo,
          ano,
          placa
        ),
        usuarios:usuario_id (
          nome
        ),
        venda_itens (
          id,
          quantidade,
          preco_unitario,
          desconto,
          total,
          produtos:produto_id (
            codigo,
            nome,
            unidade
          )
        ),
        venda_pagamentos (
          forma_pagamento,
          valor
        )
      `)
      .eq('empresa_id', userData.empresa_id)
      .eq('cliente_id', clienteId)
      .order('data_hora', { ascending: false })

    // Buscar veiculos do cliente
    const { data: veiculos } = await supabase
      .from('veiculos')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('empresa_id', userData.empresa_id)
      .eq('ativo', true)
      .order('created_at', { ascending: false })

    // Calcular resumo
    const vendasFinalizadas = vendas?.filter(v => v.status === 'finalizada') || []
    const totalGasto = vendasFinalizadas.reduce((sum, v) => sum + (v.total || 0), 0)
    const totalVisitas = vendasFinalizadas.length
    const ticketMedio = totalVisitas > 0 ? totalGasto / totalVisitas : 0

    // Formas de pagamento mais usadas
    const formasPagamento: Record<string, { quantidade: number; valor: number }> = {}
    vendasFinalizadas.forEach(venda => {
      venda.venda_pagamentos?.forEach((pag: any) => {
        if (!formasPagamento[pag.forma_pagamento]) {
          formasPagamento[pag.forma_pagamento] = { quantidade: 0, valor: 0 }
        }
        formasPagamento[pag.forma_pagamento].quantidade += 1
        formasPagamento[pag.forma_pagamento].valor += pag.valor
      })
    })

    // Produtos mais comprados
    const produtosComprados: Record<string, { codigo: string; nome: string; quantidade: number; valor: number }> = {}
    vendasFinalizadas.forEach(venda => {
      venda.venda_itens?.forEach((item: any) => {
        const produtoId = item.produtos?.codigo || 'desconhecido'
        if (!produtosComprados[produtoId]) {
          produtosComprados[produtoId] = {
            codigo: item.produtos?.codigo || '',
            nome: item.produtos?.nome || 'Produto',
            quantidade: 0,
            valor: 0,
          }
        }
        produtosComprados[produtoId].quantidade += item.quantidade
        produtosComprados[produtoId].valor += item.total
      })
    })

    // Ordenar produtos por quantidade
    const topProdutos = Object.values(produtosComprados)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10)

    // Ordenar formas de pagamento por valor
    const topFormasPagamento = Object.entries(formasPagamento)
      .map(([forma, dados]) => ({ forma, ...dados }))
      .sort((a, b) => b.valor - a.valor)

    // Ultima visita
    const ultimaVisita = vendasFinalizadas.length > 0 ? vendasFinalizadas[0].data_hora : null

    return NextResponse.json({
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
      },
      resumo: {
        totalGasto,
        totalVisitas,
        ticketMedio,
        ultimaVisita,
        totalVeiculos: veiculos?.length || 0,
      },
      veiculos: veiculos || [],
      vendas: vendas || [],
      formasPagamento: topFormasPagamento,
      produtosMaisComprados: topProdutos,
    })
  } catch (error: any) {
    console.error('Erro ao buscar historico:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
