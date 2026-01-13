'use client'

import { Button } from '@/components/ui/button'
import { formatCurrency, PAYMENT_LABELS } from './types'

interface CombinedPaymentSummaryProps {
  payments: { forma: string; valor: number }[] | null
  valorRecebido?: number
  onEdit: () => void
}

export function CombinedPaymentSummary({
  payments,
  valorRecebido,
  onEdit,
}: CombinedPaymentSummaryProps) {
  if (!payments || payments.length === 0) return null

  const dinheiroPayment = payments.find(p => p.forma === 'dinheiro')
  const hasDinheiro = !!dinheiroPayment
  const troco = valorRecebido && hasDinheiro
    ? valorRecebido - (dinheiroPayment?.valor || 0)
    : 0

  return (
    <div className="p-3 border-t">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase">Pagamento Combinado</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={onEdit}
          >
            Editar
          </Button>
        </div>
        <div className="space-y-1">
          {payments.map((p, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{PAYMENT_LABELS[p.forma] || p.forma}</span>
              <span className="font-medium">{formatCurrency(p.valor)}</span>
            </div>
          ))}
        </div>
        {valorRecebido && hasDinheiro && troco > 0 && (
          <div className="pt-2 border-t">
            <div className="flex justify-between text-sm text-green-600">
              <span>Troco</span>
              <span className="font-bold">{formatCurrency(troco)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
