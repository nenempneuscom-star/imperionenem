// PDV Caixa Types

export interface Caixa {
  id: string
  data_abertura: string
  valor_abertura: number
  status: 'aberto' | 'fechado'
}

export interface Movimento {
  id: string
  tipo: 'entrada' | 'saida' | 'sangria' | 'suprimento'
  valor: number
  descricao: string
  created_at: string
}

export interface Resumo {
  total_vendas: number
  total_sangrias: number
  total_suprimentos: number
  total_dinheiro: number
  total_cartao_credito: number
  total_cartao_debito: number
  total_pix: number
  quantidade_vendas: number
}

// Utility functions
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}
