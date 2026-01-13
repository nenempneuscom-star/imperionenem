'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Search, Loader2, Users, UserPlus } from 'lucide-react'
import { type Cliente, formatCurrency } from './types'

interface ClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  search: string
  onSearchChange: (value: string) => void
  clientes: Cliente[]
  loading: boolean
  total: number
  onSelectClient: (cliente: Cliente) => void
  mode?: 'crediario' | 'identificacao' // crediario valida limite, identificacao nao
}

export function ClientModal({
  open,
  onOpenChange,
  search,
  onSearchChange,
  clientes,
  loading,
  total,
  onSelectClient,
  mode = 'crediario',
}: ClientModalProps) {
  const isCrediario = mode === 'crediario'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isCrediario ? 'Selecionar Cliente (Crediario)' : 'Identificar Cliente'}
          </DialogTitle>
          <DialogDescription>
            {isCrediario
              ? 'Busque o cliente para venda no crediario'
              : 'Identifique o cliente para vincular a esta venda'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nome, CPF/CNPJ ou telefone..."
              className="pl-10"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Link para cadastrar novo cliente */}
          {!isCrediario && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open('/dashboard/clientes/novo', '_blank')}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Cadastrar Novo Cliente
            </Button>
          )}

          {/* Lista de clientes */}
          <ScrollArea className="h-64">
            {clientes.length > 0 ? (
              <div className="space-y-2">
                {clientes.map((cliente) => {
                  const creditoDisponivel =
                    cliente.limite_credito - cliente.saldo_devedor
                  const temCredito = creditoDisponivel >= total
                  const canSelect = isCrediario ? temCredito : true

                  return (
                    <button
                      key={cliente.id}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${
                        canSelect
                          ? 'hover:bg-muted cursor-pointer'
                          : 'opacity-50 cursor-not-allowed bg-muted/50'
                      }`}
                      onClick={() => canSelect && onSelectClient(cliente)}
                      disabled={!canSelect}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{cliente.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {cliente.cpf_cnpj}
                          </p>
                          {cliente.telefone && (
                            <p className="text-xs text-muted-foreground">
                              {cliente.telefone}
                            </p>
                          )}
                        </div>
                        {isCrediario && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Limite</p>
                            <p className="text-sm font-medium">
                              {formatCurrency(cliente.limite_credito)}
                            </p>
                            <p
                              className={`text-xs ${
                                temCredito ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              Disponivel: {formatCurrency(creditoDisponivel)}
                            </p>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {search
                  ? 'Nenhum cliente encontrado'
                  : 'Digite para buscar clientes'}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="flex gap-2">
          {!isCrediario && (
            <Button
              variant="ghost"
              onClick={() => {
                onOpenChange(false)
              }}
            >
              Continuar sem cliente
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
