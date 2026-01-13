'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type FormDataFiscal } from '../types'

interface NFeTabProps {
  formData: FormDataFiscal
  saving: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export function NFeTab({
  formData,
  saving,
  onChange,
}: NFeTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuracoes NF-e</CardTitle>
        <CardDescription>
          Parametros para emissao de Nota Fiscal Eletronica (Modelo 55)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="serie_nfe">Serie</Label>
            <Input
              id="serie_nfe"
              name="serie_nfe"
              type="number"
              min="1"
              placeholder="1"
              value={formData.serie_nfe}
              onChange={onChange}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ultimo_numero_nfe">Ultimo Numero</Label>
            <Input
              id="ultimo_numero_nfe"
              name="ultimo_numero_nfe"
              type="number"
              min="0"
              placeholder="0"
              value={formData.ultimo_numero_nfe}
              onChange={onChange}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              A proxima NF-e sera: {(parseInt(formData.ultimo_numero_nfe) || 0) + 1}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cfop_venda_nfe">CFOP Venda</Label>
            <select
              id="cfop_venda_nfe"
              name="cfop_venda_nfe"
              value={formData.cfop_venda_nfe}
              onChange={onChange}
              disabled={saving}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="5102">5102 - Venda merc. adq. terceiros</option>
              <option value="5101">5101 - Venda prod. estabelecimento</option>
              <option value="5405">5405 - Venda merc. ST</option>
              <option value="6102">6102 - Venda interestadual</option>
              <option value="6101">6101 - Venda interestadual (producao)</option>
            </select>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Importante:</strong> A numeracao e sequencial e nao pode ter lacunas.
            Antes de alterar, certifique-se de que os numeros anteriores foram utilizados ou inutilizados.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
