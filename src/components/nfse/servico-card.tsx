'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type Servico, type NFSeFormData, ITENS_LC116 } from './types'

interface ServicoCardProps {
  formData: NFSeFormData
  onFormDataChange: (data: Partial<NFSeFormData>) => void
  servicos: Servico[]
  onServicoChange: (servicoId: string) => void
}

export function ServicoCard({
  formData,
  onFormDataChange,
  servicos,
  onServicoChange,
}: ServicoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Servico Prestado</CardTitle>
        <CardDescription>Dados do servico realizado</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Servico Cadastrado</Label>
            <Select value={formData.servico_id} onValueChange={onServicoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um servico" />
              </SelectTrigger>
              <SelectContent>
                {servicos.map((servico) => (
                  <SelectItem key={servico.id} value={servico.id}>
                    {servico.codigo} - {servico.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Item Lista de Servicos (LC 116) *</Label>
            <Select
              value={formData.item_lista_servico}
              onValueChange={(v) => onFormDataChange({ item_lista_servico: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITENS_LC116.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Discriminacao do Servico *</Label>
          <Textarea
            value={formData.discriminacao}
            onChange={(e) => onFormDataChange({ discriminacao: e.target.value })}
            placeholder="Descreva detalhadamente o servico prestado..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label>Data de Competencia</Label>
          <Input
            type="date"
            value={formData.data_competencia}
            onChange={(e) => onFormDataChange({ data_competencia: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  )
}
