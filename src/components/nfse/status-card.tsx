'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Download,
  ExternalLink,
  Copy,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { StatusNFSeADN, ADNErro } from './types'

interface NFSeStatusData {
  id: string
  numero_rps: number
  numero_nfse?: string
  status: StatusNFSeADN
  chave_acesso?: string
  protocolo_autorizacao?: string
  data_autorizacao?: string
  link_danfse?: string
  ambiente_adn: 'homologacao' | 'producao'
  erros?: ADNErro[]
  xml_dps?: string
}

interface StatusCardProps {
  nfse: NFSeStatusData
  onRefresh?: () => void
  onDownloadXML?: () => void
  onDownloadDANFSe?: () => void
  loading?: boolean
}

const STATUS_CONFIG: Record<StatusNFSeADN, {
  label: string
  color: string
  icon: typeof CheckCircle2
  bgColor: string
}> = {
  rascunho: {
    label: 'Rascunho',
    color: 'text-gray-600',
    icon: FileText,
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  pendente: {
    label: 'Pendente',
    color: 'text-yellow-600',
    icon: Clock,
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
  },
  processando: {
    label: 'Processando',
    color: 'text-blue-600',
    icon: RefreshCw,
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
  },
  autorizada: {
    label: 'Autorizada',
    color: 'text-green-600',
    icon: CheckCircle2,
    bgColor: 'bg-green-100 dark:bg-green-900/20',
  },
  rejeitada: {
    label: 'Rejeitada',
    color: 'text-red-600',
    icon: XCircle,
    bgColor: 'bg-red-100 dark:bg-red-900/20',
  },
  cancelada: {
    label: 'Cancelada',
    color: 'text-gray-600',
    icon: XCircle,
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  substituida: {
    label: 'Substituida',
    color: 'text-orange-600',
    icon: AlertTriangle,
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
  },
}

export function StatusCard({
  nfse,
  onRefresh,
  onDownloadXML,
  onDownloadDANFSe,
  loading = false,
}: StatusCardProps) {
  const [copying, setCopying] = useState(false)
  const statusConfig = STATUS_CONFIG[nfse.status] || STATUS_CONFIG.rascunho
  const StatusIcon = statusConfig.icon

  async function copiarChave() {
    if (!nfse.chave_acesso) return

    setCopying(true)
    try {
      await navigator.clipboard.writeText(nfse.chave_acesso)
      toast.success('Chave de acesso copiada!')
    } catch {
      toast.error('Erro ao copiar chave')
    } finally {
      setCopying(false)
    }
  }

  function formatarData(dataString?: string): string {
    if (!dataString) return '-'
    try {
      return new Date(dataString).toLocaleString('pt-BR')
    } catch {
      return dataString
    }
  }

  return (
    <Card className={statusConfig.bgColor}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
            <div>
              <CardTitle className="flex items-center gap-2">
                Status da NFS-e
                <Badge
                  variant={nfse.status === 'autorizada' ? 'default' : 'secondary'}
                  className={statusConfig.color}
                >
                  {statusConfig.label}
                </Badge>
              </CardTitle>
              <CardDescription>
                {nfse.ambiente_adn === 'homologacao' ? (
                  <span className="text-orange-600">[HOMOLOGACAO]</span>
                ) : (
                  <span className="text-green-600">[PRODUCAO]</span>
                )}{' '}
                RPS #{nfse.numero_rps}
                {nfse.numero_nfse && ` | NFS-e #${nfse.numero_nfse}`}
              </CardDescription>
            </div>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informacoes principais */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Protocolo:</span>
            <p className="font-medium">{nfse.protocolo_autorizacao || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Data Autorizacao:</span>
            <p className="font-medium">{formatarData(nfse.data_autorizacao)}</p>
          </div>
        </div>

        {/* Chave de Acesso */}
        {nfse.chave_acesso && (
          <>
            <Separator />
            <div>
              <span className="text-sm text-muted-foreground">Chave de Acesso (44 digitos):</span>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 bg-background p-2 rounded text-xs font-mono break-all border">
                  {nfse.chave_acesso}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copiarChave}
                  disabled={copying}
                >
                  {copying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Erros (se houver) */}
        {nfse.erros && nfse.erros.length > 0 && (
          <>
            <Separator />
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4" />
                Erros de Validacao
              </h4>
              <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                {nfse.erros.map((erro, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="font-mono text-xs bg-red-200 dark:bg-red-800 px-1 rounded">
                      {erro.codigo}
                    </span>
                    <span>{erro.descricao}</span>
                    {erro.correcao && (
                      <span className="text-xs text-red-600 dark:text-red-400">
                        ({erro.correcao})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Acoes */}
        <Separator />
        <div className="flex flex-wrap gap-2">
          {nfse.xml_dps && onDownloadXML && (
            <Button variant="outline" size="sm" onClick={onDownloadXML}>
              <Download className="h-4 w-4 mr-2" />
              Baixar XML
            </Button>
          )}

          {nfse.status === 'autorizada' && onDownloadDANFSe && (
            <Button variant="outline" size="sm" onClick={onDownloadDANFSe}>
              <FileText className="h-4 w-4 mr-2" />
              DANFSe
            </Button>
          )}

          {nfse.link_danfse && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(nfse.link_danfse, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Visualizar DANFSe
            </Button>
          )}
        </div>

        {/* Aviso de ambiente */}
        {nfse.ambiente_adn === 'homologacao' && (
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-800 dark:text-orange-200 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Esta NFS-e foi emitida em ambiente de <strong>homologacao</strong> e nao tem validade fiscal.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
