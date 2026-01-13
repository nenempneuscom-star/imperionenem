'use client'

import { DollarSign, CreditCard, QrCode, Users, Layers } from 'lucide-react'
import { type PaymentMethodId, PAYMENT_METHODS } from './types'

interface PaymentSelectorProps {
  selectedPayment: string | null
  hasCombinedPayments: boolean
  disabled: boolean
  onSelectPayment: (paymentId: PaymentMethodId) => void
}

const ICONS = {
  dinheiro: DollarSign,
  cartao_credito: CreditCard,
  cartao_debito: CreditCard,
  pix: QrCode,
  crediario: Users,
  combinado: Layers,
}

const COLORS: Record<string, { bg: string; selected: string }> = {
  green: { bg: 'bg-green-100 text-green-600', selected: 'bg-green-500 text-white' },
  blue: { bg: 'bg-blue-100 text-blue-600', selected: 'bg-blue-500 text-white' },
  indigo: { bg: 'bg-indigo-100 text-indigo-600', selected: 'bg-indigo-500 text-white' },
  teal: { bg: 'bg-teal-100 text-teal-600', selected: 'bg-teal-500 text-white' },
  orange: { bg: 'bg-orange-100 text-orange-600', selected: 'bg-orange-500 text-white' },
  purple: { bg: 'bg-purple-100 text-purple-600', selected: 'bg-purple-500 text-white' },
}

export function PaymentSelector({
  selectedPayment,
  hasCombinedPayments,
  disabled,
  onSelectPayment,
}: PaymentSelectorProps) {
  return (
    <div className="p-3">
      <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Forma de Pagamento</p>
      <div className="grid grid-cols-6 gap-1">
        {PAYMENT_METHODS.map((method) => {
          const Icon = ICONS[method.id]
          const isSelected = selectedPayment === method.id || (method.id === 'combinado' && hasCombinedPayments)
          const colorConfig = COLORS[method.color]

          return (
            <button
              key={method.id}
              onClick={() => onSelectPayment(method.id)}
              disabled={disabled}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? `${colorConfig.selected} ring-2 ring-offset-1`
                  : `${colorConfig.bg} hover:opacity-80`
              }`}
              title={`${method.label} (${method.key})`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">{method.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
