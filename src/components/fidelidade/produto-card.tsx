'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Package, Edit, Trash2 } from 'lucide-react'
import { type ProdutoFidelidade, formatPontos } from './types'

interface ProdutoCardProps {
  produto: ProdutoFidelidade
  onEdit: (produto: ProdutoFidelidade) => void
  onDelete: (produto: ProdutoFidelidade) => void
}

export function ProdutoCard({ produto, onEdit, onDelete }: ProdutoCardProps) {
  return (
    <Card className={!produto.ativo ? 'opacity-60' : ''}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold">{produto.nome}</h3>
            {produto.descricao && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {produto.descricao}
              </p>
            )}
          </div>
          <Badge variant={produto.ativo ? 'default' : 'secondary'}>
            {produto.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="text-xl font-bold">
              {formatPontos(produto.pontos_necessarios)}
            </span>
            <span className="text-sm text-muted-foreground">pontos</span>
          </div>
          {produto.estoque_disponivel !== null && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>{produto.estoque_disponivel} disponível</span>
            </div>
          )}
        </div>

        {produto.produto && (
          <p className="text-xs text-muted-foreground mb-3">
            Vinculado: {produto.produto.codigo} - {produto.produto.nome}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(produto)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(produto)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
