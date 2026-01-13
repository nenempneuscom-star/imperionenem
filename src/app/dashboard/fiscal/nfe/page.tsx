'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  Plus,
  MoreHorizontal,
  Ban,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { CancelarNotaModal } from '@/components/fiscal'
import { toast } from 'sonner'

interface NotaFiscal {
  id: string
  tipo: 'nfce' | 'nfe'
  numero: number
  serie: number
  chave: string
  protocolo: string
  status: string
  valor_total: number
  emitida_em: string
  xml: string
  vendas?: {
    numero: number
    total: number
    data_hora: string
  }
}

export default function NFeListPage() {
  const [notas, setNotas] = useState<NotaFiscal[]>([])
  const [loading, setLoading] = useState(true)
  const [notaSelecionada, setNotaSelecionada] = useState<NotaFiscal | null>(null)
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchNotas()
  }, [])

  async function fetchNotas() {
    setLoading(true)
    const { data } = await supabase
      .from('notas_fiscais')
      .select(`
        *,
        vendas (numero, total, data_hora)
      `)
      .eq('tipo', 'nfe')
      .order('emitida_em', { ascending: false })
      .limit(50)

    setNotas(data || [])
    setLoading(false)
  }

  // Calcular resumo
  const resumo = {
    total: notas.length,
    autorizadas: notas.filter(n => n.status === 'autorizada').length,
    canceladas: notas.filter(n => n.status === 'cancelada').length,
    pendentes: notas.filter(n => n.status === 'pendente').length,
    rejeitadas: notas.filter(n => n.status === 'rejeitada').length,
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

  function getStatusBadge(status: string) {
    switch (status) {
      case 'autorizada':
        return (
          <Badge className="bg-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Autorizada
          </Badge>
        )
      case 'cancelada':
        return (
          <Badge variant="secondary">
            <XCircle className="mr-1 h-3 w-3" />
            Cancelada
          </Badge>
        )
      case 'rejeitada':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Rejeitada
          </Badge>
        )
      case 'pendente':
      default:
        return (
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" />
            Pendente
          </Badge>
        )
    }
  }

  function handleCancelar(nota: NotaFiscal) {
    setNotaSelecionada(nota)
    setModalCancelarAberto(true)
  }

  function handleDownloadXML(nota: NotaFiscal) {
    if (!nota.xml) {
      toast.error('XML nao disponivel')
      return
    }

    const blob = new Blob([nota.xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `NFe_${nota.numero}_${nota.serie}.xml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('XML baixado com sucesso!')
  }

  // Verificar se pode cancelar (24 horas para NF-e)
  function podeCancelar(nota: NotaFiscal): boolean {
    if (nota.status !== 'autorizada') return false
    if (!nota.emitida_em) return false

    const dataEmissao = new Date(nota.emitida_em)
    const agora = new Date()
    const horasDesdeEmissao = (agora.getTime() - dataEmissao.getTime()) / (1000 * 60 * 60)

    return horasDesdeEmissao <= 24
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NF-e</h1>
          <p className="text-muted-foreground">
            Nota Fiscal Eletronica (Modelo 55)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchNotas} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button asChild>
            <Link href="/dashboard/fiscal/nfe/nova">
              <Plus className="mr-2 h-4 w-4" />
              Nova NF-e
            </Link>
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emitidas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumo.total}</div>
            <p className="text-xs text-muted-foreground">notas fiscais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Autorizadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resumo.autorizadas}</div>
            <p className="text-xs text-muted-foreground">notas validas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
            <XCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumo.canceladas}</div>
            <p className="text-xs text-muted-foreground">notas canceladas</p>
          </CardContent>
        </Card>

        <Card className={resumo.rejeitadas > 0 ? 'border-red-500' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${resumo.rejeitadas > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${resumo.rejeitadas > 0 ? 'text-red-600' : ''}`}>
              {resumo.rejeitadas}
            </div>
            <p className="text-xs text-muted-foreground">requer atencao</p>
          </CardContent>
        </Card>
      </div>

      {/* Informativo */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <FileText className="h-8 w-8 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                NF-e para Vendas B2B
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                A NF-e (Modelo 55) e utilizada para vendas entre empresas (B2B) ou quando o cliente
                solicitar. Para emitir, e necessario ter o certificado digital A1 configurado em{' '}
                <Link href="/dashboard/fiscal/configuracoes" className="underline font-medium">
                  Configuracoes Fiscais
                </Link>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Notas */}
      <Card>
        <CardHeader>
          <CardTitle>Historico de NF-e</CardTitle>
          <CardDescription>
            {notas.length} nota(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nenhuma NF-e emitida</h3>
              <p className="text-muted-foreground mb-4">
                Emita sua primeira NF-e para vendas B2B
              </p>
              <Button asChild>
                <Link href="/dashboard/fiscal/nfe/nova">
                  <Plus className="mr-2 h-4 w-4" />
                  Emitir NF-e
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Serie</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Chave de Acesso</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notas.map((nota) => (
                  <TableRow key={nota.id}>
                    <TableCell className="font-mono font-medium">
                      {nota.numero}
                    </TableCell>
                    <TableCell className="font-mono">
                      {nota.serie}
                    </TableCell>
                    <TableCell>
                      {nota.emitida_em ? formatDateTime(nota.emitida_em) : '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {nota.chave ? `${nota.chave.substring(0, 22)}...` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {nota.valor_total ? formatCurrency(nota.valor_total) : '-'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(nota.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/fiscal/nfe/${nota.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </Link>
                          </DropdownMenuItem>
                          {nota.status === 'autorizada' && nota.xml && (
                            <DropdownMenuItem onClick={() => handleDownloadXML(nota)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download XML
                            </DropdownMenuItem>
                          )}
                          {podeCancelar(nota) && (
                            <DropdownMenuItem
                              onClick={() => handleCancelar(nota)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Cancelar Nota
                            </DropdownMenuItem>
                          )}
                          {nota.status === 'autorizada' && !podeCancelar(nota) && (
                            <DropdownMenuItem disabled className="text-muted-foreground">
                              <Ban className="mr-2 h-4 w-4" />
                              Prazo expirado (24h)
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Cancelamento */}
      <CancelarNotaModal
        nota={notaSelecionada}
        open={modalCancelarAberto}
        onOpenChange={setModalCancelarAberto}
        onSuccess={fetchNotas}
      />
    </div>
  )
}
