'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Ban,
  Loader2,
  Copy,
  Printer,
  ExternalLink,
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
  venda_id: string
  mensagem_sefaz?: string
  vendas?: {
    id: string
    numero: number
    total: number
    data_hora: string
    cliente_id?: string
    clientes?: {
      nome: string
      cpf_cnpj: string
    }
  }
}

export default function NFCeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [nota, setNota] = useState<NotaFiscal | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchNota()
  }, [id])

  async function fetchNota() {
    setLoading(true)
    const { data, error } = await supabase
      .from('notas_fiscais')
      .select(`
        *,
        vendas (
          id,
          numero,
          total,
          data_hora,
          cliente_id,
          clientes (nome, cpf_cnpj)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      toast.error('Nota fiscal nao encontrada')
      router.push('/dashboard/fiscal/nfce')
      return
    }

    setNota(data)
    setLoading(false)
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
      second: '2-digit',
    }).format(new Date(date))
  }

  function formatChave(chave: string) {
    if (!chave) return '-'
    // Formata a chave em grupos de 4 digitos
    return chave.replace(/(.{4})/g, '$1 ').trim()
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'autorizada':
        return (
          <Badge className="bg-green-600 text-sm sm:text-lg px-2 sm:px-4 py-0.5 sm:py-1">
            <CheckCircle2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Autorizada
          </Badge>
        )
      case 'cancelada':
        return (
          <Badge variant="secondary" className="text-sm sm:text-lg px-2 sm:px-4 py-0.5 sm:py-1">
            <XCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Cancelada
          </Badge>
        )
      case 'rejeitada':
        return (
          <Badge variant="destructive" className="text-sm sm:text-lg px-2 sm:px-4 py-0.5 sm:py-1">
            <AlertTriangle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Rejeitada
          </Badge>
        )
      case 'pendente':
      default:
        return (
          <Badge variant="outline" className="text-sm sm:text-lg px-2 sm:px-4 py-0.5 sm:py-1">
            <Clock className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Pendente
          </Badge>
        )
    }
  }

  function handleDownloadXML() {
    if (!nota?.xml) {
      toast.error('XML nao disponivel')
      return
    }

    const blob = new Blob([nota.xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `NFCe_${nota.numero}_${nota.serie}.xml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('XML baixado com sucesso!')
  }

  function handleCopyChave() {
    if (!nota?.chave) return
    navigator.clipboard.writeText(nota.chave)
    toast.success('Chave copiada para a area de transferencia')
  }

  function handlePrint() {
    // Abre janela de impressao do DANFE (se disponivel)
    toast.info('Funcionalidade de impressao em desenvolvimento')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!nota) {
    return null
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/dashboard/fiscal/nfce">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">
              NFC-e #{nota.numero}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Serie {nota.serie} - {nota.emitida_em ? formatDateTime(nota.emitida_em) : '-'}
            </p>
          </div>
        </div>

        {/* Botoes de acao - responsivos */}
        <div className="flex flex-wrap gap-2">
          {nota.status === 'autorizada' && nota.xml && (
            <>
              <Button variant="outline" size="sm" onClick={handleDownloadXML} className="flex-1 sm:flex-none">
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Download XML</span>
                <span className="sm:hidden">XML</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 sm:flex-none">
                <Printer className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Imprimir</span>
                <span className="sm:hidden">Print</span>
              </Button>
            </>
          )}
          {nota.status === 'autorizada' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setModalCancelarAberto(true)}
              className="flex-1 sm:flex-none"
            >
              <Ban className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Cancelar Nota</span>
              <span className="sm:hidden">Cancelar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Status da Nota</p>
                {getStatusBadge(nota.status)}
              </div>
            </div>
            <div className="text-left sm:text-right pl-11 sm:pl-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Valor Total</p>
              <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(nota.valor_total || 0)}</p>
            </div>
          </div>
          {nota.mensagem_sefaz && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Mensagem SEFAZ:</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{nota.mensagem_sefaz}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Dados da Nota */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Dados da NFC-e</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Informacoes da nota fiscal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Numero</p>
                <p className="font-mono font-medium text-sm sm:text-base">{nota.numero}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Serie</p>
                <p className="font-mono font-medium text-sm sm:text-base">{nota.serie}</p>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Chave de Acesso</p>
                <Button variant="ghost" size="sm" onClick={handleCopyChave} className="h-7 px-2">
                  <Copy className="h-3 w-3 mr-1" />
                  <span className="text-xs">Copiar</span>
                </Button>
              </div>
              <p className="font-mono text-[10px] sm:text-xs break-all bg-muted p-2 rounded leading-relaxed">
                {formatChave(nota.chave || '')}
              </p>
            </div>

            <Separator />

            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Protocolo de Autorizacao</p>
              <p className="font-mono font-medium text-sm sm:text-base break-all">{nota.protocolo || '-'}</p>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Data/Hora de Emissao</p>
              <p className="font-medium text-sm sm:text-base">{nota.emitida_em ? formatDateTime(nota.emitida_em) : '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Dados da Venda */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Dados da Venda</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Venda associada a esta nota</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {nota.vendas ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Numero da Venda</p>
                    <p className="font-medium text-base sm:text-lg">#{nota.vendas.numero}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild className="shrink-0">
                    <Link href={`/dashboard/vendas?id=${nota.vendas.id}`}>
                      <ExternalLink className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Ver Venda</span>
                    </Link>
                  </Button>
                </div>

                <Separator />

                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Data/Hora da Venda</p>
                  <p className="font-medium text-sm sm:text-base">{nota.vendas.data_hora ? formatDateTime(nota.vendas.data_hora) : '-'}</p>
                </div>

                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Valor da Venda</p>
                  <p className="font-medium text-sm sm:text-base">{formatCurrency(nota.vendas.total || 0)}</p>
                </div>

                {nota.vendas.clientes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Cliente</p>
                      <p className="font-medium text-sm sm:text-base">{nota.vendas.clientes.nome}</p>
                      {nota.vendas.clientes.cpf_cnpj && (
                        <p className="text-xs sm:text-sm text-muted-foreground font-mono">
                          {nota.vendas.clientes.cpf_cnpj}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-sm text-muted-foreground">
                  Venda nao encontrada ou desvinculada
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* XML Preview */}
      {nota.xml && (
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">XML da Nota</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Visualizacao do XML da NFC-e</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <pre className="bg-muted p-2 sm:p-4 rounded-lg overflow-x-auto text-[10px] sm:text-xs max-h-[300px] sm:max-h-[400px] overflow-y-auto">
              {nota.xml}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Modal de Cancelamento */}
      <CancelarNotaModal
        nota={nota}
        open={modalCancelarAberto}
        onOpenChange={setModalCancelarAberto}
        onSuccess={() => {
          fetchNota()
          setModalCancelarAberto(false)
        }}
      />
    </div>
  )
}
