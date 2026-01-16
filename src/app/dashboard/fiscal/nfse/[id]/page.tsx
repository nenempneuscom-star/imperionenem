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
  User,
  Building2,
  Globe,
  Receipt,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface NFSe {
  id: string
  numero_rps: number
  serie_rps: string
  numero_nfse: string | null
  data_emissao: string
  data_competencia: string
  data_autorizacao: string | null
  tomador_tipo_pessoa: string
  tomador_cpf_cnpj: string
  tomador_razao_social: string
  tomador_email: string | null
  tomador_telefone: string | null
  tomador_endereco: {
    logradouro?: string
    numero?: string
    bairro?: string
    uf?: string
    cep?: string
  } | null
  item_lista_servico: string
  discriminacao: string
  valor_servicos: number
  valor_deducoes: number
  desconto_incondicionado: number
  base_calculo: number
  aliquota_iss: number
  valor_iss: number
  iss_retido: boolean
  aliquota_ibs: number
  valor_ibs: number
  ibs_retido: boolean
  aliquota_cbs: number
  valor_cbs: number
  cbs_retido: boolean
  valor_liquido: number
  status: string
  chave_acesso: string | null
  codigo_verificacao: string | null
  protocolo_autorizacao: string | null
  link_danfse: string | null
  xml_dps: string | null
  xml_nfse_autorizada: string | null
  usar_adn: boolean
  ambiente_adn: string
  data_cancelamento: string | null
  motivo_cancelamento: string | null
}

export default function NFSeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [nfse, setNfse] = useState<NFSe | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalCancelarAberto, setModalCancelarAberto] = useState(false)
  const [justificativa, setJustificativa] = useState('')
  const [cancelando, setCancelando] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchNFSe()
  }, [id])

  async function fetchNFSe() {
    setLoading(true)
    const { data, error } = await supabase
      .from('nfse')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      toast.error('NFS-e não encontrada')
      router.push('/dashboard/fiscal/nfse')
      return
    }

    setNfse(data)
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
    }).format(new Date(date))
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date))
  }

  function formatCpfCnpj(value: string) {
    const digits = value.replace(/\D/g, '')
    if (digits.length === 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else if (digits.length === 14) {
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    return value
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
      case 'rascunho':
        return (
          <Badge variant="outline" className="text-sm sm:text-lg px-2 sm:px-4 py-0.5 sm:py-1">
            <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Rascunho
          </Badge>
        )
      case 'pendente':
      case 'processando':
      default:
        return (
          <Badge variant="outline" className="text-sm sm:text-lg px-2 sm:px-4 py-0.5 sm:py-1">
            <Clock className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            {status === 'processando' ? 'Processando' : 'Pendente'}
          </Badge>
        )
    }
  }

  function handleDownloadXML() {
    if (!nfse?.xml_dps && !nfse?.xml_nfse_autorizada) {
      toast.error('XML não disponível')
      return
    }

    const xml = nfse.xml_nfse_autorizada || nfse.xml_dps
    const blob = new Blob([xml!], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `NFSe_${nfse.numero_rps}_${nfse.serie_rps}.xml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('XML baixado com sucesso!')
  }

  function handleCopyChave() {
    if (!nfse?.chave_acesso) return
    navigator.clipboard.writeText(nfse.chave_acesso)
    toast.success('Chave copiada para a área de transferência')
  }

  async function handleCancelar() {
    if (!nfse?.chave_acesso) {
      toast.error('NFS-e não possui chave de acesso')
      return
    }

    if (justificativa.length < 15) {
      toast.error('Justificativa deve ter no mínimo 15 caracteres')
      return
    }

    setCancelando(true)

    try {
      const response = await fetch('/api/nfse/adn', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chaveAcesso: nfse.chave_acesso,
          justificativa,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cancelar NFS-e')
      }

      toast.success(data.mensagem || 'NFS-e cancelada com sucesso')
      setModalCancelarAberto(false)
      fetchNFSe()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setCancelando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!nfse) {
    return null
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/dashboard/fiscal/nfse">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">
              NFS-e - RPS #{nfse.numero_rps}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Série {nfse.serie_rps} - {nfse.data_emissao ? formatDateTime(nfse.data_emissao) : '-'}
            </p>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-wrap gap-2">
          {(nfse.xml_dps || nfse.xml_nfse_autorizada) && (
            <Button variant="outline" size="sm" onClick={handleDownloadXML} className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Download XML</span>
              <span className="sm:hidden">XML</span>
            </Button>
          )}
          {nfse.link_danfse && (
            <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
              <a href={nfse.link_danfse} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Ver DANFSE</span>
                <span className="sm:hidden">DANFSE</span>
              </a>
            </Button>
          )}
          {nfse.status === 'autorizada' && (
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
              <Receipt className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Status da Nota</p>
                {getStatusBadge(nfse.status)}
                {nfse.usar_adn && (
                  <div className="flex items-center gap-1 mt-1">
                    <Globe className="h-3 w-3 text-blue-600" />
                    <span className="text-xs text-blue-600">
                      ADN - {nfse.ambiente_adn === 'producao' ? 'Produção' : 'Homologação'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-left sm:text-right pl-11 sm:pl-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Valor do Serviço</p>
              <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(nfse.valor_servicos)}</p>
            </div>
          </div>
          {nfse.status === 'cancelada' && nfse.motivo_cancelamento && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">Motivo do Cancelamento:</p>
              <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">{nfse.motivo_cancelamento}</p>
              {nfse.data_cancelamento && (
                <p className="text-xs text-red-600 mt-1">
                  Cancelada em: {formatDateTime(nfse.data_cancelamento)}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Dados da Nota */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Dados da NFS-e</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Informações da nota fiscal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Número RPS</p>
                <p className="font-mono font-medium text-sm sm:text-base">{nfse.numero_rps}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Série</p>
                <p className="font-mono font-medium text-sm sm:text-base">{nfse.serie_rps}</p>
              </div>
            </div>

            {nfse.numero_nfse && (
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Número NFS-e</p>
                <p className="font-mono font-medium text-sm sm:text-base">{nfse.numero_nfse}</p>
              </div>
            )}

            <Separator />

            {nfse.chave_acesso && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Chave de Acesso</p>
                  <Button variant="ghost" size="sm" onClick={handleCopyChave} className="h-7 px-2">
                    <Copy className="h-3 w-3 mr-1" />
                    <span className="text-xs">Copiar</span>
                  </Button>
                </div>
                <p className="font-mono text-[10px] sm:text-xs break-all bg-muted p-2 rounded leading-relaxed">
                  {nfse.chave_acesso}
                </p>
              </div>
            )}

            {nfse.codigo_verificacao && (
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Código de Verificação</p>
                <p className="font-mono font-medium text-sm sm:text-base">{nfse.codigo_verificacao}</p>
              </div>
            )}

            {nfse.protocolo_autorizacao && (
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Protocolo de Autorização</p>
                <p className="font-mono font-medium text-sm sm:text-base break-all">{nfse.protocolo_autorizacao}</p>
              </div>
            )}

            <Separator />

            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Data de Emissão</p>
              <p className="font-medium text-sm sm:text-base">
                {nfse.data_emissao ? formatDateTime(nfse.data_emissao) : '-'}
              </p>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Competência</p>
              <p className="font-medium text-sm sm:text-base">
                {nfse.data_competencia ? formatDate(nfse.data_competencia) : '-'}
              </p>
            </div>

            {nfse.data_autorizacao && (
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Data de Autorização</p>
                <p className="font-medium text-sm sm:text-base">{formatDateTime(nfse.data_autorizacao)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dados do Tomador */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              {nfse.tomador_tipo_pessoa === 'PJ' ? (
                <Building2 className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
              Tomador do Serviço
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Dados do cliente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {nfse.tomador_tipo_pessoa === 'PJ' ? 'Razão Social' : 'Nome'}
              </p>
              <p className="font-medium text-sm sm:text-base">{nfse.tomador_razao_social}</p>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {nfse.tomador_tipo_pessoa === 'PJ' ? 'CNPJ' : 'CPF'}
              </p>
              <p className="font-mono font-medium text-sm sm:text-base">
                {formatCpfCnpj(nfse.tomador_cpf_cnpj)}
              </p>
            </div>

            {nfse.tomador_email && (
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">E-mail</p>
                <p className="font-medium text-sm sm:text-base">{nfse.tomador_email}</p>
              </div>
            )}

            {nfse.tomador_telefone && (
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium text-sm sm:text-base">{nfse.tomador_telefone}</p>
              </div>
            )}

            {nfse.tomador_endereco && nfse.tomador_endereco.logradouro && (
              <>
                <Separator />
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium text-sm sm:text-base">
                    {nfse.tomador_endereco.logradouro}
                    {nfse.tomador_endereco.numero && `, ${nfse.tomador_endereco.numero}`}
                  </p>
                  {nfse.tomador_endereco.bairro && (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {nfse.tomador_endereco.bairro}
                      {nfse.tomador_endereco.uf && ` - ${nfse.tomador_endereco.uf}`}
                    </p>
                  )}
                  {nfse.tomador_endereco.cep && (
                    <p className="text-xs text-muted-foreground">CEP: {nfse.tomador_endereco.cep}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Serviço */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Serviço Prestado</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Detalhes do serviço</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {nfse.item_lista_servico && (
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Item LC 116</p>
              <p className="font-mono font-medium text-sm sm:text-base">{nfse.item_lista_servico}</p>
            </div>
          )}
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Discriminação</p>
            <p className="text-sm sm:text-base whitespace-pre-wrap">{nfse.discriminacao}</p>
          </div>
        </CardContent>
      </Card>

      {/* Valores */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Valores e Tributos</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Detalhamento dos valores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Valores do Serviço */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Valor do Serviço</p>
                <p className="font-medium text-sm sm:text-base">{formatCurrency(nfse.valor_servicos)}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Deduções</p>
                <p className="font-medium text-sm sm:text-base">{formatCurrency(nfse.valor_deducoes)}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Desconto</p>
                <p className="font-medium text-sm sm:text-base">{formatCurrency(nfse.desconto_incondicionado)}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Base de Cálculo</p>
                <p className="font-medium text-sm sm:text-base">{formatCurrency(nfse.base_calculo)}</p>
              </div>
            </div>

            <Separator />

            {/* Tributos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  ISS ({(nfse.aliquota_iss * 100).toFixed(2)}%)
                  {nfse.iss_retido && <Badge variant="outline" className="ml-2 text-xs">Retido</Badge>}
                </p>
                <p className="font-medium text-sm sm:text-base">{formatCurrency(nfse.valor_iss)}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground text-blue-600">
                  IBS ({nfse.aliquota_ibs}%)
                  {nfse.ibs_retido && <Badge variant="outline" className="ml-2 text-xs">Retido</Badge>}
                </p>
                <p className="font-medium text-sm sm:text-base text-blue-600">{formatCurrency(nfse.valor_ibs)}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground text-blue-600">
                  CBS ({nfse.aliquota_cbs}%)
                  {nfse.cbs_retido && <Badge variant="outline" className="ml-2 text-xs">Retido</Badge>}
                </p>
                <p className="font-medium text-sm sm:text-base text-blue-600">{formatCurrency(nfse.valor_cbs)}</p>
              </div>
            </div>

            <Separator />

            {/* Valor Líquido */}
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="font-bold text-lg">Valor Líquido</span>
              <span className="font-bold text-xl text-primary">{formatCurrency(nfse.valor_liquido)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* XML Preview */}
      {(nfse.xml_dps || nfse.xml_nfse_autorizada) && (
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">XML da Nota</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {nfse.xml_nfse_autorizada ? 'XML da NFS-e autorizada' : 'XML do DPS'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 overflow-hidden">
            <pre className="bg-muted p-2 sm:p-4 rounded-lg text-[10px] sm:text-xs max-h-[300px] sm:max-h-[400px] overflow-auto whitespace-pre-wrap break-all">
              {nfse.xml_nfse_autorizada || nfse.xml_dps}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Modal de Cancelamento */}
      <Dialog open={modalCancelarAberto} onOpenChange={setModalCancelarAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar NFS-e</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Informe a justificativa do cancelamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="justificativa">Justificativa (mínimo 15 caracteres)</Label>
              <Textarea
                id="justificativa"
                placeholder="Informe o motivo do cancelamento..."
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {justificativa.length}/15 caracteres mínimos
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCancelarAberto(false)} disabled={cancelando}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelar}
              disabled={cancelando || justificativa.length < 15}
            >
              {cancelando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
