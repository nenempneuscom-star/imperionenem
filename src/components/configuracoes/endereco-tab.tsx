'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Search } from 'lucide-react'
import { type FormDataConfiguracoes, ufs } from './types'

interface EnderecoTabProps {
  formData: FormDataConfiguracoes
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onBuscarCEP: () => void
  saving: boolean
  buscandoCep: boolean
}

export function EnderecoTab({
  formData,
  onChange,
  onBuscarCEP,
  saving,
  buscandoCep,
}: EnderecoTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Endereco</CardTitle>
        <CardDescription>
          Endereco fiscal da empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <div className="flex gap-2">
              <Input
                id="cep"
                name="cep"
                placeholder="00000-000"
                value={formData.cep}
                onChange={onChange}
                maxLength={9}
                disabled={saving || buscandoCep}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onBuscarCEP}
                disabled={saving || buscandoCep}
              >
                {buscandoCep ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="logradouro">Logradouro</Label>
            <Input
              id="logradouro"
              name="logradouro"
              placeholder="Rua, Avenida, etc"
              value={formData.logradouro}
              onChange={onChange}
              disabled={saving}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="numero">Numero</Label>
            <Input
              id="numero"
              name="numero"
              placeholder="123"
              value={formData.numero}
              onChange={onChange}
              disabled={saving}
            />
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="complemento">Complemento</Label>
            <Input
              id="complemento"
              name="complemento"
              placeholder="Sala, Bloco, etc"
              value={formData.complemento}
              onChange={onChange}
              disabled={saving}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              name="bairro"
              placeholder="Bairro"
              value={formData.bairro}
              onChange={onChange}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              name="cidade"
              placeholder="Cidade"
              value={formData.cidade}
              onChange={onChange}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uf">UF</Label>
            <select
              id="uf"
              name="uf"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.uf}
              onChange={onChange}
              disabled={saving}
            >
              <option value="">Selecione</option>
              {ufs.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
