'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Banknote, CreditCard, QrCode } from 'lucide-react'
import { type Resumo, formatCurrency } from './types'

interface FormasPagamentoCardProps {
  resumo: Resumo
}

export function FormasPagamentoCard({ resumo }: FormasPagamentoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendas por Forma de Pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <Banknote className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Dinheiro</p>
              <p className="text-lg font-semibold">{formatCurrency(resumo.total_dinheiro)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <CreditCard className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Crédito</p>
              <p className="text-lg font-semibold">{formatCurrency(resumo.total_cartao_credito)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <CreditCard className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Débito</p>
              <p className="text-lg font-semibold">{formatCurrency(resumo.total_cartao_debito)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <QrCode className="h-8 w-8 text-teal-600" />
            <div>
              <p className="text-sm text-muted-foreground">PIX</p>
              <p className="text-lg font-semibold">{formatCurrency(resumo.total_pix)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
