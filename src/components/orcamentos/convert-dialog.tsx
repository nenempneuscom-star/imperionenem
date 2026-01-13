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
import { Loader2 } from 'lucide-react'

interface ConvertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  loading: boolean
}

export function ConvertDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
}: ConvertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Converter em Venda</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja converter este orcamento em uma venda? Os produtos serao baixados do estoque.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Converter'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
