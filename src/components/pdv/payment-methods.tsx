'use client'

import { DollarSign, CreditCard, QrCode, Users, Layers } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface PaymentMethod {
  id: string
  label: string
  icon: LucideIcon
  key: string
  color: string
}

interface PaymentMethodsProps {
  selectedPayment: string | null
  hasCombinedPayments: boolean
  disabled: boolean
  onSelectPayment: (method: string) => void
  onOpenCombinedModal: () => void
  onOpenPixModal: () => void
  onOpenClientModal: () => void
  hasClientSelected: boolean
}

const paymentMethods: PaymentMethod[] = [
  { id: 'dinheiro', label: 'Dinheiro', icon: DollarSign, key: 'F6', color: 'green' },
  { id: 'cartao_credito', label: 'Credito', icon: CreditCard, key: 'F7', color: 'blue' },
  { id: 'cartao_debito', label: 'Debito', icon: CreditCard, key: 'F8', color: 'indigo' },
  { id: 'pix', label: 'PIX', icon: QrCode, key: 'F9', color: 'teal' },
  { id: 'crediario', label: 'Fiado', icon: Users, key: 'F10', color: 'orange' },
  { id: 'combinado', label: 'Combinado', icon: Layers, key: 'F11', color: 'purple' },
]

const colors: Record<string, { bg: string; selected: string }> = {
  green: { bg: 'bg-green-100 text-green-600', selected: 'bg-green-500 text-white' },
  blue: { bg: 'bg-blue-100 text-blue-600', selected: 'bg-blue-500 text-white' },
  indigo: { bg: 'bg-indigo-100 text-indigo-600', selected: 'bg-indigo-500 text-white' },
  teal: { bg: 'bg-teal-100 text-teal-600', selected: 'bg-teal-500 text-white' },
  orange: { bg: 'bg-orange-100 text-orange-600', selected: 'bg-orange-500 text-white' },
  purple: { bg: 'bg-purple-100 text-purple-600', selected: 'bg-purple-500 text-white' },
}

export function PaymentMethods({
  selectedPayment,
  hasCombinedPayments,
  disabled,
  onSelectPayment,
  onOpenCombinedModal,
  onOpenPixModal,
  onOpenClientModal,
  hasClientSelected,
}: PaymentMethodsProps) {
  return (
    <div className="p-3">
      <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Forma de Pagamento</p>
      <div className="grid grid-cols-6 gap-1">
        {paymentMethods.map((method) => {
          const Icon = method.icon
          const isSelected = selectedPayment === method.id || (method.id === 'combinado' && hasCombinedPayments)

          return (
            <button
              key={method.id}
              onClick={() => {
                if (method.id === 'combinado') {
                  onOpenCombinedModal()
                } else {
                  onSelectPayment(method.id)
                  if (method.id === 'pix') {
                    onOpenPixModal()
                  } else if (method.id === 'crediario' && !hasClientSelected) {
                    onOpenClientModal()
                  }
                }
              }}
              disabled={disabled}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? `${colors[method.color].selected} ring-2 ring-offset-1 ring-${method.color}-500`
                  : `${colors[method.color].bg} hover:opacity-80`
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
