'use client'

import { User } from 'lucide-react'

interface ClienteInfoProps {
  nome: string | null
  cpfCnpj: string | null
  telefone: string | null
  email: string | null
}

export function ClienteInfo({ nome, cpfCnpj, telefone, email }: ClienteInfoProps) {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <h3 className="font-semibold flex items-center gap-2 mb-3">
        <User className="h-4 w-4" />
        Cliente
      </h3>
      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Nome</p>
          <p className="font-medium">{nome || 'Nao informado'}</p>
        </div>
        {cpfCnpj && (
          <div>
            <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
            <p className="font-medium">{cpfCnpj}</p>
          </div>
        )}
        {telefone && (
          <div>
            <p className="text-sm text-muted-foreground">Telefone</p>
            <p className="font-medium">{telefone}</p>
          </div>
        )}
        {email && (
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{email}</p>
          </div>
        )}
      </div>
    </div>
  )
}
