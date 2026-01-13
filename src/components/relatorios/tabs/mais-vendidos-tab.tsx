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
import { TrendingUp } from 'lucide-react'
import { type ProdutoRelatorio, formatCurrency } from '../types'

interface MaisVendidosTabProps {
  produtos: ProdutoRelatorio[]
  loading: boolean
  filterComponent: React.ReactNode
  exportButton?: React.ReactNode
}

export function MaisVendidosTab({
  produtos,
  loading,
  filterComponent,
  exportButton,
}: MaisVendidosTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos Mais Vendidos</CardTitle>
        <CardDescription>
          Ranking dos produtos mais vendidos no periodo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          {filterComponent}
          {exportButton}
        </div>

        {produtos.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Codigo</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Qtd. Vendida</TableHead>
                <TableHead className="text-right">Total Faturado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.slice(0, 20).map((produto, index) => (
                <TableRow key={produto.id}>
                  <TableCell>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-primary/10 text-primary'
                    }`}>
                      {index + 1}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{produto.codigo}</TableCell>
                  <TableCell>{produto.nome}</TableCell>
                  <TableCell className="text-right font-medium">
                    {produto.total_vendido} {produto.unidade}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {formatCurrency(produto.valor_vendido || 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {produtos.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Clique em "Gerar Relatorio" para visualizar os produtos mais vendidos</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
