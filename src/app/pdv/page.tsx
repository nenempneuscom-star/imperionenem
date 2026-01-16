'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/stores/cart-store'
import { useOffline } from '@/lib/hooks/use-offline'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  ShoppingCart,
  Loader2,
  Search,
  Plus,
  Minus,
  X,
  Scan,
  Scale,
  Percent,
  Car,
  User,
} from 'lucide-react'

// PDV Components
import {
  PDVHeader,
  WeightModal,
  ClientModal,
  VehicleModal,
  HelpModal,
  DiscountModal,
  PaymentCombinationModal,
  printReceipt,
  ProductSearchResults,
  SidebarSummary,
  ClientFidelidadeSection,
  PaymentSelector,
  PaymentDetails,
  CombinedPaymentSummary,
  NFCeToggle,
  ConfirmSaleFooter,
  PixModal,
  DiscountButton,
  type DadosRecibo,
  type Produto,
  type Cliente,
  type Veiculo,
  type FidelidadeConfig,
  type ClientePontos,
  type NFCeResult,
  type ConfigDesconto,
  type CaixaAberto,
  type Empresa,
  type VendaFinalizada,
  type ItemDesconto,
  type DescontoGeral,
  type PaymentMethodId,
  formatCurrency,
  formatUnidade,
  isProdutoPesavel,
} from '@/components/pdv'

export default function PDVPage() {
  const supabase = createClient()
  const searchRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')

  // Scanner de código de barras
  const lastKeystrokeTime = useRef<number>(0)
  const keystrokeBuffer = useRef<string>('')
  const [isScannerInput, setIsScannerInput] = useState(false)
  const [scannerEnabled, setScannerEnabled] = useState(true)
  const audioContextRef = useRef<AudioContext | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null)
  const [valorRecebido, setValorRecebido] = useState('')
  const [emitirNFCe, setEmitirNFCe] = useState(true)
  const [nfceResult, setNfceResult] = useState<NFCeResult | null>(null)
  const [cpfCliente, setCpfCliente] = useState('')
  const [fiscalConfigurado, setFiscalConfigurado] = useState(false)
  const [caixaAberto, setCaixaAberto] = useState<CaixaAberto | null>(null)
  const [loadingCaixa, setLoadingCaixa] = useState(true)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  // Estados para cliente
  const [showClienteModal, setShowClienteModal] = useState(false)
  const [clienteModalMode, setClienteModalMode] = useState<'crediario' | 'identificacao'>('identificacao')
  const [clienteSearch, setClienteSearch] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [loadingClientes, setLoadingClientes] = useState(false)
  // Estados para veiculo
  const [showVeiculoModal, setShowVeiculoModal] = useState(false)
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<Veiculo | null>(null)
  const [loadingVeiculos, setLoadingVeiculos] = useState(false)
  // Estados para fidelidade
  const [fidelidadeConfig, setFidelidadeConfig] = useState<FidelidadeConfig | null>(null)
  const [clientePontos, setClientePontos] = useState<ClientePontos | null>(null)
  const [usarPontos, setUsarPontos] = useState(false)
  const [pontosAUsar, setPontosAUsar] = useState('')
  const [pontosGanhos, setPontosGanhos] = useState<number | null>(null)
  const [showAjuda, setShowAjuda] = useState(false)
  const [showPixModal, setShowPixModal] = useState(false)
  // Estados para pagamento combinado
  const [showCombinedPaymentModal, setShowCombinedPaymentModal] = useState(false)
  const [combinedPayments, setCombinedPayments] = useState<{ forma: string; valor: number }[] | null>(null)
  const [combinedValorRecebido, setCombinedValorRecebido] = useState<number | undefined>(undefined)
  // Estados para desconto
  const [configDesconto, setConfigDesconto] = useState<ConfigDesconto | null>(null)
  const [showDescontoModal, setShowDescontoModal] = useState(false)
  const [itemDesconto, setItemDesconto] = useState<ItemDesconto | null>(null)
  // Estados para produto pesavel
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [pendingWeightProduct, setPendingWeightProduct] = useState<Produto | null>(null)
  const [weightValue, setWeightValue] = useState('')
  const weightInputRef = useRef<HTMLInputElement>(null)
  const [vendaFinalizada, setVendaFinalizada] = useState<VendaFinalizada | null>(null)

  const {
    items,
    descontoGeral,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTotal,
    getTotalItems,
    getDescontoItens,
    setDescontoGeral,
    clearDescontoGeral,
    setDescontoItem,
    clearDescontoItem,
  } = useCartStore()

  const {
    isOnline,
    isSyncing,
    vendasPendentes,
    cacheAllProducts,
    buscarProdutoOffline,
    salvarVenda,
    sincronizarVendas,
  } = useOffline()

  const subtotal = getSubtotal()
  // Calcular desconto de pontos
  const pontosUsados = usarPontos && clientePontos && fidelidadeConfig
    ? Math.min(parseFloat(pontosAUsar || '0') || 0, clientePontos.saldo_pontos)
    : 0
  const descontoPontos = pontosUsados * (fidelidadeConfig?.valor_ponto_resgate || 0)
  const total = Math.max(0, getTotal() - descontoPontos)
  const troco = parseFloat(valorRecebido || '0') - total

  // Verificar se fiscal esta configurado e buscar dados da empresa
  useEffect(() => {
    async function verificarFiscal() {
      try {
        const response = await fetch('/api/fiscal/status')
        if (response.ok) {
          const data = await response.json()
          setFiscalConfigurado(!data.nfce?.mensagem?.includes('não configurado'))
        }
      } catch {
        setFiscalConfigurado(false)
      }
    }

    async function buscarEmpresa() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: usuario } = await supabase
          .from('usuarios')
          .select('empresa_id')
          .eq('auth_id', user.id)
          .single()

        if (!usuario) return

        const { data: empresaData } = await supabase
          .from('empresas')
          .select('razao_social, nome_fantasia, cnpj, endereco, telefone, config_fiscal')
          .eq('id', usuario.empresa_id)
          .single()

        if (empresaData) {
          let enderecoFormatado: string | undefined
          let cidade: string | undefined
          let uf: string | undefined
          let cep: string | undefined

          if (empresaData.endereco && typeof empresaData.endereco === 'object') {
            const end = empresaData.endereco as Record<string, string>
            cidade = end.cidade
            uf = end.uf
            cep = end.cep
            enderecoFormatado = [
              end.logradouro,
              end.numero,
              end.bairro,
            ].filter(Boolean).join(', ')
          }

          let chavePix: string | undefined
          if (empresaData.config_fiscal && typeof empresaData.config_fiscal === 'object') {
            const config = empresaData.config_fiscal as Record<string, unknown>
            chavePix = config.chave_pix as string | undefined
          }

          setEmpresa({
            nome: empresaData.nome_fantasia || empresaData.razao_social,
            cnpj: empresaData.cnpj,
            endereco: enderecoFormatado || undefined,
            cidade: cidade || undefined,
            uf: uf || undefined,
            cep: cep || undefined,
            telefone: empresaData.telefone || undefined,
            chavePix: chavePix || undefined,
          })
        }
      } catch (error) {
        console.error('Erro ao buscar empresa:', error)
      }
    }

    async function buscarFidelidadeConfig() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: usuario } = await supabase
          .from('usuarios')
          .select('empresa_id')
          .eq('auth_id', user.id)
          .single()

        if (!usuario) return

        const { data: config } = await supabase
          .from('fidelidade_config')
          .select('*')
          .eq('empresa_id', usuario.empresa_id)
          .eq('ativo', true)
          .single()

        if (config) {
          setFidelidadeConfig(config)
        }
      } catch {
        // Programa de fidelidade não configurado
      }
    }

    verificarFiscal()
    buscarEmpresa()
    buscarFidelidadeConfig()
  }, [supabase])

  // Verificar se há caixa aberto
  useEffect(() => {
    async function verificarCaixa() {
      try {
        const response = await fetch('/api/caixa')
        if (response.ok) {
          const data = await response.json()
          setCaixaAberto(data.caixa)
        }
      } catch {
        setCaixaAberto(null)
      } finally {
        setLoadingCaixa(false)
      }
    }
    verificarCaixa()
    carregarConfigDesconto()
  }, [])

  // Carregar configuração de desconto
  async function carregarConfigDesconto() {
    try {
      const response = await fetch('/api/configuracoes/desconto')
      if (response.ok) {
        const data = await response.json()
        setConfigDesconto(data)
      }
    } catch (error) {
      console.error('Erro ao carregar config desconto:', error)
    }
  }

  // Calcula tributos IBPT para os itens do carrinho
  async function calcularTributosIBPT(): Promise<{ valorTributos: number; percentualTributos: number }> {
    let totalTributos = 0
    let totalProdutos = 0

    for (const item of items) {
      const valorItem = item.preco * item.quantidade
      totalProdutos += valorItem

      if (item.ncm) {
        try {
          const response = await fetch(`/api/ibpt?ncm=${item.ncm.replace(/\D/g, '')}`)
          if (response.ok) {
            const data = await response.json()
            if (data.aliquota_total) {
              totalTributos += valorItem * (data.aliquota_total / 100)
            }
          }
        } catch (error) {
          console.error('Erro ao buscar aliquota IBPT:', error)
        }
      }
    }

    const percentual = totalProdutos > 0 ? (totalTributos / totalProdutos) * 100 : 0
    return {
      valorTributos: totalTributos,
      percentualTributos: percentual,
    }
  }

  // Adiciona produto pesavel com a quantidade informada
  function confirmarPesagem() {
    if (!pendingWeightProduct) return

    const peso = parseFloat(weightValue.replace(',', '.'))
    if (isNaN(peso) || peso <= 0) {
      toast.error('Digite um peso válido')
      return
    }

    if (peso > pendingWeightProduct.estoque_atual) {
      toast.error(`Estoque insuficiente. Disponível: ${pendingWeightProduct.estoque_atual} ${pendingWeightProduct.unidade}`)
      return
    }

    addItem({
      id: pendingWeightProduct.id,
      codigo: pendingWeightProduct.codigo,
      nome: pendingWeightProduct.nome,
      preco: pendingWeightProduct.preco_venda,
      quantidade: peso,
      unidade: pendingWeightProduct.unidade,
      ncm: pendingWeightProduct.ncm,
    })

    const valorTotal = pendingWeightProduct.preco_venda * peso
    playBeep(true)
    toast.success(`${pendingWeightProduct.nome}`, {
      description: `${peso} ${formatUnidade(pendingWeightProduct.unidade)} = ${formatCurrency(valorTotal)}`,
    })

    setShowWeightModal(false)
    setPendingWeightProduct(null)
    setWeightValue('')
    setSearch('')
    setProdutos([])
    searchRef.current?.focus()
  }

  // Funcao para tocar beep de confirmacao
  const playBeep = useCallback((success: boolean = true) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = success ? 1200 : 400
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (success ? 0.1 : 0.3))

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + (success ? 0.1 : 0.3))
    } catch (error) {
      console.error('Erro ao tocar beep:', error)
    }
  }, [])

  // Busca rapida para scanner (sem debounce)
  const buscarProdutoScanner = useCallback(async (codigoBarras: string) => {
    if (!codigoBarras.trim()) return

    setLoading(true)
    try {
      let produto: Produto | null = null

      if (isOnline) {
        const { data, error } = await supabase
          .from('produtos')
          .select('id, codigo, codigo_barras, nome, preco_venda, estoque_atual, unidade, ncm')
          .eq('ativo', true)
          .eq('codigo_barras', codigoBarras)
          .single()

        if (!error && data) {
          produto = data
        }
      } else {
        const produtosCache = await buscarProdutoOffline(codigoBarras)
        const encontrado = produtosCache.find(p => p.codigo_barras === codigoBarras)
        if (encontrado) {
          produto = {
            id: encontrado.id,
            codigo: encontrado.codigo,
            codigo_barras: encontrado.codigo_barras,
            nome: encontrado.nome,
            preco_venda: encontrado.preco_venda,
            estoque_atual: encontrado.estoque_atual,
            unidade: encontrado.unidade,
          }
        }
      }

      if (produto) {
        if (produto.estoque_atual <= 0) {
          playBeep(false)
          toast.error('Produto sem estoque', { description: produto.nome })
        } else if (isProdutoPesavel(produto.unidade)) {
          setPendingWeightProduct(produto)
          setWeightValue('')
          setShowWeightModal(true)
          setTimeout(() => weightInputRef.current?.focus(), 100)
        } else {
          addItem({
            id: produto.id,
            codigo: produto.codigo,
            nome: produto.nome,
            preco: produto.preco_venda,
            unidade: produto.unidade,
            ncm: produto.ncm,
          })
          playBeep(true)
          toast.success(produto.nome, { description: `${formatCurrency(produto.preco_venda)} adicionado` })
        }
      } else {
        playBeep(false)
        toast.error('Produto não encontrado', { description: `Código: ${codigoBarras}` })
      }
    } catch (error) {
      console.error('Erro ao buscar produto:', error)
      playBeep(false)
      toast.error('Erro ao buscar produto')
    } finally {
      setLoading(false)
      setSearch('')
      setProdutos([])
      setIsScannerInput(false)
      searchRef.current?.focus()
    }
  }, [isOnline, supabase, buscarProdutoOffline, addItem, playBeep])

  // Handler para detectar entrada de scanner
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!scannerEnabled) return

    const now = Date.now()
    const timeSinceLastKey = now - lastKeystrokeTime.current

    if (timeSinceLastKey < 50 && lastKeystrokeTime.current > 0) {
      setIsScannerInput(true)
    }

    lastKeystrokeTime.current = now

    if (e.key === 'Enter') {
      e.preventDefault()
      const value = (e.target as HTMLInputElement).value.trim()

      if (value) {
        if (isScannerInput || value.length >= 8) {
          buscarProdutoScanner(value)
        } else if (produtos.length === 1) {
          adicionarProduto(produtos[0])
        } else if (produtos.length > 1) {
          toast.info('Selecione um produto da lista')
        }
      }

      setIsScannerInput(false)
      keystrokeBuffer.current = ''
    }
  }, [scannerEnabled, isScannerInput, produtos, buscarProdutoScanner])

  // Auto-focus no campo de busca
  useEffect(() => {
    if (!showClienteModal && !showAjuda) {
      const timer = setTimeout(() => {
        searchRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [showClienteModal, showAjuda])

  // Manter foco no campo de busca
  useEffect(() => {
    const interval = setInterval(() => {
      if (!showClienteModal && !showAjuda) {
        const activeElement = document.activeElement
        const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA'

        if (!isInputFocused) {
          searchRef.current?.focus()
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [showClienteModal, showAjuda])

  // Buscar produtos (online ou offline)
  async function buscarProdutos(termo: string) {
    if (!termo.trim()) {
      setProdutos([])
      return
    }

    setLoading(true)
    try {
      let resultados: Produto[] = []

      if (isOnline) {
        const { data, error } = await supabase
          .from('produtos')
          .select('id, codigo, codigo_barras, nome, preco_venda, estoque_atual, unidade, ncm')
          .eq('ativo', true)
          .or(`codigo.ilike.%${termo}%,codigo_barras.eq.${termo},nome.ilike.%${termo}%`)
          .order('nome')
          .limit(10)

        if (error) throw error
        resultados = data || []
      } else {
        const produtosCache = await buscarProdutoOffline(termo)
        resultados = produtosCache.map(p => ({
          id: p.id,
          codigo: p.codigo,
          codigo_barras: p.codigo_barras,
          nome: p.nome,
          preco_venda: p.preco_venda,
          estoque_atual: p.estoque_atual,
          unidade: p.unidade,
        }))
      }

      if (resultados.length === 1 && resultados[0].codigo_barras === termo) {
        adicionarProduto(resultados[0])
        setSearch('')
        setProdutos([])
        searchRef.current?.focus()
      } else {
        setProdutos(resultados)
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
      if (isOnline) {
        try {
          const produtosCache = await buscarProdutoOffline(termo)
          setProdutos(produtosCache.map(p => ({
            id: p.id,
            codigo: p.codigo,
            codigo_barras: p.codigo_barras,
            nome: p.nome,
            preco_venda: p.preco_venda,
            estoque_atual: p.estoque_atual,
            unidade: p.unidade,
          })))
          toast.info('Usando dados em cache')
        } catch {
          toast.error('Erro ao buscar produtos')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // Debounce na busca
  useEffect(() => {
    const timer = setTimeout(() => {
      buscarProdutos(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  function adicionarProduto(produto: Produto) {
    if (produto.estoque_atual <= 0) {
      playBeep(false)
      toast.error('Produto sem estoque')
      return
    }

    if (isProdutoPesavel(produto.unidade)) {
      setPendingWeightProduct(produto)
      setWeightValue('')
      setShowWeightModal(true)
      setTimeout(() => weightInputRef.current?.focus(), 100)
      return
    }

    addItem({
      id: produto.id,
      codigo: produto.codigo,
      nome: produto.nome,
      preco: produto.preco_venda,
      unidade: produto.unidade,
      ncm: produto.ncm,
    })

    playBeep(true)
    toast.success(`${produto.nome} adicionado`)
    setSearch('')
    setProdutos([])
    searchRef.current?.focus()
  }

  // Buscar clientes para crediario
  async function buscarClientes(termo: string) {
    if (!termo.trim()) {
      setClientes([])
      return
    }

    setLoadingClientes(true)
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, cpf_cnpj, telefone, limite_credito, saldo_devedor')
        .eq('ativo', true)
        .or(`nome.ilike.%${termo}%,cpf_cnpj.ilike.%${termo}%`)
        .order('nome')
        .limit(10)

      if (error) throw error
      setClientes(data || [])
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      toast.error('Erro ao buscar clientes')
    } finally {
      setLoadingClientes(false)
    }
  }

  // Buscar veiculos do cliente
  async function buscarVeiculosCliente(clienteId: string) {
    setLoadingVeiculos(true)
    try {
      const response = await fetch(`/api/veiculos?cliente_id=${clienteId}`)
      if (response.ok) {
        const data = await response.json()
        setVeiculos(data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar veiculos:', error)
      setVeiculos([])
    } finally {
      setLoadingVeiculos(false)
    }
  }

  // Selecionar cliente
  function selecionarCliente(cliente: Cliente) {
    const creditoDisponivel = cliente.limite_credito - cliente.saldo_devedor

    // Se for crediario, validar limite
    if (clienteModalMode === 'crediario' && creditoDisponivel < total) {
      toast.error(`Crédito insuficiente. Disponível: ${formatCurrency(creditoDisponivel)}`)
      return
    }

    setClienteSelecionado(cliente)
    setShowClienteModal(false)
    setClienteSearch('')
    setClientes([])
    toast.success(`Cliente ${cliente.nome} selecionado`)

    if (fidelidadeConfig) {
      buscarPontosCliente(cliente.id)
    }

    // Se for modo identificacao, abrir modal de veiculos
    if (clienteModalMode === 'identificacao') {
      buscarVeiculosCliente(cliente.id)
      setShowVeiculoModal(true)
    }
  }

  // Selecionar veiculo
  function selecionarVeiculo(veiculo: Veiculo | null) {
    setVeiculoSelecionado(veiculo)
    if (veiculo) {
      toast.success(`Veículo ${veiculo.marca} ${veiculo.modelo} selecionado`)
    }
  }

  // Buscar pontos do cliente
  async function buscarPontosCliente(clienteId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('auth_id', user.id)
        .single()

      if (!usuario) return

      const { data: pontos } = await supabase
        .from('fidelidade_pontos')
        .select('saldo_pontos, total_acumulado')
        .eq('empresa_id', usuario.empresa_id)
        .eq('cliente_id', clienteId)
        .single()

      setClientePontos(pontos || null)
    } catch {
      setClientePontos(null)
    }
  }

  // Debounce na busca de clientes
  useEffect(() => {
    if (!showClienteModal) return
    const timer = setTimeout(() => {
      buscarClientes(clienteSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [clienteSearch, showClienteModal])

  // Finalizar venda (online ou offline)
  async function finalizarVenda() {
    const isCombinedPayment = combinedPayments && combinedPayments.length > 0

    if (!selectedPayment && !isCombinedPayment) {
      toast.error('Selecione uma forma de pagamento')
      return
    }

    if (selectedPayment === 'dinheiro' && troco < 0) {
      toast.error('Valor recebido insuficiente')
      return
    }

    const hasCrediario = selectedPayment === 'crediario' || (isCombinedPayment && combinedPayments?.some(p => p.forma === 'crediario'))
    const valorCrediario = isCombinedPayment
      ? combinedPayments?.find(p => p.forma === 'crediario')?.valor || 0
      : (selectedPayment === 'crediario' ? total : 0)

    if (hasCrediario) {
      if (!clienteSelecionado) {
        toast.error('Selecione um cliente para venda no crediário')
        setShowClienteModal(true)
        return
      }

      const creditoDisponivel = clienteSelecionado.limite_credito - clienteSelecionado.saldo_devedor
      if (creditoDisponivel < valorCrediario) {
        toast.error(`Crédito insuficiente. Disponível: ${formatCurrency(creditoDisponivel)}`)
        return
      }
    }

    setPaymentLoading(true)
    setNfceResult(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      let usuarioId = 'offline-user'
      let operadorNome = 'Operador'
      let vendaNumero: number | undefined

      if (user) {
        const { data: userData } = await supabase
          .from('usuarios')
          .select('id, empresa_id, nome')
          .eq('auth_id', user.id)
          .single()

        if (userData) {
          usuarioId = userData.id
          operadorNome = userData.nome || 'Operador'
        }
      }

      const formasPagamentoFiscal: Record<string, string> = {
        'dinheiro': '01',
        'cartao_credito': '03',
        'cartao_debito': '04',
        'pix': '17',
        'crediario': '05',
      }

      let pagamentosFinais: { forma: string; valor: number }[]

      if (isCombinedPayment && combinedPayments) {
        pagamentosFinais = combinedPayments
      } else {
        const formaPagamento = selectedPayment === 'cartao_credito' ? 'cartao_credito' :
                              selectedPayment === 'cartao_debito' ? 'cartao_debito' :
                              selectedPayment === 'pix' ? 'pix' :
                              selectedPayment === 'crediario' ? 'crediario' : 'dinheiro'
        pagamentosFinais = [{ forma: formaPagamento, valor: total }]
      }

      const descontoItensTotal = getDescontoItens()
      const descontoGeralValor = descontoGeral.valor
      const descontoTotal = descontoItensTotal + descontoGeralValor

      const vendaData = {
        tempId: `venda-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        itens: items.map((item) => ({
          produto_id: item.id,
          codigo: item.codigo,
          nome: item.nome,
          quantidade: item.quantidade,
          preco_unitario: item.preco,
          desconto: item.desconto || 0,
          desconto_percentual: item.descontoPercentual || 0,
          desconto_motivo: item.descontoMotivo || null,
          total: (item.preco * item.quantidade) - (item.desconto || 0),
        })),
        pagamentos: pagamentosFinais,
        subtotal,
        desconto: descontoTotal,
        desconto_percentual: descontoGeral.percentual,
        desconto_motivo: descontoGeral.motivo || null,
        total,
        usuario_id: usuarioId,
      }

      if (isOnline) {
        try {
          const { data: userData } = await supabase
            .from('usuarios')
            .select('id, empresa_id')
            .eq('auth_id', user?.id)
            .single()

          if (!userData) throw new Error('Usuário não encontrado')

          const { data: venda, error: vendaError } = await supabase
            .from('vendas')
            .insert({
              empresa_id: userData.empresa_id,
              usuario_id: userData.id,
              caixa_id: caixaAberto?.id || null,
              cliente_id: clienteSelecionado?.id || null,
              veiculo_id: veiculoSelecionado?.id || null,
              subtotal,
              desconto: descontoTotal,
              desconto_percentual: descontoGeral.percentual || 0,
              desconto_motivo: descontoGeral.motivo || null,
              total,
              status: 'finalizada',
              tipo_documento: emitirNFCe && fiscalConfigurado ? 'nfce' : 'sem_nota',
            })
            .select()
            .single()

          if (vendaError) throw vendaError

          vendaNumero = venda.numero

          if (caixaAberto?.id) {
            await supabase
              .from('caixa_movimentos')
              .insert({
                caixa_id: caixaAberto.id,
                tipo: 'entrada',
                valor: total,
                descricao: `Venda #${venda.numero}`,
                venda_id: venda.id,
              })
          }

          const itensVenda = items.map((item) => ({
            venda_id: venda.id,
            produto_id: item.id,
            quantidade: item.quantidade,
            preco_unitario: item.preco,
            desconto: item.desconto || 0,
            desconto_percentual: item.descontoPercentual || 0,
            desconto_motivo: item.descontoMotivo || null,
            total: (item.preco * item.quantidade) - (item.desconto || 0),
          }))

          const { error: itensError } = await supabase
            .from('venda_itens')
            .insert(itensVenda)

          if (itensError) throw itensError

          const pagamentosParaInserir = pagamentosFinais.map(p => ({
            venda_id: venda.id,
            forma_pagamento: p.forma,
            valor: p.valor,
          }))

          const { error: pagamentoError } = await supabase
            .from('venda_pagamentos')
            .insert(pagamentosParaInserir)

          if (pagamentoError) throw pagamentoError

          const pagamentoCrediario = pagamentosFinais.find(p => p.forma === 'crediario')
          if (pagamentoCrediario && clienteSelecionado) {
            await supabase
              .from('crediario')
              .insert({
                empresa_id: userData.empresa_id,
                cliente_id: clienteSelecionado.id,
                venda_id: venda.id,
                tipo: 'debito',
                valor: pagamentoCrediario.valor,
                saldo_anterior: clienteSelecionado.saldo_devedor,
                saldo_posterior: clienteSelecionado.saldo_devedor + pagamentoCrediario.valor,
                descricao: `Venda #${venda.numero} - PDV`,
              })
          }

          if (fidelidadeConfig && clienteSelecionado) {
            try {
              let saldoAtual = clientePontos?.saldo_pontos || 0

              await supabase
                .from('fidelidade_pontos')
                .upsert({
                  empresa_id: userData.empresa_id,
                  cliente_id: clienteSelecionado.id,
                  saldo_pontos: saldoAtual,
                  total_acumulado: clientePontos?.total_acumulado || 0,
                  total_resgatado: 0,
                }, { onConflict: 'empresa_id,cliente_id', ignoreDuplicates: true })

              if (usarPontos && pontosUsados > 0) {
                await supabase
                  .from('fidelidade_movimentos')
                  .insert({
                    empresa_id: userData.empresa_id,
                    cliente_id: clienteSelecionado.id,
                    venda_id: venda.id,
                    tipo: 'resgate',
                    pontos: -pontosUsados,
                    saldo_anterior: saldoAtual,
                    saldo_posterior: saldoAtual - pontosUsados,
                    valor_venda: total,
                    descricao: `Resgate na venda #${venda.numero}`,
                  })

                saldoAtual -= pontosUsados
              }

              const valorParaPontos = total
              const pontosGanhosVenda = Math.floor(valorParaPontos * fidelidadeConfig.pontos_por_real)

              if (pontosGanhosVenda > 0) {
                const dataExpiracao = fidelidadeConfig.validade_dias > 0
                  ? new Date(Date.now() + fidelidadeConfig.validade_dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                  : null

                await supabase
                  .from('fidelidade_movimentos')
                  .insert({
                    empresa_id: userData.empresa_id,
                    cliente_id: clienteSelecionado.id,
                    venda_id: venda.id,
                    tipo: 'acumulo',
                    pontos: pontosGanhosVenda,
                    saldo_anterior: saldoAtual,
                    saldo_posterior: saldoAtual + pontosGanhosVenda,
                    valor_venda: valorParaPontos,
                    data_expiracao: dataExpiracao,
                    descricao: `Acumulo na venda #${venda.numero}`,
                  })

                setPontosGanhos(pontosGanhosVenda)
              }
            } catch (fidelError) {
              console.error('Erro no programa de fidelidade:', fidelError)
            }
          }

          if (emitirNFCe && fiscalConfigurado) {
            try {
              const nfceResponse = await fetch('/api/fiscal/nfce', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  produtos: items.map((item) => ({
                    codigo: item.codigo,
                    nome: item.nome,
                    quantidade: item.quantidade,
                    preco_unitario: item.preco,
                    total: item.preco * item.quantidade,
                    unidade: 'UN',
                  })),
                  pagamentos: pagamentosFinais.map(p => ({
                    forma: formasPagamentoFiscal[p.forma] || '01',
                    valor: p.valor,
                  })),
                  cliente: cpfCliente ? {
                    cpf_cnpj: cpfCliente.replace(/\D/g, ''),
                  } : undefined,
                  valorTotal: total,
                  valorDesconto: descontoTotal,
                }),
              })

              const nfceData = await nfceResponse.json()
              setNfceResult(nfceData)

              if (nfceData.sucesso) {
                await supabase
                  .from('vendas')
                  .update({
                    chave_nfce: nfceData.chave,
                    protocolo_nfce: nfceData.protocolo,
                  })
                  .eq('id', venda.id)

                toast.success('NFC-e emitida com sucesso!')
              } else {
                toast.error('Erro ao emitir NFC-e', { description: nfceData.mensagem })
              }
            } catch (nfceError) {
              console.error('Erro ao emitir NFC-e:', nfceError)
              setNfceResult({ sucesso: false, mensagem: 'Erro ao comunicar com SEFAZ' })
              toast.error('Erro ao emitir NFC-e')
            }
          }

        } catch (error) {
          console.error('Erro ao salvar online, salvando offline:', error)
          await salvarVenda(vendaData)
          toast.info('Venda salva para sincronizar depois')
        }
      } else {
        await salvarVenda(vendaData)
        toast.info('Venda salva offline', { description: 'Será sincronizada quando voltar a conexão' })
      }

      let tributos = { valorTributos: 0, percentualTributos: 0 }
      try {
        tributos = await calcularTributosIBPT()
      } catch (error) {
        console.error('Erro ao calcular tributos IBPT:', error)
      }

      const temDinheiroNoPagamento = pagamentosFinais.some(p => p.forma === 'dinheiro')
      const valorDinheiroNoPagamento = pagamentosFinais.find(p => p.forma === 'dinheiro')?.valor || 0
      const valorRecebidoFinal = isCombinedPayment
        ? (temDinheiroNoPagamento ? combinedValorRecebido : undefined)
        : (selectedPayment === 'dinheiro' ? parseFloat(valorRecebido || '0') : undefined)
      const trocoFinal = valorRecebidoFinal && temDinheiroNoPagamento
        ? Math.max(0, valorRecebidoFinal - valorDinheiroNoPagamento)
        : undefined

      setVendaFinalizada({
        numero: vendaNumero,
        itens: items.map((item) => ({
          codigo: item.codigo,
          nome: item.nome,
          quantidade: item.quantidade,
          preco: item.preco,
          total: (item.preco * item.quantidade) - (item.desconto || 0),
        })),
        subtotal,
        desconto: descontoTotal,
        total,
        pagamentos: pagamentosFinais,
        valorRecebido: valorRecebidoFinal,
        troco: trocoFinal && trocoFinal > 0 ? trocoFinal : undefined,
        operador: operadorNome,
        valorTributos: tributos.valorTributos,
        percentualTributos: tributos.percentualTributos,
      })

      setPaymentSuccess(true)

      setTimeout(() => {
        resetarVenda()
      }, 10000)

    } catch (error) {
      console.error('Erro ao finalizar venda:', error)
      toast.error('Erro ao finalizar venda')
    } finally {
      setPaymentLoading(false)
    }
  }

  function resetarVenda() {
    clearCart()
    setPaymentSuccess(false)
    setSelectedPayment(null)
    setValorRecebido('')
    setNfceResult(null)
    setCpfCliente('')
    setVendaFinalizada(null)
    setClienteSelecionado(null)
    setVeiculoSelecionado(null)
    setVeiculos([])
    setCombinedPayments(null)
    setCombinedValorRecebido(undefined)
    setClientePontos(null)
    setUsarPontos(false)
    setPontosAUsar('')
    setPontosGanhos(null)
    searchRef.current?.focus()
  }

  // Imprimir cupom
  function imprimirCupom() {
    if (!vendaFinalizada) {
      toast.error('Dados da venda não disponíveis')
      return
    }

    const empresaData = empresa || {
      nome: 'EMPRESA',
      cnpj: '00000000000000',
      endereco: undefined,
      cidade: undefined,
      uf: undefined,
      cep: undefined,
      telefone: undefined,
    }

    let dadosCliente: { nome?: string; cpf?: string; telefone?: string; cidade?: string } | undefined
    if (clienteSelecionado) {
      dadosCliente = {
        nome: clienteSelecionado.nome,
        cpf: clienteSelecionado.cpf_cnpj,
        telefone: clienteSelecionado.telefone,
      }
    } else if (cpfCliente) {
      dadosCliente = { cpf: cpfCliente }
    }

    const dadosRecibo: DadosRecibo = {
      empresa: {
        nome: empresaData.nome,
        cnpj: empresaData.cnpj,
        endereco: empresaData.endereco,
        cidade: empresaData.cidade,
        uf: empresaData.uf,
        cep: empresaData.cep,
        telefone: empresaData.telefone,
      },
      numero: vendaFinalizada.numero,
      data: new Date(),
      operador: vendaFinalizada.operador,
      itens: vendaFinalizada.itens,
      subtotal: vendaFinalizada.subtotal,
      desconto: vendaFinalizada.desconto,
      total: vendaFinalizada.total,
      valorTributos: vendaFinalizada.valorTributos,
      percentualTributos: vendaFinalizada.percentualTributos,
      pagamentos: vendaFinalizada.pagamentos,
      valorRecebido: vendaFinalizada.valorRecebido,
      troco: vendaFinalizada.troco,
      nfce: nfceResult?.sucesso
        ? { chave: nfceResult.chave, protocolo: nfceResult.protocolo }
        : undefined,
      cliente: dadosCliente,
    }

    printReceipt({ dados: dadosRecibo, largura: '80mm' })
  }

  // Handler para selecao de pagamento
  function handleSelectPayment(paymentId: PaymentMethodId) {
    if (paymentId === 'combinado') {
      setShowCombinedPaymentModal(true)
      setSelectedPayment(null)
    } else {
      setSelectedPayment(paymentId)
      setCombinedPayments(null)
      setCombinedValorRecebido(undefined)
      if (paymentId === 'pix') {
        setShowPixModal(true)
      } else if (paymentId === 'crediario' && !clienteSelecionado) {
        setClienteModalMode('crediario')
        setShowClienteModal(true)
      }
    }
  }

  // Abrir modal para identificar cliente
  function handleIdentificarCliente() {
    setClienteModalMode('identificacao')
    setShowClienteModal(true)
  }

  // Handler para usar pontos
  function handleUsarPontosChange(usar: boolean, pontosDisponiveis: number) {
    setUsarPontos(usar)
    if (!usar) {
      setPontosAUsar('')
    } else {
      setPontosAUsar(String(pontosDisponiveis))
    }
  }

  // Handler para desconto geral
  function handleApplyDesconto(valor: number, percentual: number, motivo?: string) {
    setDescontoGeral({ valor, percentual, motivo: motivo || '' })
  }

  // Handler para desconto item
  function handleApplyItemDesconto(itemId: string, valor: number, percentual: number, motivo?: string) {
    setDescontoItem(itemId, valor, percentual, motivo || '')
  }

  // Atalhos de teclado
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

      switch (e.key) {
        case 'F1':
          e.preventDefault()
          setShowAjuda(true)
          break
        case 'F2':
          e.preventDefault()
          searchRef.current?.focus()
          break
        case 'F3':
          e.preventDefault()
          window.open('/dashboard/clientes/novo', '_blank')
          break
        case 'F4':
          e.preventDefault()
          if (items.length > 0 && selectedPayment && !paymentLoading) {
            if (selectedPayment === 'dinheiro' && troco < 0) {
              toast.error('Valor recebido insuficiente')
            } else {
              finalizarVenda()
            }
          }
          break
        case 'F5':
          e.preventDefault()
          if (items.length > 0) {
            if (confirm('Limpar todos os itens do carrinho?')) {
              clearCart()
              setSelectedPayment(null)
              setValorRecebido('')
            }
          }
          break
        case 'F6':
          e.preventDefault()
          if (items.length > 0) setSelectedPayment('dinheiro')
          break
        case 'F7':
          e.preventDefault()
          if (items.length > 0) setSelectedPayment('cartao_credito')
          break
        case 'F8':
          e.preventDefault()
          if (items.length > 0) setSelectedPayment('cartao_debito')
          break
        case 'F9':
          e.preventDefault()
          if (items.length > 0) {
            setSelectedPayment('pix')
            setShowPixModal(true)
          }
          break
        case 'F10':
          e.preventDefault()
          if (items.length > 0) {
            setSelectedPayment('crediario')
            if (!clienteSelecionado) {
              setClienteModalMode('crediario')
              setShowClienteModal(true)
            }
          }
          break
        case 'F11':
          e.preventDefault()
          // Identificar cliente
          handleIdentificarCliente()
          break
        case 'F12':
          e.preventDefault()
          window.location.href = '/pdv/caixa'
          break
        case 'd':
        case 'D':
          if (e.ctrlKey && items.length > 0) {
            e.preventDefault()
            setItemDesconto(null)
            setShowDescontoModal(true)
          }
          break
        case 'Escape':
          if (showAjuda) setShowAjuda(false)
          else if (showClienteModal) setShowClienteModal(false)
          else if (showDescontoModal) setShowDescontoModal(false)
          else if (selectedPayment) {
            setSelectedPayment(null)
            setValorRecebido('')
          } else {
            setProdutos([])
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [items, selectedPayment, clienteSelecionado, fidelidadeConfig, showAjuda, showClienteModal, showDescontoModal, clearCart, paymentLoading, troco])

  const canConfirmSale = items.length > 0 &&
    (selectedPayment !== null || (combinedPayments !== null && combinedPayments.length > 0)) &&
    !(selectedPayment === 'dinheiro' && troco < 0)

  return (
    <div className="flex h-screen">
      {/* Área Principal - Produtos */}
      <div className="flex-1 flex flex-col p-4">
        {/* Header */}
        <PDVHeader
          isOnline={isOnline}
          vendasPendentes={vendasPendentes}
          caixaAberto={caixaAberto}
          loadingCaixa={loadingCaixa}
          isSyncing={isSyncing}
          onCacheProducts={cacheAllProducts}
          onSincronizar={sincronizarVendas}
          onShowAjuda={() => setShowAjuda(true)}
        />

        {/* Busca */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder={scannerEnabled ? "Escaneie ou digite o código do produto..." : "Digite o código ou nome do produto..."}
            className={`pl-12 pr-24 h-14 text-lg ${isScannerInput ? 'border-green-500 ring-2 ring-green-500/20' : ''}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            autoFocus
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            {isScannerInput && (
              <Badge variant="default" className="bg-green-500 animate-pulse">
                <Scan className="h-3 w-3 mr-1" />
                Scanner
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-2 ${scannerEnabled ? 'text-green-600' : 'text-muted-foreground'}`}
              onClick={() => setScannerEnabled(!scannerEnabled)}
              title={scannerEnabled ? 'Scanner ativo' : 'Scanner desativado'}
            >
              <Scan className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Lista de produtos encontrados */}
        <ProductSearchResults produtos={produtos} onSelect={adicionarProduto} />

        {/* Area de itens do carrinho */}
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-0 h-full flex flex-col">
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
                <ShoppingCart className="h-20 w-20 mb-4 opacity-20" />
                <p className="text-xl">Carrinho vazio</p>
                <p className="text-sm">Digite o código de barras ou nome do produto</p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="divide-y">
                  {items.map((item, index) => {
                    const itemPesavel = item.unidade && ['KG', 'G', 'L', 'ML', 'M', 'CM', 'M2', 'M3'].includes(item.unidade.toUpperCase())
                    return (
                      <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-muted/50">
                        <span className="text-2xl font-bold text-muted-foreground w-8">{index + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{item.nome}</p>
                            {itemPesavel && <Scale className="h-4 w-4 text-orange-500" />}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.preco)}{itemPesavel ? `/${formatUnidade(item.unidade!)}` : ''} x {itemPesavel ? item.quantidade.toFixed(3).replace('.', ',') : item.quantidade} {itemPesavel ? formatUnidade(item.unidade!) : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {itemPesavel ? (
                            <span className="w-24 text-center font-medium text-orange-600">
                              {item.quantidade.toFixed(3).replace('.', ',')} {formatUnidade(item.unidade!)}
                            </span>
                          ) : (
                            <>
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantidade - 1)}>
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-12 text-center font-medium">{item.quantidade}</span>
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantidade + 1)}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                        <div className="w-28 text-right">
                          <p className="font-bold text-lg">{formatCurrency((item.preco * item.quantidade) - (item.desconto || 0))}</p>
                          {item.desconto && item.desconto > 0 && (
                            <p className="text-xs text-destructive">-{formatCurrency(item.desconto)} ({item.descontoPercentual?.toFixed(1)}%)</p>
                          )}
                        </div>
                        {configDesconto?.permitir_desconto_item && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${item.desconto ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}
                            onClick={() => {
                              if (item.desconto) {
                                clearDescontoItem(item.id)
                                toast.success('Desconto removido')
                              } else {
                                setItemDesconto({ id: item.id, nome: item.nome, preco: item.preco, quantidade: item.quantidade })
                                setShowDescontoModal(true)
                              }
                            }}
                            title={item.desconto ? 'Remover desconto' : 'Aplicar desconto'}
                          >
                            <Percent className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeItem(item.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar - Resumo e Pagamento */}
      <div className="w-[420px] border-l flex flex-col bg-muted/30">
        <ScrollArea className="flex-1">
          <SidebarSummary
            subtotal={subtotal}
            total={total}
            totalItems={getTotalItems()}
            hasItems={items.length > 0}
            descontoItens={getDescontoItens()}
            descontoGeral={descontoGeral}
            descontoPontos={descontoPontos}
            onClearCart={clearCart}
            onClearDescontoGeral={() => {
              clearDescontoGeral()
              toast.success('Desconto removido')
            }}
          />

          {/* Identificação de Cliente/Veículo */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Identificação</span>
              <span className="text-xs text-muted-foreground">F11</span>
            </div>
            {clienteSelecionado ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <User className="h-4 w-4 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{clienteSelecionado.nome}</p>
                    <p className="text-xs text-muted-foreground">{clienteSelecionado.cpf_cnpj}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => {
                      setClienteSelecionado(null)
                      setVeiculoSelecionado(null)
                      setVeiculos([])
                      toast.success('Cliente removido')
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                {veiculoSelecionado ? (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <Car className="h-4 w-4 text-orange-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {veiculoSelecionado.marca} {veiculoSelecionado.modelo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {veiculoSelecionado.placa || `${veiculoSelecionado.ano || ''}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => {
                        setVeiculoSelecionado(null)
                        toast.success('Veículo removido')
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      buscarVeiculosCliente(clienteSelecionado.id)
                      setShowVeiculoModal(true)
                    }}
                  >
                    <Car className="mr-2 h-4 w-4" />
                    Selecionar Veículo
                  </Button>
                )}
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleIdentificarCliente}
              >
                <User className="mr-2 h-4 w-4" />
                Identificar Cliente
              </Button>
            )}
          </div>

          <ClientFidelidadeSection
            fidelidadeConfig={fidelidadeConfig}
            selectedPayment={selectedPayment}
            clienteSelecionado={clienteSelecionado}
            clientePontos={clientePontos}
            usarPontos={usarPontos}
            onUsarPontosChange={handleUsarPontosChange}
            onShowClienteModal={() => setShowClienteModal(true)}
          />

          <DiscountButton
            hasItems={items.length > 0}
            configDesconto={configDesconto}
            descontoGeral={descontoGeral}
            onShowDescontoModal={() => {
              setItemDesconto(null)
              setShowDescontoModal(true)
            }}
          />

          <PaymentSelector
            selectedPayment={selectedPayment}
            hasCombinedPayments={combinedPayments !== null && combinedPayments.length > 0}
            disabled={items.length === 0}
            onSelectPayment={handleSelectPayment}
          />

          {items.length > 0 && (
            <PaymentDetails
              selectedPayment={selectedPayment}
              total={total}
              troco={troco}
              valorRecebido={valorRecebido}
              onValorRecebidoChange={setValorRecebido}
              clienteSelecionado={clienteSelecionado}
              onShowPixModal={() => setShowPixModal(true)}
              onShowClienteModal={() => setShowClienteModal(true)}
            />
          )}

          {items.length > 0 && (
            <CombinedPaymentSummary
              payments={combinedPayments}
              valorRecebido={combinedValorRecebido}
              onEdit={() => setShowCombinedPaymentModal(true)}
            />
          )}

          <NFCeToggle
            emitirNFCe={emitirNFCe}
            onEmitirNFCeChange={setEmitirNFCe}
            fiscalConfigurado={fiscalConfigurado}
            cpfCliente={cpfCliente}
            onCpfClienteChange={setCpfCliente}
          />
        </ScrollArea>

        <ConfirmSaleFooter
          paymentSuccess={paymentSuccess}
          paymentLoading={paymentLoading}
          canConfirm={canConfirmSale}
          troco={troco}
          selectedPayment={selectedPayment}
          pontosGanhos={pontosGanhos}
          onConfirm={finalizarVenda}
          onPrint={imprimirCupom}
          onNewSale={resetarVenda}
        />
      </div>

      {/* Modals */}
      <WeightModal
        open={showWeightModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowWeightModal(false)
            setPendingWeightProduct(null)
            setWeightValue('')
            searchRef.current?.focus()
          }
        }}
        produto={pendingWeightProduct}
        weightValue={weightValue}
        onWeightChange={setWeightValue}
        onConfirm={confirmarPesagem}
        onCancel={() => {
          setShowWeightModal(false)
          setPendingWeightProduct(null)
          setWeightValue('')
          searchRef.current?.focus()
        }}
      />

      <PixModal
        open={showPixModal}
        onOpenChange={setShowPixModal}
        total={total}
        empresa={empresa}
        onConfirm={() => {
          setShowPixModal(false)
          finalizarVenda()
        }}
        onCancel={() => {
          setShowPixModal(false)
          setSelectedPayment(null)
        }}
      />

      <ClientModal
        open={showClienteModal}
        onOpenChange={setShowClienteModal}
        search={clienteSearch}
        onSearchChange={setClienteSearch}
        clientes={clientes}
        loading={loadingClientes}
        total={total}
        onSelectClient={selecionarCliente}
        mode={clienteModalMode}
      />

      <VehicleModal
        open={showVeiculoModal}
        onOpenChange={setShowVeiculoModal}
        cliente={clienteSelecionado}
        veiculos={veiculos}
        loading={loadingVeiculos}
        onSelectVehicle={selecionarVeiculo}
        onRefreshVeiculos={() => clienteSelecionado && buscarVeiculosCliente(clienteSelecionado.id)}
      />

      <HelpModal
        open={showAjuda}
        onOpenChange={setShowAjuda}
        scannerEnabled={scannerEnabled}
        showFidelidade={!!fidelidadeConfig}
      />

      <DiscountModal
        open={showDescontoModal}
        onOpenChange={setShowDescontoModal}
        config={configDesconto}
        subtotal={subtotal}
        item={itemDesconto || undefined}
        onApplyDiscount={handleApplyDesconto}
        onApplyItemDiscount={handleApplyItemDesconto}
      />

      <PaymentCombinationModal
        open={showCombinedPaymentModal}
        onOpenChange={setShowCombinedPaymentModal}
        total={total}
        clienteSelecionado={clienteSelecionado}
        onConfirm={(pagamentos, valorRecebidoDinheiro) => {
          setCombinedPayments(pagamentos)
          setCombinedValorRecebido(valorRecebidoDinheiro)
          setSelectedPayment(null)
        }}
        onSelectCliente={() => setShowClienteModal(true)}
      />
    </div>
  )
}
