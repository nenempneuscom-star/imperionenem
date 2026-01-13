'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Save,
  Loader2,
  User,
  Package,
  FileText,
} from 'lucide-react'

interface Produto {
  id: string
  codigo: string
  nome: string
  preco_venda: number
  estoque_atual: number
  unidade: string
}

interface Cliente {
  id: string
  nome: string
  cpf_cnpj: string
  telefone: string
  email: string
}

interface ItemOrcamento {
  id: string
  produto_id: string | null
  codigo: string
  nome: string
  unidade: string
  quantidade: number
  preco_unitario: number
  desconto: number
  total: number
}

export default function NovoOrcamentoPage() {
  const router = useRouter()
  const supabase = createClient()
  const searchRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)

  // Cliente
  const [showClienteModal, setShowClienteModal] = useState(false)
  const [clienteSearch, setClienteSearch] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [clienteManual, setClienteManual] = useState({
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

  function atualizarItem(id: string, campo: string, valor: any) {
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

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
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
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{clienteSelecionado.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {clienteSelecionado.cpf_cnpj} | {clienteSelecionado.telefone}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setClienteSelecionado(null)}>
                    Alterar
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button variant="outline" onClick={() => setShowClienteModal(true)}>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar Cliente Cadastrado
                  </Button>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        placeholder="Nome do cliente"
                        value={clienteManual.nome}
                        onChange={(e) => setClienteManual({ ...clienteManual, nome: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        placeholder="(00) 00000-0000"
                        value={clienteManual.telefone}
                        onChange={(e) => setClienteManual({ ...clienteManual, telefone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        value={clienteManual.email}
                        onChange={(e) => setClienteManual({ ...clienteManual, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CPF/CNPJ</Label>
                      <Input
                        placeholder="000.000.000-00"
                        value={clienteManual.cpf_cnpj}
                        onChange={(e) => setClienteManual({ ...clienteManual, cpf_cnpj: e.target.value })}
                      />
                    </div>
                  </div>
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
                <div className="text-center py-10">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum item adicionado</p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowProdutoModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Item
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="w-[100px]">Qtd</TableHead>
                        <TableHead className="w-[120px]">Preco</TableHead>
                        <TableHead className="w-[100px]">Desc.</TableHead>
                        <TableHead className="w-[120px] text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.nome}</p>
                              <p className="text-xs text-muted-foreground">{item.codigo}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              step="0.001"
                              value={item.quantidade}
                              onChange={(e) => atualizarItem(item.id, 'quantidade', parseFloat(e.target.value) || 1)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.preco_unitario}
                              onChange={(e) => atualizarItem(item.id, 'preco_unitario', parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.desconto}
                              onChange={(e) => atualizarItem(item.id, 'desconto', parseFloat(e.target.value) || 0)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.total)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removerItem(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observacoes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Observacoes e Condicoes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Observacoes</Label>
                <Textarea
                  placeholder="Observacoes gerais do orcamento..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Condicoes de Pagamento/Entrega</Label>
                <Textarea
                  placeholder="Ex: Pagamento a vista com 5% de desconto. Entrega em ate 3 dias uteis..."
                  value={condicoes}
                  onChange={(e) => setCondicoes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral - Resumo */}
        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Validade (dias)</Label>
                <Input
                  type="number"
                  min="1"
                  value={validadeDias}
                  onChange={(e) => setValidadeDias(parseInt(e.target.value) || 7)}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Desconto</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={desconto}
                    onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                    className="w-28 text-right"
                  />
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground">
                <p>{itens.length} item(s)</p>
                <p>Valido por {validadeDias} dias</p>
              </div>

              <Button className="w-full" onClick={salvarOrcamento} disabled={saving || itens.length === 0}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Orcamento
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Buscar Cliente */}
      <Dialog open={showClienteModal} onOpenChange={setShowClienteModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Buscar Cliente</DialogTitle>
            <DialogDescription>
              Busque pelo nome, CPF/CNPJ ou telefone
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={clienteSearch}
                onChange={(e) => setClienteSearch(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <ScrollArea className="h-[300px]">
              {loadingClientes ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : clientes.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">
                  {clienteSearch.length < 2 ? 'Digite para buscar...' : 'Nenhum cliente encontrado'}
                </p>
              ) : (
                <div className="space-y-2">
                  {clientes.map((cliente) => (
                    <button
                      key={cliente.id}
                      onClick={() => {
                        setClienteSelecionado(cliente)
                        setShowClienteModal(false)
                        setClienteSearch('')
                      }}
                      className="w-full p-3 text-left rounded-lg border hover:bg-muted transition-colors"
                    >
                      <p className="font-medium">{cliente.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {cliente.cpf_cnpj} | {cliente.telefone}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Buscar Produto */}
      <Dialog open={showProdutoModal} onOpenChange={setShowProdutoModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Produto</DialogTitle>
            <DialogDescription>
              Busque pelo nome, codigo ou codigo de barras
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={produtoSearch}
                onChange={(e) => setProdutoSearch(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <ScrollArea className="h-[400px]">
              {loadingProdutos ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : produtos.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">
                  {produtoSearch.length < 2 ? 'Digite para buscar...' : 'Nenhum produto encontrado'}
                </p>
              ) : (
                <div className="space-y-2">
                  {produtos.map((produto) => (
                    <button
                      key={produto.id}
                      onClick={() => adicionarProduto(produto)}
                      className="w-full p-3 text-left rounded-lg border hover:bg-muted transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{produto.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            Codigo: {produto.codigo} | Estoque: {produto.estoque_atual} {produto.unidade}
                          </p>
                        </div>
                        <p className="font-bold text-lg">{formatCurrency(produto.preco_venda)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
