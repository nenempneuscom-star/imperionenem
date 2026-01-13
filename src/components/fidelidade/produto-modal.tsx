'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Search, Package, Save } from 'lucide-react'
import { type ProdutoCatalogo } from './types'

interface ProdutoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editando: boolean
  salvando: boolean
  onSalvar: () => void
  // Form fields
  nome: string
  onNomeChange: (value: string) => void
  descricao: string
  onDescricaoChange: (value: string) => void
  pontos: string
  onPontosChange: (value: string) => void
  estoque: string
  onEstoqueChange: (value: string) => void
  ativo: boolean
  onAtivoChange: (value: boolean) => void
  // Product search
  produtoVinculado: boolean
  onRemoverVinculo: () => void
  buscaProduto: string
  onBuscaProdutoChange: (value: string) => void
  buscandoProduto: boolean
  produtosEncontrados: ProdutoCatalogo[]
  onSelecionarProduto: (produto: ProdutoCatalogo) => void
}

export function ProdutoModal({
  open,
  onOpenChange,
  editando,
  salvando,
  onSalvar,
  nome,
  onNomeChange,
  descricao,
  onDescricaoChange,
  pontos,
  onPontosChange,
  estoque,
  onEstoqueChange,
  ativo,
  onAtivoChange,
  produtoVinculado,
  onRemoverVinculo,
  buscaProduto,
  onBuscaProdutoChange,
  buscandoProduto,
  produtosEncontrados,
  onSelecionarProduto,
}: ProdutoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editando ? 'Editar Produto' : 'Novo Produto Resgatável'}
          </DialogTitle>
          <DialogDescription>
            {editando
              ? 'Atualize as informações do produto'
              : 'Cadastre um novo produto para resgate por pontos'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vincular a produto existente */}
          <div className="space-y-2">
            <Label>Vincular a Produto (opcional)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto do estoque..."
                className="pl-10"
                value={buscaProduto}
                onChange={(e) => onBuscaProdutoChange(e.target.value)}
              />
              {buscandoProduto && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {produtosEncontrados.length > 0 && (
              <div className="border rounded-lg max-h-40 overflow-y-auto">
                {produtosEncontrados.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full p-2 text-left hover:bg-muted text-sm"
                    onClick={() => onSelecionarProduto(p)}
                  >
                    <span className="font-medium">{p.codigo}</span> - {p.nome}
                  </button>
                ))}
              </div>
            )}
            {produtoVinculado && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-green-600" />
                <span>Produto vinculado</span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="p-0 h-auto"
                  onClick={onRemoverVinculo}
                >
                  Remover vínculo
                </Button>
              </div>
            )}
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              placeholder="Nome do produto/recompensa"
              value={nome}
              onChange={(e) => onNomeChange(e.target.value)}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Descrição do produto..."
              value={descricao}
              onChange={(e) => onDescricaoChange(e.target.value)}
              rows={2}
            />
          </div>

          {/* Pontos e Estoque */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pontos">Pontos Necessários *</Label>
              <Input
                id="pontos"
                type="number"
                min="1"
                placeholder="100"
                value={pontos}
                onChange={(e) => onPontosChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estoque">Estoque (vazio = ilimitado)</Label>
              <Input
                id="estoque"
                type="number"
                min="0"
                placeholder="Ilimitado"
                value={estoque}
                onChange={(e) => onEstoqueChange(e.target.value)}
              />
            </div>
          </div>

          {/* Ativo */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Produto Ativo</Label>
              <p className="text-xs text-muted-foreground">
                Disponível para resgate pelos clientes
              </p>
            </div>
            <Switch
              checked={ativo}
              onCheckedChange={onAtivoChange}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSalvar} disabled={salvando}>
            {salvando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
