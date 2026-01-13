'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { HandCoins } from 'lucide-react'
import { DateFilter } from '../date-filter'
import { type RelatorioCrediario, formatCurrency } from '../types'

interface CrediarioTabProps {
  dataInicio: string
  dataFim: string
  onDataInicioChange: (value: string) => void
  onDataFimChange: (value: string) => void
  onBuscar: () => void
  loading: boolean
  relatorio: RelatorioCrediario | null
}

export function CrediarioTab({
  dataInicio,
  dataFim,
  onDataInicioChange,
  onDataFimChange,
  onBuscar,
  loading,
  relatorio,
}: CrediarioTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HandCoins className="h-5 w-5" />
          Relatorio de Crediario / Fiado
        </CardTitle>
        <CardDescription>
          Acompanhe os creditos concedidos e inadimplencia
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
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Crediario</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(relatorio.resumo.totalCrediario)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-yellow-600">Em Aberto</p>
                    <p className="text-2xl font-bold text-yellow-700">
                      {formatCurrency(relatorio.resumo.totalEmAberto)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {relatorio.resumo.quantidadeParcelasAbertas} parcelas
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-red-600">Atrasado</p>
                    <p className="text-2xl font-bold text-red-700">
                      {formatCurrency(relatorio.resumo.totalAtrasado)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {relatorio.resumo.quantidadeParcelasAtrasadas} parcelas
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-green-600">Taxa Recuperacao</p>
                    <p className="text-2xl font-bold text-green-700">
                      {relatorio.resumo.taxaRecuperacao.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(relatorio.resumo.totalRecebido)} recebido
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Clientes Devedores */}
            {relatorio.clientesDevedores.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Clientes com Debito em Aberto</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead className="text-right">Parcelas</TableHead>
                        <TableHead className="text-right">Em Aberto</TableHead>
                        <TableHead className="text-right">Atrasado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorio.clientesDevedores.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{c.cliente}</TableCell>
                          <TableCell>{c.telefone || '-'}</TableCell>
                          <TableCell className="text-right">{c.parcelas}</TableCell>
                          <TableCell className="text-right text-yellow-600">
                            {formatCurrency(c.totalAberto)}
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-medium">
                            {c.totalAtrasado > 0 ? formatCurrency(c.totalAtrasado) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!relatorio && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <HandCoins className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Clique em "Gerar Relatorio" para ver o crediario</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
