'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Minus, Plus, X, Scale, Percent, ShoppingCart } from 'lucide-react'
import { formatCurrency, formatUnidade, type ConfigDesconto } from './types'

interface CartItem {
  id: string
  nome: string
  preco: number
  quantidade: number
  unidade?: string
  desconto?: number
  descontoPercentual?: number
}

interface CartItemsProps {
  items: CartItem[]
  configDesconto: ConfigDesconto | null
  onUpdateQuantity: (id: string, quantidade: number) => void
  onRemoveItem: (id: string) => void
  onApplyDiscount: (item: CartItem) => void
  onClearDiscount: (id: string) => void
}

function isPesavel(unidade?: string): boolean {
  if (!unidade) return false
  return ['KG', 'G', 'L', 'ML', 'M', 'CM', 'M2', 'M3'].includes(unidade.toUpperCase())
}

export function CartItems({
  items,
  configDesconto,
  onUpdateQuantity,
  onRemoveItem,
  onApplyDiscount,
  onClearDiscount,
}: CartItemsProps) {
  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">Carrinho vazio</p>
          <p className="text-sm mt-1">
            Busque produtos ou use o scanner
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y">
        {items.map((item, index) => {
          const pesavel = isPesavel(item.unidade)
          return (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 hover:bg-muted/50"
            >
              <span className="text-2xl font-bold text-muted-foreground w-8">
                {index + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{item.nome}</p>
                  {pesavel && (
                    <Scale className="h-4 w-4 text-orange-500" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(item.preco)}{pesavel ? `/${formatUnidade(item.unidade!)}` : ''} x {pesavel ? item.quantidade.toFixed(3).replace('.', ',') : item.quantidade} {pesavel ? formatUnidade(item.unidade!) : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {pesavel ? (
                  <span className="w-24 text-center font-medium text-orange-600">
                    {item.quantidade.toFixed(3).replace('.', ',')} {formatUnidade(item.unidade!)}
                  </span>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onUpdateQuantity(item.id, item.quantidade - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">
                      {item.quantidade}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onUpdateQuantity(item.id, item.quantidade + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              <div className="w-28 text-right">
                <p className="font-bold text-lg">
                  {formatCurrency((item.preco * item.quantidade) - (item.desconto || 0))}
                </p>
                {item.desconto && item.desconto > 0 && (
                  <p className="text-xs text-destructive">
                    -{formatCurrency(item.desconto)} ({item.descontoPercentual?.toFixed(1)}%)
                  </p>
                )}
              </div>
              {configDesconto?.permitir_desconto_item && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${item.desconto ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}
                  onClick={() => {
                    if (item.desconto) {
                      onClearDiscount(item.id)
                    } else {
                      onApplyDiscount(item)
                    }
                  }}
                  title={item.desconto ? 'Remover desconto' : 'Aplicar desconto'}
                >
                  <Percent className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive h-8 w-8"
                onClick={() => onRemoveItem(item.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
