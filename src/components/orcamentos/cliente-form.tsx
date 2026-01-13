'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type ClienteManual } from './types'

interface ClienteFormProps {
  cliente: ClienteManual
  onChange: (cliente: ClienteManual) => void
}

export function ClienteForm({ cliente, onChange }: ClienteFormProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input
          placeholder="Nome do cliente"
          value={cliente.nome}
          onChange={(e) => onChange({ ...cliente, nome: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Telefone</Label>
        <Input
          placeholder="(00) 00000-0000"
          value={cliente.telefone}
          onChange={(e) => onChange({ ...cliente, telefone: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          placeholder="email@exemplo.com"
          value={cliente.email}
          onChange={(e) => onChange({ ...cliente, email: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>CPF/CNPJ</Label>
        <Input
          placeholder="000.000.000-00"
          value={cliente.cpf_cnpj}
          onChange={(e) => onChange({ ...cliente, cpf_cnpj: e.target.value })}
        />
      </div>
    </div>
  )
}
