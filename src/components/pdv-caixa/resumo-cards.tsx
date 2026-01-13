'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LockOpen, Banknote, ShoppingCart, DollarSign } from 'lucide-react'
import { type Caixa, type Resumo, formatCurrency, formatDateTime } from './types'

interface ResumoCardsProps {
  caixa: Caixa
  resumo: Resumo
  saldoAtual: number
}

export function ResumoCards({ caixa, resumo, saldoAtual }: ResumoCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Status */}
      <Card className="border-green-500 bg-green-50 dark:bg-green-900/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
            Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-500">
              <LockOpen className="mr-1 h-3 w-3" />
              Aberto
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Desde {formatDateTime(caixa.data_abertura)}
          </p>
        </CardContent>
      </Card>

      {/* Saldo em Dinheiro */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            Saldo em Dinheiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(saldoAtual)}</p>
          <p className="text-xs text-muted-foreground">
            Abertura: {formatCurrency(caixa.valor_abertura || 0)}
          </p>
        </CardContent>
      </Card>

      {/* Vendas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(resumo.total_vendas)}</p>
          <p className="text-xs text-muted-foreground">
            {resumo.quantidade_vendas} venda(s)
          </p>
        </CardContent>
      </Card>

      {/* Movimentacoes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-green-600">+ Suprimentos</span>
              <span>{formatCurrency(resumo.total_suprimentos)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600">- Sangrias</span>
              <span>{formatCurrency(resumo.total_sangrias)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
