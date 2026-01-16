import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Listar veiculos (opcionalmente filtrar por cliente)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('cliente_id')
    const search = searchParams.get('search')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData?.empresa_id) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    let query = supabase
      .from('veiculos')
      .select(`
        *,
        clientes:cliente_id (
          id,
          nome,
          cpf_cnpj,
          telefone
        )
      `)
      .eq('empresa_id', userData.empresa_id)
      .eq('ativo', true)
      .order('created_at', { ascending: false })

    if (clienteId) {
      query = query.eq('cliente_id', clienteId)
    }

    if (search) {
      query = query.or(`placa.ilike.%${search}%,marca.ilike.%${search}%,modelo.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Erro ao listar veiculos:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Criar veiculo
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData?.empresa_id) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const { cliente_id, marca, modelo, ano, placa, cor, chassi, observacoes } = body

    if (!cliente_id || !marca || !modelo) {
      return NextResponse.json(
        { error: 'Cliente, marca e modelo são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se cliente pertence a empresa
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', cliente_id)
      .eq('empresa_id', userData.empresa_id)
      .single()

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('veiculos')
      .insert({
        empresa_id: userData.empresa_id,
        cliente_id,
        marca,
        modelo,
        ano: ano ? parseInt(ano) : null,
        placa: placa?.toUpperCase() || null,
        cor,
        chassi,
        observacoes,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Já existe um veículo com esta placa' },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Erro ao criar veiculo:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Atualizar veiculo
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData?.empresa_id) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const { id, marca, modelo, ano, placa, cor, chassi, observacoes, ativo } = body

    if (!id) {
      return NextResponse.json({ error: 'ID do veículo obrigatório' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('veiculos')
      .update({
        marca,
        modelo,
        ano: ano ? parseInt(ano) : null,
        placa: placa?.toUpperCase() || null,
        cor,
        chassi,
        observacoes,
        ativo,
      })
      .eq('id', id)
      .eq('empresa_id', userData.empresa_id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Já existe um veículo com esta placa' },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Erro ao atualizar veiculo:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Excluir veiculo (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID do veículo obrigatório' }, { status: 400 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData?.empresa_id) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    const { error } = await supabase
      .from('veiculos')
      .update({ ativo: false })
      .eq('id', id)
      .eq('empresa_id', userData.empresa_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao excluir veiculo:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
