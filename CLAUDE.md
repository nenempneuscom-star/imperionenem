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
│   ├── relatorios/        # Componentes de relatorios
│   └── configuracoes/     # Componentes de configuracoes
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
- Vendas por periodo
- Pagamentos
- Curva ABC
- Descontos
- Crediario
- Estoque critico

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

1. **Arquivos grandes:** `relatorios/page.tsx` ainda tem 2670 linhas e pode ser modularizado
2. **Componentes modulares:** PDV e Configuracoes ja foram refatorados em componentes
3. **Tipos compartilhados:** Usar exports de `@/components/*/types.ts`
4. **Idioma:** Interface em portugues brasileiro (sem acentos em codigo)
