import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function verificar() {
  // 1. Verificar se existe registro para NCM 40111000
  const { data: ibpt, error: ibptError } = await supabase
    .from('ibpt_aliquotas')
    .select('*')
    .eq('ncm', '40111000')
    .limit(1)

  console.log('=== IBPT para NCM 40111000 ===')
  if (ibptError) {
    console.log('Erro:', ibptError.message)
  } else if (!ibpt || ibpt.length === 0) {
    console.log('NAO ENCONTRADO - Tabela IBPT nao possui este NCM!')
  } else {
    console.log('Encontrado:', ibpt[0])
  }

  // 2. Verificar total de registros na tabela IBPT
  const { count } = await supabase
    .from('ibpt_aliquotas')
    .select('*', { count: 'exact', head: true })

  console.log('\n=== Total de registros na tabela IBPT ===')
  console.log('Total:', count || 0)

  // 3. Verificar ultima importacao
  const { data: importacao } = await supabase
    .from('ibpt_importacoes')
    .select('*')
    .order('importado_em', { ascending: false })
    .limit(1)

  console.log('\n=== Ultima importacao IBPT ===')
  if (importacao && importacao.length > 0) {
    console.log('Data:', importacao[0].importado_em)
    console.log('Versao:', importacao[0].versao)
    console.log('Registros:', importacao[0].registros_importados)
  } else {
    console.log('NENHUMA IMPORTACAO - Tabela IBPT esta VAZIA!')
  }
}

verificar()
