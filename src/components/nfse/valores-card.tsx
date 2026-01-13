'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  type NFSeFormData,
  calcularBaseCalculo,
  calcularValorIss,
  calcularTotalRetencoes,
  calcularValorLiquido,
} from './types'

interface ValoresCardProps {
  formData: NFSeFormData
  onFormDataChange: (data: Partial<NFSeFormData>) => void
}

export function ValoresCard({ formData, onFormDataChange }: ValoresCardProps) {
  const baseCalculo = calcularBaseCalculo(formData)
  const valorIss = calcularValorIss(formData)
  const totalRetencoes = calcularTotalRetencoes(formData)
  const valorLiquido = calcularValorLiquido(formData)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Valores</CardTitle>
        <CardDescription>Valores do servico e impostos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Valor do Servico (R$) *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.valor_servicos}
              onChange={(e) => onFormDataChange({ valor_servicos: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Deducoes (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.valor_deducoes}
              onChange={(e) => onFormDataChange({ valor_deducoes: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Desconto (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.desconto_incondicionado}
              onChange={(e) => onFormDataChange({ desconto_incondicionado: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Aliquota ISS (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.aliquota_iss}
              onChange={(e) => onFormDataChange({ aliquota_iss: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2 flex items-end pb-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="iss_retido"
                checked={formData.iss_retido}
                onCheckedChange={(checked) => onFormDataChange({ iss_retido: checked })}
              />
              <Label htmlFor="iss_retido">ISS Retido na Fonte</Label>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label>PIS (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.valor_pis}
              onChange={(e) => onFormDataChange({ valor_pis: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>COFINS (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.valor_cofins}
              onChange={(e) => onFormDataChange({ valor_cofins: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>INSS (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.valor_inss}
              onChange={(e) => onFormDataChange({ valor_inss: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>IR (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.valor_ir}
              onChange={(e) => onFormDataChange({ valor_ir: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>CSLL (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.valor_csll}
              onChange={(e) => onFormDataChange({ valor_csll: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <Separator />

        {/* Resumo */}
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span>Base de Calculo:</span>
            <span className="font-medium">R$ {baseCalculo.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>ISS ({formData.aliquota_iss}%):</span>
            <span className="font-medium">R$ {valorIss.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Retencoes:</span>
            <span className="font-medium">R$ {totalRetencoes.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg">
            <span className="font-bold">Valor Liquido:</span>
            <span className="font-bold text-primary">R$ {valorLiquido.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
