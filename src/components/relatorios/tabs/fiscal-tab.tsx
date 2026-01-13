'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import { type RelatorioFiscal, formatCurrency } from '../types'

interface FiscalTabProps {
  relatorio: RelatorioFiscal | null
  loading: boolean
  filterComponent: React.ReactNode
}

export function FiscalTab({
  relatorio,
  loading,
  filterComponent,
}: FiscalTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Relatorio Fiscal
        </CardTitle>
        <CardDescription>
          Notas fiscais emitidas e impostos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {filterComponent}

        {relatorio && (
          <>
            {/* NFC-e e NF-e */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* NFC-e */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">NFC-e (Cupom Fiscal)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 grid-cols-2">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded text-center">
                      <p className="text-sm text-green-600">Emitidas</p>
                      <p className="text-xl font-bold text-green-700">{relatorio.nfce.emitidas}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(relatorio.nfce.valorEmitido)}
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded text-center">
                      <p className="text-sm text-red-600">Canceladas</p>
                      <p className="text-xl font-bold text-red-700">{relatorio.nfce.canceladas}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(relatorio.nfce.valorCancelado)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* NF-e */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">NF-e (Nota Fiscal)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 grid-cols-2">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded text-center">
                      <p className="text-sm text-green-600">Emitidas</p>
                      <p className="text-xl font-bold text-green-700">{relatorio.nfe.emitidas}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(relatorio.nfe.valorEmitido)}
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded text-center">
                      <p className="text-sm text-red-600">Canceladas</p>
                      <p className="text-xl font-bold text-red-700">{relatorio.nfe.canceladas}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(relatorio.nfe.valorCancelado)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Impostos (IBPT) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Impostos Aproximados (IBPT)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Total Vendas</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(relatorio.impostos.totalVendas)}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                    <p className="text-sm text-yellow-600">Total Impostos</p>
                    <p className="text-xl font-bold text-yellow-700">
                      {formatCurrency(relatorio.impostos.totalImpostos)}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Carga Tributaria Media</p>
                    <p className="text-xl font-bold">
                      {relatorio.impostos.percentualMedio.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!relatorio && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Clique em "Gerar Relatorio" para ver o fiscal</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
