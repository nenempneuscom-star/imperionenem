'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PieChart, Layers } from 'lucide-react'
import { type ProdutoCurvaABC, type ResumoCurvaABC, formatCurrency, formatPercent } from '../types'

interface CurvaABCTabProps {
  produtos: ProdutoCurvaABC[]
  resumo: ResumoCurvaABC
  loading: boolean
  filterComponent: React.ReactNode
  exportButton?: React.ReactNode
}

export function CurvaABCTab({
  produtos,
  resumo,
  loading,
  filterComponent,
  exportButton,
}: CurvaABCTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Curva ABC de Produtos
        </CardTitle>
        <CardDescription>
          Classificacao dos produtos por contribuicao no faturamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          {filterComponent}
          {exportButton}
        </div>

        {resumo.totalFaturamento > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-green-500">Classe A</Badge>
                  <span className="text-sm text-muted-foreground">{resumo.qtdClasseA} produtos</span>
                </div>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(resumo.valorClasseA)}</p>
                <p className="text-sm text-green-600">80% do faturamento</p>
              </CardContent>
            </Card>
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-yellow-500">Classe B</Badge>
                  <span className="text-sm text-muted-foreground">{resumo.qtdClasseB} produtos</span>
                </div>
                <p className="text-2xl font-bold text-yellow-700">{formatCurrency(resumo.valorClasseB)}</p>
                <p className="text-sm text-yellow-600">15% do faturamento</p>
              </CardContent>
            </Card>
            <Card className="border-gray-200 bg-gray-50 dark:bg-gray-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">Classe C</Badge>
                  <span className="text-sm text-muted-foreground">{resumo.qtdClasseC} produtos</span>
                </div>
                <p className="text-2xl font-bold text-gray-700">{formatCurrency(resumo.valorClasseC)}</p>
                <p className="text-sm text-gray-600">5% do faturamento</p>
              </CardContent>
            </Card>
          </div>
        )}

        {produtos.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Classe</TableHead>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd. Vendida</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">% Faturamento</TableHead>
                  <TableHead className="w-32">Acumulado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell>
                      <Badge className={
                        produto.classe === 'A' ? 'bg-green-500' :
                        produto.classe === 'B' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }>
                        {produto.classe}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{produto.codigo}</TableCell>
                    <TableCell>{produto.nome}</TableCell>
                    <TableCell className="text-right">{produto.quantidade_vendida}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(produto.valor_vendido)}
                    </TableCell>
                    <TableCell className="text-right">{formatPercent(produto.percentual)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={produto.percentual_acumulado} className="h-2" />
                        <span className="text-xs w-12">{formatPercent(produto.percentual_acumulado)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : !loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Clique em "Gerar Relatorio" para visualizar a curva ABC</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
