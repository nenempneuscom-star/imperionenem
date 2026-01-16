'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type FormDataConfiguracoes, regimesTributarios, ambientes } from './types'

interface FiscalTabProps {
  formData: FormDataConfiguracoes
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  saving: boolean
}

export function FiscalTab({
  formData,
  onChange,
  saving,
}: FiscalTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuracoes Fiscais</CardTitle>
          <CardDescription>
            Parametros para emissao de notas fiscais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="regime_tributario">Regime Tributario</Label>
              <select
                id="regime_tributario"
                name="regime_tributario"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.regime_tributario}
                onChange={onChange}
                disabled={saving}
              >
                {regimesTributarios.map((regime) => (
                  <option key={regime.value} value={regime.value}>
                    {regime.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ambiente">Ambiente</Label>
              <select
                id="ambiente"
                name="ambiente"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.ambiente}
                onChange={onChange}
                disabled={saving}
              >
                {ambientes.map((amb) => (
                  <option key={amb.value} value={amb.value}>
                    {amb.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>NFC-e (Cupom Fiscal)</CardTitle>
          <CardDescription>
            Configuracoes da Nota Fiscal de Consumidor Eletronica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serie_nfce">Serie</Label>
            <Input
              id="serie_nfce"
              name="serie_nfce"
              type="number"
              min="1"
              value={formData.serie_nfce}
              onChange={onChange}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              Para configurar numeracao e CSC, acesse Fiscal &gt; Configuracoes
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>NF-e (Nota Fiscal)</CardTitle>
          <CardDescription>
            Configuracoes da Nota Fiscal Eletronica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="serie_nfe">Serie</Label>
              <Input
                id="serie_nfe"
                name="serie_nfe"
                type="number"
                min="1"
                value={formData.serie_nfe}
                onChange={onChange}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero_nfe">Proximo Numero</Label>
              <Input
                id="numero_nfe"
                name="numero_nfe"
                type="number"
                min="1"
                value={formData.numero_nfe}
                onChange={onChange}
                disabled={saving}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>PIX</CardTitle>
          <CardDescription>
            Chave PIX para exibir QR Code no PDV
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chave_pix">Chave PIX</Label>
            <Input
              id="chave_pix"
              name="chave_pix"
              placeholder="CPF, CNPJ, Email, Telefone ou Chave Aleatoria"
              value={formData.chave_pix}
              onChange={onChange}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              A chave PIX sera usada para gerar o QR Code de pagamento no PDV
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
