'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, TrendingUp } from 'lucide-react'
import {
  type NFSeFormData,
  calcularBaseCalculo,
  calcularValorIss,
  calcularValorIbs,
  calcularValorCbs,
  calcularTotalRetencoes,
  calcularTotalTributos,
  calcularValorLiquido,
  ALIQUOTA_IBS_PADRAO,
  ALIQUOTA_CBS_PADRAO,
} from './types'

interface ValoresCardProps {
  formData: NFSeFormData
  onFormDataChange: (data: Partial<NFSeFormData>) => void
}

export function ValoresCard({ formData, onFormDataChange }: ValoresCardProps) {
  const baseCalculo = calcularBaseCalculo(formData)
  const valorIss = calcularValorIss(formData)
  const valorIbs = calcularValorIbs(formData)
  const valorCbs = calcularValorCbs(formData)
  const totalRetencoes = calcularTotalRetencoes(formData)
  const totalTributos = calcularTotalTributos(formData)
  const valorLiquido = calcularValorLiquido(formData)

  // Calculo da carga tributaria total (para transparencia fiscal)
  const cargaTributariaPercent = baseCalculo > 0
    ? ((totalTributos / baseCalculo) * 100).toFixed(2)
    : '0.00'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Valores e Tributos</CardTitle>
            <CardDescription>Valores do servico, ISS e IBS/CBS (Reforma Tributaria 2026)</CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Carga: {cargaTributariaPercent}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Valores do Servico */}
        <div>
          <h4 className="text-sm font-medium mb-3">Valores do Servico</h4>
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
              <Label>Desconto Incondicionado (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.desconto_incondicionado}
                onChange={(e) => onFormDataChange({ desconto_incondicionado: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* ISS - Imposto Sobre Servicos */}
        <div>
          <h4 className="text-sm font-medium mb-3">ISS - Imposto Sobre Servicos</h4>
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
            <div className="space-y-2">
              <Label>Valor ISS</Label>
              <Input
                type="text"
                value={`R$ ${valorIss.toFixed(2)}`}
                disabled
                className="bg-muted"
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
        </div>

        <Separator />

        {/* IBS/CBS - Reforma Tributaria 2026 */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              IBS/CBS - Reforma Tributaria 2026
            </h4>
            <Badge variant="secondary" className="text-xs">Novo</Badge>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300 mb-4">
            Novos tributos conforme Emenda Constitucional 132/2023. O IBS substitui ICMS/ISS e o CBS substitui PIS/COFINS.
          </p>

          <div className="grid grid-cols-2 gap-6">
            {/* IBS */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium">IBS (Estado/Municipio)</h5>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Aliquota (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.aliquota_ibs}
                    onChange={(e) => onFormDataChange({ aliquota_ibs: parseFloat(e.target.value) || ALIQUOTA_IBS_PADRAO })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Valor IBS</Label>
                  <Input
                    type="text"
                    value={`R$ ${valorIbs.toFixed(2)}`}
                    disabled
                    className="bg-white dark:bg-gray-900"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ibs_retido"
                  checked={formData.ibs_retido}
                  onCheckedChange={(checked) => onFormDataChange({ ibs_retido: checked })}
                />
                <Label htmlFor="ibs_retido" className="text-xs">IBS Retido</Label>
              </div>
            </div>

            {/* CBS */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium">CBS (Federal)</h5>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Aliquota (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.aliquota_cbs}
                    onChange={(e) => onFormDataChange({ aliquota_cbs: parseFloat(e.target.value) || ALIQUOTA_CBS_PADRAO })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Valor CBS</Label>
                  <Input
                    type="text"
                    value={`R$ ${valorCbs.toFixed(2)}`}
                    disabled
                    className="bg-white dark:bg-gray-900"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="cbs_retido"
                  checked={formData.cbs_retido}
                  onCheckedChange={(checked) => onFormDataChange({ cbs_retido: checked })}
                />
                <Label htmlFor="cbs_retido" className="text-xs">CBS Retido</Label>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Retencoes Federais */}
        <div>
          <h4 className="text-sm font-medium mb-3">Retencoes Federais</h4>
          <div className="grid grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">PIS (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.valor_pis}
                onChange={(e) => onFormDataChange({ valor_pis: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">COFINS (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.valor_cofins}
                onChange={(e) => onFormDataChange({ valor_cofins: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">INSS (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.valor_inss}
                onChange={(e) => onFormDataChange({ valor_inss: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">IR (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.valor_ir}
                onChange={(e) => onFormDataChange({ valor_ir: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">CSLL (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.valor_csll}
                onChange={(e) => onFormDataChange({ valor_csll: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Resumo */}
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>Base de Calculo:</span>
            <span className="font-medium">R$ {baseCalculo.toFixed(2)}</span>
          </div>

          <Separator className="my-2" />

          <div className="flex justify-between text-sm">
            <span>ISS ({formData.aliquota_iss}%):</span>
            <span className="font-medium">R$ {valorIss.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
            <span>IBS ({formData.aliquota_ibs}%):</span>
            <span className="font-medium">R$ {valorIbs.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
            <span>CBS ({formData.aliquota_cbs}%):</span>
            <span className="font-medium">R$ {valorCbs.toFixed(2)}</span>
          </div>

          <Separator className="my-2" />

          <div className="flex justify-between text-sm">
            <span>Total Tributos:</span>
            <span className="font-medium">R$ {totalTributos.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Retencoes:</span>
            <span className="font-medium text-orange-600">R$ {totalRetencoes.toFixed(2)}</span>
          </div>

          <Separator className="my-2" />

          <div className="flex justify-between text-lg">
            <span className="font-bold">Valor Liquido:</span>
            <span className="font-bold text-primary">R$ {valorLiquido.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
