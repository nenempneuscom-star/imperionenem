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
│   ├── pdv-caixa/         # Controle de caixa
│   │   ├── modals/        # AbrirCaixa, FecharCaixa, Sangria, Suprimento
│   │   ├── *-card.tsx     # Cards de resumo
│   │   └── types.ts
│   ├── relatorios/        # Componentes de relatorios
│   │   ├── tabs/          # 14 componentes de tab
│   │   ├── date-filter.tsx
│   │   ├── stats-card.tsx
│   │   └── types.ts
│   ├── configuracoes/     # Configuracoes gerais
│   │   ├── tabs/          # EmpresaTab, EnderecoTab, FiscalTab, SistemaTab
│   │   └── types.ts
│   ├── fiscal-config/     # Configuracoes fiscais
│   │   ├── tabs/          # GeralTab, CertificadoTab, NFCeTab, NFeTab
│   │   └── types.ts
│   ├── fidelidade/        # Programa de fidelidade
│   │   ├── pontos-tab.tsx
│   │   ├── config-tab.tsx
│   │   ├── ajuste-modal.tsx
│   │   ├── produto-card.tsx      # Produtos resgataveis
│   │   ├── produtos-grid.tsx
│   │   ├── produto-modal.tsx
│   │   ├── delete-produto-dialog.tsx
│   │   └── types.ts
│   └── orcamentos/        # Modulo de orcamentos
│       ├── cliente-*.tsx  # Card, Form, Modal, Info
│       ├── itens-*.tsx    # Table, Empty
│       ├── *-card.tsx     # Observacoes, Resumo, Validade, Acoes
│       ├── *-modal.tsx    # Produto, Convert dialog
│       ├── totais-display.tsx
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
- Controle de caixa (`/pdv/caixa`) - modularizado em `components/pdv-caixa`
- Emissao de NFC-e

### Fidelidade (`/dashboard/fidelidade`)
Programa de fidelidade modularizado em `components/fidelidade`:
- **PontosTab:** Lista de clientes com pontos, historico de movimentos
- **ConfigTab:** Configuracao do programa (pontos/real, valor resgate, validade)
- **AjusteModal:** Adicionar/remover pontos manualmente

Produtos resgataveis (`/dashboard/fidelidade/produtos`):
- **ProdutoCard:** Card individual de produto resgatavel
- **ProdutosGrid:** Grid com busca e estado vazio
- **ProdutoModal:** Modal de criar/editar com busca de produtos do estoque
- **DeleteProdutoDialog:** Confirmacao de exclusao

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
- Configuracoes fiscais (`/dashboard/fiscal/configuracoes`) - modularizado em `components/fiscal-config`:
  - **GeralTab:** Regime tributario, ambiente (producao/homologacao)
  - **CertificadoTab:** Upload e status do certificado digital
  - **NFCeTab:** Serie, CSC, CFOP para NFC-e
  - **NFeTab:** Serie, CFOP para NF-e

### Orcamentos (`/dashboard/orcamentos`)
Modulo de orcamentos modularizado em `components/orcamentos`:

Criar orcamento (`/dashboard/orcamentos/novo`):
- **ClienteCard:** Cliente selecionado com botao alterar
- **ClienteForm:** Formulario manual (nome, telefone, email, cpf_cnpj)
- **ClienteModal:** Busca de cliente cadastrado
- **ItensTable:** Tabela editavel de itens (quantidade, preco, desconto)
- **ItensEmpty:** Estado vazio com botao adicionar
- **ProdutoModal:** Busca de produto do estoque
- **ObservacoesCard:** Observacoes e condicoes
- **ResumoCard:** Validade, subtotal, desconto, total

Visualizar orcamento (`/dashboard/orcamentos/[id]`):
- **ClienteInfo:** Dados do cliente (readonly)
- **ItensTable:** Tabela de itens (readonly)
- **TotaisDisplay:** Subtotal, desconto, total
- **ValidadeCard:** Data de validade e status
- **AcoesCard:** Aprovar, rejeitar, converter
- **ConvertDialog:** Confirmacao de conversao em venda

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

1. **Componentes modulares:** Modulos ja refatorados em componentes:
   - `relatorios` - 14 tabs de relatorios
   - `configuracoes` - 4 tabs de configuracoes gerais
   - `fiscal-config` - 4 tabs de configuracoes fiscais
   - `fidelidade` - 2 tabs + 1 modal + 4 componentes de produtos
   - `pdv-caixa` - 4 modals + 4 cards
   - `orcamentos` - 14 componentes (cliente, itens, modals, cards)
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
// Importar de relatorios
import {
  VendasTab,
  PagamentosTab,
  type VendaRelatorio,
  formatCurrency,
} from '@/components/relatorios'

// Importar de fidelidade
import {
  PontosTab,
  ConfigTab,
  AjusteModal,
  ProdutosGrid,
  ProdutoModal,
  type FidelidadeConfig,
  type ProdutoFidelidade,
} from '@/components/fidelidade'

// Importar de pdv-caixa
import {
  CaixaFechadoCard,
  ResumoCards,
  AbrirCaixaModal,
  type Caixa,
  type Resumo,
} from '@/components/pdv-caixa'

// Importar de orcamentos
import {
  ClienteCard,
  ClienteForm,
  ClienteModal,
  ItensTable,
  ResumoCard,
  ProdutoModal,
  type Produto,
  type Cliente,
  type ItemOrcamento,
  formatCurrency,
  getStatusConfig,
} from '@/components/orcamentos'
```
