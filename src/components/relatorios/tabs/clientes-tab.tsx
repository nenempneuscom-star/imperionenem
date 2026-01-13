'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, TrendingUp, UserX } from 'lucide-react'
import { type RelatorioClientes, formatCurrency } from '../types'

interface ClientesTabProps {
  relatorio: RelatorioClientes | null
  loading: boolean
  filterComponent: React.ReactNode
}

export function ClientesTab({
  relatorio,
  loading,
  filterComponent,
}: ClientesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Relatorio de Clientes
        </CardTitle>
        <CardDescription>
          Conheca seus clientes e identifique oportunidades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {filterComponent}

        {relatorio && (
          <>
            {/* Resumo */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Clientes</p>
                    <p className="text-2xl font-bold">{relatorio.resumo.totalClientes}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-green-600">Clientes Novos</p>
                    <p className="text-2xl font-bold text-green-700">
                      {relatorio.resumo.clientesNovos}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Vendas Identificadas</p>
                    <p className="text-2xl font-bold">
                      {relatorio.resumo.percentualIdentificado.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {relatorio.resumo.vendasCliente} de {relatorio.resumo.vendasCliente + relatorio.resumo.vendasConsumidor}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Vendido</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(relatorio.resumo.totalVendas)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Melhores Clientes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Melhores Clientes (Por Valor)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {relatorio.melhoresClientes.slice(0, 10).map((c: any, i: number) => (
                      <div key={i} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{c.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.quantidadeCompras} compras | Ticket: {formatCurrency(c.ticketMedio)}
                          </p>
                        </div>
                        <p className="font-bold text-green-600">{formatCurrency(c.totalCompras)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Clientes que Sumiram */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserX className="h-4 w-4 text-red-500" />
                    Clientes que Sumiram (+30 dias)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {relatorio.clientesSumiram.length > 0 ? (
                    <div className="space-y-3">
                      {relatorio.clientesSumiram.slice(0, 10).map((c: any, i: number) => (
                        <div key={i} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{c.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              Ultima compra: {formatCurrency(c.totalCompras)}
                            </p>
                          </div>
                          <Badge variant="destructive">
                            {c.diasSemCompra} dias
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Todos os clientes estao ativos!
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {!relatorio && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Clique em "Gerar Relatorio" para conhecer seus clientes</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
