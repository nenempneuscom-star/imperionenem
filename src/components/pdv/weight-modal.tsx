'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Scale } from 'lucide-react'
import { type Produto, formatCurrency, formatUnidade } from './types'

interface WeightModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto: Produto | null
  weightValue: string
  onWeightChange: (value: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export function WeightModal({
  open,
  onOpenChange,
  produto,
  weightValue,
  onWeightChange,
  onConfirm,
  onCancel,
}: WeightModalProps) {
  const weightInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && weightInputRef.current) {
      setTimeout(() => weightInputRef.current?.focus(), 100)
    }
  }, [open])

  if (!produto) return null

  const pesoNumerico = parseFloat(weightValue.replace(',', '.')) || 0
  const valorTotal = produto.preco_venda * pesoNumerico

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-orange-500" />
            Produto por Peso
          </DialogTitle>
          <DialogDescription>
            Digite o peso do produto na balanca
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info do produto */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="font-semibold text-lg">{produto.nome}</p>
            <p className="text-sm text-muted-foreground">
              Codigo: {produto.codigo}
            </p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(produto.preco_venda)}/{formatUnidade(produto.unidade)}
              </span>
              <span className="text-sm text-muted-foreground">
                Estoque: {produto.estoque_atual} {formatUnidade(produto.unidade)}
              </span>
            </div>
          </div>

          {/* Input de peso */}
          <div className="space-y-2">
            <Label htmlFor="peso">Peso / Quantidade</Label>
            <div className="relative">
              <Input
                id="peso"
                ref={weightInputRef}
                type="text"
                inputMode="decimal"
                placeholder="0,000"
                className="text-2xl h-14 pr-12 text-center font-mono"
                value={weightValue}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d,.]/, '')
                  onWeightChange(value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && pesoNumerico > 0) {
                    onConfirm()
                  }
                }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                {formatUnidade(produto.unidade)}
              </span>
            </div>
          </div>

          {/* Preview do valor */}
          {pesoNumerico > 0 && (
            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 text-center">
              <p className="text-sm text-green-600">Valor Total</p>
              <p className="text-3xl font-bold text-green-700">
                {formatCurrency(valorTotal)}
              </p>
            </div>
          )}

          {/* Botoes */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              onClick={onConfirm}
              disabled={pesoNumerico <= 0}
            >
              <Scale className="h-4 w-4 mr-2" />
              Confirmar Peso
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
