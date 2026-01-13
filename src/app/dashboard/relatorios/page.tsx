'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  BarChart3,
  ShoppingCart,
  Package,
  DollarSign,
  Loader2,
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  QrCode,
  FileSpreadsheet,
  Users,
  Calendar,
  Wallet,
  Percent,
  AlertTriangle,
  Clock,
  FileText,
  Heart,
  UserX,
  ArrowUpRight,
  ArrowDownRight,
  HandCoins,
  Activity,
  PieChart,
  Layers,
} from 'lucide-react'

// Interfaces existentes
interface VendaRelatorio {
  id: string
  numero: number
  data_hora: string
  total: number
  status: string
  clientes: { nome: string } | null
  usuarios: { nome: string } | null
}

interface ProdutoRelatorio {
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

interface PagamentoRelatorio {
  forma_pagamento: string
  total: number
  quantidade: number
}

interface ResumoFinanceiro {
  total_vendas: number
  total_custo: number
  lucro_bruto: number
  margem: number
  ticket_medio: number
  quantidade_vendas: number
}

interface ProdutoCurvaABC {
  id: string
  codigo: string
  nome: string
  quantidade_vendida: number
  valor_vendido: number
  percentual: number
  percentual_acumulado: number
  classe: 'A' | 'B' | 'C'
}

// Novas interfaces para os relatorios "fofoqueira"
interface RelatorioDescontos {
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

interface RelatorioCrediario {
  resumo: {
    totalCrediario: number
    totalEmAberto: number
    totalAtrasado: number
    totalRecebido: number
    taxaRecuperacao: number
    quantidadeParcelasAbertas: number
    quantidadeParcelasAtrasadas: number
  }
  clientesDevedores: { cliente: string; telefone: string; totalAberto: number; totalAtrasado: number; parcelas: number }[]
  parcelasAtrasadas: any[]
}

interface RelatorioClientes {
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

interface RelatorioOperacional {
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

interface RelatorioEstoqueCritico {
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

interface RelatorioSaudeFinanceira {
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

interface RelatorioFiscal {
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

// Interface para itens vendidos detalhado
interface ItemVendido {
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

export default function RelatoriosPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('vendas')

  // Filtros de data
  const hoje = new Date()
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

  const [dataInicio, setDataInicio] = useState(primeiroDiaMes.toISOString().split('T')[0])
  const [dataFim, setDataFim] = useState(hoje.toISOString().split('T')[0])

  // Dados dos relatorios existentes
  const [vendas, setVendas] = useState<VendaRelatorio[]>([])
  const [produtos, setProdutos] = useState<ProdutoRelatorio[]>([])
  const [pagamentos, setPagamentos] = useState<PagamentoRelatorio[]>([])
  const [resumoFinanceiro, setResumoFinanceiro] = useState<ResumoFinanceiro | null>(null)
  const [curvaABC, setCurvaABC] = useState<ProdutoCurvaABC[]>([])
  const [resumoCurvaABC, setResumoCurvaABC] = useState({
    totalFaturamento: 0,
    qtdClasseA: 0,
    qtdClasseB: 0,
    qtdClasseC: 0,
    valorClasseA: 0,
    valorClasseB: 0,
    valorClasseC: 0,
  })

  const [resumoVendas, setResumoVendas] = useState({
    total: 0,
    quantidade: 0,
    ticketMedio: 0,
  })
  const [resumoEstoque, setResumoEstoque] = useState({
    totalProdutos: 0,
    valorEstoque: 0,
    valorCusto: 0,
    baixoEstoque: 0,
  })

  // Dados dos novos relatorios
  const [relatorioDescontos, setRelatorioDescontos] = useState<RelatorioDescontos | null>(null)
  const [relatorioCrediario, setRelatorioCrediario] = useState<RelatorioCrediario | null>(null)
  const [relatorioClientes, setRelatorioClientes] = useState<RelatorioClientes | null>(null)
  const [relatorioOperacional, setRelatorioOperacional] = useState<RelatorioOperacional | null>(null)
  const [relatorioEstoqueCritico, setRelatorioEstoqueCritico] = useState<RelatorioEstoqueCritico | null>(null)
  const [relatorioSaude, setRelatorioSaude] = useState<RelatorioSaudeFinanceira | null>(null)
  const [relatorioFiscal, setRelatorioFiscal] = useState<RelatorioFiscal | null>(null)

  // Itens vendidos detalhado
  const [itensVendidos, setItensVendidos] = useState<ItemVendido[]>([])
  const [resumoItensVendidos, setResumoItensVendidos] = useState({
    totalItens: 0,
    totalQuantidade: 0,
    totalValor: 0,
    totalDesconto: 0,
  })

  // Funcoes dos relatorios existentes
  async function buscarRelatorioVendas() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          id,
          numero,
          data_hora,
          total,
          status,
          clientes (nome),
          usuarios (nome)
        `)
        .eq('status', 'finalizada')
        .gte('data_hora', `${dataInicio}T00:00:00`)
        .lte('data_hora', `${dataFim}T23:59:59`)
        .order('data_hora', { ascending: false })

      if (error) throw error

      const vendasFormatadas: VendaRelatorio[] = (data || []).map((v: any) => ({
        id: v.id,
        numero: v.numero,
        data_hora: v.data_hora,
        total: v.total,
        status: v.status,
        clientes: Array.isArray(v.clientes) ? v.clientes[0] || null : v.clientes,
        usuarios: Array.isArray(v.usuarios) ? v.usuarios[0] || null : v.usuarios,
      }))

      setVendas(vendasFormatadas)

      const total = data?.reduce((acc, v) => acc + v.total, 0) || 0
      const quantidade = data?.length || 0
      setResumoVendas({
        total,
        quantidade,
        ticketMedio: quantidade > 0 ? total / quantidade : 0,
      })

      toast.success('Relatorio gerado!')
    } catch (error) {
      toast.error('Erro ao gerar relatorio')
    } finally {
      setLoading(false)
    }
  }

  // Buscar itens vendidos detalhado
  async function buscarItensVendidos() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('venda_itens')
        .select(`
          id,
          quantidade,
          preco_unitario,
          desconto,
          total,
          produtos (codigo, nome, unidade),
          vendas!inner (
            numero,
            data_hora,
            status,
            clientes (nome)
          )
        `)
        .eq('vendas.status', 'finalizada')
        .gte('vendas.data_hora', `${dataInicio}T00:00:00`)
        .lte('vendas.data_hora', `${dataFim}T23:59:59`)
        .order('vendas(data_hora)', { ascending: false })

      if (error) throw error

      const itensFormatados: ItemVendido[] = (data || []).map((item: any) => ({
        id: item.id,
        venda_numero: item.vendas?.numero || 0,
        venda_data: item.vendas?.data_hora || '',
        cliente_nome: item.vendas?.clientes?.nome || 'Consumidor',
        produto_codigo: item.produtos?.codigo || '-',
        produto_nome: item.produtos?.nome || 'Produto removido',
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        desconto: item.desconto || 0,
        total: item.total,
        unidade: item.produtos?.unidade || 'UN',
      }))

      setItensVendidos(itensFormatados)

      // Calcular resumo
      const totalItens = itensFormatados.length
      const totalQuantidade = itensFormatados.reduce((acc, i) => acc + i.quantidade, 0)
      const totalValor = itensFormatados.reduce((acc, i) => acc + i.total, 0)
      const totalDesconto = itensFormatados.reduce((acc, i) => acc + i.desconto, 0)

      setResumoItensVendidos({
        totalItens,
        totalQuantidade,
        totalValor,
        totalDesconto,
      })

      toast.success(`${totalItens} itens encontrados!`)
    } catch (error) {
      console.error('Erro ao buscar itens vendidos:', error)
      toast.error('Erro ao gerar relatorio')
    } finally {
      setLoading(false)
    }
  }

  async function buscarRelatorioProdutos() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, codigo, nome, estoque_atual, estoque_minimo, preco_venda, preco_custo, unidade')
        .eq('ativo', true)
        .order('nome')

      if (error) throw error

      setProdutos(data || [])

      const totalProdutos = data?.length || 0
      const valorEstoque = data?.reduce((acc, p) => acc + (p.estoque_atual * p.preco_venda), 0) || 0
      const valorCusto = data?.reduce((acc, p) => acc + (p.estoque_atual * (p.preco_custo || 0)), 0) || 0
      const baixoEstoque = data?.filter(p => p.estoque_atual <= p.estoque_minimo).length || 0

      setResumoEstoque({
        totalProdutos,
        valorEstoque,
        valorCusto,
        baixoEstoque,
      })

      toast.success('Relatorio gerado!')
    } catch (error) {
      toast.error('Erro ao gerar relatorio')
    } finally {
      setLoading(false)
    }
  }

  async function buscarRelatorioMaisVendidos() {
    setLoading(true)
    try {
      const { data: itensVendidos, error } = await supabase
        .from('venda_itens')
        .select(`
          produto_id,
          quantidade,
          preco_unitario,
          total,
          produtos (id, codigo, nome, preco_venda, preco_custo, unidade)
        `)
        .gte('created_at', `${dataInicio}T00:00:00`)
        .lte('created_at', `${dataFim}T23:59:59`)

      if (error) throw error

      const agrupado: { [key: string]: ProdutoRelatorio } = {}
      itensVendidos?.forEach((item: any) => {
        if (item.produtos) {
          const id = item.produto_id
          if (!agrupado[id]) {
            agrupado[id] = {
              id: item.produtos.id,
              codigo: item.produtos.codigo,
              nome: item.produtos.nome,
              preco_venda: item.produtos.preco_venda,
              preco_custo: item.produtos.preco_custo || 0,
              unidade: item.produtos.unidade,
              estoque_atual: 0,
              estoque_minimo: 0,
              total_vendido: 0,
              valor_vendido: 0,
            }
          }
          agrupado[id].total_vendido! += item.quantidade
          agrupado[id].valor_vendido! += item.total
        }
      })

      const produtosOrdenados = Object.values(agrupado).sort(
        (a, b) => (b.valor_vendido || 0) - (a.valor_vendido || 0)
      )

      setProdutos(produtosOrdenados)
      toast.success('Relatorio gerado!')
    } catch (error) {
      toast.error('Erro ao gerar relatorio')
    } finally {
      setLoading(false)
    }
  }

  async function buscarRelatorioPagamentos() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('venda_pagamentos')
        .select(`
          forma_pagamento,
          valor,
          vendas!inner (data_hora, status)
        `)
        .eq('vendas.status', 'finalizada')
        .gte('vendas.data_hora', `${dataInicio}T00:00:00`)
        .lte('vendas.data_hora', `${dataFim}T23:59:59`)

      if (error) throw error

      const agrupado: { [key: string]: PagamentoRelatorio } = {}
      data?.forEach((pag: any) => {
        const forma = pag.forma_pagamento
        if (!agrupado[forma]) {
          agrupado[forma] = {
            forma_pagamento: forma,
            total: 0,
            quantidade: 0,
          }
        }
        agrupado[forma].total += pag.valor
        agrupado[forma].quantidade++
      })

      const pagamentosOrdenados = Object.values(agrupado).sort((a, b) => b.total - a.total)
      setPagamentos(pagamentosOrdenados)

      toast.success('Relatorio gerado!')
    } catch (error) {
      toast.error('Erro ao gerar relatorio')
    } finally {
      setLoading(false)
    }
  }

  async function buscarResumoFinanceiro() {
    setLoading(true)
    try {
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select(`
          id,
          total,
          venda_itens (
            quantidade,
            preco_unitario,
            produtos (preco_custo)
          )
        `)
        .eq('status', 'finalizada')
        .gte('data_hora', `${dataInicio}T00:00:00`)
        .lte('data_hora', `${dataFim}T23:59:59`)

      if (vendasError) throw vendasError

      let totalVendas = 0
      let totalCusto = 0
      let quantidadeVendas = vendas?.length || 0

      vendas?.forEach((venda: any) => {
        totalVendas += venda.total
        venda.venda_itens?.forEach((item: any) => {
          const custoProduto = item.produtos?.preco_custo || 0
          totalCusto += item.quantidade * custoProduto
        })
      })

      const lucroBruto = totalVendas - totalCusto
      const margem = totalVendas > 0 ? (lucroBruto / totalVendas) * 100 : 0
      const ticketMedio = quantidadeVendas > 0 ? totalVendas / quantidadeVendas : 0

      setResumoFinanceiro({
        total_vendas: totalVendas,
        total_custo: totalCusto,
        lucro_bruto: lucroBruto,
        margem,
        ticket_medio: ticketMedio,
        quantidade_vendas: quantidadeVendas,
      })

      toast.success('Relatorio gerado!')
    } catch (error) {
      toast.error('Erro ao gerar relatorio')
    } finally {
      setLoading(false)
    }
  }

  async function buscarCurvaABC() {
    setLoading(true)
    try {
      const { data: itensVendidos, error } = await supabase
        .from('venda_itens')
        .select(`
          produto_id,
          quantidade,
          total,
          produtos (id, codigo, nome)
        `)
        .gte('created_at', `${dataInicio}T00:00:00`)
        .lte('created_at', `${dataFim}T23:59:59`)

      if (error) throw error

      const agrupado: { [key: string]: { id: string; codigo: string; nome: string; quantidade: number; valor: number } } = {}
      itensVendidos?.forEach((item: any) => {
        if (item.produtos) {
          const id = item.produto_id
          if (!agrupado[id]) {
            agrupado[id] = {
              id: item.produtos.id,
              codigo: item.produtos.codigo,
              nome: item.produtos.nome,
              quantidade: 0,
              valor: 0,
            }
          }
          agrupado[id].quantidade += item.quantidade
          agrupado[id].valor += item.total
        }
      })

      const produtosOrdenados = Object.values(agrupado).sort((a, b) => b.valor - a.valor)
      const totalFaturamento = produtosOrdenados.reduce((acc, p) => acc + p.valor, 0)

      let acumulado = 0
      const produtosABC: ProdutoCurvaABC[] = produtosOrdenados.map((p) => {
        const percentual = totalFaturamento > 0 ? (p.valor / totalFaturamento) * 100 : 0
        acumulado += percentual

        let classe: 'A' | 'B' | 'C' = 'C'
        if (acumulado <= 80) {
          classe = 'A'
        } else if (acumulado <= 95) {
          classe = 'B'
        }

        return {
          id: p.id,
          codigo: p.codigo,
          nome: p.nome,
          quantidade_vendida: p.quantidade,
          valor_vendido: p.valor,
          percentual,
          percentual_acumulado: acumulado,
          classe,
        }
      })

      setCurvaABC(produtosABC)

      const classeA = produtosABC.filter(p => p.classe === 'A')
      const classeB = produtosABC.filter(p => p.classe === 'B')
      const classeC = produtosABC.filter(p => p.classe === 'C')

      setResumoCurvaABC({
        totalFaturamento,
        qtdClasseA: classeA.length,
        qtdClasseB: classeB.length,
        qtdClasseC: classeC.length,
        valorClasseA: classeA.reduce((acc, p) => acc + p.valor_vendido, 0),
        valorClasseB: classeB.reduce((acc, p) => acc + p.valor_vendido, 0),
        valorClasseC: classeC.reduce((acc, p) => acc + p.valor_vendido, 0),
      })

      toast.success('Curva ABC gerada!')
    } catch (error) {
      toast.error('Erro ao gerar Curva ABC')
    } finally {
      setLoading(false)
    }
  }

  // Funcoes dos novos relatorios "fofoqueira"
  async function buscarRelatorioFofoqueira(tipo: string) {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        tipo,
        dataInicio,
        dataFim,
      })

      const response = await fetch(`/api/relatorios/fofoqueira?${params}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao buscar relatorio')
      }

      const data = await response.json()

      switch (tipo) {
        case 'descontos':
          setRelatorioDescontos(data)
          break
        case 'crediario':
          setRelatorioCrediario(data)
          break
        case 'clientes':
          setRelatorioClientes(data)
          break
        case 'operacional':
          setRelatorioOperacional(data)
          break
        case 'estoque-critico':
          setRelatorioEstoqueCritico(data)
          break
        case 'saude-financeira':
          setRelatorioSaude(data)
          break
        case 'fiscal':
          setRelatorioFiscal(data)
          break
      }

      toast.success('Relatorio gerado!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar relatorio')
    } finally {
      setLoading(false)
    }
  }

  function exportarExcel(dados: any[], nomeArquivo: string) {
    if (dados.length === 0) {
      toast.error('Nao ha dados para exportar')
      return
    }

    const headers = Object.keys(dados[0])
    const csvContent = [
      headers.join(';'),
      ...dados.map(row =>
        headers.map(header => {
          let value = row[header]
          if (typeof value === 'object' && value !== null) {
            value = value.nome || JSON.stringify(value)
          }
          if (typeof value === 'number') {
            value = value.toString().replace('.', ',')
          }
          return `"${value || ''}"`
        }).join(';')
      )
    ].join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${nomeArquivo}_${dataInicio}_${dataFim}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast.success('Arquivo exportado!')
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  function formatDateTime(date: string) {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  function formatFormaPagamento(forma: string) {
    const nomes: Record<string, string> = {
      dinheiro: 'Dinheiro',
      cartao_credito: 'Cartao Credito',
      cartao_debito: 'Cartao Debito',
      pix: 'PIX',
      crediario: 'Crediario',
    }
    return nomes[forma] || forma
  }

  function getIconePagamento(forma: string) {
    switch (forma) {
      case 'dinheiro':
        return <Banknote className="h-5 w-5 text-green-600" />
      case 'cartao_credito':
        return <CreditCard className="h-5 w-5 text-blue-600" />
      case 'cartao_debito':
        return <CreditCard className="h-5 w-5 text-purple-600" />
      case 'pix':
        return <QrCode className="h-5 w-5 text-teal-600" />
      default:
        return <Wallet className="h-5 w-5 text-gray-600" />
    }
  }

  const totalPagamentos = pagamentos.reduce((acc, p) => acc + p.total, 0)

  // Componente de filtro de datas reutilizavel
  const FiltroData = ({ onBuscar }: { onBuscar: () => void }) => (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="space-y-2">
        <Label>Data Inicio</Label>
        <Input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Data Fim</Label>
        <Input
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
        />
      </div>
      <Button onClick={onBuscar} disabled={loading}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Search className="mr-2 h-4 w-4" />
        )}
        Gerar Relatorio
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatorios</h1>
        <p className="text-muted-foreground">
          A "fofoqueira" que sabe tudo sobre seu negocio
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="vendas">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="itens-vendidos">
            <Package className="mr-2 h-4 w-4" />
            Itens Vendidos
          </TabsTrigger>
          <TabsTrigger value="descontos">
            <Percent className="mr-2 h-4 w-4" />
            Descontos
          </TabsTrigger>
          <TabsTrigger value="pagamentos">
            <CreditCard className="mr-2 h-4 w-4" />
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="crediario">
            <HandCoins className="mr-2 h-4 w-4" />
            Crediario
          </TabsTrigger>
          <TabsTrigger value="clientes">
            <Users className="mr-2 h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="operacional">
            <Activity className="mr-2 h-4 w-4" />
            Operacional
          </TabsTrigger>
          <TabsTrigger value="mais-vendidos">
            <TrendingUp className="mr-2 h-4 w-4" />
            Mais Vendidos
          </TabsTrigger>
          <TabsTrigger value="curva-abc">
            <BarChart3 className="mr-2 h-4 w-4" />
            Curva ABC
          </TabsTrigger>
          <TabsTrigger value="estoque-critico">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Estoque Critico
          </TabsTrigger>
          <TabsTrigger value="produtos">
            <Package className="mr-2 h-4 w-4" />
            Estoque
          </TabsTrigger>
          <TabsTrigger value="saude">
            <Heart className="mr-2 h-4 w-4" />
            Saude Financeira
          </TabsTrigger>
          <TabsTrigger value="fiscal">
            <FileText className="mr-2 h-4 w-4" />
            Fiscal
          </TabsTrigger>
          <TabsTrigger value="financeiro">
            <DollarSign className="mr-2 h-4 w-4" />
            Financeiro
          </TabsTrigger>
        </TabsList>

        {/* ==================== VENDAS ==================== */}
        <TabsContent value="vendas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatorio de Vendas</CardTitle>
              <CardDescription>
                Visualize todas as vendas realizadas no periodo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 items-end">
                <FiltroData onBuscar={buscarRelatorioVendas} />
                {vendas.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => exportarExcel(
                      vendas.map(v => ({
                        Numero: v.numero,
                        Data: formatDateTime(v.data_hora),
                        Cliente: v.clientes?.nome || 'Consumidor',
                        Vendedor: v.usuarios?.nome || '-',
                        Total: v.total,
                      })),
                      'vendas'
                    )}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                )}
              </div>

              {resumoVendas.quantidade > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <DollarSign className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Vendido</p>
                          <p className="text-2xl font-bold">{formatCurrency(resumoVendas.total)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <ShoppingCart className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Quantidade de Vendas</p>
                          <p className="text-2xl font-bold">{resumoVendas.quantidade}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <BarChart3 className="h-8 w-8 text-purple-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Ticket Medio</p>
                          <p className="text-2xl font-bold">{formatCurrency(resumoVendas.ticketMedio)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {vendas.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numero</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendas.map((venda) => (
                      <TableRow key={venda.id}>
                        <TableCell className="font-mono">#{venda.numero}</TableCell>
                        <TableCell>{formatDateTime(venda.data_hora)}</TableCell>
                        <TableCell>{venda.clientes?.nome || 'Consumidor'}</TableCell>
                        <TableCell>{venda.usuarios?.nome || '-'}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(venda.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ITENS VENDIDOS ==================== */}
        <TabsContent value="itens-vendidos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Itens Vendidos no Periodo
              </CardTitle>
              <CardDescription>
                Lista detalhada de todos os produtos e servicos vendidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 items-end">
                <FiltroData onBuscar={buscarItensVendidos} />
                {itensVendidos.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => exportarExcel(
                      itensVendidos.map(i => ({
                        'Venda #': i.venda_numero,
                        'Data/Hora': formatDateTime(i.venda_data),
                        'Cliente': i.cliente_nome,
                        'Codigo': i.produto_codigo,
                        'Produto': i.produto_nome,
                        'Qtd': i.quantidade,
                        'Unidade': i.unidade,
                        'Preco Unit.': i.preco_unitario,
                        'Desconto': i.desconto,
                        'Total': i.total,
                      })),
                      'itens_vendidos'
                    )}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar Excel
                  </Button>
                )}
              </div>

              {resumoItensVendidos.totalItens > 0 && (
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <Package className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total de Itens</p>
                          <p className="text-2xl font-bold">{resumoItensVendidos.totalItens}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <TrendingUp className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Quantidade Total</p>
                          <p className="text-2xl font-bold">{resumoItensVendidos.totalQuantidade.toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <DollarSign className="h-8 w-8 text-emerald-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Valor Total</p>
                          <p className="text-2xl font-bold">{formatCurrency(resumoItensVendidos.totalValor)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <Percent className="h-8 w-8 text-orange-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Descontos</p>
                          <p className="text-2xl font-bold">{formatCurrency(resumoItensVendidos.totalDesconto)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {itensVendidos.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Venda</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Preco Unit.</TableHead>
                        <TableHead className="text-right">Desconto</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itensVendidos.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">#{item.venda_numero}</TableCell>
                          <TableCell>{formatDateTime(item.venda_data)}</TableCell>
                          <TableCell>{item.cliente_nome}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.produto_nome}</p>
                              <p className="text-xs text-muted-foreground">{item.produto_codigo}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantidade} {item.unidade}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.preco_unitario)}</TableCell>
                          <TableCell className="text-right text-orange-600">
                            {item.desconto > 0 ? `-${formatCurrency(item.desconto)}` : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione o periodo e clique em "Gerar Relatorio" para ver os itens vendidos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== DESCONTOS ==================== */}
        <TabsContent value="descontos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Relatorio de Descontos
              </CardTitle>
              <CardDescription>
                Analise completa dos descontos concedidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FiltroData onBuscar={() => buscarRelatorioFofoqueira('descontos')} />

              {relatorioDescontos && (
                <>
                  {/* Resumo */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-red-600">Total em Descontos</p>
                          <p className="text-2xl font-bold text-red-700">
                            {formatCurrency(relatorioDescontos.resumo.totalDesconto)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Desconto no Total</p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(relatorioDescontos.resumo.totalDescontoVendas)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {relatorioDescontos.resumo.quantidadeVendas} vendas
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Desconto por Item</p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(relatorioDescontos.resumo.totalDescontoItens)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {relatorioDescontos.resumo.quantidadeItens} itens
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Total Ocorrencias</p>
                          <p className="text-2xl font-bold">
                            {relatorioDescontos.resumo.quantidadeVendas + relatorioDescontos.resumo.quantidadeItens}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Por Motivo */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Por Motivo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {relatorioDescontos.porMotivo.length > 0 ? (
                          <div className="space-y-3">
                            {relatorioDescontos.porMotivo.map((m, i) => (
                              <div key={i} className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{m.motivo}</p>
                                  <p className="text-xs text-muted-foreground">{m.quantidade} vezes</p>
                                </div>
                                <p className="font-bold text-red-600">-{formatCurrency(m.valor)}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">Nenhum desconto no periodo</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Por Operador</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {relatorioDescontos.porOperador.length > 0 ? (
                          <div className="space-y-3">
                            {relatorioDescontos.porOperador.map((o, i) => (
                              <div key={i} className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{o.operador}</p>
                                  <p className="text-xs text-muted-foreground">{o.quantidade} descontos</p>
                                </div>
                                <p className="font-bold text-red-600">-{formatCurrency(o.valor)}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">Nenhum desconto no periodo</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Produtos com mais desconto */}
                  {relatorioDescontos.porProduto.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Produtos que Mais Recebem Desconto</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Codigo</TableHead>
                              <TableHead>Produto</TableHead>
                              <TableHead className="text-right">Vezes</TableHead>
                              <TableHead className="text-right">Total Desconto</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {relatorioDescontos.porProduto.map((p, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-mono">{p.codigo}</TableCell>
                                <TableCell>{p.nome}</TableCell>
                                <TableCell className="text-right">{p.quantidade}</TableCell>
                                <TableCell className="text-right text-red-600 font-medium">
                                  -{formatCurrency(p.valor)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {!relatorioDescontos && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Percent className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Clique em "Gerar Relatorio" para ver os descontos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== PAGAMENTOS ==================== */}
        <TabsContent value="pagamentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendas por Forma de Pagamento</CardTitle>
              <CardDescription>
                Analise das vendas por tipo de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FiltroData onBuscar={buscarRelatorioPagamentos} />

              {pagamentos.length > 0 && (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {pagamentos.map((pag) => (
                      <Card key={pag.forma_pagamento}>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-4">
                            {getIconePagamento(pag.forma_pagamento)}
                            <div className="flex-1">
                              <p className="text-sm text-muted-foreground">
                                {formatFormaPagamento(pag.forma_pagamento)}
                              </p>
                              <p className="text-xl font-bold">{formatCurrency(pag.total)}</p>
                              <p className="text-xs text-muted-foreground">
                                {pag.quantidade} transacao(oes)
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Distribuicao</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {pagamentos.map((pag) => {
                        const percentual = totalPagamentos > 0
                          ? (pag.total / totalPagamentos) * 100
                          : 0
                        return (
                          <div key={pag.forma_pagamento} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="flex items-center gap-2">
                                {getIconePagamento(pag.forma_pagamento)}
                                {formatFormaPagamento(pag.forma_pagamento)}
                              </span>
                              <span className="font-medium">
                                {percentual.toFixed(1)}% ({formatCurrency(pag.total)})
                              </span>
                            </div>
                            <Progress value={percentual} className="h-2" />
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== CREDIARIO ==================== */}
        <TabsContent value="crediario" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HandCoins className="h-5 w-5" />
                Relatorio de Crediario / Fiado
              </CardTitle>
              <CardDescription>
                Acompanhe os creditos concedidos e inadimplencia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FiltroData onBuscar={() => buscarRelatorioFofoqueira('crediario')} />

              {relatorioCrediario && (
                <>
                  {/* Resumo */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Total Crediario</p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(relatorioCrediario.resumo.totalCrediario)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-yellow-600">Em Aberto</p>
                          <p className="text-2xl font-bold text-yellow-700">
                            {formatCurrency(relatorioCrediario.resumo.totalEmAberto)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {relatorioCrediario.resumo.quantidadeParcelasAbertas} parcelas
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-red-600">Atrasado</p>
                          <p className="text-2xl font-bold text-red-700">
                            {formatCurrency(relatorioCrediario.resumo.totalAtrasado)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {relatorioCrediario.resumo.quantidadeParcelasAtrasadas} parcelas
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-green-600">Taxa Recuperacao</p>
                          <p className="text-2xl font-bold text-green-700">
                            {relatorioCrediario.resumo.taxaRecuperacao.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(relatorioCrediario.resumo.totalRecebido)} recebido
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Clientes Devedores */}
                  {relatorioCrediario.clientesDevedores.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Clientes com Debito em Aberto</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Cliente</TableHead>
                              <TableHead>Telefone</TableHead>
                              <TableHead className="text-right">Parcelas</TableHead>
                              <TableHead className="text-right">Em Aberto</TableHead>
                              <TableHead className="text-right">Atrasado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {relatorioCrediario.clientesDevedores.map((c, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium">{c.cliente}</TableCell>
                                <TableCell>{c.telefone || '-'}</TableCell>
                                <TableCell className="text-right">{c.parcelas}</TableCell>
                                <TableCell className="text-right text-yellow-600">
                                  {formatCurrency(c.totalAberto)}
                                </TableCell>
                                <TableCell className="text-right text-red-600 font-medium">
                                  {c.totalAtrasado > 0 ? formatCurrency(c.totalAtrasado) : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {!relatorioCrediario && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <HandCoins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Clique em "Gerar Relatorio" para ver o crediario</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== CLIENTES ==================== */}
        <TabsContent value="clientes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Relatorio de Clientes
              </CardTitle>
              <CardDescription>
                Conheca seus clientes e identifique oportunidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FiltroData onBuscar={() => buscarRelatorioFofoqueira('clientes')} />

              {relatorioClientes && (
                <>
                  {/* Resumo */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Total Clientes</p>
                          <p className="text-2xl font-bold">{relatorioClientes.resumo.totalClientes}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-green-600">Clientes Novos</p>
                          <p className="text-2xl font-bold text-green-700">
                            {relatorioClientes.resumo.clientesNovos}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Vendas Identificadas</p>
                          <p className="text-2xl font-bold">
                            {relatorioClientes.resumo.percentualIdentificado.toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {relatorioClientes.resumo.vendasCliente} de {relatorioClientes.resumo.vendasCliente + relatorioClientes.resumo.vendasConsumidor}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Total Vendido</p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(relatorioClientes.resumo.totalVendas)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Melhores Clientes */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          Melhores Clientes (Por Valor)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {relatorioClientes.melhoresClientes.slice(0, 10).map((c, i) => (
                            <div key={i} className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{c.nome}</p>
                                <p className="text-xs text-muted-foreground">
                                  {c.quantidadeCompras} compras | Ticket: {formatCurrency(c.ticketMedio)}
                                </p>
                              </div>
                              <p className="font-bold text-green-600">{formatCurrency(c.totalCompras)}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Clientes que Sumiram */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <UserX className="h-4 w-4 text-red-500" />
                          Clientes que Sumiram (+30 dias)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {relatorioClientes.clientesSumiram.length > 0 ? (
                          <div className="space-y-3">
                            {relatorioClientes.clientesSumiram.slice(0, 10).map((c, i) => (
                              <div key={i} className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{c.nome}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Ultima compra: {formatCurrency(c.totalCompras)}
                                  </p>
                                </div>
                                <Badge variant="destructive">
                                  {c.diasSemCompra} dias
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">
                            Todos os clientes estao ativos!
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {!relatorioClientes && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Clique em "Gerar Relatorio" para conhecer seus clientes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== OPERACIONAL ==================== */}
        <TabsContent value="operacional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Relatorio Operacional
              </CardTitle>
              <CardDescription>
                Analise o dia-a-dia da operacao
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FiltroData onBuscar={() => buscarRelatorioFofoqueira('operacional')} />

              {relatorioOperacional && (
                <>
                  {/* Resumo */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-green-600">Total Vendido</p>
                          <p className="text-2xl font-bold text-green-700">
                            {formatCurrency(relatorioOperacional.resumo.valorTotal)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {relatorioOperacional.resumo.totalVendas} vendas
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-red-600">Cancelamentos</p>
                          <p className="text-2xl font-bold text-red-700">
                            {relatorioOperacional.resumo.vendasCanceladas}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(relatorioOperacional.resumo.valorCancelado)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Taxa Cancelamento</p>
                          <p className="text-2xl font-bold">
                            {relatorioOperacional.resumo.taxaCancelamento.toFixed(1)}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Ticket Medio</p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(
                              relatorioOperacional.resumo.totalVendas > 0
                                ? relatorioOperacional.resumo.valorTotal / relatorioOperacional.resumo.totalVendas
                                : 0
                            )}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Pagamentos Combinados */}
                  {relatorioOperacional.resumo.vendasPagamentoCombinado !== undefined &&
                   relatorioOperacional.resumo.vendasPagamentoCombinado > 0 && (
                    <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Layers className="h-4 w-4 text-purple-600" />
                          Pagamentos Combinados
                        </CardTitle>
                        <CardDescription>
                          Vendas com multiplas formas de pagamento
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="text-center p-4 bg-white dark:bg-gray-900 rounded-lg">
                            <p className="text-sm text-muted-foreground">Vendas Combinadas</p>
                            <p className="text-3xl font-bold text-purple-600">
                              {relatorioOperacional.resumo.vendasPagamentoCombinado}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {relatorioOperacional.resumo.percentualCombinado?.toFixed(1)}% do total
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Combinacoes mais usadas:</p>
                            {relatorioOperacional.pagamentosCombinados?.slice(0, 5).map((pc, i) => (
                              <div key={i} className="flex justify-between items-center text-sm">
                                <span className="truncate max-w-[180px]">{pc.combinacao}</span>
                                <Badge variant="secondary">{pc.quantidade}</Badge>
                              </div>
                            ))}
                            {(!relatorioOperacional.pagamentosCombinados ||
                              relatorioOperacional.pagamentosCombinados.length === 0) && (
                              <p className="text-xs text-muted-foreground italic">
                                Detalhes nao disponiveis
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Horarios de Pico */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Horarios de Pico
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {relatorioOperacional.horariosPico.map((h, i) => (
                            <div key={i} className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Badge variant={i === 0 ? 'default' : 'secondary'}>
                                  {h.hora.toString().padStart(2, '0')}:00
                                </Badge>
                                <span className="text-sm">{h.quantidade} vendas</span>
                              </div>
                              <p className="font-medium">{formatCurrency(h.valor)}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Dias da Semana */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Dias da Semana
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {relatorioOperacional.diasSemana.map((d, i) => (
                            <div key={i} className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{d.dia}</p>
                                <p className="text-xs text-muted-foreground">{d.quantidade} vendas</p>
                              </div>
                              <p className="font-medium">{formatCurrency(d.valor)}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Por Operador */}
                  {relatorioOperacional.porOperador.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Vendas por Operador</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                          {relatorioOperacional.porOperador.map((o, i) => (
                            <div key={i} className="p-4 bg-muted rounded-lg">
                              <p className="font-medium">{o.operador}</p>
                              <p className="text-2xl font-bold">{formatCurrency(o.valor)}</p>
                              <p className="text-xs text-muted-foreground">{o.quantidade} vendas</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {!relatorioOperacional && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Clique em "Gerar Relatorio" para ver o operacional</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== MAIS VENDIDOS ==================== */}
        <TabsContent value="mais-vendidos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
              <CardDescription>
                Ranking dos produtos mais vendidos no periodo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 items-end">
                <FiltroData onBuscar={buscarRelatorioMaisVendidos} />
                {produtos.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => exportarExcel(
                      produtos.map((p, i) => ({
                        Rank: i + 1,
                        Codigo: p.codigo,
                        Produto: p.nome,
                        Quantidade: p.total_vendido,
                        Valor_Total: p.valor_vendido,
                      })),
                      'mais_vendidos'
                    )}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                )}
              </div>

              {produtos.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Codigo</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Qtd. Vendida</TableHead>
                      <TableHead className="text-right">Total Faturado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtos.slice(0, 20).map((produto, index) => (
                      <TableRow key={produto.id}>
                        <TableCell>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-100 text-gray-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-primary/10 text-primary'
                          }`}>
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{produto.codigo}</TableCell>
                        <TableCell>{produto.nome}</TableCell>
                        <TableCell className="text-right font-medium">
                          {produto.total_vendido} {produto.unidade}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(produto.valor_vendido || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {produtos.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Clique em "Gerar Relatorio" para visualizar os produtos mais vendidos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== CURVA ABC ==================== */}
        <TabsContent value="curva-abc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Curva ABC - Analise de Pareto</CardTitle>
              <CardDescription>
                Classificacao dos produtos por importancia no faturamento (80-15-5)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 items-end">
                <FiltroData onBuscar={buscarCurvaABC} />
                {curvaABC.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => exportarExcel(
                      curvaABC.map((p, i) => ({
                        Rank: i + 1,
                        Codigo: p.codigo,
                        Produto: p.nome,
                        Quantidade: p.quantidade_vendida,
                        Valor: p.valor_vendido,
                        Percentual: p.percentual.toFixed(2),
                        Acumulado: p.percentual_acumulado.toFixed(2),
                        Classe: p.classe,
                      })),
                      'curva_abc'
                    )}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                )}
              </div>

              {curvaABC.length > 0 && (
                <>
                  {/* Resumo das Classes */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border-green-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500 text-white text-xl font-bold mb-2">
                            A
                          </div>
                          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                            {resumoCurvaABC.qtdClasseA} produtos
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-500">
                            {formatCurrency(resumoCurvaABC.valorClasseA)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            ~80% do faturamento
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20 border-yellow-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500 text-white text-xl font-bold mb-2">
                            B
                          </div>
                          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                            {resumoCurvaABC.qtdClasseB} produtos
                          </p>
                          <p className="text-sm text-yellow-600 dark:text-yellow-500">
                            {formatCurrency(resumoCurvaABC.valorClasseB)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            ~15% do faturamento
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 border-red-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500 text-white text-xl font-bold mb-2">
                            C
                          </div>
                          <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                            {resumoCurvaABC.qtdClasseC} produtos
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-500">
                            {formatCurrency(resumoCurvaABC.valorClasseC)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            ~5% do faturamento
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground text-lg font-bold mb-2">
                            <DollarSign className="h-6 w-6" />
                          </div>
                          <p className="text-2xl font-bold">
                            {formatCurrency(resumoCurvaABC.totalFaturamento)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Faturamento Total
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {curvaABC.length} produtos
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Barra Visual das Classes */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Distribuicao do Faturamento</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex h-8 rounded-lg overflow-hidden">
                        <div
                          className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                          style={{ width: `${(resumoCurvaABC.valorClasseA / resumoCurvaABC.totalFaturamento) * 100}%` }}
                        >
                          A ({((resumoCurvaABC.valorClasseA / resumoCurvaABC.totalFaturamento) * 100).toFixed(0)}%)
                        </div>
                        <div
                          className="bg-yellow-500 flex items-center justify-center text-white text-xs font-medium"
                          style={{ width: `${(resumoCurvaABC.valorClasseB / resumoCurvaABC.totalFaturamento) * 100}%` }}
                        >
                          B ({((resumoCurvaABC.valorClasseB / resumoCurvaABC.totalFaturamento) * 100).toFixed(0)}%)
                        </div>
                        <div
                          className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                          style={{ width: `${(resumoCurvaABC.valorClasseC / resumoCurvaABC.totalFaturamento) * 100}%` }}
                        >
                          C ({((resumoCurvaABC.valorClasseC / resumoCurvaABC.totalFaturamento) * 100).toFixed(0)}%)
                        </div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>{resumoCurvaABC.qtdClasseA} itens ({((resumoCurvaABC.qtdClasseA / curvaABC.length) * 100).toFixed(0)}%)</span>
                        <span>{resumoCurvaABC.qtdClasseB} itens ({((resumoCurvaABC.qtdClasseB / curvaABC.length) * 100).toFixed(0)}%)</span>
                        <span>{resumoCurvaABC.qtdClasseC} itens ({((resumoCurvaABC.qtdClasseC / curvaABC.length) * 100).toFixed(0)}%)</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tabela de Produtos */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead className="w-16">Classe</TableHead>
                        <TableHead>Codigo</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Qtd.</TableHead>
                        <TableHead className="text-right">Faturamento</TableHead>
                        <TableHead className="text-right">%</TableHead>
                        <TableHead className="text-right">% Acum.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {curvaABC.map((produto, index) => (
                        <TableRow key={produto.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                produto.classe === 'A'
                                  ? 'bg-green-500 hover:bg-green-600'
                                  : produto.classe === 'B'
                                  ? 'bg-yellow-500 hover:bg-yellow-600'
                                  : 'bg-red-500 hover:bg-red-600'
                              }
                            >
                              {produto.classe}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono">{produto.codigo}</TableCell>
                          <TableCell>{produto.nome}</TableCell>
                          <TableCell className="text-right">{produto.quantidade_vendida}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(produto.valor_vendido)}
                          </TableCell>
                          <TableCell className="text-right">{produto.percentual.toFixed(2)}%</TableCell>
                          <TableCell className="text-right font-medium">
                            {produto.percentual_acumulado.toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}

              {curvaABC.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Clique em "Gerar Curva ABC" para classificar os produtos</p>
                  <p className="text-sm mt-2">
                    A analise ABC identifica quais produtos sao mais importantes para seu faturamento
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ESTOQUE CRITICO ==================== */}
        <TabsContent value="estoque-critico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Estoque Critico
              </CardTitle>
              <CardDescription>
                Produtos que precisam de atencao urgente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => buscarRelatorioFofoqueira('estoque-critico')} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Verificar Estoque
              </Button>

              {relatorioEstoqueCritico && (
                <>
                  {/* Resumo */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Total Produtos</p>
                          <p className="text-2xl font-bold">{relatorioEstoqueCritico.resumo.totalProdutos}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-yellow-600">Abaixo do Minimo</p>
                          <p className="text-2xl font-bold text-yellow-700">
                            {relatorioEstoqueCritico.resumo.abaixoMinimo}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-red-600">Estoque Zerado</p>
                          <p className="text-2xl font-bold text-red-700">
                            {relatorioEstoqueCritico.resumo.estoqueZerado}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-orange-600">Produtos Parados</p>
                          <p className="text-2xl font-bold text-orange-700">
                            {relatorioEstoqueCritico.resumo.produtosParados}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(relatorioEstoqueCritico.resumo.valorParado)} parado
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Estoque Zerado */}
                    {relatorioEstoqueCritico.estoqueZerado.length > 0 && (
                      <Card className="border-red-200">
                        <CardHeader>
                          <CardTitle className="text-base text-red-600">Estoque Zerado</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {relatorioEstoqueCritico.estoqueZerado.map((p: any, i: number) => (
                              <div key={i} className="flex justify-between items-center text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                <div>
                                  <p className="font-mono text-xs text-muted-foreground">{p.codigo}</p>
                                  <p className="font-medium">{p.nome}</p>
                                </div>
                                <Badge variant="destructive">0 {p.unidade}</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Abaixo do Minimo */}
                    {relatorioEstoqueCritico.abaixoMinimo.length > 0 && (
                      <Card className="border-yellow-200">
                        <CardHeader>
                          <CardTitle className="text-base text-yellow-600">Abaixo do Minimo</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {relatorioEstoqueCritico.abaixoMinimo.map((p: any, i: number) => (
                              <div key={i} className="flex justify-between items-center text-sm p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                                <div>
                                  <p className="font-mono text-xs text-muted-foreground">{p.codigo}</p>
                                  <p className="font-medium">{p.nome}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-yellow-600">{p.estoque_atual} {p.unidade}</p>
                                  <p className="text-xs text-muted-foreground">Min: {p.estoque_minimo}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Produtos Parados */}
                  {relatorioEstoqueCritico.produtosParados.length > 0 && (
                    <Card className="border-orange-200">
                      <CardHeader>
                        <CardTitle className="text-base text-orange-600">
                          Produtos Parados (Sem venda ha 60+ dias)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Codigo</TableHead>
                              <TableHead>Produto</TableHead>
                              <TableHead className="text-right">Estoque</TableHead>
                              <TableHead className="text-right">Valor Parado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {relatorioEstoqueCritico.produtosParados.slice(0, 15).map((p: any, i: number) => (
                              <TableRow key={i}>
                                <TableCell className="font-mono">{p.codigo}</TableCell>
                                <TableCell>{p.nome}</TableCell>
                                <TableCell className="text-right">{p.estoque_atual} {p.unidade}</TableCell>
                                <TableCell className="text-right text-orange-600 font-medium">
                                  {formatCurrency(p.valorEstoque)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {!relatorioEstoqueCritico && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Clique em "Verificar Estoque" para identificar problemas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ESTOQUE ==================== */}
        <TabsContent value="produtos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatorio de Estoque</CardTitle>
              <CardDescription>
                Posicao atual do estoque de produtos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={buscarRelatorioProdutos} disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Gerar Relatorio
                </Button>
                {produtos.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => exportarExcel(
                      produtos.map(p => ({
                        Codigo: p.codigo,
                        Produto: p.nome,
                        Estoque: p.estoque_atual,
                        Minimo: p.estoque_minimo,
                        Preco_Custo: p.preco_custo,
                        Preco_Venda: p.preco_venda,
                        Valor_Estoque: p.estoque_atual * p.preco_venda,
                      })),
                      'estoque'
                    )}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                )}
              </div>

              {resumoEstoque.totalProdutos > 0 && (
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <Package className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total de Produtos</p>
                          <p className="text-2xl font-bold">{resumoEstoque.totalProdutos}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <DollarSign className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Valor Venda</p>
                          <p className="text-2xl font-bold">{formatCurrency(resumoEstoque.valorEstoque)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <DollarSign className="h-8 w-8 text-orange-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Valor Custo</p>
                          <p className="text-2xl font-bold">{formatCurrency(resumoEstoque.valorCusto)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className={resumoEstoque.baixoEstoque > 0 ? 'border-red-500' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <Package className={`h-8 w-8 ${resumoEstoque.baixoEstoque > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                          <p className={`text-2xl font-bold ${resumoEstoque.baixoEstoque > 0 ? 'text-red-600' : ''}`}>
                            {resumoEstoque.baixoEstoque}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {produtos.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codigo</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                      <TableHead className="text-right">Minimo</TableHead>
                      <TableHead className="text-right">Preco Venda</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtos.map((produto) => {
                      const baixo = produto.estoque_atual <= produto.estoque_minimo
                      return (
                        <TableRow key={produto.id}>
                          <TableCell className="font-mono">{produto.codigo}</TableCell>
                          <TableCell>{produto.nome}</TableCell>
                          <TableCell className="text-right">
                            {produto.estoque_atual} {produto.unidade}
                          </TableCell>
                          <TableCell className="text-right">
                            {produto.estoque_minimo} {produto.unidade}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(produto.preco_venda)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(produto.estoque_atual * produto.preco_venda)}
                          </TableCell>
                          <TableCell>
                            {baixo ? (
                              <Badge variant="destructive">Baixo</Badge>
                            ) : (
                              <Badge variant="default">OK</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== SAUDE FINANCEIRA ==================== */}
        <TabsContent value="saude" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Saude Financeira
              </CardTitle>
              <CardDescription>
                Visao completa da saude do seu negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FiltroData onBuscar={() => buscarRelatorioFofoqueira('saude-financeira')} />

              {relatorioSaude && (
                <>
                  {/* DRE Simplificado */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">DRE Simplificado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                          <span>Receita Bruta</span>
                          <span className="font-bold text-green-600">
                            {formatCurrency(relatorioSaude.periodo.receitaBruta)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
                          <span>(-) Descontos</span>
                          <span className="font-bold text-red-600">
                            -{formatCurrency(relatorioSaude.periodo.descontos)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <span>= Receita Liquida</span>
                          <span className="font-bold text-blue-600">
                            {formatCurrency(relatorioSaude.periodo.receitaLiquida)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
                          <span>(-) CMV (Custo Mercadoria Vendida)</span>
                          <span className="font-bold text-orange-600">
                            -{formatCurrency(relatorioSaude.periodo.cmv)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-primary/10 rounded border-2 border-primary">
                          <span className="font-bold">= Lucro Bruto</span>
                          <span className="font-bold text-primary text-xl">
                            {formatCurrency(relatorioSaude.periodo.lucroBruto)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Indicadores */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Margem Bruta</p>
                          <p className={`text-2xl font-bold ${
                            relatorioSaude.indicadores.margemBruta >= 30 ? 'text-green-600' :
                            relatorioSaude.indicadores.margemBruta >= 15 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {relatorioSaude.indicadores.margemBruta.toFixed(1)}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">% Descontos</p>
                          <p className={`text-2xl font-bold ${
                            relatorioSaude.indicadores.percentualDesconto <= 5 ? 'text-green-600' :
                            relatorioSaude.indicadores.percentualDesconto <= 10 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {relatorioSaude.indicadores.percentualDesconto.toFixed(1)}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Ticket Medio</p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(relatorioSaude.periodo.ticketMedio)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Total Vendas</p>
                          <p className="text-2xl font-bold">
                            {relatorioSaude.periodo.quantidadeVendas}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Comparativo com Periodo Anterior */}
                  {relatorioSaude.comparativo && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Comparativo com Periodo Anterior</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="p-4 bg-muted rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">Periodo Anterior</p>
                            <p className="text-xl font-bold">
                              {formatCurrency(relatorioSaude.comparativo.receitaAnterior)}
                            </p>
                          </div>
                          <div className="p-4 bg-muted rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">Periodo Atual</p>
                            <p className="text-xl font-bold">
                              {formatCurrency(relatorioSaude.periodo.receitaLiquida)}
                            </p>
                          </div>
                          <div className={`p-4 rounded-lg text-center ${
                            relatorioSaude.comparativo.crescimento >= 0
                              ? 'bg-green-50 dark:bg-green-900/20'
                              : 'bg-red-50 dark:bg-red-900/20'
                          }`}>
                            <p className="text-sm text-muted-foreground">Crescimento</p>
                            <p className={`text-xl font-bold flex items-center justify-center gap-1 ${
                              relatorioSaude.comparativo.crescimento >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {relatorioSaude.comparativo.crescimento >= 0 ? (
                                <ArrowUpRight className="h-5 w-5" />
                              ) : (
                                <ArrowDownRight className="h-5 w-5" />
                              )}
                              {relatorioSaude.comparativo.crescimento.toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(Math.abs(relatorioSaude.comparativo.diferencaValor))}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Fluxo de Caixa */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Fluxo de Caixa Projetado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                          <p className="text-sm text-green-600">A Receber</p>
                          <p className="text-xl font-bold text-green-700">
                            {formatCurrency(relatorioSaude.fluxoCaixa.totalReceber)}
                          </p>
                        </div>
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                          <p className="text-sm text-red-600">A Pagar</p>
                          <p className="text-xl font-bold text-red-700">
                            {formatCurrency(relatorioSaude.fluxoCaixa.totalPagar)}
                          </p>
                        </div>
                        <div className={`p-4 rounded-lg text-center ${
                          relatorioSaude.fluxoCaixa.saldo >= 0
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'bg-orange-50 dark:bg-orange-900/20'
                        }`}>
                          <p className="text-sm text-muted-foreground">Saldo Projetado</p>
                          <p className={`text-xl font-bold ${
                            relatorioSaude.fluxoCaixa.saldo >= 0 ? 'text-blue-700' : 'text-orange-700'
                          }`}>
                            {formatCurrency(relatorioSaude.fluxoCaixa.saldo)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {!relatorioSaude && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Clique em "Gerar Relatorio" para ver a saude financeira</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== FISCAL ==================== */}
        <TabsContent value="fiscal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Relatorio Fiscal
              </CardTitle>
              <CardDescription>
                Notas fiscais emitidas e impostos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FiltroData onBuscar={() => buscarRelatorioFofoqueira('fiscal')} />

              {relatorioFiscal && (
                <>
                  {/* NFC-e e NF-e */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* NFC-e */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">NFC-e (Cupom Fiscal)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3 grid-cols-2">
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded text-center">
                            <p className="text-sm text-green-600">Emitidas</p>
                            <p className="text-xl font-bold text-green-700">{relatorioFiscal.nfce.emitidas}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(relatorioFiscal.nfce.valorEmitido)}
                            </p>
                          </div>
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded text-center">
                            <p className="text-sm text-red-600">Canceladas</p>
                            <p className="text-xl font-bold text-red-700">{relatorioFiscal.nfce.canceladas}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(relatorioFiscal.nfce.valorCancelado)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* NF-e */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">NF-e (Nota Fiscal)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3 grid-cols-2">
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded text-center">
                            <p className="text-sm text-green-600">Emitidas</p>
                            <p className="text-xl font-bold text-green-700">{relatorioFiscal.nfe.emitidas}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(relatorioFiscal.nfe.valorEmitido)}
                            </p>
                          </div>
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded text-center">
                            <p className="text-sm text-red-600">Canceladas</p>
                            <p className="text-xl font-bold text-red-700">{relatorioFiscal.nfe.canceladas}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(relatorioFiscal.nfe.valorCancelado)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Impostos (IBPT) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Impostos Aproximados (IBPT)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="p-4 bg-muted rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">Total Vendas</p>
                          <p className="text-xl font-bold">
                            {formatCurrency(relatorioFiscal.impostos.totalVendas)}
                          </p>
                        </div>
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                          <p className="text-sm text-yellow-600">Total Impostos</p>
                          <p className="text-xl font-bold text-yellow-700">
                            {formatCurrency(relatorioFiscal.impostos.totalImpostos)}
                          </p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">Carga Tributaria Media</p>
                          <p className="text-xl font-bold">
                            {relatorioFiscal.impostos.percentualMedio.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {!relatorioFiscal && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Clique em "Gerar Relatorio" para ver o fiscal</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== FINANCEIRO ==================== */}
        <TabsContent value="financeiro" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
              <CardDescription>
                Analise de faturamento, custos e lucratividade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FiltroData onBuscar={buscarResumoFinanceiro} />

              {resumoFinanceiro && (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <p className="text-sm text-green-700 dark:text-green-400">Total de Vendas</p>
                          <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                            {formatCurrency(resumoFinanceiro.total_vendas)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {resumoFinanceiro.quantidade_vendas} vendas
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200">
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <p className="text-sm text-orange-700 dark:text-orange-400">Custo das Mercadorias</p>
                          <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">
                            {formatCurrency(resumoFinanceiro.total_custo)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            CMV (Custo Mercadoria Vendida)
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <p className="text-sm text-blue-700 dark:text-blue-400">Lucro Bruto</p>
                          <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                            {formatCurrency(resumoFinanceiro.lucro_bruto)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Margem: {resumoFinanceiro.margem.toFixed(1)}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <BarChart3 className="h-10 w-10 text-purple-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Ticket Medio</p>
                            <p className="text-2xl font-bold">{formatCurrency(resumoFinanceiro.ticket_medio)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <TrendingUp className="h-10 w-10 text-green-500" />
                          <div>
                            <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                            <p className="text-2xl font-bold">{resumoFinanceiro.margem.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Progress value={resumoFinanceiro.margem} className="h-3" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {!resumoFinanceiro && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Clique em "Gerar Relatorio" para visualizar o resumo financeiro</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
