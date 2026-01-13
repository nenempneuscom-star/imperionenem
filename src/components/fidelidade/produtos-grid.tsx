'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Gift, Search, Plus } from 'lucide-react'
import { type ProdutoFidelidade } from './types'
import { ProdutoCard } from './produto-card'

interface ProdutosGridProps {
  produtos: ProdutoFidelidade[]
  search: string
  onSearchChange: (value: string) => void
  onEdit: (produto: ProdutoFidelidade) => void
  onDelete: (produto: ProdutoFidelidade) => void
  onNovo: () => void
}

export function ProdutosGrid({
  produtos,
  search,
  onSearchChange,
  onEdit,
  onDelete,
  onNovo,
}: ProdutosGridProps) {
  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.produto?.nome?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catálogo de Recompensas</CardTitle>
        <CardDescription>
          Produtos que os clientes podem resgatar usando seus pontos de fidelidade
        </CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            className="pl-10"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {produtosFiltrados.length > 0 ? (
          <ScrollArea className="h-[500px]">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {produtosFiltrados.map((produto) => (
                <ProdutoCard
                  key={produto.id}
                  produto={produto}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Gift className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Nenhum produto cadastrado</p>
            <p className="text-sm">Cadastre produtos para os clientes resgatarem com pontos</p>
            <Button className="mt-4" onClick={onNovo}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeiro Produto
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
