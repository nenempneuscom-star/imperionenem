'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { type ProdutoFidelidade } from './types'

interface DeleteProdutoDialogProps {
  produto: ProdutoFidelidade | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  deletando: boolean
}

export function DeleteProdutoDialog({
  produto,
  onOpenChange,
  onConfirm,
  deletando,
}: DeleteProdutoDialogProps) {
  return (
    <AlertDialog open={!!produto} onOpenChange={() => onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover Produto</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover o produto &quot;{produto?.nome}&quot;?
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={deletando}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deletando ? 'Removendo...' : 'Remover'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
