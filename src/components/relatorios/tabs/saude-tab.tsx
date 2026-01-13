'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { type RelatorioSaudeFinanceira, formatCurrency } from '../types'

interface SaudeTabProps {
  relatorio: RelatorioSaudeFinanceira | null
  loading: boolean
  filterComponent: React.ReactNode
}

export function SaudeTab({
  relatorio,
  loading,
  filterComponent,
}: SaudeTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Saude Financeira
        </CardTitle>
        <CardDescription>
          Visao completa da saude do seu negocio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {filterComponent}

        {relatorio && (
          <>
            {/* DRE Simplificado */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">DRE Simplificado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                    <span>Receita Bruta</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(relatorio.periodo.receitaBruta)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
                    <span>(-) Descontos</span>
                    <span className="font-bold text-red-600">
                      -{formatCurrency(relatorio.periodo.descontos)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <span>= Receita Liquida</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(relatorio.periodo.receitaLiquida)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
                    <span>(-) CMV (Custo Mercadoria Vendida)</span>
                    <span className="font-bold text-orange-600">
                      -{formatCurrency(relatorio.periodo.cmv)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded border-2 border-primary">
                    <span className="font-bold">= Lucro Bruto</span>
                    <span className="font-bold text-primary text-xl">
                      {formatCurrency(relatorio.periodo.lucroBruto)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Indicadores */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Margem Bruta</p>
                    <p className={`text-2xl font-bold ${
                      relatorio.indicadores.margemBruta >= 30 ? 'text-green-600' :
                      relatorio.indicadores.margemBruta >= 15 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {relatorio.indicadores.margemBruta.toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">% Descontos</p>
                    <p className={`text-2xl font-bold ${
                      relatorio.indicadores.percentualDesconto <= 5 ? 'text-green-600' :
                      relatorio.indicadores.percentualDesconto <= 10 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {relatorio.indicadores.percentualDesconto.toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Ticket Medio</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(relatorio.periodo.ticketMedio)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Vendas</p>
                    <p className="text-2xl font-bold">
                      {relatorio.periodo.quantidadeVendas}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comparativo com Periodo Anterior */}
            {relatorio.comparativo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Comparativo com Periodo Anterior</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Periodo Anterior</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(relatorio.comparativo.receitaAnterior)}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Periodo Atual</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(relatorio.periodo.receitaLiquida)}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg text-center ${
                      relatorio.comparativo.crescimento >= 0
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-red-50 dark:bg-red-900/20'
                    }`}>
                      <p className="text-sm text-muted-foreground">Crescimento</p>
                      <p className={`text-xl font-bold flex items-center justify-center gap-1 ${
                        relatorio.comparativo.crescimento >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {relatorio.comparativo.crescimento >= 0 ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5" />
                        )}
                        {relatorio.comparativo.crescimento.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(Math.abs(relatorio.comparativo.diferencaValor))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fluxo de Caixa */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fluxo de Caixa Projetado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <p className="text-sm text-green-600">A Receber</p>
                    <p className="text-xl font-bold text-green-700">
                      {formatCurrency(relatorio.fluxoCaixa.totalReceber)}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                    <p className="text-sm text-red-600">A Pagar</p>
                    <p className="text-xl font-bold text-red-700">
                      {formatCurrency(relatorio.fluxoCaixa.totalPagar)}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg text-center ${
                    relatorio.fluxoCaixa.saldo >= 0
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'bg-orange-50 dark:bg-orange-900/20'
                  }`}>
                    <p className="text-sm text-muted-foreground">Saldo Projetado</p>
                    <p className={`text-xl font-bold ${
                      relatorio.fluxoCaixa.saldo >= 0 ? 'text-blue-700' : 'text-orange-700'
                    }`}>
                      {formatCurrency(relatorio.fluxoCaixa.saldo)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!relatorio && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Clique em "Gerar Relatorio" para ver a saude financeira</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
