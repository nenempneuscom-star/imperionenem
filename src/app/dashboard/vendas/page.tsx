'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ShoppingCart,
  Search,
  Filter,
  XCircle,
  Eye,
  Loader2,
  AlertTriangle,
  Calendar,
  Receipt,
  CreditCard,
  User,
  Package,
  ChevronLeft,
  ChevronRight,
  Info,
  FileText,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface Venda {
  id: string
  numero: number
  data_hora: string
  status: 'pendente' | 'finalizada' | 'cancelada'
  tipo_documento: 'nfce' | 'nfe' | 'sem_nota'
  subtotal: number
  desconto: number
  total: number
  chave_nfce: string | null
  observacao: string | null
  cliente: {
    id: string
    nome: string
    cpf_cnpj: string
    telefone: string
  } | null
  usuario: {
    id: string
    nome: string
  } | null
  venda_itens: {
    id: string
    quantidade: number
    preco_unitario: number
    desconto: number
    total: number
    produto: {
      id: string
      nome: string
      codigo: string
    }
  }[]
  venda_pagamentos: {
    id: string
    forma_pagamento: string
    valor: number
  }[]
}

const formasPagamentoLabel: Record<string, string> = {
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão Crédito',
  cartao_debito: 'Cartão Débito',
  pix: 'PIX',
  crediario: 'Crediário',
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendente: { label: 'Pendente', variant: 'secondary' },
  finalizada: { label: 'Finalizada', variant: 'default' },
  cancelada: { label: 'Cancelada', variant: 'destructive' },
}

const tipoDocumentoLabel: Record<string, string> = {
  nfce: 'NFC-e',
  nfe: 'NF-e',
  sem_nota: 'Sem Nota',
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export default function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [totalVendas, setTotalVendas] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filtros
  const [search, setSearch] = useState('')
  const [dataInicio, setDataInicio] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split('T')[0]
  })
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().split('T')[0])
  const [statusFiltro, setStatusFiltro] = useState('todos')
  const [tipoDocumentoFiltro, setTipoDocumentoFiltro] = useState('todos')

  // Modal de detalhes
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null)
  const [showDetalhes, setShowDetalhes] = useState(false)

  // Modal de cancelamento
  const [showCancelar, setShowCancelar] = useState(false)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const [cancelando, setCancelando] = useState(false)

  const buscarVendas = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        dataInicio,
        dataFim,
      })

      if (statusFiltro !== 'todos') {
        params.append('status', statusFiltro)
      }
      if (tipoDocumentoFiltro !== 'todos') {
        params.append('tipoDocumento', tipoDocumentoFiltro)
      }
      if (search) {
        params.append('search', search)
      }

      const response = await fetch(`/api/vendas?${params}`)
      if (!response.ok) throw new Error('Erro ao buscar vendas')

      const data = await response.json()
      setVendas(data.vendas)
      setTotalVendas(data.total)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar vendas')
    } finally {
      setLoading(false)
    }
  }, [page, dataInicio, dataFim, statusFiltro, tipoDocumentoFiltro, search])

  useEffect(() => {
    buscarVendas()
  }, [buscarVendas])

  function handleVerDetalhes(venda: Venda) {
    setVendaSelecionada(venda)
    setShowDetalhes(true)
  }

  function handleAbrirCancelar(venda: Venda) {
    setVendaSelecionada(venda)
    setMotivoCancelamento('')
    setShowCancelar(true)
  }

  async function handleCancelarVenda() {
    if (!vendaSelecionada) return
    if (motivoCancelamento.length < 10) {
      toast.error('Motivo deve ter no mínimo 10 caracteres')
      return
    }

    setCancelando(true)
    try {
      const response = await fetch(`/api/vendas/${vendaSelecionada.id}/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoCancelamento }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cancelar venda')
      }

      toast.success('Venda cancelada com sucesso!')
      setShowCancelar(false)
      buscarVendas()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cancelar venda')
    } finally {
      setCancelando(false)
    }
  }

  // Resumo
  const vendasFinalizadas = vendas.filter(v => v.status === 'finalizada')
  const totalFaturado = vendasFinalizadas.reduce((acc, v) => acc + v.total, 0)
  const vendasCanceladas = vendas.filter(v => v.status === 'cancelada').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Histórico de Vendas</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todas as vendas realizadas
          </p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVendas}</div>
            <p className="text-xs text-muted-foreground">no período selecionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalFaturado)}</div>
            <p className="text-xs text-muted-foreground">vendas finalizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendasFinalizadas.length > 0
                ? formatCurrency(totalFaturado / vendasFinalizadas.length)
                : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">por venda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{vendasCanceladas}</div>
            <p className="text-xs text-muted-foreground">no período</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Número, cliente..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data Início</Label>
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

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="finalizada">Finalizada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Documento</Label>
              <Select value={tipoDocumentoFiltro} onValueChange={setTipoDocumentoFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="sem_nota">Sem Nota</SelectItem>
                  <SelectItem value="nfce">NFC-e</SelectItem>
                  <SelectItem value="nfe">NF-e</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legenda sobre cancelamento */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Como cancelar vendas:</strong> Vendas <strong>sem nota fiscal</strong> podem ser canceladas diretamente nesta tela (botão X vermelho).
          Vendas com <strong>NFC-e ou NF-e</strong> devem ser canceladas em{' '}
          <a href="/dashboard/fiscal/nfce" className="text-primary underline font-medium">
            Fiscal &gt; NFC-e
          </a>{' '}
          ou{' '}
          <a href="/dashboard/fiscal/nfe" className="text-primary underline font-medium">
            Fiscal &gt; NF-e
          </a>{' '}
          para garantir o cancelamento junto a SEFAZ.
        </AlertDescription>
      </Alert>

      {/* Tabela de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : vendas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhuma venda encontrada</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendas.map((venda) => (
                    <TableRow key={venda.id}>
                      <TableCell className="font-medium">#{venda.numero}</TableCell>
                      <TableCell>{formatDateTime(venda.data_hora)}</TableCell>
                      <TableCell>
                        {venda.cliente ? (
                          <div>
                            <p className="font-medium">{venda.cliente.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {venda.cliente.cpf_cnpj}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {tipoDocumentoLabel[venda.tipo_documento] || venda.tipo_documento}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {venda.venda_pagamentos.map((p, i) => (
                          <Badge key={i} variant="secondary" className="mr-1">
                            {formasPagamentoLabel[p.forma_pagamento] || p.forma_pagamento}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(venda.total)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[venda.status]?.variant || 'default'}>
                          {statusConfig[venda.status]?.label || venda.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVerDetalhes(venda)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {venda.status === 'finalizada' && !venda.chave_nfce && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleAbrirCancelar(venda)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages} ({totalVendas} vendas)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Venda #{vendaSelecionada?.numero}
            </DialogTitle>
            <DialogDescription>
              {vendaSelecionada && formatDateTime(vendaSelecionada.data_hora)}
            </DialogDescription>
          </DialogHeader>

          {vendaSelecionada && (
            <div className="space-y-4">
              {/* Info da venda */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Cliente</Label>
                  <p className="font-medium">
                    {vendaSelecionada.cliente?.nome || 'Não identificado'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Operador</Label>
                  <p className="font-medium">{vendaSelecionada.usuario?.nome || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>
                    <Badge variant={statusConfig[vendaSelecionada.status]?.variant}>
                      {statusConfig[vendaSelecionada.status]?.label}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Documento</Label>
                  <p>
                    <Badge variant="outline">
                      {tipoDocumentoLabel[vendaSelecionada.tipo_documento]}
                    </Badge>
                  </p>
                </div>
              </div>

              {/* Itens */}
              <div>
                <Label className="text-muted-foreground">Itens</Label>
                <div className="mt-2 border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-center">Qtd</TableHead>
                        <TableHead className="text-right">Preco</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendaSelecionada.venda_itens.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <p className="font-medium">{item.produto.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.produto.codigo}
                            </p>
                          </TableCell>
                          <TableCell className="text-center">{item.quantidade}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.preco_unitario)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagamentos */}
              <div>
                <Label className="text-muted-foreground">Pagamentos</Label>
                <div className="mt-2 space-y-1">
                  {vendaSelecionada.venda_pagamentos.map((pag) => (
                    <div key={pag.id} className="flex justify-between">
                      <span>{formasPagamentoLabel[pag.forma_pagamento]}</span>
                      <span className="font-medium">{formatCurrency(pag.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totais */}
              <div className="border-t pt-4 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(vendaSelecionada.subtotal)}</span>
                </div>
                {vendaSelecionada.desconto > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Desconto</span>
                    <span>-{formatCurrency(vendaSelecionada.desconto)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(vendaSelecionada.total)}</span>
                </div>
              </div>

              {/* Observação */}
              {vendaSelecionada.observacao && (
                <div>
                  <Label className="text-muted-foreground">Observação</Label>
                  <p className="text-sm mt-1">{vendaSelecionada.observacao}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetalhes(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Cancelamento */}
      <Dialog open={showCancelar} onOpenChange={setShowCancelar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Cancelar Venda #{vendaSelecionada?.numero}
            </DialogTitle>
            <DialogDescription>
              Esta ação irá reverter o estoque, caixa e crediário (se aplicável).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 rounded-lg text-sm">
              <p className="font-medium text-destructive">Atenção!</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• Estoque dos produtos será restaurado</li>
                <li>• Movimento de saída será registrado no caixa</li>
                <li>• Saldo devedor do cliente será estornado (se crediário)</li>
                <li>• Pontos fidelidade serão revertidos</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo do Cancelamento *</Label>
              <Textarea
                id="motivo"
                placeholder="Informe o motivo do cancelamento (mínimo 10 caracteres)"
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {motivoCancelamento.length}/10 caracteres mínimos
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelar(false)}
              disabled={cancelando}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelarVenda}
              disabled={cancelando || motivoCancelamento.length < 10}
            >
              {cancelando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Confirmar Cancelamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
