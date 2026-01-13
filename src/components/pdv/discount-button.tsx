'use client'

import { Button } from '@/components/ui/button'
import { Percent } from 'lucide-react'
import { formatCurrency, type DescontoGeral, type ConfigDesconto } from './types'

interface DiscountButtonProps {
  hasItems: boolean
  configDesconto: ConfigDesconto | null
  descontoGeral: DescontoGeral
  onShowDescontoModal: () => void
}

export function DiscountButton({
  hasItems,
  configDesconto,
  descontoGeral,
  onShowDescontoModal,
}: DiscountButtonProps) {
  if (!hasItems || !configDesconto?.permitir_desconto_total) return null

  return (
    <div className="p-3 border-b">
      <Button
        variant={descontoGeral.valor > 0 ? 'destructive' : 'outline'}
        className="w-full"
        onClick={onShowDescontoModal}
      >
        <Percent className="h-4 w-4 mr-2" />
        {descontoGeral.valor > 0
          ? `Desconto: ${formatCurrency(descontoGeral.valor)} (${descontoGeral.percentual.toFixed(1)}%)`
          : 'Aplicar Desconto (Ctrl+D)'
        }
      </Button>
    </div>
  )
}
