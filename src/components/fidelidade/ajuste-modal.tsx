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
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { type ClientePontos, formatPontos } from './types'

interface AjusteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipo: 'adicionar' | 'remover'
  cliente: ClientePontos | null
  valor: string
  descricao: string
  processando: boolean
  onValorChange: (valor: string) => void
  onDescricaoChange: (descricao: string) => void
  onConfirm: () => void
}

export function AjusteModal({
  open,
  onOpenChange,
  tipo,
  cliente,
  valor,
  descricao,
  processando,
  onValorChange,
  onDescricaoChange,
  onConfirm,
}: AjusteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tipo === 'adicionar' ? 'Adicionar Pontos' : 'Remover Pontos'}
          </DialogTitle>
          <DialogDescription>
            Cliente: {cliente?.cliente?.nome}
            <br />
            Saldo atual: {cliente && formatPontos(cliente.saldo_pontos)} pontos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Quantidade de Pontos</Label>
            <Input
              type="number"
              min="1"
              placeholder="0"
              value={valor}
              onChange={(e) => onValorChange(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Motivo (opcional)</Label>
            <Input
              placeholder="Descreva o motivo do ajuste..."
              value={descricao}
              onChange={(e) => onDescricaoChange(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={processando}>
            {processando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Confirmar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
