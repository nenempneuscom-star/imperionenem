'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Loader2 } from 'lucide-react'
import { type Cliente } from './types'

interface ClienteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  search: string
  onSearchChange: (value: string) => void
  clientes: Cliente[]
  loading: boolean
  onSelect: (cliente: Cliente) => void
}

export function ClienteModal({
  open,
  onOpenChange,
  search,
  onSearchChange,
  clientes,
  loading,
  onSelect,
}: ClienteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Buscar Cliente</DialogTitle>
          <DialogDescription>
            Busque pelo nome, CPF/CNPJ ou telefone
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : clientes.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                {search.length < 2 ? 'Digite para buscar...' : 'Nenhum cliente encontrado'}
              </p>
            ) : (
              <div className="space-y-2">
                {clientes.map((cliente) => (
                  <button
                    key={cliente.id}
                    onClick={() => onSelect(cliente)}
                    className="w-full p-3 text-left rounded-lg border hover:bg-muted transition-colors"
                  >
                    <p className="font-medium">{cliente.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {cliente.cpf_cnpj} | {cliente.telefone}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
