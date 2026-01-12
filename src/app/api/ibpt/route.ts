import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Consultar alíquota por NCM ou código de serviço
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const ncm = searchParams.get('ncm');
    const servico = searchParams.get('servico');
    const tipo = searchParams.get('tipo') || '0'; // 0=Nacional, 1=Importado

    if (ncm) {
      // Buscar alíquota de produto por NCM
      const { data, error } = await supabase
        .from('ibpt_aliquotas')
        .select('*')
        .eq('ncm', ncm.replace(/\D/g, ''))
        .order('vigencia_inicio', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json({
          error: 'NCM não encontrado na tabela IBPT',
          ncm: ncm
        }, { status: 404 });
      }

      const aliquotaFederal = tipo === '0'
        ? data.aliquota_nacional_federal
        : data.aliquota_importado_federal;

      return NextResponse.json({
        ncm: data.ncm,
        descricao: data.descricao,
        aliquota_federal: aliquotaFederal,
        aliquota_estadual: data.aliquota_estadual,
        aliquota_municipal: data.aliquota_municipal,
        aliquota_total: aliquotaFederal + data.aliquota_estadual + data.aliquota_municipal,
        vigencia_inicio: data.vigencia_inicio,
        vigencia_fim: data.vigencia_fim,
        versao: data.versao,
      });
    }

    if (servico) {
      // Buscar alíquota de serviço
      const { data, error } = await supabase
        .from('ibpt_servicos')
        .select('*')
        .eq('codigo', servico)
        .order('vigencia_inicio', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json({
          error: 'Código de serviço não encontrado na tabela IBPT',
          servico: servico
        }, { status: 404 });
      }

      return NextResponse.json({
        codigo: data.codigo,
        descricao: data.descricao,
        aliquota_federal: data.aliquota_federal,
        aliquota_estadual: data.aliquota_estadual,
        aliquota_municipal: data.aliquota_municipal,
        aliquota_total: data.aliquota_federal + data.aliquota_estadual + data.aliquota_municipal,
        vigencia_inicio: data.vigencia_inicio,
        vigencia_fim: data.vigencia_fim,
        versao: data.versao,
      });
    }

    // Retornar estatísticas
    const { count: countProdutos } = await supabase
      .from('ibpt_aliquotas')
      .select('*', { count: 'exact', head: true });

    const { count: countServicos } = await supabase
      .from('ibpt_servicos')
      .select('*', { count: 'exact', head: true });

    const { data: ultimaImportacao } = await supabase
      .from('ibpt_importacoes')
      .select('*')
      .order('importado_em', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      total_produtos: countProdutos || 0,
      total_servicos: countServicos || 0,
      ultima_importacao: ultimaImportacao || null,
    });

  } catch (error) {
    console.error('Erro na consulta IBPT:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Importar tabela IBPT (CSV)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tipo = formData.get('tipo') as string || 'produtos';
    const versao = formData.get('versao') as string || '';
    const vigenciaInicio = formData.get('vigencia_inicio') as string;
    const vigenciaFim = formData.get('vigencia_fim') as string;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
    }

    const content = await file.text();
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json({ error: 'Arquivo vazio ou inválido' }, { status: 400 });
    }

    let registrosImportados = 0;
    const erros: string[] = [];

    if (tipo === 'produtos') {
      // Limpar tabela antiga (opcional - manter apenas versão atual)
      await supabase.from('ibpt_aliquotas').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Formato CSV IBPT: NCM;EX;TIPO;DESCRICAO;ALIQ_NAC_FED;ALIQ_IMP_FED;ALIQ_ESTADUAL;ALIQ_MUNICIPAL;VIGENCIA_INI;VIGENCIA_FIM;CHAVE;VERSAO;FONTE
      for (let i = 1; i < lines.length; i++) {
        try {
          const cols = lines[i].split(';');
          if (cols.length < 8) continue;

          const ncm = cols[0]?.replace(/\D/g, '').substring(0, 10);
          if (!ncm || ncm.length < 4) continue;

          await supabase.from('ibpt_aliquotas').upsert({
            ncm: ncm,
            ex: cols[1] || null,
            tipo: cols[2] || '0',
            descricao: cols[3]?.substring(0, 500) || '',
            aliquota_nacional_federal: parseFloat(cols[4]?.replace(',', '.')) || 0,
            aliquota_importado_federal: parseFloat(cols[5]?.replace(',', '.')) || 0,
            aliquota_estadual: parseFloat(cols[6]?.replace(',', '.')) || 0,
            aliquota_municipal: parseFloat(cols[7]?.replace(',', '.')) || 0,
            vigencia_inicio: vigenciaInicio || cols[8] || null,
            vigencia_fim: vigenciaFim || cols[9] || null,
            chave: cols[10] || null,
            versao: versao || cols[11] || '',
            fonte: cols[12] || 'IBPT',
          }, { onConflict: 'ncm,ex,tipo' });

          registrosImportados++;
        } catch (err: any) {
          erros.push(`Linha ${i + 1}: ${err.message}`);
        }
      }
    } else {
      // Importar serviços
      await supabase.from('ibpt_servicos').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Formato: CODIGO;TIPO;DESCRICAO;ALIQ_FED;ALIQ_EST;ALIQ_MUN;VIGENCIA_INI;VIGENCIA_FIM;VERSAO;FONTE
      for (let i = 1; i < lines.length; i++) {
        try {
          const cols = lines[i].split(';');
          if (cols.length < 6) continue;

          const codigo = cols[0]?.trim();
          if (!codigo) continue;

          await supabase.from('ibpt_servicos').upsert({
            codigo: codigo,
            tipo: cols[1] || 'NBS',
            descricao: cols[2]?.substring(0, 500) || '',
            aliquota_federal: parseFloat(cols[3]?.replace(',', '.')) || 0,
            aliquota_estadual: parseFloat(cols[4]?.replace(',', '.')) || 0,
            aliquota_municipal: parseFloat(cols[5]?.replace(',', '.')) || 0,
            vigencia_inicio: vigenciaInicio || cols[6] || null,
            vigencia_fim: vigenciaFim || cols[7] || null,
            versao: versao || cols[8] || '',
            fonte: cols[9] || 'IBPT',
          }, { onConflict: 'codigo,tipo' });

          registrosImportados++;
        } catch (err: any) {
          erros.push(`Linha ${i + 1}: ${err.message}`);
        }
      }
    }

    // Registrar importação
    await supabase.from('ibpt_importacoes').insert({
      empresa_id: usuario.empresa_id,
      versao: versao,
      tipo: tipo,
      arquivo_nome: file.name,
      registros_importados: registrosImportados,
      vigencia_inicio: vigenciaInicio || null,
      vigencia_fim: vigenciaFim || null,
      usuario_id: usuario.id,
    });

    return NextResponse.json({
      sucesso: true,
      registros_importados: registrosImportados,
      erros: erros.slice(0, 10), // Limitar erros retornados
      mensagem: `${registrosImportados} registros importados com sucesso`,
    });

  } catch (error: any) {
    console.error('Erro na importação IBPT:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
