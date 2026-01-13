'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Trash2 } from 'lucide-react'
import { formatCurrency, type DescontoGeral } from './types'

interface SidebarSummaryProps {
  subtotal: number
  total: number
  totalItems: number
  hasItems: boolean
  descontoItens: number
  descontoGeral: DescontoGeral
  descontoPontos: number
  onClearCart: () => void
  onClearDescontoGeral: () => void
}

export function SidebarSummary({
  subtotal,
  total,
  totalItems,
  hasItems,
  descontoItens,
  descontoGeral,
  descontoPontos,
  onClearCart,
  onClearDescontoGeral,
}: SidebarSummaryProps) {
  return (
    <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <span className="font-semibold">Resumo</span>
          {totalItems > 0 && (
            <Badge variant="secondary">{totalItems} itens</Badge>
          )}
        </div>
        {hasItems && (
          <Button variant="ghost" size="sm" onClick={onClearCart} className="text-destructive h-8">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-sm text-muted-foreground">
          <div>Subtotal: {formatCurrency(subtotal)}</div>
          {descontoItens > 0 && (
            <div className="text-destructive">Desc. Itens: -{formatCurrency(descontoItens)}</div>
          )}
          {descontoGeral.valor > 0 && (
            <div className="text-destructive flex items-center gap-1">
              Desc. Geral: -{formatCurrency(descontoGeral.valor)}
              <button
                onClick={onClearDescontoGeral}
                className="text-xs hover:underline"
              >
                (remover)
              </button>
            </div>
          )}
          {descontoPontos > 0 && <div className="text-amber-600">Pontos: -{formatCurrency(descontoPontos)}</div>}
        </div>
        <div className="text-3xl font-bold text-primary">{formatCurrency(total)}</div>
      </div>
    </div>
  )
}
