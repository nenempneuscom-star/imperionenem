'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Scale } from 'lucide-react'
import { type Produto, formatCurrency, isProdutoPesavel, formatUnidade } from './types'

interface ProductSearchResultsProps {
  produtos: Produto[]
  onSelect: (produto: Produto) => void
}

export function ProductSearchResults({ produtos, onSelect }: ProductSearchResultsProps) {
  if (produtos.length === 0) return null

  return (
    <Card className="mb-4">
      <CardContent className="p-2">
        <ScrollArea className="max-h-64">
          {produtos.map((produto) => {
            const pesavel = isProdutoPesavel(produto.unidade)
            return (
              <button
                key={produto.id}
                className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors text-left"
                onClick={() => onSelect(produto)}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{produto.nome}</p>
                    {pesavel && (
                      <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                        <Scale className="h-3 w-3 mr-1" />
                        Pesavel
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Codigo: {produto.codigo}
                    {produto.codigo_barras && ` | EAN: ${produto.codigo_barras}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {formatCurrency(produto.preco_venda)}
                    {pesavel && <span className="text-sm font-normal text-muted-foreground">/{formatUnidade(produto.unidade)}</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Estoque: {produto.estoque_atual} {formatUnidade(produto.unidade)}
                  </p>
                </div>
              </button>
            )
          })}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
