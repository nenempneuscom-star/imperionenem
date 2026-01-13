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
import { formatCurrency } from '../types'

interface FecharCaixaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  valor: string
  onValorChange: (valor: string) => void
  onConfirm: () => void
  operando: boolean
  saldoEsperado: number
}

export function FecharCaixaModal({
  open,
  onOpenChange,
  valor,
  onValorChange,
  onConfirm,
  operando,
  saldoEsperado,
}: FecharCaixaModalProps) {
  const diferenca = valor ? parseFloat(valor) - saldoEsperado : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fechar Caixa</DialogTitle>
          <DialogDescription>
            Conte o dinheiro e informe o valor total em caixa
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Saldo esperado em dinheiro:</p>
            <p className="text-2xl font-bold">{formatCurrency(saldoEsperado)}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="valor-fechamento">Valor Contado (R$)</Label>
            <Input
              id="valor-fechamento"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={valor}
              onChange={(e) => onValorChange(e.target.value)}
            />
          </div>
          {valor && (
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Diferença:</p>
              <p
                className={`text-xl font-bold ${
                  diferenca === 0
                    ? 'text-green-600'
                    : diferenca > 0
                    ? 'text-blue-600'
                    : 'text-red-600'
                }`}
              >
                {formatCurrency(diferenca)}
                {diferenca === 0 && ' (Confere!)'}
                {diferenca > 0 && ' (Sobra)'}
                {diferenca < 0 && ' (Falta)'}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={operando}>
            {operando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Fechar Caixa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
