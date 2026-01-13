'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Banknote, CreditCard, QrCode, Users, Layers, DollarSign } from 'lucide-react'
import { DateFilter } from '../date-filter'
import { type PagamentoRelatorio, formatCurrency } from '../types'

interface PagamentosTabProps {
  dataInicio: string
  dataFim: string
  onDataInicioChange: (value: string) => void
  onDataFimChange: (value: string) => void
  onBuscar: () => void
  loading: boolean
  pagamentos: PagamentoRelatorio[]
}

function formatFormaPagamento(forma: string): string {
  const labels: Record<string, string> = {
    dinheiro: 'Dinheiro',
    cartao_credito: 'Cartao Credito',
    cartao_debito: 'Cartao Debito',
    pix: 'PIX',
    crediario: 'Crediario',
    combinado: 'Combinado',
  }
  return labels[forma] || forma
}

function getIconePagamento(forma: string) {
  const icons: Record<string, React.ReactNode> = {
    dinheiro: <Banknote className="h-8 w-8 text-green-500" />,
    cartao_credito: <CreditCard className="h-8 w-8 text-blue-500" />,
    cartao_debito: <CreditCard className="h-8 w-8 text-purple-500" />,
    pix: <QrCode className="h-8 w-8 text-teal-500" />,
    crediario: <Users className="h-8 w-8 text-orange-500" />,
    combinado: <Layers className="h-8 w-8 text-indigo-500" />,
  }
  return icons[forma] || <DollarSign className="h-8 w-8 text-gray-500" />
}

export function PagamentosTab({
  dataInicio,
  dataFim,
  onDataInicioChange,
  onDataFimChange,
  onBuscar,
  loading,
  pagamentos,
}: PagamentosTabProps) {
  const totalPagamentos = pagamentos.reduce((acc, p) => acc + p.total, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendas por Forma de Pagamento</CardTitle>
        <CardDescription>
          Analise das vendas por tipo de pagamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DateFilter
          dataInicio={dataInicio}
          dataFim={dataFim}
          onDataInicioChange={onDataInicioChange}
          onDataFimChange={onDataFimChange}
          onBuscar={onBuscar}
          loading={loading}
        />

        {pagamentos.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {pagamentos.map((pag) => (
                <Card key={pag.forma_pagamento}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      {getIconePagamento(pag.forma_pagamento)}
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          {formatFormaPagamento(pag.forma_pagamento)}
                        </p>
                        <p className="text-xl font-bold">{formatCurrency(pag.total)}</p>
                        <p className="text-xs text-muted-foreground">
                          {pag.quantidade} transacao(oes)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuicao</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pagamentos.map((pag) => {
                  const percentual = totalPagamentos > 0
                    ? (pag.total / totalPagamentos) * 100
                    : 0
                  return (
                    <div key={pag.forma_pagamento} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          {getIconePagamento(pag.forma_pagamento)}
                          {formatFormaPagamento(pag.forma_pagamento)}
                        </span>
                        <span className="font-medium">
                          {percentual.toFixed(1)}% ({formatCurrency(pag.total)})
                        </span>
                      </div>
                      <Progress value={percentual} className="h-2" />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </>
        )}
      </CardContent>
    </Card>
  )
}
