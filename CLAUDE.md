# Imperio Sistemas - Contexto do Projeto

## Visao Geral
Sistema ERP/PDV completo para **Nenem Pneus**, desenvolvido com Next.js 16 e Supabase.

## Stack Tecnologica

- **Framework:** Next.js 16 (App Router)
- **Linguagem:** TypeScript
- **Banco de Dados:** Supabase (PostgreSQL)
- **UI:** shadcn/ui + Tailwind CSS
- **Estado:** Zustand (cart-store)
- **Validacao:** Zod
- **Icones:** Lucide React

## Estrutura do Projeto

```
src/
├── app/                    # Rotas do App Router
│   ├── api/               # API Routes
│   ├── dashboard/         # Area administrativa
│   │   ├── clientes/
│   │   ├── produtos/
│   │   ├── configuracoes/
│   │   ├── relatorios/
│   │   ├── fiscal/
│   │   ├── financeiro/
│   │   └── ...
│   ├── pdv/               # Ponto de Venda
│   └── login/
├── components/
│   ├── ui/                # Componentes shadcn/ui
│   ├── pdv/               # Componentes do PDV (modais, busca, etc)
│   ├── relatorios/        # Componentes de relatorios
│   │   ├── tabs/          # 14 componentes de tab
│   │   ├── date-filter.tsx
│   │   ├── stats-card.tsx
│   │   └── types.ts       # Tipos compartilhados
│   └── configuracoes/     # Componentes de configuracoes
│       ├── tabs/          # EmpresaTab, EnderecoTab, FiscalTab, SistemaTab
│       └── types.ts
├── lib/
│   ├── supabase/          # Cliente Supabase
│   ├── fiscal/            # Logica fiscal (NF-e, NFC-e)
│   ├── hooks/             # Custom hooks
│   └── utils/             # Utilitarios
├── stores/                # Zustand stores
└── types/                 # Tipos TypeScript
```

## Convencoes de Codigo

### Nomenclatura
- Componentes: PascalCase (`ProductSearch.tsx`)
- Arquivos: kebab-case (`product-search.tsx`)
- Tipos/Interfaces: PascalCase com prefixo descritivo
- Funcoes: camelCase

### Componentes
- Usar `'use client'` apenas quando necessario
- Props tipadas com interfaces
- Extrair componentes grandes em arquivos separados
- Agrupar por feature em pastas dedicadas

### Estilizacao
- Tailwind CSS para estilos
- Componentes shadcn/ui como base
- Classes utilitarias, evitar CSS customizado

## Modulos Principais

### PDV (`/pdv`)
- Venda rapida com scanner de codigo de barras
- Multiplas formas de pagamento (dinheiro, cartao, PIX, crediario)
- Controle de caixa
- Emissao de NFC-e

### Relatorios (`/dashboard/relatorios`)
14 tabs de relatorios, cada uma com componente modular em `components/relatorios/tabs/`:
- **Vendas:** VendasTab - vendas por periodo
- **Itens Vendidos:** ItensVendidosTab - detalhamento de itens
- **Descontos:** DescontosTab - analise de descontos
- **Pagamentos:** PagamentosTab - formas de pagamento
- **Crediario:** CrediarioTab - vendas a prazo
- **Clientes:** ClientesTab - analise de clientes
- **Operacional:** OperacionalTab - metricas operacionais
- **Mais Vendidos:** MaisVendidosTab - ranking de produtos
- **Curva ABC:** CurvaABCTab - classificacao 80-15-5
- **Estoque Critico:** EstoqueCriticoTab - alertas de estoque
- **Produtos:** ProdutosTab - posicao de estoque
- **Saude Financeira:** SaudeTab - DRE simplificado
- **Fiscal:** FiscalTab - NFC-e, NF-e, impostos
- **Financeiro:** FinanceiroTab - faturamento e margem

### Configuracoes (`/dashboard/configuracoes`)
- Dados da empresa
- Endereco fiscal
- Configuracoes fiscais (NF-e, NFC-e)
- Senha mestre
- Restaurar padrao

### Fiscal (`/dashboard/fiscal`)
- Emissao de NF-e
- Emissao de NFC-e
- NFS-e (servicos)
- Configuracao de certificado

## Banco de Dados (Supabase)

### Tabelas Principais
- `empresas` - Dados da empresa
- `produtos` - Catalogo de produtos
- `clientes` - Cadastro de clientes
- `vendas` / `itens_venda` - Vendas realizadas
- `caixa` - Controle de caixa
- `contas_pagar` / `contas_receber` - Financeiro

## Comandos Uteis

```bash
npm run dev      # Desenvolvimento
npm run build    # Build de producao
npm run lint     # Verificar linting
```

## Observacoes para o Claude Code

1. **Componentes modulares:** PDV, Configuracoes e Relatorios ja foram refatorados em componentes
2. **Tipos compartilhados:** Usar exports de `@/components/*/types.ts`
3. **Idioma:** Interface em portugues brasileiro (sem acentos em codigo)
4. **Padrao de tabs:** Componentes de tab usam render props (`filterComponent`, `exportButton`)

## Arquitetura de Componentes

### Padrao de Tab Components
```tsx
interface TabProps {
  dados: TipoDados | null
  loading: boolean
  filterComponent: React.ReactNode  // FiltroData ou Button
  exportButton?: React.ReactNode    // Botao de exportar Excel
}
```

### Imports Centralizados
```tsx
// Importar tudo de um modulo
import {
  VendasTab,
  PagamentosTab,
  type VendaRelatorio,
  formatCurrency,
} from '@/components/relatorios'
```
