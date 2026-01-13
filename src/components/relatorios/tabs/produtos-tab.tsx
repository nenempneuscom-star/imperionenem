'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Package, DollarSign } from 'lucide-react'
import { type ProdutoRelatorio, type ResumoEstoque, formatCurrency } from '../types'

interface ProdutosTabProps {
  produtos: ProdutoRelatorio[]
  resumo: ResumoEstoque
  filterComponent: React.ReactNode
  exportButton?: React.ReactNode
}

export function ProdutosTab({
  produtos,
  resumo,
  filterComponent,
  exportButton,
}: ProdutosTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatorio de Estoque</CardTitle>
        <CardDescription>
          Posicao atual do estoque de produtos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          {filterComponent}
          {exportButton}
        </div>

        {resumo.totalProdutos > 0 && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Package className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Produtos</p>
                    <p className="text-2xl font-bold">{resumo.totalProdutos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Venda</p>
                    <p className="text-2xl font-bold">{formatCurrency(resumo.valorEstoque)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <DollarSign className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Custo</p>
                    <p className="text-2xl font-bold">{formatCurrency(resumo.valorCusto)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={resumo.baixoEstoque > 0 ? 'border-red-500' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Package className={`h-8 w-8 ${resumo.baixoEstoque > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                    <p className={`text-2xl font-bold ${resumo.baixoEstoque > 0 ? 'text-red-600' : ''}`}>
                      {resumo.baixoEstoque}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {produtos.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codigo</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-right">Minimo</TableHead>
                <TableHead className="text-right">Preco Venda</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.map((produto) => {
                const baixo = produto.estoque_atual <= produto.estoque_minimo
                return (
                  <TableRow key={produto.id}>
                    <TableCell className="font-mono">{produto.codigo}</TableCell>
                    <TableCell>{produto.nome}</TableCell>
                    <TableCell className="text-right">
                      {produto.estoque_atual} {produto.unidade}
                    </TableCell>
                    <TableCell className="text-right">
                      {produto.estoque_minimo} {produto.unidade}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(produto.preco_venda)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(produto.estoque_atual * produto.preco_venda)}
                    </TableCell>
                    <TableCell>
                      {baixo ? (
                        <Badge variant="destructive">Baixo</Badge>
                      ) : (
                        <Badge variant="default">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
