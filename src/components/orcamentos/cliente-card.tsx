'use client'

import { Button } from '@/components/ui/button'
import { type Cliente } from './types'

interface ClienteCardProps {
  cliente: Cliente
  onAlterar: () => void
}

export function ClienteCard({ cliente, onAlterar }: ClienteCardProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
      <div>
        <p className="font-medium">{cliente.nome}</p>
        <p className="text-sm text-muted-foreground">
          {cliente.cpf_cnpj} | {cliente.telefone}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onAlterar}>
        Alterar
      </Button>
    </div>
  )
}
