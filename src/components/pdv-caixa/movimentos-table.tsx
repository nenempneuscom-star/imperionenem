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
import { type Movimento, formatCurrency, formatDateTime } from './types'

interface MovimentosTableProps {
  movimentos: Movimento[]
}

export function MovimentosTable({ movimentos }: MovimentosTableProps) {
  if (movimentos.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimos Movimentos</CardTitle>
        <CardDescription>Movimentações do caixa atual</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hora</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movimentos.slice(0, 10).map((mov) => (
              <TableRow key={mov.id}>
                <TableCell className="text-sm">
                  {formatDateTime(mov.created_at)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      mov.tipo === 'entrada' || mov.tipo === 'suprimento'
                        ? 'default'
                        : 'destructive'
                    }
                  >
                    {mov.tipo === 'entrada' && 'Venda'}
                    {mov.tipo === 'saida' && 'Saída'}
                    {mov.tipo === 'sangria' && 'Sangria'}
                    {mov.tipo === 'suprimento' && 'Suprimento'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{mov.descricao || '-'}</TableCell>
                <TableCell className="text-right font-medium">
                  <span
                    className={
                      mov.tipo === 'entrada' || mov.tipo === 'suprimento'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {mov.tipo === 'entrada' || mov.tipo === 'suprimento' ? '+' : '-'}
                    {formatCurrency(mov.valor)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
