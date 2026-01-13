// Tipos compartilhados para o PDV

export interface Produto {
  id: string
  codigo: string
  codigo_barras: string | null
  nome: string
  preco_venda: number
  estoque_atual: number
  unidade: string
  ncm?: string
}

export interface Cliente {
  id: string
  nome: string
  cpf_cnpj: string
  telefone?: string
  limite_credito: number
  saldo_devedor: number
}

export interface FidelidadeConfig {
  id: string
  pontos_por_real: number
  valor_ponto_resgate: number
  validade_dias: number
  ativo: boolean
}

export interface ClientePontos {
  saldo_pontos: number
  total_acumulado: number
}

export interface NFCeResult {
  sucesso: boolean
  chave?: string
  protocolo?: string
  mensagem: string
}

export interface ConfigDesconto {
  desconto_maximo_percentual: number
  desconto_maximo_valor: number | null
  motivo_obrigatorio: boolean
  permitir_desconto_item: boolean
  permitir_desconto_total: boolean
  requer_autorizacao_acima_percentual: number | null
  motivos_predefinidos: string[]
}

export interface Empresa {
  nome: string
  cnpj: string
  endereco?: string
  cidade?: string
  uf?: string
  cep?: string
  telefone?: string
  chavePix?: string
}

export interface CaixaAberto {
  id: string
  valor_abertura: number
}

export interface VendaFinalizada {
  numero?: number
  itens: {
    codigo: string
    nome: string
    quantidade: number
    preco: number
    total: number
  }[]
  subtotal: number
  desconto: number
  total: number
  pagamentos: { forma: string; valor: number }[]
  valorRecebido?: number
  troco?: number
  operador: string
  valorTributos?: number
  percentualTributos?: number
}

export interface ItemDesconto {
  id: string
  nome: string
  preco: number
  quantidade: number
}

export interface DescontoGeral {
  valor: number
  percentual: number
  motivo?: string
}

export interface CartItem {
  id: string
  codigo: string
  nome: string
  preco: number
  quantidade: number
  unidade?: string
  ncm?: string
  desconto?: number
  descontoPercentual?: number
  descontoMotivo?: string
}

export type PaymentMethodId = 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'crediario' | 'combinado'

export interface PaymentMethod {
  id: PaymentMethodId
  label: string
  icon: string
  key: string
  color: string
}

export const PAYMENT_METHODS: Omit<PaymentMethod, 'icon'>[] = [
  { id: 'dinheiro', label: 'Dinheiro', key: 'F6', color: 'green' },
  { id: 'cartao_credito', label: 'Crédito', key: 'F7', color: 'blue' },
  { id: 'cartao_debito', label: 'Débito', key: 'F8', color: 'indigo' },
  { id: 'pix', label: 'PIX', key: 'F9', color: 'teal' },
  { id: 'crediario', label: 'Fiado', key: 'F10', color: 'orange' },
  { id: 'combinado', label: 'Combinado', key: 'F11', color: 'purple' },
]

export const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  cartao_credito: 'Crédito',
  cartao_debito: 'Débito',
  pix: 'PIX',
  crediario: 'Fiado',
}

// Utilitarios
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function isProdutoPesavel(unidade: string): boolean {
  const unidadesPesaveis = ['kg', 'g', 'l', 'ml', 'm', 'cm']
  return unidadesPesaveis.includes(unidade?.toLowerCase())
}

export function formatUnidade(unidade: string): string {
  const map: Record<string, string> = {
    un: 'Un',
    kg: 'Kg',
    g: 'g',
    l: 'L',
    ml: 'mL',
    m: 'm',
    cm: 'cm',
    pc: 'Pç',
    cx: 'Cx',
    par: 'Par',
  }
  return map[unidade?.toLowerCase()] || unidade?.toUpperCase() || 'Un'
}
