'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Loader2, Printer, Star } from 'lucide-react'
import { formatCurrency } from './types'

interface ConfirmSaleFooterProps {
  paymentSuccess: boolean
  paymentLoading: boolean
  canConfirm: boolean
  troco: number
  selectedPayment: string | null
  pontosGanhos: number | null
  onConfirm: () => void
  onPrint: () => void
  onNewSale: () => void
}

export function ConfirmSaleFooter({
  paymentSuccess,
  paymentLoading,
  canConfirm,
  troco,
  selectedPayment,
  pontosGanhos,
  onConfirm,
  onPrint,
  onNewSale,
}: ConfirmSaleFooterProps) {
  return (
    <div className="border-t p-3 bg-background">
      {paymentSuccess ? (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <p className="font-bold text-green-700">Venda Finalizada!</p>
          {selectedPayment === 'dinheiro' && troco > 0 && (
            <p className="text-amber-600 font-bold">Troco: {formatCurrency(troco)}</p>
          )}
          {pontosGanhos !== null && pontosGanhos > 0 && (
            <Badge className="bg-amber-100 text-amber-700 mt-1">
              <Star className="h-3 w-3 mr-1" />
              +{pontosGanhos} pontos
            </Badge>
          )}
          <div className="flex gap-2 mt-3">
            <Button onClick={onPrint} className="flex-1 bg-green-600 hover:bg-green-700">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={onNewSale}
            >
              Nova Venda
            </Button>
          </div>
        </div>
      ) : (
        <Button
          className="w-full h-14 text-lg"
          disabled={!canConfirm || paymentLoading}
          onClick={onConfirm}
        >
          {paymentLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-5 w-5" />
              Confirmar Venda (F4)
            </>
          )}
        </Button>
      )}
    </div>
  )
}
