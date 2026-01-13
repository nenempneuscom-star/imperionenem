'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BarChart3, TrendingUp, DollarSign } from 'lucide-react'
import { type ResumoFinanceiro, formatCurrency } from '../types'

interface FinanceiroTabProps {
  resumo: ResumoFinanceiro | null
  loading: boolean
  filterComponent: React.ReactNode
}

export function FinanceiroTab({
  resumo,
  loading,
  filterComponent,
}: FinanceiroTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo Financeiro</CardTitle>
        <CardDescription>
          Analise de faturamento, custos e lucratividade
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {filterComponent}

        {resumo && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm text-green-700 dark:text-green-400">Total de Vendas</p>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                      {formatCurrency(resumo.total_vendas)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {resumo.quantidade_vendas} vendas
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm text-orange-700 dark:text-orange-400">Custo das Mercadorias</p>
                    <p className="text-3xl font-bold text-orange-700 dark:text-orange-400">
                      {formatCurrency(resumo.total_custo)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      CMV (Custo Mercadoria Vendida)
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm text-blue-700 dark:text-blue-400">Lucro Bruto</p>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                      {formatCurrency(resumo.lucro_bruto)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Margem: {resumo.margem.toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <BarChart3 className="h-10 w-10 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Ticket Medio</p>
                      <p className="text-2xl font-bold">{formatCurrency(resumo.ticket_medio)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <TrendingUp className="h-10 w-10 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                      <p className="text-2xl font-bold">{resumo.margem.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress value={resumo.margem} className="h-3" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {!resumo && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Clique em "Gerar Relatorio" para visualizar o resumo financeiro</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
