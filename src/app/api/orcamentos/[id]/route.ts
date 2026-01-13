import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('orcamentos')
    .select(`
      *,
      clientes (id, nome, telefone, cpf_cnpj, email, endereco, cidade, uf, cep),
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
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erro ao buscar orcamento:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Orcamento nao encontrado' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
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
    status,
  } = body

  // Verificar se orcamento existe e pode ser editado
  const { data: orcamentoExistente } = await supabase
    .from('orcamentos')
    .select('id, status')
    .eq('id', id)
    .single()

  if (!orcamentoExistente) {
    return NextResponse.json({ error: 'Orcamento nao encontrado' }, { status: 404 })
  }

  // Nao permitir edicao de orcamentos convertidos
  if (orcamentoExistente.status === 'convertido') {
    return NextResponse.json({ error: 'Nao e possivel editar um orcamento ja convertido em venda' }, { status: 400 })
  }

  // Se estiver atualizando itens
  if (itens && itens.length > 0) {
    // Calcular totais
    const subtotal = itens.reduce((acc: number, item: any) => {
      const itemTotal = (item.quantidade * item.preco_unitario) - (item.desconto || 0)
      return acc + itemTotal
    }, 0)

    const descontoValor = desconto || 0
    const total = subtotal - descontoValor

    // Atualizar orcamento
    const { error: updateError } = await supabase
      .from('orcamentos')
      .update({
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
        status: status || 'pendente',
      })
      .eq('id', id)

    if (updateError) {
      console.error('Erro ao atualizar orcamento:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Deletar itens antigos
    await supabase.from('orcamento_itens').delete().eq('orcamento_id', id)

    // Criar novos itens
    const itensParaInserir = itens.map((item: any, index: number) => ({
      orcamento_id: id,
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
      return NextResponse.json({ error: itensError.message }, { status: 500 })
    }
  } else {
    // Apenas atualizar status ou outros campos
    const updateData: any = {}
    if (status) updateData.status = status
    if (observacoes !== undefined) updateData.observacoes = observacoes
    if (condicoes !== undefined) updateData.condicoes = condicoes

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('orcamentos')
        .update(updateData)
        .eq('id', id)

      if (updateError) {
        console.error('Erro ao atualizar orcamento:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }
  }

  // Buscar orcamento atualizado
  const { data: orcamentoAtualizado } = await supabase
    .from('orcamentos')
    .select(`
      *,
      clientes (id, nome, telefone, cpf_cnpj),
      usuarios (id, nome),
      orcamento_itens (*)
    `)
    .eq('id', id)
    .single()

  return NextResponse.json(orcamentoAtualizado)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  // Verificar se orcamento pode ser deletado
  const { data: orcamento } = await supabase
    .from('orcamentos')
    .select('id, status')
    .eq('id', id)
    .single()

  if (!orcamento) {
    return NextResponse.json({ error: 'Orcamento nao encontrado' }, { status: 404 })
  }

  if (orcamento.status === 'convertido') {
    return NextResponse.json({ error: 'Nao e possivel excluir um orcamento convertido em venda' }, { status: 400 })
  }

  // Deletar itens (CASCADE deve fazer isso, mas por seguranca)
  await supabase.from('orcamento_itens').delete().eq('orcamento_id', id)

  // Deletar orcamento
  const { error } = await supabase
    .from('orcamentos')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erro ao deletar orcamento:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
