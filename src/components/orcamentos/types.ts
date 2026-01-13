// Orcamentos Types

export interface Produto {
  id: string
  codigo: string
  nome: string
  preco_venda: number
  estoque_atual: number
  unidade: string
}

export interface Cliente {
  id: string
  nome: string
  cpf_cnpj: string
  telefone: string
  email: string
}

export interface ClienteManual {
  nome: string
  telefone: string
  email: string
  cpf_cnpj: string
}

export interface ItemOrcamento {
  id: string
  produto_id: string | null
  codigo: string
  nome: string
  unidade: string
  quantidade: number
  preco_unitario: number
  desconto: number
  total: number
  descricao?: string | null
}

export interface Orcamento {
  id: string
  numero: number
  empresa_id: string
  usuario_id: string
  cliente_id: string | null
  cliente_nome: string | null
  cliente_telefone: string | null
  cliente_email: string | null
  cliente_cpf_cnpj: string | null
  subtotal: number
  desconto: number
  desconto_percentual: number
  total: number
  status: string
  validade_dias: number
  data_validade: string
  observacoes: string | null
  condicoes: string | null
  created_at: string
  updated_at: string
  clientes: {
    nome: string
    cpf_cnpj: string
    telefone: string
    email: string
    endereco: any
  } | null
  usuarios: { nome: string } | null
  empresas: {
    nome_fantasia: string
    razao_social: string
    cnpj: string
    telefone: string
    endereco: any
  } | null
}

// Utility functions
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('pt-BR')
}

export function getStatusConfig(status: string): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  const configs: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pendente: { label: 'Pendente', variant: 'secondary' },
    aprovado: { label: 'Aprovado', variant: 'default' },
    rejeitado: { label: 'Rejeitado', variant: 'destructive' },
    expirado: { label: 'Expirado', variant: 'outline' },
    convertido: { label: 'Convertido', variant: 'default' },
  }
  return configs[status] || configs.pendente
}
