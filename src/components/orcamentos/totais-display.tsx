'use client'

import { formatCurrency } from './types'

interface TotaisDisplayProps {
  subtotal: number
  desconto: number
  total: number
}

export function TotaisDisplay({ subtotal, desconto, total }: TotaisDisplayProps) {
  return (
    <div className="flex justify-end">
      <div className="w-64 space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {desconto > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Desconto</span>
            <span>-{formatCurrency(desconto)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  )
}
