// Tipos compartilhados para Fidelidade

export interface FidelidadeConfig {
  id?: string
  empresa_id: string
  pontos_por_real: number
  valor_ponto_resgate: number
  validade_dias: number
  ativo: boolean
}

export interface ClientePontos {
  id: string
  cliente_id: string
  saldo_pontos: number
  total_acumulado: number
  total_resgatado: number
  cliente: {
    id: string
    nome: string
    cpf_cnpj: string
    telefone?: string
  }
}

export interface Movimento {
  id: string
  tipo: 'acumulo' | 'resgate' | 'expiracao' | 'ajuste'
  pontos: number
  saldo_anterior: number
  saldo_posterior: number
  valor_venda?: number
  descricao?: string
  created_at: string
  venda?: { numero: number }[] | null
}

// Funcoes utilitarias
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatPontos(pontos: number): string {
  return new Intl.NumberFormat('pt-BR').format(pontos)
}
