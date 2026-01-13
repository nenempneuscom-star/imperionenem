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
│   ├── pdv/               # Componentes do PDV
│   │   ├── *-modal.tsx    # Weight, Client, Help, Discount, PIX, PaymentCombination
│   │   ├── sidebar-*.tsx  # Summary, PaymentSelector, PaymentDetails
│   │   ├── confirm-sale-footer.tsx
│   │   ├── product-search-results.tsx
│   │   └── types.ts       # Produto, Cliente, PaymentMethod, etc
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
│   ├── orcamentos/        # Modulo de orcamentos
│   │   ├── cliente-*.tsx  # Card, Form, Modal, Info
│   │   ├── itens-*.tsx    # Table, Empty
│   │   ├── *-card.tsx     # Observacoes, Resumo, Validade, Acoes
│   │   ├── *-modal.tsx    # Produto, Convert dialog
│   │   ├── totais-display.tsx
│   │   └── types.ts
│   └── nfse/              # Emissao de NFS-e
│       ├── tomador-card.tsx
│       ├── servico-card.tsx
│       ├── valores-card.tsx   # Inclui IBS/CBS (Reforma 2026)
│       ├── status-card.tsx    # Status da NFS-e
│       ├── form-actions.tsx
│       └── types.ts           # Tipos + ADN + IBS/CBS
├── lib/
│   ├── supabase/          # Cliente Supabase
│   ├── fiscal/            # Logica fiscal (NF-e, NFC-e)
│   ├── nfse/              # Modulo NFS-e
│   │   ├── types.ts       # Tipos ABRASF (legado)
│   │   ├── xml-generator.ts # Gerador XML ABRASF
│   │   └── adn/           # ADN - Ambiente de Dados Nacional
│   │       ├── types.ts       # Tipos DPS, IBS/CBS
│   │       ├── dps-generator.ts # Gerador XML/JSON DPS
│   │       ├── api-client.ts  # Cliente API ADN
│   │       └── index.ts
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
Ponto de venda modularizado em `components/pdv`:

Componentes principais:
- **ProductSearchResults:** Lista de produtos encontrados na busca
- **SidebarSummary:** Resumo do carrinho com totais e descontos
- **ClientFidelidadeSection:** Selecao de cliente e pontos fidelidade
- **PaymentSelector:** Grid de formas de pagamento (F6-F11)
- **PaymentDetails:** Detalhes do pagamento (troco, QR PIX, etc)
- **CombinedPaymentSummary:** Resumo de pagamento combinado
- **NFCeToggle:** Toggle para emitir NFC-e
- **ConfirmSaleFooter:** Botao confirmar venda e estado sucesso
- **PixModal:** Modal com QR Code PIX
- **DiscountButton:** Botao de desconto geral

Modais existentes:
- **WeightModal:** Informar peso de produtos pesaveis
- **ClientModal:** Busca e selecao de cliente
- **HelpModal:** Atalhos de teclado (F1)
- **DiscountModal:** Aplicar desconto (item ou geral)
- **PaymentCombinationModal:** Combinar formas de pagamento

Controle de caixa (`/pdv/caixa`) - modularizado em `components/pdv-caixa`

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
- NFS-e (servicos) - modularizado em `components/nfse`
- Configuracoes fiscais (`/dashboard/fiscal/configuracoes`) - modularizado em `components/fiscal-config`

NFS-e (`/dashboard/fiscal/nfse/nova`) - modularizado em `components/nfse`:
- **TomadorCard:** Dados do tomador com busca de cliente e CEP
- **ServicoCard:** Selecao de servico (LC 116) e discriminacao
- **ValoresCard:** Valores, ISS, IBS/CBS (Reforma 2026), retencoes e resumo
- **StatusCard:** Exibe status da NFS-e apos envio (autorizada, rejeitada, etc)
- **FormActions:** Botoes cancelar/gerar RPS

**ADN - Ambiente de Dados Nacional (NFS-e Padrao Nacional 2026):**

API Route (`/api/nfse/adn`):
- POST: Emitir NFS-e via ADN (gera DPS, envia ao sistema nacional)
- GET: Consultar NFS-e por chave de acesso
- DELETE: Cancelar NFS-e

Modulo `lib/nfse/adn`:
- **types.ts:** Tipos DPS, IBS, CBS, ADNClient, endpoints
- **dps-generator.ts:** Gera XML/JSON do DPS conforme especificacao ADN
- **api-client.ts:** Cliente REST para comunicacao com o ADN

Reforma Tributaria 2026 (EC 132/2023):
- **IBS:** Imposto sobre Bens e Servicos (substitui ICMS/ISS) - 17.7% padrao
- **CBS:** Contribuicao sobre Bens e Servicos (substitui PIS/COFINS) - 8.8% padrao
- Campos de retencao IBS/CBS no tomador
- Calculo automatico de carga tributaria (transparencia fiscal)

Configuracoes fiscais (`/dashboard/fiscal/configuracoes`) - modularizado em `components/fiscal-config`:
- **GeralTab:** Regime tributario, ambiente (producao/homologacao)
- **CertificadoTab:** Upload e status do certificado digital A1
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
   - `pdv` - 10 componentes de sidebar + 6 modais + tipos
   - `pdv-caixa` - 4 modals + 4 cards
   - `relatorios` - 14 tabs de relatorios
   - `configuracoes` - 4 tabs de configuracoes gerais
   - `fiscal-config` - 4 tabs de configuracoes fiscais
   - `fidelidade` - 2 tabs + 1 modal + 4 componentes de produtos
   - `orcamentos` - 14 componentes (cliente, itens, modals, cards)
   - `nfse` - 5 cards + tipos + ADN + IBS/CBS + utilitarios
   - `lib/nfse/adn` - Integracao ADN (DPS, API client, XML/JSON)
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

// Importar de pdv
import {
  ProductSearchResults,
  SidebarSummary,
  PaymentSelector,
  PaymentDetails,
  ConfirmSaleFooter,
  PixModal,
  WeightModal,
  ClientModal,
  type Produto,
  type Cliente,
  type PaymentMethodId,
  formatCurrency,
  isProdutoPesavel,
} from '@/components/pdv'

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

// Importar de nfse (componentes UI)
import {
  TomadorCard,
  ServicoCard,
  ValoresCard,
  FormActions,
  StatusCard,
  type Servico,
  type ClienteNFSe,
  type NFSeFormData,
  type StatusNFSeADN,
  FORM_DATA_INICIAL,
  ALIQUOTA_IBS_PADRAO,
  ALIQUOTA_CBS_PADRAO,
  calcularBaseCalculo,
  calcularValorIbs,
  calcularValorCbs,
  calcularValorLiquido,
} from '@/components/nfse'

// Importar de lib/nfse/adn (integracao ADN)
import {
  converterParaDPS,
  gerarXMLDPS,
  gerarJSONDPS,
  validarDPS,
  ADNClient,
  getADNClient,
  validarChaveAcesso,
  type DPS,
  type DPSPrestador,
  type DPSTomador,
  type AmbienteADN,
  type ADNErro,
} from '@/lib/nfse/adn'
```
