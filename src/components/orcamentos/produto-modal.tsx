'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Loader2 } from 'lucide-react'
import { type Produto, formatCurrency } from './types'

interface ProdutoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  search: string
  onSearchChange: (value: string) => void
  produtos: Produto[]
  loading: boolean
  onSelect: (produto: Produto) => void
}

export function ProdutoModal({
  open,
  onOpenChange,
  search,
  onSearchChange,
  produtos,
  loading,
  onSelect,
}: ProdutoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Adicionar Produto</DialogTitle>
          <DialogDescription>
            Busque pelo nome, codigo ou codigo de barras
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : produtos.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                {search.length < 2 ? 'Digite para buscar...' : 'Nenhum produto encontrado'}
              </p>
            ) : (
              <div className="space-y-2">
                {produtos.map((produto) => (
                  <button
                    key={produto.id}
                    onClick={() => onSelect(produto)}
                    className="w-full p-3 text-left rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{produto.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          Codigo: {produto.codigo} | Estoque: {produto.estoque_atual} {produto.unidade}
                        </p>
                      </div>
                      <p className="font-bold text-lg">{formatCurrency(produto.preco_venda)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
