'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type FormDataFiscal } from '../types'

interface NFCeTabProps {
  formData: FormDataFiscal
  saving: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export function NFCeTab({
  formData,
  saving,
  onChange,
}: NFCeTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuracoes NFC-e</CardTitle>
        <CardDescription>
          Parametros para emissao de Nota Fiscal de Consumidor Eletronica (Modelo 65)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="serie_nfce">Serie</Label>
            <Input
              id="serie_nfce"
              name="serie_nfce"
              type="number"
              min="1"
              placeholder="1"
              value={formData.serie_nfce}
              onChange={onChange}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ultimo_numero_nfce">Ultimo Numero</Label>
            <Input
              id="ultimo_numero_nfce"
              name="ultimo_numero_nfce"
              type="number"
              min="0"
              placeholder="0"
              value={formData.ultimo_numero_nfce}
              onChange={onChange}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              A proxima NFC-e sera: {(parseInt(formData.ultimo_numero_nfce) || 0) + 1}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cfop_venda">CFOP Venda</Label>
            <select
              id="cfop_venda"
              name="cfop_venda"
              value={formData.cfop_venda}
              onChange={onChange}
              disabled={saving}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="5102">5102 - Venda merc. adq. terceiros</option>
              <option value="5101">5101 - Venda prod. estabelecimento</option>
              <option value="5405">5405 - Venda merc. ST</option>
            </select>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-4">CSC (Codigo de Seguranca do Contribuinte)</h4>
          <p className="text-sm text-muted-foreground mb-4">
            O CSC e obtido no portal da SEFAZ do seu estado e e obrigatorio para NFC-e
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="id_token_nfce">ID do Token</Label>
              <Input
                id="id_token_nfce"
                name="id_token_nfce"
                type="number"
                min="1"
                placeholder="1"
                value={formData.id_token_nfce}
                onChange={onChange}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="csc_nfce">CSC (Token)</Label>
              <Input
                id="csc_nfce"
                name="csc_nfce"
                type="password"
                placeholder="Codigo de Seguranca"
                value={formData.csc_nfce}
                onChange={onChange}
                disabled={saving}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
