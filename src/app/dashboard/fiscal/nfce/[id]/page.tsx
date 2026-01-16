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
          <Badge className="bg-green-600 text-lg px-4 py-1">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Autorizada
          </Badge>
        )
      case 'cancelada':
        return (
          <Badge variant="secondary" className="text-lg px-4 py-1">
            <XCircle className="mr-2 h-4 w-4" />
            Cancelada
          </Badge>
        )
      case 'rejeitada':
        return (
          <Badge variant="destructive" className="text-lg px-4 py-1">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Rejeitada
          </Badge>
        )
      case 'pendente':
      default:
        return (
          <Badge variant="outline" className="text-lg px-4 py-1">
            <Clock className="mr-2 h-4 w-4" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/fiscal/nfce">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              NFC-e #{nota.numero}
            </h1>
            <p className="text-muted-foreground">
              Serie {nota.serie} - Emitida em {nota.emitida_em ? formatDateTime(nota.emitida_em) : '-'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {nota.status === 'autorizada' && nota.xml && (
            <>
              <Button variant="outline" onClick={handleDownloadXML}>
                <Download className="h-4 w-4 mr-2" />
                Download XML
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </>
          )}
          {nota.status === 'autorizada' && (
            <Button
              variant="destructive"
              onClick={() => setModalCancelarAberto(true)}
            >
              <Ban className="h-4 w-4 mr-2" />
              Cancelar Nota
            </Button>
          )}
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Status da Nota</p>
                {getStatusBadge(nota.status)}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-3xl font-bold">{formatCurrency(nota.valor_total || 0)}</p>
            </div>
          </div>
          {nota.mensagem_sefaz && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Mensagem SEFAZ:</p>
              <p className="text-sm text-muted-foreground">{nota.mensagem_sefaz}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Dados da Nota */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da NFC-e</CardTitle>
            <CardDescription>Informacoes da nota fiscal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Numero</p>
                <p className="font-mono font-medium">{nota.numero}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Serie</p>
                <p className="font-mono font-medium">{nota.serie}</p>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-muted-foreground">Chave de Acesso</p>
                <Button variant="ghost" size="sm" onClick={handleCopyChave}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar
                </Button>
              </div>
              <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                {formatChave(nota.chave || '')}
              </p>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground">Protocolo de Autorizacao</p>
              <p className="font-mono font-medium">{nota.protocolo || '-'}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Data/Hora de Emissao</p>
              <p className="font-medium">{nota.emitida_em ? formatDateTime(nota.emitida_em) : '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Dados da Venda */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Venda</CardTitle>
            <CardDescription>Venda associada a esta nota</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {nota.vendas ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Numero da Venda</p>
                    <p className="font-medium text-lg">#{nota.vendas.numero}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/vendas?id=${nota.vendas.id}`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Venda
                    </Link>
                  </Button>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">Data/Hora da Venda</p>
                  <p className="font-medium">{nota.vendas.data_hora ? formatDateTime(nota.vendas.data_hora) : '-'}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Valor da Venda</p>
                  <p className="font-medium">{formatCurrency(nota.vendas.total || 0)}</p>
                </div>

                {nota.vendas.clientes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <p className="font-medium">{nota.vendas.clientes.nome}</p>
                      {nota.vendas.clientes.cpf_cnpj && (
                        <p className="text-sm text-muted-foreground font-mono">
                          {nota.vendas.clientes.cpf_cnpj}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
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
          <CardHeader>
            <CardTitle>XML da Nota</CardTitle>
            <CardDescription>Visualizacao do XML da NFC-e</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs max-h-[400px] overflow-y-auto">
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
