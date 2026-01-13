'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Clock, Calendar, Layers } from 'lucide-react'
import { DateFilter } from '../date-filter'
import { type RelatorioOperacional, formatCurrency } from '../types'

interface OperacionalTabProps {
  dataInicio: string
  dataFim: string
  onDataInicioChange: (value: string) => void
  onDataFimChange: (value: string) => void
  onBuscar: () => void
  loading: boolean
  relatorio: RelatorioOperacional | null
}

export function OperacionalTab({
  dataInicio,
  dataFim,
  onDataInicioChange,
  onDataFimChange,
  onBuscar,
  loading,
  relatorio,
}: OperacionalTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Relatorio Operacional
        </CardTitle>
        <CardDescription>
          Analise o dia-a-dia da operacao
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

        {relatorio && (
          <>
            {/* Resumo */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-green-600">Total Vendido</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(relatorio.resumo.valorTotal)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {relatorio.resumo.totalVendas} vendas
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-red-600">Cancelamentos</p>
                    <p className="text-2xl font-bold text-red-700">
                      {relatorio.resumo.vendasCanceladas}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(relatorio.resumo.valorCancelado)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Taxa Cancelamento</p>
                    <p className="text-2xl font-bold">
                      {relatorio.resumo.taxaCancelamento.toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Ticket Medio</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        relatorio.resumo.totalVendas > 0
                          ? relatorio.resumo.valorTotal / relatorio.resumo.totalVendas
                          : 0
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pagamentos Combinados */}
            {relatorio.resumo.vendasPagamentoCombinado !== undefined &&
             relatorio.resumo.vendasPagamentoCombinado > 0 && (
              <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-600" />
                    Pagamentos Combinados
                  </CardTitle>
                  <CardDescription>
                    Vendas com multiplas formas de pagamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="text-center p-4 bg-white dark:bg-gray-900 rounded-lg">
                      <p className="text-sm text-muted-foreground">Vendas Combinadas</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {relatorio.resumo.vendasPagamentoCombinado}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {relatorio.resumo.percentualCombinado?.toFixed(1)}% do total
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Combinacoes mais usadas:</p>
                      {relatorio.pagamentosCombinados?.slice(0, 5).map((pc, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="truncate max-w-[180px]">{pc.combinacao}</span>
                          <Badge variant="secondary">{pc.quantidade}</Badge>
                        </div>
                      ))}
                      {(!relatorio.pagamentosCombinados ||
                        relatorio.pagamentosCombinados.length === 0) && (
                        <p className="text-xs text-muted-foreground italic">
                          Detalhes nao disponiveis
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {/* Horarios de Pico */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horarios de Pico
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {relatorio.horariosPico.map((h, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge variant={i === 0 ? 'default' : 'secondary'}>
                            {h.hora.toString().padStart(2, '0')}:00
                          </Badge>
                          <span className="text-sm">{h.quantidade} vendas</span>
                        </div>
                        <p className="font-medium">{formatCurrency(h.valor)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Dias da Semana */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Dias da Semana
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {relatorio.diasSemana.map((d, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{d.dia}</p>
                          <p className="text-xs text-muted-foreground">{d.quantidade} vendas</p>
                        </div>
                        <p className="font-medium">{formatCurrency(d.valor)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Por Operador */}
            {relatorio.porOperador.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Vendas por Operador</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {relatorio.porOperador.map((o, i) => (
                      <div key={i} className="p-4 bg-muted rounded-lg">
                        <p className="font-medium">{o.operador}</p>
                        <p className="text-2xl font-bold">{formatCurrency(o.valor)}</p>
                        <p className="text-xs text-muted-foreground">{o.quantidade} vendas</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!relatorio && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Clique em "Gerar Relatorio" para ver o operacional</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
