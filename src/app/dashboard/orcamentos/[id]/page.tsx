'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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
  ArrowLeft,
  Printer,
  Send,
  Edit,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Loader2,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  FileText,
  Download,
} from 'lucide-react'
import { printOrcamento } from '@/components/orcamento/orcamento-print'

interface Orcamento {
  id: string
  numero: number
  empresa_id: string
  usuario_id: string
  cliente_id: string | null
  cliente_nome: string | null
  cliente_telefone: string | null
  cliente_email: string | null
  cliente_cpf_cnpj: string | null
  subtotal: number
  desconto: number
  desconto_percentual: number
  total: number
  status: string
  validade_dias: number
  data_validade: string
  observacoes: string | null
  condicoes: string | null
  created_at: string
  updated_at: string
  clientes: {
    nome: string
    cpf_cnpj: string
    telefone: string
    email: string
    endereco: any
  } | null
  usuarios: { nome: string } | null
  empresas: {
    nome_fantasia: string
    razao_social: string
    cnpj: string
    telefone: string
    endereco: any
  } | null
}

interface OrcamentoItem {
  id: string
  codigo: string | null
  nome: string
  descricao: string | null
  unidade: string
  quantidade: number
  preco_unitario: number
  desconto: number
  total: number
}

export default function OrcamentoViewPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null)
  const [itens, setItens] = useState<OrcamentoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showConvertDialog, setShowConvertDialog] = useState(false)

  useEffect(() => {
    fetchOrcamento()
  }, [params.id])

  async function fetchOrcamento() {
    setLoading(true)
    try {
      const response = await fetch(`/api/orcamentos/${params.id}`)
      if (!response.ok) throw new Error('Erro ao buscar orcamento')

      const data = await response.json()
      setOrcamento(data.orcamento)
      setItens(data.itens || [])
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar orcamento')
      router.push('/dashboard/orcamentos')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(status: string) {
    try {
      const response = await fetch(`/api/orcamentos/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error('Erro ao atualizar status')

      toast.success(`Status atualizado para ${status}`)
      fetchOrcamento()
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  async function handleConvert() {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/orcamentos/${params.id}/converter`, {
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
      router.push('/dashboard/orcamentos')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao converter orcamento')
    } finally {
      setActionLoading(false)
      setShowConvertDialog(false)
    }
  }

  function handlePrint() {
    if (!orcamento) return

    const empresa = orcamento.empresas ? {
      nome: orcamento.empresas.nome_fantasia || orcamento.empresas.razao_social,
      cnpj: orcamento.empresas.cnpj,
      telefone: orcamento.empresas.telefone,
      endereco: orcamento.empresas.endereco,
    } : null

    const cliente = orcamento.clientes ? {
      nome: orcamento.clientes.nome,
      cpf_cnpj: orcamento.clientes.cpf_cnpj,
      telefone: orcamento.clientes.telefone,
      email: orcamento.clientes.email,
    } : {
      nome: orcamento.cliente_nome,
      cpf_cnpj: orcamento.cliente_cpf_cnpj,
      telefone: orcamento.cliente_telefone,
      email: orcamento.cliente_email,
    }

    printOrcamento({
      orcamento: {
        numero: orcamento.numero,
        data: new Date(orcamento.created_at),
        validade: new Date(orcamento.data_validade),
        status: orcamento.status,
        observacoes: orcamento.observacoes,
        condicoes: orcamento.condicoes,
      },
      empresa,
      cliente,
      itens: itens.map(item => ({
        codigo: item.codigo || '',
        nome: item.nome,
        unidade: item.unidade,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        desconto: item.desconto,
        total: item.total,
      })),
      subtotal: orcamento.subtotal,
      desconto: orcamento.desconto,
      total: orcamento.total,
    })
  }

  function handleWhatsApp() {
    if (!orcamento) return

    const clienteTelefone = orcamento.clientes?.telefone || orcamento.cliente_telefone
    const clienteNome = orcamento.clientes?.nome || orcamento.cliente_nome || 'Cliente'

    // Formatar mensagem
    const mensagem = `*ORCAMENTO #${orcamento.numero}*
Nenem Pneus

Ola ${clienteNome}!

Segue seu orcamento:

${itens.map(item => `- ${item.nome}: ${item.quantidade}x ${formatCurrency(item.preco_unitario)} = ${formatCurrency(item.total)}`).join('\n')}

*Subtotal:* ${formatCurrency(orcamento.subtotal)}
${orcamento.desconto > 0 ? `*Desconto:* -${formatCurrency(orcamento.desconto)}\n` : ''}*TOTAL: ${formatCurrency(orcamento.total)}*

Valido ate: ${formatDate(orcamento.data_validade)}

${orcamento.condicoes ? `_${orcamento.condicoes}_\n` : ''}
Aguardamos seu retorno!`

    // Limpar telefone
    let telefone = clienteTelefone?.replace(/\D/g, '') || ''
    if (telefone.length === 11) {
      telefone = '55' + telefone
    } else if (telefone.length === 10) {
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

  function formatDateTime(date: string) {
    return new Date(date).toLocaleString('pt-BR')
  }

  function getStatusBadge(status: string) {
    const configs: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pendente: { label: 'Pendente', variant: 'secondary' },
      aprovado: { label: 'Aprovado', variant: 'default' },
      rejeitado: { label: 'Rejeitado', variant: 'destructive' },
      expirado: { label: 'Expirado', variant: 'outline' },
      convertido: { label: 'Convertido', variant: 'default' },
    }
    const config = configs[status] || configs.pendente
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!orcamento) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Orcamento nao encontrado</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/orcamentos">Voltar</Link>
        </Button>
      </div>
    )
  }

  const clienteNome = orcamento.clientes?.nome || orcamento.cliente_nome
  const clienteTelefone = orcamento.clientes?.telefone || orcamento.cliente_telefone
  const clienteEmail = orcamento.clientes?.email || orcamento.cliente_email
  const clienteCpfCnpj = orcamento.clientes?.cpf_cnpj || orcamento.cliente_cpf_cnpj

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/orcamentos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              Orcamento #{orcamento.numero}
              {getStatusBadge(orcamento.status)}
            </h1>
            <p className="text-muted-foreground">
              Criado em {formatDateTime(orcamento.created_at)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={handleWhatsApp}>
            <Send className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
          {orcamento.status !== 'convertido' && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/orcamentos/${orcamento.id}/editar`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Info Principal */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes do Orcamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cliente */}
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <User className="h-4 w-4" />
                Cliente
              </h3>
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{clienteNome || 'Nao informado'}</p>
                </div>
                {clienteCpfCnpj && (
                  <div>
                    <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                    <p className="font-medium">{clienteCpfCnpj}</p>
                  </div>
                )}
                {clienteTelefone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{clienteTelefone}</p>
                  </div>
                )}
                {clienteEmail && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{clienteEmail}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Itens */}
            <div>
              <h3 className="font-semibold mb-3">Itens ({itens.length})</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codigo</TableHead>
                      <TableHead>Descricao</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead className="text-right">Unitario</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">
                          {item.codigo || '-'}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{item.nome}</p>
                          {item.descricao && (
                            <p className="text-xs text-muted-foreground">{item.descricao}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantidade} {item.unidade}
                        </TableCell>
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

            {/* Totais */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(orcamento.subtotal)}</span>
                </div>
                {orcamento.desconto > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Desconto</span>
                    <span>-{formatCurrency(orcamento.desconto)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(orcamento.total)}</span>
                </div>
              </div>
            </div>

            {/* Observacoes */}
            {orcamento.observacoes && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Observacoes</h3>
                <p className="text-sm whitespace-pre-wrap">{orcamento.observacoes}</p>
              </div>
            )}

            {/* Condicoes */}
            {orcamento.condicoes && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Condicoes</h3>
                <p className="text-sm whitespace-pre-wrap">{orcamento.condicoes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status e Validade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Validade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Valido ate</p>
                <p className="text-xl font-bold">{formatDate(orcamento.data_validade)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(orcamento.status)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Acoes */}
          {orcamento.status !== 'convertido' && (
            <Card>
              <CardHeader>
                <CardTitle>Acoes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {orcamento.status === 'pendente' && (
                  <>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => updateStatus('aprovado')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Aprovar
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => updateStatus('rejeitado')}
                    >
                      <XCircle className="h-4 w-4 mr-2 text-red-600" />
                      Rejeitar
                    </Button>
                  </>
                )}
                {(orcamento.status === 'pendente' || orcamento.status === 'aprovado') && (
                  <Button
                    className="w-full"
                    onClick={() => setShowConvertDialog(true)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Converter em Venda
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog Converter */}
      <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
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
