import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Tabela IBPT básica para produtos automotivos (pneus, rodas, acessórios)
// Alíquotas aproximadas para Santa Catarina - versão 26.1
// Fonte: IBPT - valores aproximados baseados em dados públicos
const ncmsBasicos = [
  // PNEUS
  { ncm: '40111000', descricao: 'Pneus novos de borracha para automoveis de passageiros', federal: 16.69, estadual: 18.44, municipal: 0 },
  { ncm: '40112010', descricao: 'Pneus novos de borracha para onibus e caminhoes - radiais', federal: 14.99, estadual: 18.44, municipal: 0 },
  { ncm: '40112090', descricao: 'Pneus novos de borracha para onibus e caminhoes - outros', federal: 14.99, estadual: 18.44, municipal: 0 },
  { ncm: '40113000', descricao: 'Pneus novos de borracha para aeronaves', federal: 14.99, estadual: 18.44, municipal: 0 },
  { ncm: '40114000', descricao: 'Pneus novos de borracha para motocicletas', federal: 21.17, estadual: 18.44, municipal: 0 },
  { ncm: '40115000', descricao: 'Pneus novos de borracha para bicicletas', federal: 18.75, estadual: 18.44, municipal: 0 },
  { ncm: '40116100', descricao: 'Pneus novos para veiculos agricolas/florestais - espinha de peixe', federal: 11.65, estadual: 18.44, municipal: 0 },
  { ncm: '40116200', descricao: 'Pneus novos para veiculos agricolas/florestais - radiais', federal: 11.65, estadual: 18.44, municipal: 0 },
  { ncm: '40116900', descricao: 'Pneus novos para veiculos agricolas/florestais - outros', federal: 11.65, estadual: 18.44, municipal: 0 },
  { ncm: '40117000', descricao: 'Pneus novos para veiculos industriais', federal: 14.99, estadual: 18.44, municipal: 0 },
  { ncm: '40118000', descricao: 'Pneus novos para veiculos de construcao/mineracao', federal: 14.99, estadual: 18.44, municipal: 0 },
  { ncm: '40119200', descricao: 'Pneus novos - outros - espinha de peixe', federal: 14.99, estadual: 18.44, municipal: 0 },
  { ncm: '40119300', descricao: 'Pneus novos - outros - radiais', federal: 14.99, estadual: 18.44, municipal: 0 },
  { ncm: '40119400', descricao: 'Pneus novos - outros - macicos ou ocos', federal: 14.99, estadual: 18.44, municipal: 0 },
  { ncm: '40119900', descricao: 'Pneus novos de borracha - outros', federal: 14.99, estadual: 18.44, municipal: 0 },

  // CAMARAS DE AR
  { ncm: '40131000', descricao: 'Camaras de ar de borracha para automoveis', federal: 16.69, estadual: 18.44, municipal: 0 },
  { ncm: '40132000', descricao: 'Camaras de ar de borracha para bicicletas', federal: 18.75, estadual: 18.44, municipal: 0 },
  { ncm: '40139000', descricao: 'Camaras de ar de borracha - outras', federal: 16.69, estadual: 18.44, municipal: 0 },

  // PNEUS RECAUCHUTADOS
  { ncm: '40121100', descricao: 'Pneus recauchutados para automoveis de passageiros', federal: 16.69, estadual: 18.44, municipal: 0 },
  { ncm: '40121200', descricao: 'Pneus recauchutados para onibus e caminhoes', federal: 14.99, estadual: 18.44, municipal: 0 },
  { ncm: '40121300', descricao: 'Pneus recauchutados para aeronaves', federal: 14.99, estadual: 18.44, municipal: 0 },
  { ncm: '40121900', descricao: 'Pneus recauchutados - outros', federal: 14.99, estadual: 18.44, municipal: 0 },
  { ncm: '40122000', descricao: 'Pneus usados', federal: 14.99, estadual: 18.44, municipal: 0 },

  // RODAS E AROS
  { ncm: '87087010', descricao: 'Rodas para veiculos automoveis - de aluminio', federal: 21.97, estadual: 12.00, municipal: 0 },
  { ncm: '87087090', descricao: 'Rodas e suas partes para veiculos automoveis - outras', federal: 21.97, estadual: 12.00, municipal: 0 },

  // AMORTECEDORES
  { ncm: '87083000', descricao: 'Freios e servo-freios e suas partes', federal: 21.97, estadual: 12.00, municipal: 0 },

  // BATERIAS
  { ncm: '85071000', descricao: 'Baterias/acumuladores de chumbo para arranque de motores', federal: 25.89, estadual: 18.44, municipal: 0 },

  // OLEOS E LUBRIFICANTES
  { ncm: '27101921', descricao: 'Oleos lubrificantes sem aditivos', federal: 22.90, estadual: 25.00, municipal: 0 },
  { ncm: '27101922', descricao: 'Oleos lubrificantes com aditivos', federal: 22.90, estadual: 25.00, municipal: 0 },
  { ncm: '27101929', descricao: 'Outros oleos lubrificantes', federal: 22.90, estadual: 25.00, municipal: 0 },
  { ncm: '34031900', descricao: 'Outras preparacoes lubrificantes', federal: 18.15, estadual: 18.44, municipal: 0 },

  // FILTROS
  { ncm: '84212300', descricao: 'Filtros de oleo ou combustivel para motores', federal: 19.46, estadual: 12.00, municipal: 0 },
  { ncm: '84213100', descricao: 'Filtros de ar para motores', federal: 19.46, estadual: 12.00, municipal: 0 },

  // LAMPADAS
  { ncm: '85392100', descricao: 'Lampadas halogeneas de tungstenio', federal: 27.33, estadual: 18.44, municipal: 0 },
  { ncm: '85392900', descricao: 'Outras lampadas de filamento', federal: 27.33, estadual: 18.44, municipal: 0 },

  // CORREIAS
  { ncm: '40103100', descricao: 'Correias de transmissao sem fim - trapezoidal', federal: 18.15, estadual: 18.44, municipal: 0 },
  { ncm: '40103200', descricao: 'Correias de transmissao sem fim - sincronas', federal: 18.15, estadual: 18.44, municipal: 0 },
  { ncm: '40103900', descricao: 'Outras correias de transmissao', federal: 18.15, estadual: 18.44, municipal: 0 },

  // VELAS E CABOS DE IGNICAO
  { ncm: '85111000', descricao: 'Velas de ignicao', federal: 21.97, estadual: 12.00, municipal: 0 },
  { ncm: '85442000', descricao: 'Cabos coaxiais e outros condutores eletricos', federal: 18.85, estadual: 18.44, municipal: 0 },

  // SERVICOS (para NFS-e)
  { ncm: '00000000', descricao: 'Produto generico sem NCM', federal: 15.00, estadual: 17.00, municipal: 0 },
]

async function importar() {
  console.log('=== Importando tabela IBPT básica ===\n')

  let importados = 0
  let erros = 0

  for (const item of ncmsBasicos) {
    try {
      const { error } = await supabase
        .from('ibpt_aliquotas')
        .upsert({
          ncm: item.ncm,
          ex: null,
          tipo: '0',
          descricao: item.descricao,
          aliquota_nacional_federal: item.federal,
          aliquota_importado_federal: item.federal + 4, // Importados ~4% maior
          aliquota_estadual: item.estadual,
          aliquota_municipal: item.municipal,
          vigencia_inicio: '2025-11-20',
          vigencia_fim: '2026-03-31',
          versao: '26.1.A',
          fonte: 'IBPT',
        }, { onConflict: 'ncm,ex,tipo' })

      if (error) {
        console.log(`❌ ${item.ncm}: ${error.message}`)
        erros++
      } else {
        console.log(`✅ ${item.ncm} - ${item.descricao.substring(0, 40)}...`)
        importados++
      }
    } catch (err: any) {
      console.log(`❌ ${item.ncm}: ${err.message}`)
      erros++
    }
  }

  // Registrar importação
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, empresa_id')
    .limit(1)
    .single()

  if (usuario) {
    await supabase.from('ibpt_importacoes').insert({
      empresa_id: usuario.empresa_id,
      versao: '26.1.A',
      tipo: 'produtos',
      arquivo_nome: 'importacao-manual-basica.csv',
      registros_importados: importados,
      vigencia_inicio: '2025-11-20',
      vigencia_fim: '2026-03-31',
      usuario_id: usuario.id,
    })
  }

  console.log(`\n=== Resultado ===`)
  console.log(`✅ Importados: ${importados}`)
  console.log(`❌ Erros: ${erros}`)
  console.log(`\nTabela IBPT básica importada com sucesso!`)
  console.log('Para tabela completa, acesse: https://deolhonoimposto.ibpt.org.br')
}

importar()
