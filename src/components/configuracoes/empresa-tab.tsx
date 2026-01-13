'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Search } from 'lucide-react'
import { type FormDataConfiguracoes } from './types'

interface EmpresaTabProps {
  formData: FormDataConfiguracoes
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onBuscarCNPJ: () => void
  saving: boolean
  buscandoCnpj: boolean
}

export function EmpresaTab({
  formData,
  onChange,
  onBuscarCNPJ,
  saving,
  buscandoCnpj,
}: EmpresaTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Cadastrais</CardTitle>
        <CardDescription>
          Informacoes basicas da empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ *</Label>
            <div className="flex gap-2">
              <Input
                id="cnpj"
                name="cnpj"
                placeholder="00.000.000/0001-00"
                value={formData.cnpj}
                onChange={onChange}
                maxLength={18}
                required
                disabled={saving || buscandoCnpj}
              />
              <Button
                type="button"
                variant="outline"
                onClick={onBuscarCNPJ}
                disabled={saving || buscandoCnpj}
              >
                {buscandoCnpj ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ie">Inscricao Estadual</Label>
            <Input
              id="ie"
              name="ie"
              placeholder="Inscricao estadual"
              value={formData.ie}
              onChange={onChange}
              disabled={saving}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="razao_social">Razao Social *</Label>
          <Input
            id="razao_social"
            name="razao_social"
            placeholder="Razao social da empresa"
            value={formData.razao_social}
            onChange={onChange}
            required
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
          <Input
            id="nome_fantasia"
            name="nome_fantasia"
            placeholder="Nome fantasia"
            value={formData.nome_fantasia}
            onChange={onChange}
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">WhatsApp</Label>
          <Input
            id="telefone"
            name="telefone"
            placeholder="(00) 00000-0000"
            value={formData.telefone}
            onChange={onChange}
            maxLength={15}
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="email@empresa.com"
            value={formData.email}
            onChange={onChange}
            disabled={saving}
          />
        </div>
      </CardContent>
    </Card>
  )
}
