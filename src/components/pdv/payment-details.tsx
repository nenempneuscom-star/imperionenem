'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CreditCard, QrCode, Users } from 'lucide-react'
import { formatCurrency, type Cliente } from './types'

interface PaymentDetailsProps {
  selectedPayment: string | null
  total: number
  troco: number
  valorRecebido: string
  onValorRecebidoChange: (valor: string) => void
  clienteSelecionado: Cliente | null
  onShowPixModal: () => void
  onShowClienteModal: () => void
}

export function PaymentDetails({
  selectedPayment,
  total,
  troco,
  valorRecebido,
  onValorRecebidoChange,
  clienteSelecionado,
  onShowPixModal,
  onShowClienteModal,
}: PaymentDetailsProps) {
  if (!selectedPayment) return null

  return (
    <div className="p-3 border-t">
      {/* Dinheiro */}
      {selectedPayment === 'dinheiro' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">Valor Recebido</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0,00"
              value={valorRecebido}
              onChange={(e) => onValorRecebidoChange(e.target.value)}
              className="text-xl h-12 text-center font-bold mt-1"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[10, 20, 50, 100].map((v) => (
              <Button key={v} variant="outline" size="sm" onClick={() => onValorRecebidoChange(String(v))} className="text-xs h-8">
                R${v}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Button variant="outline" size="sm" onClick={() => onValorRecebidoChange(String(total))} className="text-xs h-8">Exato</Button>
            <Button variant="outline" size="sm" onClick={() => onValorRecebidoChange(String(Math.ceil(total / 10) * 10))} className="text-xs h-8">R${Math.ceil(total / 10) * 10}</Button>
            <Button variant="outline" size="sm" onClick={() => onValorRecebidoChange('200')} className="text-xs h-8">R$200</Button>
          </div>
          {parseFloat(valorRecebido || '0') >= total && (
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg text-center">
              <p className="text-xs text-green-600">Troco</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(troco)}</p>
            </div>
          )}
        </div>
      )}

      {/* PIX */}
      {selectedPayment === 'pix' && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <QrCode className="h-12 w-12 text-teal-500 mb-3" />
          <p className="font-medium">Pagamento via PIX</p>
          <p className="text-sm text-muted-foreground mb-3">QR Code exibido na tela</p>
          <Button
            variant="outline"
            size="sm"
            onClick={onShowPixModal}
          >
            <QrCode className="h-4 w-4 mr-2" />
            Ver QR Code
          </Button>
        </div>
      )}

      {/* Cartoes */}
      {(selectedPayment === 'cartao_credito' || selectedPayment === 'cartao_debito') && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-medium">Aguardando maquininha</p>
          <p className="text-sm text-muted-foreground">
            Passe o cartao de {selectedPayment === 'cartao_credito' ? 'credito' : 'debito'}
          </p>
        </div>
      )}

      {/* Crediario */}
      {selectedPayment === 'crediario' && !clienteSelecionado && (
        <div className="text-center py-4">
          <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-2">Selecione um cliente</p>
          <Button variant="outline" onClick={onShowClienteModal}>
            <Users className="h-4 w-4 mr-2" />
            Selecionar Cliente
          </Button>
        </div>
      )}
    </div>
  )
}
