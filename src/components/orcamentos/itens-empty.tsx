'use client'

import { Button } from '@/components/ui/button'
import { Package, Plus } from 'lucide-react'

interface ItensEmptyProps {
  onAddItem: () => void
}

export function ItensEmpty({ onAddItem }: ItensEmptyProps) {
  return (
    <div className="text-center py-10">
      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <p className="text-muted-foreground">Nenhum item adicionado</p>
      <Button variant="outline" className="mt-4" onClick={onAddItem}>
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Primeiro Item
      </Button>
    </div>
  )
}
