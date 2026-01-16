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
  XCircle,
} from 'lucide-react'

// Import types and components from shared module
import {
  type VendaRelatorio,
  type ProdutoRelatorio,
  type PagamentoRelatorio,
  type ResumoFinanceiro,
  type ProdutoCurvaABC,
  type RelatorioDescontos,
  type RelatorioCrediario,
  type RelatorioClientes,
  type RelatorioOperacional,
  type RelatorioEstoqueCritico,
  type RelatorioSaudeFinanceira,
  type RelatorioFiscal,
  type RelatorioCancelamentos,
  type ItemVendido,
  type ResumoVendas,
  type ResumoEstoque,
  type ResumoCurvaABC,
  type ResumoItensVendidos,
  formatCurrency,
  formatDateTime,
  formatDate,
  DateFilter,
  VendasTab,
  PagamentosTab,
  OperacionalTab,
  DescontosTab,
  CrediarioTab,
  ItensVendidosTab,
  MaisVendidosTab,
  CurvaABCTab,
  ClientesTab,
  EstoqueCriticoTab,
  ProdutosTab,
  SaudeTab,
  FiscalTab,
  FinanceiroTab,
} from '@/components/relatorios'

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
  const [relatorioSaude, setRelatórioSaude] = useState<RelatorioSaudeFinanceira | null>(null)
  const [relatorioFiscal, setRelatorioFiscal] = useState<RelatorioFiscal | null>(null)
  const [relatorioCancelamentos, setRelatorioCancelamentos] = useState<RelatorioCancelamentos | null>(null)

  // Itens vendidos detalhado
  const [itensVendidos, setItensVendidos] = useState<ItemVendido[]>([])
  const [resumoItensVendidos, setResumoItensVendidos] = useState({
    totalItens: 0,
    totalQuantidade: 0,
    totalValor: 0,
    totalDesconto: 0,
  })

  // Funcoes dos relatorios existentes
  async function buscarRelatórioVendas() {
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

      toast.success('Relatório gerado!')
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

  async function buscarRelatórioProdutos() {
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

      toast.success('Relatório gerado!')
    } catch (error) {
      toast.error('Erro ao gerar relatorio')
    } finally {
      setLoading(false)
    }
  }

  async function buscarRelatórioMaisVendidos() {
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
      toast.success('Relatório gerado!')
    } catch (error) {
      toast.error('Erro ao gerar relatorio')
    } finally {
      setLoading(false)
    }
  }

  async function buscarRelatórioPagamentos() {
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

      toast.success('Relatório gerado!')
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

      toast.success('Relatório gerado!')
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
  async function buscarRelatórioFofoqueira(tipo: string) {
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
          setRelatórioSaude(data)
          break
        case 'fiscal':
          setRelatorioFiscal(data)
          break
        case 'cancelamentos':
          setRelatorioCancelamentos(data)
          break
      }

      toast.success('Relatório gerado!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar relatorio')
    } finally {
      setLoading(false)
    }
  }

  function exportarExcel(dados: any[], nomeArquivo: string) {
    if (dados.length === 0) {
      toast.error('Não há dados para exportar')
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
      cartao_credito: 'Cartão Crédito',
      cartao_debito: 'Cartão Débito',
      pix: 'PIX',
      crediario: 'Crediário',
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
        Gerar Relatório
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          A "fofoqueira" que sabe tudo sobre seu negócio
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
          <TabsTrigger value="cancelamentos">
            <XCircle className="mr-2 h-4 w-4" />
            Cancelamentos
          </TabsTrigger>
        </TabsList>

        {/* ==================== VENDAS ==================== */}
        <TabsContent value="vendas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Vendas</CardTitle>
              <CardDescription>
                Visualize todas as vendas realizadas no periodo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 items-end">
                <FiltroData onBuscar={buscarRelatórioVendas} />
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
                          <p className="text-sm text-muted-foreground">Ticket Médio</p>
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
                      <TableHead>Número</TableHead>
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
          <ItensVendidosTab
            itens={itensVendidos}
            resumo={resumoItensVendidos}
            filterComponent={<FiltroData onBuscar={buscarItensVendidos} />}
            exportButton={
              itensVendidos.length > 0 ? (
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
              ) : undefined
            }
          />
        </TabsContent>

        {/* ==================== DESCONTOS ==================== */}
        <TabsContent value="descontos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Relatório de Descontos
              </CardTitle>
              <CardDescription>
                Analise completa dos descontos concedidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FiltroData onBuscar={() => buscarRelatórioFofoqueira('descontos')} />

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
                          <p className="text-muted-foreground text-center py-4">Nenhum desconto no período</p>
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
                          <p className="text-muted-foreground text-center py-4">Nenhum desconto no período</p>
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
                              <TableHead>Código</TableHead>
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
                  <p>Clique em "Gerar Relatório" para ver os descontos</p>
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
              <FiltroData onBuscar={buscarRelatórioPagamentos} />

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
                                {pag.quantidade} transação(ões)
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Distribuição</CardTitle>
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
                Relatório de Crediario / Fiado
              </CardTitle>
              <CardDescription>
                Acompanhe os creditos concedidos e inadimplencia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FiltroData onBuscar={() => buscarRelatórioFofoqueira('crediario')} />

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
                  <p>Clique em "Gerar Relatório" para ver o crediario</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== CLIENTES ==================== */}
        <TabsContent value="clientes" className="space-y-4">
          <ClientesTab
            relatorio={relatorioClientes}
            loading={loading}
            filterComponent={<FiltroData onBuscar={() => buscarRelatórioFofoqueira('clientes')} />}
          />
        </TabsContent>

        {/* ==================== OPERACIONAL ==================== */}
        <TabsContent value="operacional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Relatório Operacional
              </CardTitle>
              <CardDescription>
                Analise o dia-a-dia da operacao
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FiltroData onBuscar={() => buscarRelatórioFofoqueira('operacional')} />

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
                          <p className="text-sm text-muted-foreground">Ticket Médio</p>
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
                            <p className="text-sm font-medium text-muted-foreground">Combinações mais usadas:</p>
                            {relatorioOperacional.pagamentosCombinados?.slice(0, 5).map((pc, i) => (
                              <div key={i} className="flex justify-between items-center text-sm">
                                <span className="truncate max-w-[180px]">{pc.combinacao}</span>
                                <Badge variant="secondary">{pc.quantidade}</Badge>
                              </div>
                            ))}
                            {(!relatorioOperacional.pagamentosCombinados ||
                              relatorioOperacional.pagamentosCombinados.length === 0) && (
                              <p className="text-xs text-muted-foreground italic">
                                Detalhes não disponíveis
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Horários de Pico */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Horários de Pico
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
                  <p>Clique em "Gerar Relatório" para ver o operacional</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== MAIS VENDIDOS ==================== */}
        <TabsContent value="mais-vendidos" className="space-y-4">
          <MaisVendidosTab
            produtos={produtos}
            loading={loading}
            filterComponent={<FiltroData onBuscar={buscarRelatórioMaisVendidos} />}
            exportButton={
              produtos.length > 0 ? (
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
              ) : undefined
            }
          />
        </TabsContent>

        {/* ==================== CURVA ABC ==================== */}
        <TabsContent value="curva-abc" className="space-y-4">
          <CurvaABCTab
            produtos={curvaABC}
            resumo={resumoCurvaABC}
            loading={loading}
            filterComponent={<FiltroData onBuscar={buscarCurvaABC} />}
            exportButton={
              curvaABC.length > 0 ? (
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
              ) : undefined
            }
          />
        </TabsContent>

        {/* ==================== ESTOQUE CRITICO ==================== */}
        <TabsContent value="estoque-critico" className="space-y-4">
          <EstoqueCriticoTab
            relatorio={relatorioEstoqueCritico}
            loading={loading}
            onBuscar={() => buscarRelatórioFofoqueira('estoque-critico')}
          />
        </TabsContent>

        {/* ==================== ESTOQUE ==================== */}
        <TabsContent value="produtos" className="space-y-4">
          <ProdutosTab
            produtos={produtos}
            resumo={resumoEstoque}
            filterComponent={
              <Button onClick={buscarRelatórioProdutos} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Gerar Relatório
              </Button>
            }
            exportButton={
              produtos.length > 0 ? (
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
              ) : undefined
            }
          />
        </TabsContent>

        {/* ==================== SAUDE FINANCEIRA ==================== */}
        <TabsContent value="saude" className="space-y-4">
          <SaudeTab
            relatorio={relatorioSaude}
            loading={loading}
            filterComponent={<FiltroData onBuscar={() => buscarRelatórioFofoqueira('saude-financeira')} />}
          />
        </TabsContent>

        {/* ==================== FISCAL ==================== */}
        <TabsContent value="fiscal" className="space-y-4">
          <FiscalTab
            relatorio={relatorioFiscal}
            loading={loading}
            filterComponent={<FiltroData onBuscar={() => buscarRelatórioFofoqueira('fiscal')} />}
          />
        </TabsContent>

        {/* ==================== FINANCEIRO ==================== */}
        <TabsContent value="financeiro" className="space-y-4">
          <FinanceiroTab
            resumo={resumoFinanceiro}
            loading={loading}
            filterComponent={<FiltroData onBuscar={buscarResumoFinanceiro} />}
          />
        </TabsContent>

        {/* ==================== CANCELAMENTOS ==================== */}
        <TabsContent value="cancelamentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Relatório de Cancelamentos
              </CardTitle>
              <CardDescription>
                Analise completa de vendas e notas fiscais canceladas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FiltroData onBuscar={() => buscarRelatórioFofoqueira('cancelamentos')} />

              {relatorioCancelamentos && (
                <>
                  {/* Resumo */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-red-600">Vendas Canceladas</p>
                          <p className="text-2xl font-bold text-red-700">
                            {relatorioCancelamentos.resumo.totalVendasCanceladas}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            de {relatorioCancelamentos.resumo.totalVendasPeriodo} vendas
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-red-600">Valor Cancelado</p>
                          <p className="text-2xl font-bold text-red-700">
                            {formatCurrency(relatorioCancelamentos.resumo.valorTotalCancelado)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Taxa Cancelamento</p>
                          <p className="text-2xl font-bold">
                            {relatorioCancelamentos.resumo.taxaCancelamento.toFixed(1)}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Ticket Médio Cancelado</p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(relatorioCancelamentos.resumo.ticketMedioCancelado)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Notas Fiscais */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">NFC-e Canceladas</p>
                            <p className="text-xl font-bold">{relatorioCancelamentos.resumo.nfcesCanceladas}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Valor</p>
                            <p className="text-lg font-medium text-red-600">
                              {formatCurrency(relatorioCancelamentos.resumo.valorNfceCancelado)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">NF-e Canceladas</p>
                            <p className="text-xl font-bold">{relatorioCancelamentos.resumo.nfesCanceladas}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Valor</p>
                            <p className="text-lg font-medium text-red-600">
                              {formatCurrency(relatorioCancelamentos.resumo.valorNfeCancelado)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Por Motivo e Por Operador */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Por Motivo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {relatorioCancelamentos.porMotivo.length > 0 ? (
                          <div className="space-y-3">
                            {relatorioCancelamentos.porMotivo.map((m, i) => (
                              <div key={i} className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{m.motivo}</p>
                                  <p className="text-xs text-muted-foreground">{m.quantidade} cancelamento(s)</p>
                                </div>
                                <p className="font-bold text-red-600">{formatCurrency(m.valor)}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">Nenhum cancelamento no período</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Por Operador</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {relatorioCancelamentos.porOperador.length > 0 ? (
                          <div className="space-y-3">
                            {relatorioCancelamentos.porOperador.map((o, i) => (
                              <div key={i} className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{o.operador}</p>
                                  <p className="text-xs text-muted-foreground">{o.quantidade} cancelamento(s)</p>
                                </div>
                                <p className="font-bold text-red-600">{formatCurrency(o.valor)}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">Nenhum cancelamento no período</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Dias e Horarios */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Cancelamentos por Dia
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {relatorioCancelamentos.cancelamentosPorDia.length > 0 ? (
                          <div className="space-y-3">
                            {relatorioCancelamentos.cancelamentosPorDia.map((d, i) => (
                              <div key={i} className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">{d.dia}</p>
                                  <p className="text-xs text-muted-foreground">{d.quantidade} cancelamento(s)</p>
                                </div>
                                <p className="font-medium">{formatCurrency(d.valor)}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">Sem dados</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Horários com Mais Cancelamentos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {relatorioCancelamentos.cancelamentosPorHora.length > 0 ? (
                          <div className="space-y-3">
                            {relatorioCancelamentos.cancelamentosPorHora.map((h, i) => (
                              <div key={i} className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <Badge variant={i === 0 ? 'destructive' : 'secondary'}>
                                    {h.hora.toString().padStart(2, '0')}:00
                                  </Badge>
                                  <span className="text-sm">{h.quantidade} cancelamento(s)</span>
                                </div>
                                <p className="font-medium">{formatCurrency(h.valor)}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">Sem dados</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Produtos mais cancelados */}
                  {relatorioCancelamentos.produtosMaisCancelados.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Produtos Mais Cancelados</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Código</TableHead>
                              <TableHead>Produto</TableHead>
                              <TableHead className="text-right">Qtd</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {relatorioCancelamentos.produtosMaisCancelados.map((p, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-mono">{p.codigo}</TableCell>
                                <TableCell>{p.nome}</TableCell>
                                <TableCell className="text-right">{p.quantidade}</TableCell>
                                <TableCell className="text-right text-red-600 font-medium">
                                  {formatCurrency(p.valor)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}

                  {/* Lista de Vendas Canceladas */}
                  {relatorioCancelamentos.vendas.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Vendas Canceladas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Número</TableHead>
                              <TableHead>Data/Hora</TableHead>
                              <TableHead>Cliente</TableHead>
                              <TableHead>Operador</TableHead>
                              <TableHead>Motivo</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {relatorioCancelamentos.vendas.map((v) => (
                              <TableRow key={v.id}>
                                <TableCell className="font-mono">#{v.numero}</TableCell>
                                <TableCell>{formatDateTime(v.data_hora)}</TableCell>
                                <TableCell>{v.cliente}</TableCell>
                                <TableCell>{v.operador}</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={v.motivo}>
                                  {v.motivo}
                                </TableCell>
                                <TableCell className="text-right font-medium text-red-600">
                                  {formatCurrency(v.total)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}

                  {/* Lista de Notas Canceladas */}
                  {relatorioCancelamentos.notas.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Notas Fiscais Canceladas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Número</TableHead>
                              <TableHead>Emitida em</TableHead>
                              <TableHead>Cancelada em</TableHead>
                              <TableHead>Motivo</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {relatorioCancelamentos.notas.map((n) => (
                              <TableRow key={n.id}>
                                <TableCell>
                                  <Badge variant={n.tipo === 'NFC-e' ? 'default' : 'secondary'}>
                                    {n.tipo}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono">{n.numero}/{n.serie}</TableCell>
                                <TableCell>{n.emitida_em ? formatDateTime(n.emitida_em) : '-'}</TableCell>
                                <TableCell>{n.cancelada_em ? formatDateTime(n.cancelada_em) : '-'}</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={n.motivo}>
                                  {n.motivo}
                                </TableCell>
                                <TableCell className="text-right font-medium text-red-600">
                                  {formatCurrency(n.valor)}
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

              {!relatorioCancelamentos && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Clique em "Gerar Relatório" para ver os cancelamentos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
