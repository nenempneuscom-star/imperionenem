'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Trash2 } from 'lucide-react'
import { type ItemOrcamento, formatCurrency } from './types'

interface ItensTableProps {
  itens: ItemOrcamento[]
  editable?: boolean
  onUpdateItem?: (id: string, campo: string, valor: number) => void
  onRemoveItem?: (id: string) => void
}

export function ItensTable({
  itens,
  editable = false,
  onUpdateItem,
  onRemoveItem,
}: ItensTableProps) {
  if (editable) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="w-[100px]">Qtd</TableHead>
              <TableHead className="w-[120px]">Preco</TableHead>
              <TableHead className="w-[100px]">Desc.</TableHead>
              <TableHead className="w-[120px] text-right">Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{item.nome}</p>
                    <p className="text-xs text-muted-foreground">{item.codigo}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    step="0.001"
                    value={item.quantidade}
                    onChange={(e) => onUpdateItem?.(item.id, 'quantidade', parseFloat(e.target.value) || 1)}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.preco_unitario}
                    onChange={(e) => onUpdateItem?.(item.id, 'preco_unitario', parseFloat(e.target.value) || 0)}
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.desconto}
                    onChange={(e) => onUpdateItem?.(item.id, 'desconto', parseFloat(e.target.value) || 0)}
                    className="w-20"
                  />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.total)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveItem?.(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Codigo</TableHead>
            <TableHead>Descricao</TableHead>
            <TableHead className="text-center">Qtd</TableHead>
            <TableHead className="text-right">Unitario</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm">
                {item.codigo || '-'}
              </TableCell>
              <TableCell>
                <p className="font-medium">{item.nome}</p>
                {item.descricao && (
                  <p className="text-xs text-muted-foreground">{item.descricao}</p>
                )}
              </TableCell>
              <TableCell className="text-center">
                {item.quantidade} {item.unidade}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.preco_unitario)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(item.total)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
