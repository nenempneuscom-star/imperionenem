import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Converter orcamento em venda
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

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

  // Buscar orcamento completo
  const { data: orcamento, error: orcamentoError } = await supabase
    .from('orcamentos')
    .select(`
      *,
      orcamento_itens (*)
    `)
    .eq('id', id)
    .single()

  if (orcamentoError || !orcamento) {
    return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 })
  }

  if (orcamento.status === 'convertido') {
    return NextResponse.json({ error: 'Este orçamento já foi convertido em venda' }, { status: 400 })
  }

  if (orcamento.status === 'expirado') {
    return NextResponse.json({ error: 'Este orçamento está expirado' }, { status: 400 })
  }

  if (orcamento.status === 'rejeitado') {
    return NextResponse.json({ error: 'Este orçamento foi rejeitado' }, { status: 400 })
  }

  const body = await request.json()
  const { forma_pagamento, caixa_id } = body

  if (!forma_pagamento) {
    return NextResponse.json({ error: 'Informe a forma de pagamento' }, { status: 400 })
  }

  try {
    // Criar venda a partir do orcamento
    const { data: venda, error: vendaError } = await supabase
      .from('vendas')
      .insert({
        empresa_id: usuario.empresa_id,
        usuario_id: usuario.id,
        caixa_id: caixa_id || null,
        cliente_id: orcamento.cliente_id,
        subtotal: orcamento.subtotal,
        desconto: orcamento.desconto,
        desconto_percentual: orcamento.desconto_percentual,
        total: orcamento.total,
        status: 'finalizada',
        tipo_documento: 'sem_nota',
        observacoes: `Convertido do Orçamento #${orcamento.numero}`,
      })
      .select()
      .single()

    if (vendaError) throw vendaError

    // Criar itens da venda
    const itensVenda = orcamento.orcamento_itens.map((item: any) => ({
      venda_id: venda.id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      desconto: item.desconto || 0,
      desconto_percentual: item.desconto_percentual || 0,
      total: item.total,
    }))

    const { error: itensError } = await supabase
      .from('venda_itens')
      .insert(itensVenda)

    if (itensError) throw itensError

    // Criar pagamento
    const pagamentos = Array.isArray(forma_pagamento)
      ? forma_pagamento
      : [{ forma: forma_pagamento, valor: orcamento.total }]

    const pagamentosParaInserir = pagamentos.map((p: any) => ({
      venda_id: venda.id,
      forma_pagamento: p.forma,
      valor: p.valor,
    }))

    const { error: pagamentoError } = await supabase
      .from('venda_pagamentos')
      .insert(pagamentosParaInserir)

    if (pagamentoError) throw pagamentoError

    // Atualizar estoque dos produtos
    for (const item of orcamento.orcamento_itens) {
      if (item.produto_id) {
        await supabase.rpc('decrementar_estoque', {
          p_produto_id: item.produto_id,
          p_quantidade: item.quantidade,
        })
      }
    }

    // Registrar movimento no caixa (se houver caixa)
    if (caixa_id) {
      await supabase
        .from('caixa_movimentos')
        .insert({
          caixa_id: caixa_id,
          tipo: 'entrada',
          valor: orcamento.total,
          descricao: `Venda #${venda.numero} (Orçamento #${orcamento.numero})`,
          venda_id: venda.id,
        })
    }

    // Atualizar status do orcamento
    const { error: updateError } = await supabase
      .from('orcamentos')
      .update({
        status: 'convertido',
        venda_id: venda.id,
        convertido_em: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      venda_id: venda.id,
      venda_numero: venda.numero,
      message: `Orçamento convertido em Venda #${venda.numero}`,
    })
  } catch (error: any) {
    console.error('Erro ao converter orcamento:', error)
    return NextResponse.json({ error: error.message || 'Erro ao converter orcamento' }, { status: 500 })
  }
}
