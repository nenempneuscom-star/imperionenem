'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  FileText,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingCart,
  Loader2,
  Printer,
  Send,
  AlertTriangle,
} from 'lucide-react'
import { printOrcamento } from '@/components/orcamento/orcamento-print'

interface Orcamento {
  id: string
  numero: number
  cliente_id: string | null
  cliente_nome: string | null
  cliente_telefone: string | null
  subtotal: number
  desconto: number
  total: number
  status: string
  data_validade: string
  created_at: string
  clientes: { nome: string; telefone: string } | null
  usuarios: { nome: string } | null
  orcamento_itens: any[]
}

export default function OrcamentosPage() {
  const supabase = createClient()
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [convertId, setConvertId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchOrcamentos()
  }, [statusFilter])

  async function fetchOrcamentos() {
    setLoading(true)
    try {
      let url = '/api/orcamentos'
      if (statusFilter && statusFilter !== 'todos') {
        url += `?status=${statusFilter}`
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Erro ao buscar orcamentos')

      const data = await response.json()
      setOrcamentos(data)
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar orcamentos')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/orcamentos/${deleteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao excluir')
      }

      toast.success('Orcamento excluido com sucesso')
      fetchOrcamentos()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir orcamento')
    } finally {
      setActionLoading(false)
      setDeleteId(null)
    }
  }

  async function handleConvert() {
    if (!convertId) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/orcamentos/${convertId}/converter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forma_pagamento: 'dinheiro' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao converter')
      }

      const data = await response.json()
      toast.success(data.message)
      fetchOrcamentos()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao converter orcamento')
    } finally {
      setActionLoading(false)
      setConvertId(null)
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const response = await fetch(`/api/orcamentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error('Erro ao atualizar status')

      toast.success(`Status atualizado para ${status}`)
      fetchOrcamentos()
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  async function handlePrint(orcamentoId: string) {
    try {
      const response = await fetch(`/api/orcamentos/${orcamentoId}`)
      if (!response.ok) throw new Error('Erro ao buscar orcamento')

      const data = await response.json()
      const orc = data.orcamento
      const itens = data.itens || []

      printOrcamento({
        orcamento: {
          numero: orc.numero,
          data: new Date(orc.created_at),
          validade: new Date(orc.data_validade),
          status: orc.status,
          observacoes: orc.observacoes,
          condicoes: orc.condicoes,
        },
        empresa: orc.empresas ? {
          nome: orc.empresas.nome_fantasia || orc.empresas.razao_social,
          cnpj: orc.empresas.cnpj,
          telefone: orc.empresas.telefone,
          endereco: orc.empresas.endereco,
        } : null,
        cliente: orc.clientes ? {
          nome: orc.clientes.nome,
          cpf_cnpj: orc.clientes.cpf_cnpj,
          telefone: orc.clientes.telefone,
          email: orc.clientes.email,
        } : {
          nome: orc.cliente_nome,
          cpf_cnpj: orc.cliente_cpf_cnpj,
          telefone: orc.cliente_telefone,
          email: orc.cliente_email,
        },
        itens: itens.map((item: any) => ({
          codigo: item.codigo || '',
          nome: item.nome,
          unidade: item.unidade,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          desconto: item.desconto,
          total: item.total,
        })),
        subtotal: orc.subtotal,
        desconto: orc.desconto,
        total: orc.total,
      })
    } catch (error) {
      toast.error('Erro ao imprimir orcamento')
    }
  }

  function handleWhatsApp(orcamento: Orcamento) {
    const clienteTelefone = orcamento.clientes?.telefone || orcamento.cliente_telefone
    const clienteNome = orcamento.clientes?.nome || orcamento.cliente_nome || 'Cliente'

    const mensagem = `*ORCAMENTO #${orcamento.numero}*
Nenem Pneus

Ola ${clienteNome}!

Seu orcamento no valor de *${formatCurrency(orcamento.total)}* esta disponivel.

Valido ate: ${formatDate(orcamento.data_validade)}

Para mais detalhes, entre em contato conosco.
Aguardamos seu retorno!`

    let telefone = clienteTelefone?.replace(/\D/g, '') || ''
    if (telefone.length === 11 || telefone.length === 10) {
      telefone = '55' + telefone
    }

    const url = telefone
      ? `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`
      : `https://wa.me/?text=${encodeURIComponent(mensagem)}`

    window.open(url, '_blank')
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  function getStatusBadge(status: string) {
    const configs: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
      pendente: { label: 'Pendente', variant: 'secondary', icon: Clock },
      aprovado: { label: 'Aprovado', variant: 'default', icon: CheckCircle },
      rejeitado: { label: 'Rejeitado', variant: 'destructive', icon: XCircle },
      expirado: { label: 'Expirado', variant: 'outline', icon: AlertTriangle },
      convertido: { label: 'Convertido', variant: 'default', icon: ShoppingCart },
    }

    const config = configs[status] || configs.pendente
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const filteredOrcamentos = orcamentos.filter((o) => {
    const clienteNome = o.clientes?.nome || o.cliente_nome || ''
    const searchLower = search.toLowerCase()
    return (
      clienteNome.toLowerCase().includes(searchLower) ||
      o.numero.toString().includes(search)
    )
  })

  // Calcular estatisticas
  const stats = {
    total: orcamentos.length,
    pendentes: orcamentos.filter(o => o.status === 'pendente').length,
    aprovados: orcamentos.filter(o => o.status === 'aprovado').length,
    valorTotal: orcamentos.filter(o => o.status === 'pendente' || o.status === 'aprovado').reduce((acc, o) => acc + o.total, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orcamentos</h1>
          <p className="text-muted-foreground">
            Gerencie os orcamentos da empresa
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/orcamentos/novo">
            <Plus className="h-4 w-4 mr-2" />
            Novo Orcamento
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pendentes</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{stats.pendentes}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aprovados</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.aprovados}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Valor em Aberto</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(stats.valorTotal)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lista de Orcamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou numero..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="aprovado">Aprovados</SelectItem>
                <SelectItem value="rejeitado">Rejeitados</SelectItem>
                <SelectItem value="expirado">Expirados</SelectItem>
                <SelectItem value="convertido">Convertidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOrcamentos.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum orcamento encontrado</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/dashboard/orcamentos/novo">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Orcamento
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrcamentos.map((orcamento) => (
                    <TableRow key={orcamento.id}>
                      <TableCell className="font-medium">#{orcamento.numero}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{orcamento.clientes?.nome || orcamento.cliente_nome || 'Sem cliente'}</p>
                          <p className="text-xs text-muted-foreground">
                            {orcamento.clientes?.telefone || orcamento.cliente_telefone || ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{orcamento.orcamento_itens?.length || 0} itens</TableCell>
                      <TableCell className="font-medium">{formatCurrency(orcamento.total)}</TableCell>
                      <TableCell>{getStatusBadge(orcamento.status)}</TableCell>
                      <TableCell>{formatDate(orcamento.data_validade)}</TableCell>
                      <TableCell>{formatDate(orcamento.created_at)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/orcamentos/${orcamento.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </Link>
                            </DropdownMenuItem>
                            {orcamento.status !== 'convertido' && (
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/orcamentos/${orcamento.id}/editar`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handlePrint(orcamento.id)}>
                              <Printer className="h-4 w-4 mr-2" />
                              Imprimir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleWhatsApp(orcamento)}>
                              <Send className="h-4 w-4 mr-2" />
                              Enviar por WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {orcamento.status === 'pendente' && (
                              <>
                                <DropdownMenuItem onClick={() => updateStatus(orcamento.id, 'aprovado')}>
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                  Aprovar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatus(orcamento.id, 'rejeitado')}>
                                  <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                  Rejeitar
                                </DropdownMenuItem>
                              </>
                            )}
                            {(orcamento.status === 'pendente' || orcamento.status === 'aprovado') && (
                              <DropdownMenuItem onClick={() => setConvertId(orcamento.id)}>
                                <ShoppingCart className="h-4 w-4 mr-2 text-blue-600" />
                                Converter em Venda
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {orcamento.status !== 'convertido' && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteId(orcamento.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Orcamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este orcamento? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert Dialog */}
      <AlertDialog open={!!convertId} onOpenChange={() => setConvertId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Converter em Venda</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja converter este orcamento em uma venda? Os produtos serao baixados do estoque.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvert} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Converter'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
