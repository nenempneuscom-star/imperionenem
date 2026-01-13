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
import { Percent } from 'lucide-react'
import { DateFilter } from '../date-filter'
import { type RelatorioDescontos, formatCurrency } from '../types'

interface DescontosTabProps {
  dataInicio: string
  dataFim: string
  onDataInicioChange: (value: string) => void
  onDataFimChange: (value: string) => void
  onBuscar: () => void
  loading: boolean
  relatorio: RelatorioDescontos | null
}

export function DescontosTab({
  dataInicio,
  dataFim,
  onDataInicioChange,
  onDataFimChange,
  onBuscar,
  loading,
  relatorio,
}: DescontosTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Relatorio de Descontos
        </CardTitle>
        <CardDescription>
          Analise completa dos descontos concedidos
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
              <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-red-600">Total em Descontos</p>
                    <p className="text-2xl font-bold text-red-700">
                      {formatCurrency(relatorio.resumo.totalDesconto)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Desconto no Total</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(relatorio.resumo.totalDescontoVendas)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {relatorio.resumo.quantidadeVendas} vendas
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Desconto por Item</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(relatorio.resumo.totalDescontoItens)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {relatorio.resumo.quantidadeItens} itens
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Ocorrencias</p>
                    <p className="text-2xl font-bold">
                      {relatorio.resumo.quantidadeVendas + relatorio.resumo.quantidadeItens}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Por Motivo */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Por Motivo</CardTitle>
                </CardHeader>
                <CardContent>
                  {relatorio.porMotivo.length > 0 ? (
                    <div className="space-y-3">
                      {relatorio.porMotivo.map((m, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{m.motivo}</p>
                            <p className="text-xs text-muted-foreground">{m.quantidade} vezes</p>
                          </div>
                          <p className="font-bold text-red-600">-{formatCurrency(m.valor)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Nenhum desconto no periodo</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Por Operador</CardTitle>
                </CardHeader>
                <CardContent>
                  {relatorio.porOperador.length > 0 ? (
                    <div className="space-y-3">
                      {relatorio.porOperador.map((o, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{o.operador}</p>
                            <p className="text-xs text-muted-foreground">{o.quantidade} descontos</p>
                          </div>
                          <p className="font-bold text-red-600">-{formatCurrency(o.valor)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Nenhum desconto no periodo</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Produtos com mais desconto */}
            {relatorio.porProduto.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Produtos que Mais Recebem Desconto</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Codigo</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Vezes</TableHead>
                        <TableHead className="text-right">Total Desconto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorio.porProduto.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono">{p.codigo}</TableCell>
                          <TableCell>{p.nome}</TableCell>
                          <TableCell className="text-right">{p.quantidade}</TableCell>
                          <TableCell className="text-right text-red-600 font-medium">
                            -{formatCurrency(p.valor)}
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
            <Percent className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Clique em "Gerar Relatorio" para ver os descontos</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
