'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Search } from 'lucide-react'
import { type ClienteNFSe, type NFSeFormData, type EnderecoTomador } from './types'

interface TomadorCardProps {
  formData: NFSeFormData
  onFormDataChange: (data: Partial<NFSeFormData>) => void
  searchCliente: string
  onSearchClienteChange: (value: string) => void
  filteredClientes: ClienteNFSe[]
  onClienteSelect: (cliente: ClienteNFSe) => void
  onBuscarCep: (cep: string) => void
}

export function TomadorCard({
  formData,
  onFormDataChange,
  searchCliente,
  onSearchClienteChange,
  filteredClientes,
  onClienteSelect,
  onBuscarCep,
}: TomadorCardProps) {
  function handleEnderecoChange(field: keyof EnderecoTomador, value: string) {
    onFormDataChange({
      tomador_endereco: { ...formData.tomador_endereco, [field]: value },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tomador do Servico</CardTitle>
        <CardDescription>Dados de quem esta contratando o servico</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca de cliente */}
        <div className="space-y-2">
          <Label>Buscar Cliente Cadastrado</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Digite o nome ou CPF/CNPJ..."
              value={searchCliente}
              onChange={(e) => onSearchClienteChange(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchCliente && filteredClientes.length > 0 && (
            <div className="border rounded-md max-h-40 overflow-auto">
              {filteredClientes.slice(0, 5).map((cliente) => (
                <div
                  key={cliente.id}
                  className="p-2 hover:bg-muted cursor-pointer"
                  onClick={() => onClienteSelect(cliente)}
                >
                  <div className="font-medium">{cliente.nome}</div>
                  <div className="text-sm text-muted-foreground">{cliente.cpf_cnpj}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Pessoa</Label>
            <Select
              value={formData.tomador_tipo_pessoa}
              onValueChange={(v) => onFormDataChange({ tomador_tipo_pessoa: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PF">Pessoa Fisica</SelectItem>
                <SelectItem value="PJ">Pessoa Juridica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{formData.tomador_tipo_pessoa === 'PF' ? 'CPF *' : 'CNPJ *'}</Label>
            <Input
              value={formData.tomador_cpf_cnpj}
              onChange={(e) => onFormDataChange({ tomador_cpf_cnpj: e.target.value })}
              placeholder={formData.tomador_tipo_pessoa === 'PF' ? '000.000.000-00' : '00.000.000/0001-00'}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{formData.tomador_tipo_pessoa === 'PF' ? 'Nome Completo *' : 'Razao Social *'}</Label>
          <Input
            value={formData.tomador_razao_social}
            onChange={(e) => onFormDataChange({ tomador_razao_social: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input
              type="email"
              value={formData.tomador_email}
              onChange={(e) => onFormDataChange({ tomador_email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              value={formData.tomador_telefone}
              onChange={(e) => onFormDataChange({ tomador_telefone: e.target.value })}
            />
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>CEP</Label>
            <Input
              value={formData.tomador_endereco.cep}
              onChange={(e) => {
                handleEnderecoChange('cep', e.target.value)
                if (e.target.value.replace(/\D/g, '').length === 8) {
                  onBuscarCep(e.target.value)
                }
              }}
              placeholder="00000-000"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Logradouro</Label>
            <Input
              value={formData.tomador_endereco.logradouro}
              onChange={(e) => handleEnderecoChange('logradouro', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Numero</Label>
            <Input
              value={formData.tomador_endereco.numero}
              onChange={(e) => handleEnderecoChange('numero', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Complemento</Label>
            <Input
              value={formData.tomador_endereco.complemento}
              onChange={(e) => handleEnderecoChange('complemento', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Bairro</Label>
            <Input
              value={formData.tomador_endereco.bairro}
              onChange={(e) => handleEnderecoChange('bairro', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>UF</Label>
            <Input
              value={formData.tomador_endereco.uf}
              onChange={(e) => handleEnderecoChange('uf', e.target.value)}
              maxLength={2}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
