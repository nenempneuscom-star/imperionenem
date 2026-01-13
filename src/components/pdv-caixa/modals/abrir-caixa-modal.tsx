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
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface AbrirCaixaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  valor: string
  onValorChange: (valor: string) => void
  onConfirm: () => void
  operando: boolean
}

export function AbrirCaixaModal({
  open,
  onOpenChange,
  valor,
  onValorChange,
  onConfirm,
  operando,
}: AbrirCaixaModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir Caixa</DialogTitle>
          <DialogDescription>
            Informe o valor inicial em dinheiro no caixa
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="valor-abertura">Valor de Abertura (R$)</Label>
            <Input
              id="valor-abertura"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={valor}
              onChange={(e) => onValorChange(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={operando}>
            {operando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Abrir Caixa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
