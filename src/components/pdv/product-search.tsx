'use client'

import { forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, Scan, Plus, Scale } from 'lucide-react'
import { type Produto, formatCurrency, isProdutoPesavel, formatUnidade } from './types'

interface ProductSearchProps {
  search: string
  onSearchChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  produtos: Produto[]
  loading: boolean
  scannerEnabled: boolean
  isScannerInput: boolean
  onToggleScanner: () => void
  onAddProduct: (produto: Produto) => void
  onWeighProduct: (produto: Produto) => void
}

export const ProductSearch = forwardRef<HTMLInputElement, ProductSearchProps>(
  function ProductSearch(
    {
      search,
      onSearchChange,
      onKeyDown,
      produtos,
      loading,
      scannerEnabled,
      isScannerInput,
      onToggleScanner,
      onAddProduct,
      onWeighProduct,
    },
    ref
  ) {
    return (
      <>
        {/* Busca */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={ref}
            placeholder={
              scannerEnabled
                ? 'Escaneie ou digite o codigo do produto...'
                : 'Digite o codigo ou nome do produto...'
            }
            className={`pl-12 pr-24 h-14 text-lg ${
              isScannerInput ? 'border-green-500 ring-2 ring-green-500/20' : ''
            }`}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {loading && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
            {isScannerInput && (
              <Badge variant="default" className="bg-green-500 animate-pulse">
                <Scan className="h-3 w-3 mr-1" />
                Scanner
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-2 ${
                scannerEnabled ? 'text-green-600' : 'text-muted-foreground'
              }`}
              onClick={onToggleScanner}
              title={scannerEnabled ? 'Scanner ativo' : 'Scanner desativado'}
            >
              <Scan className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Lista de produtos encontrados */}
        {produtos.length > 0 && (
          <Card className="mb-4">
            <CardContent className="p-2">
              <ScrollArea className="max-h-64">
                {produtos.map((produto) => {
                  const pesavel = isProdutoPesavel(produto.unidade)
                  return (
                    <button
                      key={produto.id}
                      className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors"
                      onClick={() =>
                        pesavel ? onWeighProduct(produto) : onAddProduct(produto)
                      }
                    >
                      <div className="text-left">
                        <p className="font-medium">{produto.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          Cod: {produto.codigo}
                          {produto.codigo_barras && ` | ${produto.codigo_barras}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-lg text-primary">
                            {formatCurrency(produto.preco_venda)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Estoque: {produto.estoque_atual}{' '}
                            {formatUnidade(produto.unidade)}
                          </p>
                        </div>
                        {pesavel ? (
                          <div className="flex items-center justify-center w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                            <Scale className="h-5 w-5 text-orange-600" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                            <Plus className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </>
    )
  }
)
