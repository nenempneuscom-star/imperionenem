'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface SangriaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  valor: string
  onValorChange: (valor: string) => void
  observacao: string
  onObservacaoChange: (obs: string) => void
  onConfirm: () => void
  operando: boolean
}

export function SangriaModal({
  open,
  onOpenChange,
  valor,
  onValorChange,
  observacao,
  onObservacaoChange,
  onConfirm,
  operando,
}: SangriaModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Sangria</DialogTitle>
          <DialogDescription>
            Retirada de dinheiro do caixa
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="valor-sangria">Valor (R$)</Label>
            <Input
              id="valor-sangria"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={valor}
              onChange={(e) => onValorChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="obs-sangria">Observação</Label>
            <Textarea
              id="obs-sangria"
              placeholder="Motivo da sangria..."
              value={observacao}
              onChange={(e) => onObservacaoChange(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={operando || !valor}>
            {operando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirmar Sangria
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
