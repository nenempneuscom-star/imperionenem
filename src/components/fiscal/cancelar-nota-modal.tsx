'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, XCircle } from 'lucide-react'
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
}

interface CancelarNotaModalProps {
  nota: NotaFiscal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CancelarNotaModal({
  nota,
  open,
  onOpenChange,
  onSuccess,
}: CancelarNotaModalProps) {
  const [justificativa, setJustificativa] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const tipoNota = nota?.tipo === 'nfce' ? 'NFC-e' : 'NF-e'

  async function handleCancelar() {
    if (!nota) return

    if (justificativa.length < 15) {
      setErro('A justificativa deve ter no minimo 15 caracteres')
      return
    }

    setLoading(true)
    setErro(null)

    try {
      const endpoint = nota.tipo === 'nfce' ? '/api/fiscal/nfce' : '/api/fiscal/nfe'

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chave: nota.chave,
          protocolo: nota.protocolo,
          justificativa,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cancelar nota')
      }

      if (data.sucesso) {
        toast.success(`${tipoNota} cancelada com sucesso!`)
        setJustificativa('')
        onOpenChange(false)
        onSuccess?.()
      } else {
        throw new Error(data.mensagem || 'Erro ao cancelar nota')
      }
    } catch (error: any) {
      setErro(error.message)
      toast.error('Erro ao cancelar nota', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (!loading) {
      setJustificativa('')
      setErro(null)
      onOpenChange(false)
    }
  }

  if (!nota) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Cancelar {tipoNota}
          </DialogTitle>
          <DialogDescription>
            Esta acao nao pode ser desfeita. A nota sera cancelada junto a SEFAZ.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dados da nota */}
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Numero:</span>
              <span className="font-mono font-medium">{nota.numero}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Serie:</span>
              <span className="font-mono">{nota.serie}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor:</span>
              <span className="font-medium">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(nota.valor_total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chave:</span>
              <span className="font-mono text-xs truncate max-w-[200px]" title={nota.chave}>
                {nota.chave}
              </span>
            </div>
          </div>

          {/* Aviso */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {nota.tipo === 'nfe' ? (
                <>O cancelamento de NF-e so e permitido em ate 24 horas apos a autorizacao.</>
              ) : (
                <>O cancelamento sera enviado a SEFAZ e a nota perdera a validade fiscal.</>
              )}
            </AlertDescription>
          </Alert>

          {/* Justificativa */}
          <div className="space-y-2">
            <Label htmlFor="justificativa">
              Justificativa do cancelamento <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="justificativa"
              placeholder="Informe o motivo do cancelamento (minimo 15 caracteres)"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={3}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              {justificativa.length}/15 caracteres (minimo)
            </p>
          </div>

          {/* Erro */}
          {erro && (
            <Alert variant="destructive">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancelar}
            disabled={loading || justificativa.length < 15}
          >
            {loading ? (
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
  )
}
