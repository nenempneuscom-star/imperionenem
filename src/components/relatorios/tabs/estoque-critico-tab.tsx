'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertTriangle, Loader2, Search } from 'lucide-react'
import { type RelatorioEstoqueCritico, formatCurrency } from '../types'

interface EstoqueCriticoTabProps {
  relatorio: RelatorioEstoqueCritico | null
  loading: boolean
  onBuscar: () => void
}

export function EstoqueCriticoTab({
  relatorio,
  loading,
  onBuscar,
}: EstoqueCriticoTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Estoque Critico
        </CardTitle>
        <CardDescription>
          Produtos que precisam de atencao urgente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={onBuscar} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Verificar Estoque
        </Button>

        {relatorio && (
          <>
            {/* Resumo */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Produtos</p>
                    <p className="text-2xl font-bold">{relatorio.resumo.totalProdutos}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-yellow-600">Abaixo do Minimo</p>
                    <p className="text-2xl font-bold text-yellow-700">
                      {relatorio.resumo.abaixoMinimo}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-red-600">Estoque Zerado</p>
                    <p className="text-2xl font-bold text-red-700">
                      {relatorio.resumo.estoqueZerado}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-orange-600">Produtos Parados</p>
                    <p className="text-2xl font-bold text-orange-700">
                      {relatorio.resumo.produtosParados}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(relatorio.resumo.valorParado)} parado
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Estoque Zerado */}
              {relatorio.estoqueZerado.length > 0 && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="text-base text-red-600">Estoque Zerado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {relatorio.estoqueZerado.map((p: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded">
                          <div>
                            <p className="font-mono text-xs text-muted-foreground">{p.codigo}</p>
                            <p className="font-medium">{p.nome}</p>
                          </div>
                          <Badge variant="destructive">0 {p.unidade}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Abaixo do Minimo */}
              {relatorio.abaixoMinimo.length > 0 && (
                <Card className="border-yellow-200">
                  <CardHeader>
                    <CardTitle className="text-base text-yellow-600">Abaixo do Minimo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {relatorio.abaixoMinimo.map((p: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-sm p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                          <div>
                            <p className="font-mono text-xs text-muted-foreground">{p.codigo}</p>
                            <p className="font-medium">{p.nome}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-yellow-600">{p.estoque_atual} {p.unidade}</p>
                            <p className="text-xs text-muted-foreground">Min: {p.estoque_minimo}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Produtos Parados */}
            {relatorio.produtosParados.length > 0 && (
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="text-base text-orange-600">
                    Produtos Parados (Sem venda ha 60+ dias)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Codigo</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Estoque</TableHead>
                        <TableHead className="text-right">Valor Parado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorio.produtosParados.slice(0, 15).map((p: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono">{p.codigo}</TableCell>
                          <TableCell>{p.nome}</TableCell>
                          <TableCell className="text-right">{p.estoque_atual} {p.unidade}</TableCell>
                          <TableCell className="text-right text-orange-600 font-medium">
                            {formatCurrency(p.valorEstoque)}
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
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Clique em "Verificar Estoque" para identificar problemas</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
