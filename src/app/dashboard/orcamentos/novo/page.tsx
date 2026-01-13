'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { ArrowLeft, Search, Plus, Save, Loader2, User, Package } from 'lucide-react'

import {
  type Produto,
  type Cliente,
  type ClienteManual,
  type ItemOrcamento,
  ClienteCard,
  ClienteForm,
  ClienteModal,
  ItensTable,
  ItensEmpty,
  ObservacoesCard,
  ResumoCard,
  ProdutoModal,
} from '@/components/orcamentos'

export default function NovoOrcamentoPage() {
  const router = useRouter()
  const supabase = createClient()

  const [saving, setSaving] = useState(false)

  // Cliente
  const [showClienteModal, setShowClienteModal] = useState(false)
  const [clienteSearch, setClienteSearch] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [clienteManual, setClienteManual] = useState<ClienteManual>({
    nome: '',
    telefone: '',
    email: '',
    cpf_cnpj: '',
  })

  // Produtos
  const [showProdutoModal, setShowProdutoModal] = useState(false)
  const [produtoSearch, setProdutoSearch] = useState('')
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loadingProdutos, setLoadingProdutos] = useState(false)

  // Itens
  const [itens, setItens] = useState<ItemOrcamento[]>([])

  // Configuracoes
  const [validadeDias, setValidadeDias] = useState(7)
  const [observacoes, setObservacoes] = useState('')
  const [condicoes, setCondicoes] = useState('')
  const [desconto, setDesconto] = useState(0)

  // Calculos
  const subtotal = itens.reduce((acc, item) => acc + item.total, 0)
  const total = subtotal - desconto

  // Buscar clientes
  useEffect(() => {
    if (clienteSearch.length >= 2) {
      const timer = setTimeout(() => buscarClientes(), 300)
      return () => clearTimeout(timer)
    }
  }, [clienteSearch])

  async function buscarClientes() {
    setLoadingClientes(true)
    try {
      const { data } = await supabase
        .from('clientes')
        .select('id, nome, cpf_cnpj, telefone, email')
        .or(`nome.ilike.%${clienteSearch}%,cpf_cnpj.ilike.%${clienteSearch}%,telefone.ilike.%${clienteSearch}%`)
        .limit(10)

      setClientes(data || [])
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
    } finally {
      setLoadingClientes(false)
    }
  }

  // Buscar produtos
  useEffect(() => {
    if (produtoSearch.length >= 2) {
      const timer = setTimeout(() => buscarProdutos(), 300)
      return () => clearTimeout(timer)
    }
  }, [produtoSearch])

  async function buscarProdutos() {
    setLoadingProdutos(true)
    try {
      const { data } = await supabase
        .from('produtos')
        .select('id, codigo, nome, preco_venda, estoque_atual, unidade')
        .or(`nome.ilike.%${produtoSearch}%,codigo.ilike.%${produtoSearch}%,codigo_barras.ilike.%${produtoSearch}%`)
        .eq('ativo', true)
        .limit(20)

      setProdutos(data || [])
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    } finally {
      setLoadingProdutos(false)
    }
  }

  function adicionarProduto(produto: Produto) {
    const itemExistente = itens.find(i => i.produto_id === produto.id)
    if (itemExistente) {
      setItens(itens.map(i =>
        i.produto_id === produto.id
          ? { ...i, quantidade: i.quantidade + 1, total: (i.quantidade + 1) * i.preco_unitario - i.desconto }
          : i
      ))
    } else {
      const novoItem: ItemOrcamento = {
        id: `temp-${Date.now()}`,
        produto_id: produto.id,
        codigo: produto.codigo,
        nome: produto.nome,
        unidade: produto.unidade,
        quantidade: 1,
        preco_unitario: produto.preco_venda,
        desconto: 0,
        total: produto.preco_venda,
      }
      setItens([...itens, novoItem])
    }
    setShowProdutoModal(false)
    setProdutoSearch('')
  }

  function atualizarItem(id: string, campo: string, valor: number) {
    setItens(itens.map(item => {
      if (item.id === id) {
        const novoItem = { ...item, [campo]: valor }
        novoItem.total = (novoItem.quantidade * novoItem.preco_unitario) - novoItem.desconto
        return novoItem
      }
      return item
    }))
  }

  function removerItem(id: string) {
    setItens(itens.filter(i => i.id !== id))
  }

  function selecionarCliente(cliente: Cliente) {
    setClienteSelecionado(cliente)
    setShowClienteModal(false)
    setClienteSearch('')
  }

  async function salvarOrcamento() {
    if (itens.length === 0) {
      toast.error('Adicione pelo menos um item ao orcamento')
      return
    }

    setSaving(true)
    try {
      const payload = {
        cliente_id: clienteSelecionado?.id || null,
        cliente_nome: clienteSelecionado ? null : clienteManual.nome || null,
        cliente_telefone: clienteSelecionado ? null : clienteManual.telefone || null,
        cliente_email: clienteSelecionado ? null : clienteManual.email || null,
        cliente_cpf_cnpj: clienteSelecionado ? null : clienteManual.cpf_cnpj || null,
        itens: itens.map(item => ({
          produto_id: item.produto_id,
          codigo: item.codigo,
          nome: item.nome,
          unidade: item.unidade,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          desconto: item.desconto,
        })),
        desconto,
        validade_dias: validadeDias,
        observacoes: observacoes || null,
        condicoes: condicoes || null,
      }

      const response = await fetch('/api/orcamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar')
      }

      const data = await response.json()
      toast.success(`Orcamento #${data.numero} criado com sucesso!`)
      router.push('/dashboard/orcamentos')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar orcamento')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/orcamentos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Novo Orcamento</h1>
            <p className="text-muted-foreground">
              Crie um orcamento profissional para o cliente
            </p>
          </div>
        </div>
        <Button onClick={salvarOrcamento} disabled={saving || itens.length === 0}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Orcamento
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
              <CardDescription>
                Selecione um cliente cadastrado ou informe os dados manualmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clienteSelecionado ? (
                <ClienteCard
                  cliente={clienteSelecionado}
                  onAlterar={() => setClienteSelecionado(null)}
                />
              ) : (
                <div className="space-y-4">
                  <Button variant="outline" onClick={() => setShowClienteModal(true)}>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar Cliente Cadastrado
                  </Button>
                  <Separator />
                  <ClienteForm cliente={clienteManual} onChange={setClienteManual} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Itens */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Itens do Orcamento
                  </CardTitle>
                  <CardDescription>
                    Adicione os produtos ou servicos
                  </CardDescription>
                </div>
                <Button onClick={() => setShowProdutoModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {itens.length === 0 ? (
                <ItensEmpty onAddItem={() => setShowProdutoModal(true)} />
              ) : (
                <ItensTable
                  itens={itens}
                  editable
                  onUpdateItem={atualizarItem}
                  onRemoveItem={removerItem}
                />
              )}
            </CardContent>
          </Card>

          {/* Observacoes */}
          <ObservacoesCard
            observacoes={observacoes}
            onObservacoesChange={setObservacoes}
            condicoes={condicoes}
            onCondicoesChange={setCondicoes}
          />
        </div>

        {/* Coluna Lateral - Resumo */}
        <div className="space-y-6">
          <ResumoCard
            validadeDias={validadeDias}
            onValidadeChange={setValidadeDias}
            subtotal={subtotal}
            desconto={desconto}
            onDescontoChange={setDesconto}
            total={total}
            itensCount={itens.length}
            saving={saving}
            onSalvar={salvarOrcamento}
            disabled={itens.length === 0}
          />
        </div>
      </div>

      {/* Modals */}
      <ClienteModal
        open={showClienteModal}
        onOpenChange={setShowClienteModal}
        search={clienteSearch}
        onSearchChange={setClienteSearch}
        clientes={clientes}
        loading={loadingClientes}
        onSelect={selecionarCliente}
      />

      <ProdutoModal
        open={showProdutoModal}
        onOpenChange={setShowProdutoModal}
        search={produtoSearch}
        onSearchChange={setProdutoSearch}
        produtos={produtos}
        loading={loadingProdutos}
        onSelect={adicionarProduto}
      />
    </div>
  )
}
