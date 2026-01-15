import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Cancelar venda
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vendaId } = await params
    const supabase = await createClient()

    // Verifica autenticacao
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    // Busca dados do usuario e empresa
    const { data: userData } = await supabase
      .from('usuarios')
      .select('empresa_id, id')
      .eq('auth_id', user.id)
      .single()

    if (!userData?.empresa_id) {
      return NextResponse.json({ error: 'Empresa nao encontrada' }, { status: 404 })
    }

    // Dados do cancelamento
    const body = await request.json()
    const { motivo } = body

    if (!motivo || motivo.length < 10) {
      return NextResponse.json(
        { error: 'Motivo do cancelamento obrigatorio (minimo 10 caracteres)' },
        { status: 400 }
      )
    }

    // Busca a venda com itens e pagamentos
    const { data: venda, error: vendaError } = await supabase
      .from('vendas')
      .select(`
        *,
        venda_itens(*),
        venda_pagamentos(*)
      `)
      .eq('id', vendaId)
      .eq('empresa_id', userData.empresa_id)
      .single()

    if (vendaError || !venda) {
      return NextResponse.json({ error: 'Venda nao encontrada' }, { status: 404 })
    }

    if (venda.status === 'cancelada') {
      return NextResponse.json({ error: 'Venda ja esta cancelada' }, { status: 400 })
    }

    // Verifica se tem NFC-e/NF-e vinculada
    if (venda.chave_nfce) {
      return NextResponse.json(
        { error: 'Esta venda possui NFC-e/NF-e vinculada. Cancele pela tela Fiscal.' },
        { status: 400 }
      )
    }

    // === REVERSAO AUTOMATICA ===

    // 1. Reverter estoque
    if (venda.venda_itens && venda.venda_itens.length > 0) {
      for (const item of venda.venda_itens) {
        // Restaurar quantidade no estoque
        const { data: produto } = await supabase
          .from('produtos')
          .select('estoque_atual')
          .eq('id', item.produto_id)
          .single()

        if (produto) {
          await supabase
            .from('produtos')
            .update({
              estoque_atual: (produto.estoque_atual || 0) + item.quantidade,
            })
            .eq('id', item.produto_id)

          // Registrar movimento de estoque
          await supabase.from('estoque_movimentos').insert({
            empresa_id: userData.empresa_id,
            produto_id: item.produto_id,
            tipo: 'entrada',
            quantidade: item.quantidade,
            custo_unitario: item.preco_unitario,
            documento_origem: `Cancelamento Venda ${venda.numero}`,
            observacao: `Estorno por cancelamento - ${motivo}`,
            usuario_id: userData.id,
            data_hora: new Date().toISOString(),
          })
        }
      }
    }

    // 2. Registrar saida no caixa (se houver caixa aberto)
    if (venda.caixa_id) {
      await supabase.from('caixa_movimentos').insert({
        caixa_id: venda.caixa_id,
        tipo: 'saida',
        valor: venda.total,
        descricao: `Cancelamento Venda ${venda.numero} - ${motivo}`,
        venda_id: venda.id,
      })
    }

    // 3. Reverter crediario (se pagamento foi crediario)
    if (venda.venda_pagamentos) {
      const pagamentoCrediario = venda.venda_pagamentos.find(
        (p: any) => p.forma_pagamento === 'crediario'
      )
      if (pagamentoCrediario && venda.cliente_id) {
        // Buscar saldo atual do cliente
        const { data: cliente } = await supabase
          .from('clientes')
          .select('saldo_devedor')
          .eq('id', venda.cliente_id)
          .single()

        if (cliente) {
          // Reduzir saldo devedor
          await supabase
            .from('clientes')
            .update({
              saldo_devedor: Math.max(0, (cliente.saldo_devedor || 0) - pagamentoCrediario.valor),
            })
            .eq('id', venda.cliente_id)
        }

        // Cancelar conta a receber
        await supabase
          .from('contas_receber')
          .update({ status: 'cancelada' })
          .eq('venda_id', venda.id)
      }
    }

    // 4. Reverter pontos fidelidade (se aplicavel)
    if (venda.cliente_id) {
      // Buscar se houve movimentacao de pontos para esta venda
      const { data: movimentoPontos } = await supabase
        .from('fidelidade_movimentos')
        .select('*')
        .eq('venda_id', venda.id)
        .eq('tipo', 'ganho')
        .single()

      if (movimentoPontos) {
        // Criar movimento de estorno
        await supabase.from('fidelidade_movimentos').insert({
          empresa_id: userData.empresa_id,
          cliente_id: venda.cliente_id,
          venda_id: venda.id,
          tipo: 'estorno',
          pontos: -movimentoPontos.pontos,
          descricao: `Estorno por cancelamento Venda ${venda.numero}`,
        })

        // Atualizar saldo de pontos do cliente
        const { data: cliente } = await supabase
          .from('clientes')
          .select('pontos_fidelidade')
          .eq('id', venda.cliente_id)
          .single()

        if (cliente) {
          await supabase
            .from('clientes')
            .update({
              pontos_fidelidade: Math.max(0, (cliente.pontos_fidelidade || 0) - movimentoPontos.pontos),
            })
            .eq('id', venda.cliente_id)
        }
      }
    }

    // 5. Atualizar status da venda para cancelada
    const { error: updateError } = await supabase
      .from('vendas')
      .update({
        status: 'cancelada',
        observacao: `${venda.observacao || ''} | Cancelada em ${new Date().toLocaleString('pt-BR')} - ${motivo}`.trim(),
      })
      .eq('id', venda.id)

    if (updateError) {
      console.error('Erro ao atualizar venda:', updateError)
      return NextResponse.json({ error: 'Erro ao cancelar venda' }, { status: 500 })
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Venda cancelada com sucesso. Estoque e valores revertidos.',
    })
  } catch (error: any) {
    console.error('Erro ao cancelar venda:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
