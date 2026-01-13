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
import { Package, TrendingUp, DollarSign, Percent } from 'lucide-react'
import { type ItemVendido, type ResumoItensVendidos, formatCurrency, formatDateTime } from '../types'

interface ItensVendidosTabProps {
  itens: ItemVendido[]
  resumo: ResumoItensVendidos
  filterComponent: React.ReactNode
  exportButton?: React.ReactNode
}

export function ItensVendidosTab({
  itens,
  resumo,
  filterComponent,
  exportButton,
}: ItensVendidosTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Itens Vendidos no Periodo
        </CardTitle>
        <CardDescription>
          Lista detalhada de todos os produtos e servicos vendidos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          {filterComponent}
          {exportButton}
        </div>

        {resumo.totalItens > 0 && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Package className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Itens</p>
                    <p className="text-2xl font-bold">{resumo.totalItens}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Quantidade Total</p>
                    <p className="text-2xl font-bold">{resumo.totalQuantidade.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <DollarSign className="h-8 w-8 text-emerald-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(resumo.totalValor)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Percent className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Descontos</p>
                    <p className="text-2xl font-bold">{formatCurrency(resumo.totalDesconto)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {itens.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venda</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Preco Unit.</TableHead>
                  <TableHead className="text-right">Desconto</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">#{item.venda_numero}</TableCell>
                    <TableCell>{formatDateTime(item.venda_data)}</TableCell>
                    <TableCell>{item.cliente_nome}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.produto_nome}</p>
                        <p className="text-xs text-muted-foreground">{item.produto_codigo}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{item.quantidade} {item.unidade}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.preco_unitario)}</TableCell>
                    <TableCell className="text-right text-orange-600">
                      {item.desconto > 0 ? `-${formatCurrency(item.desconto)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione o periodo e clique em "Gerar Relatorio" para ver os itens vendidos</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
