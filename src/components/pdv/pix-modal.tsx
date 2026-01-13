'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { QrCode, CheckCircle } from 'lucide-react'
import { PixQRCode } from './pix-qrcode'
import { formatCurrency, type Empresa } from './types'

interface PixModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  total: number
  empresa: Empresa | null
  onConfirm: () => void
  onCancel: () => void
}

export function PixModal({
  open,
  onOpenChange,
  total,
  empresa,
  onConfirm,
  onCancel,
}: PixModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center py-4">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-100 rounded-full mb-2">
              <QrCode className="h-6 w-6 text-teal-600" />
            </div>
            <DialogTitle className="text-xl">Pagamento via PIX</DialogTitle>
            <p className="text-3xl font-bold text-primary mt-2">{formatCurrency(total)}</p>
          </div>

          {/* QR Code */}
          <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
            <PixQRCode
              valor={total}
              chavePix={empresa?.chavePix}
              beneficiario={empresa?.nome}
              cidade={empresa?.cidade}
              txid={`PDV${Date.now()}`}
            />
          </div>

          {/* Botoes */}
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-teal-600 hover:bg-teal-700"
              onClick={onConfirm}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Recebido
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
