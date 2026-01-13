// Tipos compartilhados para Relatorios

export interface VendaRelatorio {
  id: string
  numero: number
  data_hora: string
  total: number
  status: string
  clientes: { nome: string } | null
  usuarios: { nome: string } | null
}

export interface ProdutoRelatorio {
  id: string
  codigo: string
  nome: string
  estoque_atual: number
  estoque_minimo: number
  preco_venda: number
  preco_custo: number
  unidade: string
  total_vendido?: number
  valor_vendido?: number
}

export interface PagamentoRelatorio {
  forma_pagamento: string
  total: number
  quantidade: number
}

export interface ResumoFinanceiro {
  total_vendas: number
  total_custo: number
  lucro_bruto: number
  margem: number
  ticket_medio: number
  quantidade_vendas: number
}

export interface ProdutoCurvaABC {
  id: string
  codigo: string
  nome: string
  quantidade_vendida: number
  valor_vendido: number
  percentual: number
  percentual_acumulado: number
  classe: 'A' | 'B' | 'C'
}

export interface RelatorioDescontos {
  resumo: {
    totalDesconto: number
    totalDescontoVendas: number
    totalDescontoItens: number
    quantidadeVendas: number
    quantidadeItens: number
  }
  porMotivo: { motivo: string; quantidade: number; valor: number }[]
  porOperador: { operador: string; quantidade: number; valor: number }[]
  porProduto: { codigo: string; nome: string; quantidade: number; valor: number }[]
}

export interface RelatorioCrediario {
  resumo: {
    totalCrediario: number
    totalEmAberto: number
    totalAtrasado: number
    totalRecebido: number
    taxaRecuperacao: number
    quantidadeParcelasAbertas: number
    quantidadeParcelasAtrasadas: number
  }
  clientesDevedores: {
    cliente: string
    telefone: string
    totalAberto: number
    totalAtrasado: number
    parcelas: number
  }[]
  parcelasAtrasadas: any[]
}

export interface RelatorioClientes {
  resumo: {
    totalClientes: number
    clientesNovos: number
    totalVendas: number
    vendasConsumidor: number
    vendasCliente: number
    percentualIdentificado: number
  }
  melhoresClientes: any[]
  maisFrequentes: any[]
  clientesSumiram: any[]
}

export interface RelatorioOperacional {
  resumo: {
    totalVendas: number
    valorTotal: number
    vendasCanceladas: number
    valorCancelado: number
    taxaCancelamento: number
    vendasPagamentoCombinado?: number
    percentualCombinado?: number
  }
  horariosPico: { hora: number; quantidade: number; valor: number }[]
  diasSemana: { dia: string; quantidade: number; valor: number }[]
  formasPagamento: { forma: string; quantidade: number; valor: number }[]
  porOperador: { operador: string; quantidade: number; valor: number }[]
  pagamentosCombinados?: { combinacao: string; quantidade: number }[]
}

export interface RelatorioEstoqueCritico {
  resumo: {
    totalProdutos: number
    abaixoMinimo: number
    estoqueZerado: number
    produtosParados: number
    valorParado: number
  }
  abaixoMinimo: any[]
  estoqueZerado: any[]
  produtosParados: any[]
}

export interface RelatorioSaudeFinanceira {
  periodo: {
    receitaBruta: number
    descontos: number
    receitaLiquida: number
    cmv: number
    lucroBruto: number
    margemBruta: number
    quantidadeVendas: number
    ticketMedio: number
  }
  comparativo: {
    receitaAnterior: number
    crescimento: number
    diferencaValor: number
  } | null
  fluxoCaixa: {
    totalReceber: number
    totalPagar: number
    saldo: number
  }
  indicadores: {
    margemBruta: number
    percentualDesconto: number
    cobertura: number
  }
}

export interface RelatorioFiscal {
  nfce: {
    emitidas: number
    valorEmitido: number
    canceladas: number
    valorCancelado: number
  }
  nfe: {
    emitidas: number
    valorEmitido: number
    canceladas: number
    valorCancelado: number
  }
  impostos: {
    totalVendas: number
    totalImpostos: number
    percentualMedio: number
  }
}

export interface RelatorioCancelamentos {
  resumo: {
    totalVendasPeriodo: number
    totalVendasCanceladas: number
    valorTotalCancelado: number
    taxaCancelamento: number
    ticketMedioCancelado: number
    nfcesCanceladas: number
    valorNfceCancelado: number
    nfesCanceladas: number
    valorNfeCancelado: number
  }
  porMotivo: { motivo: string; quantidade: number; valor: number }[]
  porOperador: { operador: string; quantidade: number; valor: number }[]
  cancelamentosPorDia: { dia: string; quantidade: number; valor: number }[]
  cancelamentosPorHora: { hora: number; quantidade: number; valor: number }[]
  produtosMaisCancelados: { codigo: string; nome: string; quantidade: number; valor: number }[]
  vendas: {
    id: string
    numero: number
    data_hora: string
    total: number
    cliente: string
    operador: string
    motivo: string
    itens: number
  }[]
  notas: {
    id: string
    tipo: string
    numero: number
    serie: number
    chave: string
    valor: number
    emitida_em: string
    cancelada_em: string
    motivo: string
  }[]
}

export interface ItemVendido {
  id: string
  venda_numero: number
  venda_data: string
  cliente_nome: string
  produto_codigo: string
  produto_nome: string
  quantidade: number
  preco_unitario: number
  desconto: number
  total: number
  unidade: string
}

export interface ResumoVendas {
  total: number
  quantidade: number
  ticketMedio: number
}

export interface ResumoEstoque {
  totalProdutos: number
  valorEstoque: number
  valorCusto: number
  baixoEstoque: number
}

export interface ResumoCurvaABC {
  totalFaturamento: number
  qtdClasseA: number
  qtdClasseB: number
  qtdClasseC: number
  valorClasseA: number
  valorClasseB: number
  valorClasseC: number
}

export interface ResumoItensVendidos {
  totalItens: number
  totalQuantidade: number
  totalValor: number
  totalDesconto: number
}

// Utilitarios
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('pt-BR')
}

export function getPaymentLabel(forma: string): string {
  const labels: Record<string, string> = {
    dinheiro: 'Dinheiro',
    cartao_credito: 'Cartao Credito',
    cartao_debito: 'Cartao Debito',
    pix: 'PIX',
    crediario: 'Crediario',
    combinado: 'Combinado',
  }
  return labels[forma] || forma
}

export function getPaymentIcon(forma: string): string {
  const icons: Record<string, string> = {
    dinheiro: 'Banknote',
    cartao_credito: 'CreditCard',
    cartao_debito: 'CreditCard',
    pix: 'QrCode',
    crediario: 'Users',
    combinado: 'Layers',
  }
  return icons[forma] || 'DollarSign'
}
