import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface ConfigDesconto {
  id: string;
  empresa_id: string;
  desconto_maximo_percentual: number;
  desconto_maximo_valor: number | null;
  motivo_obrigatorio: boolean;
  permitir_desconto_item: boolean;
  permitir_desconto_total: boolean;
  requer_autorizacao_acima_percentual: number | null;
  motivos_predefinidos: string[];
  ativo: boolean;
}

// GET - Buscar configuracao de desconto
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_id', user.id)
      .single();

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    // Buscar configuracao
    let { data: config, error } = await supabase
      .from('config_desconto')
      .select('*')
      .eq('empresa_id', usuario.empresa_id)
      .single();

    // Se nao existe, criar configuracao padrao
    if (error && error.code === 'PGRST116') {
      const { data: newConfig, error: insertError } = await supabase
        .from('config_desconto')
        .insert({
          empresa_id: usuario.empresa_id,
          desconto_maximo_percentual: 15.00,
          motivo_obrigatorio: true,
          permitir_desconto_item: true,
          permitir_desconto_total: true,
          motivos_predefinidos: ['Cliente fidelidade', 'Promocao', 'Avaria no produto', 'Negociacao', 'Outro'],
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      config = newConfig;
    } else if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(config);

  } catch (error: any) {
    console.error('Erro ao buscar config desconto:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT - Atualizar configuracao de desconto
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_id', user.id)
      .single();

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    const body = await request.json();

    // Validacoes
    if (body.desconto_maximo_percentual !== undefined) {
      if (body.desconto_maximo_percentual < 0 || body.desconto_maximo_percentual > 100) {
        return NextResponse.json({ error: 'Percentual maximo deve estar entre 0 e 100' }, { status: 400 });
      }
    }

    if (body.desconto_maximo_valor !== undefined && body.desconto_maximo_valor !== null) {
      if (body.desconto_maximo_valor < 0) {
        return NextResponse.json({ error: 'Valor maximo nao pode ser negativo' }, { status: 400 });
      }
    }

    // Atualizar ou criar
    const { data: existing } = await supabase
      .from('config_desconto')
      .select('id')
      .eq('empresa_id', usuario.empresa_id)
      .single();

    let result;
    if (existing) {
      // Atualizar
      const { data, error } = await supabase
        .from('config_desconto')
        .update({
          desconto_maximo_percentual: body.desconto_maximo_percentual,
          desconto_maximo_valor: body.desconto_maximo_valor,
          motivo_obrigatorio: body.motivo_obrigatorio,
          permitir_desconto_item: body.permitir_desconto_item,
          permitir_desconto_total: body.permitir_desconto_total,
          requer_autorizacao_acima_percentual: body.requer_autorizacao_acima_percentual,
          motivos_predefinidos: body.motivos_predefinidos,
          ativo: body.ativo,
        })
        .eq('empresa_id', usuario.empresa_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    } else {
      // Criar
      const { data, error } = await supabase
        .from('config_desconto')
        .insert({
          empresa_id: usuario.empresa_id,
          ...body,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Erro ao atualizar config desconto:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
