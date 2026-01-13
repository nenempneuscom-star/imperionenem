'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DollarSign, ShoppingCart, BarChart3, FileSpreadsheet } from 'lucide-react'
import { DateFilter } from '../date-filter'
import { type VendaRelatorio, type ResumoVendas, formatCurrency, formatDateTime } from '../types'

interface VendasTabProps {
  dataInicio: string
  dataFim: string
  onDataInicioChange: (value: string) => void
  onDataFimChange: (value: string) => void
  onBuscar: () => void
  loading: boolean
  vendas: VendaRelatorio[]
  resumo: ResumoVendas
  onExportar: () => void
}

export function VendasTab({
  dataInicio,
  dataFim,
  onDataInicioChange,
  onDataFimChange,
  onBuscar,
  loading,
  vendas,
  resumo,
  onExportar,
}: VendasTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatorio de Vendas</CardTitle>
        <CardDescription>
          Visualize todas as vendas realizadas no periodo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <DateFilter
            dataInicio={dataInicio}
            dataFim={dataFim}
            onDataInicioChange={onDataInicioChange}
            onDataFimChange={onDataFimChange}
            onBuscar={onBuscar}
            loading={loading}
          />
          {vendas.length > 0 && (
            <Button variant="outline" onClick={onExportar}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          )}
        </div>

        {resumo.quantidade > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Vendido</p>
                    <p className="text-2xl font-bold">{formatCurrency(resumo.total)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <ShoppingCart className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Quantidade de Vendas</p>
                    <p className="text-2xl font-bold">{resumo.quantidade}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Medio</p>
                    <p className="text-2xl font-bold">{formatCurrency(resumo.ticketMedio)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {vendas.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numero</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendas.map((venda) => (
                <TableRow key={venda.id}>
                  <TableCell className="font-mono">#{venda.numero}</TableCell>
                  <TableCell>{formatDateTime(venda.data_hora)}</TableCell>
                  <TableCell>{venda.clientes?.nome || 'Consumidor'}</TableCell>
                  <TableCell>{venda.usuarios?.nome || '-'}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(venda.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
