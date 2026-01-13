'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { type Empresa, type FormDataFiscal } from '../types'

interface GeralTabProps {
  formData: FormDataFiscal
  empresa: Empresa | null
  saving: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export function GeralTab({
  formData,
  empresa,
  saving,
  onChange,
}: GeralTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuracoes Gerais</CardTitle>
        <CardDescription>
          Regime tributario e ambiente de emissao
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="crt">Regime Tributario (CRT)</Label>
            <select
              id="crt"
              name="crt"
              value={formData.crt}
              onChange={onChange}
              disabled={saving}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="1">1 - Simples Nacional</option>
              <option value="2">2 - Simples Nacional - Excesso sublimite</option>
              <option value="3">3 - Regime Normal</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ambiente">Ambiente de Emissao</Label>
            <select
              id="ambiente"
              name="ambiente"
              value={formData.ambiente}
              onChange={onChange}
              disabled={saving}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="2">2 - Homologacao (Testes)</option>
              <option value="1">1 - Producao</option>
            </select>
          </div>
        </div>

        {formData.ambiente === '2' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Ambiente de Homologacao
              </p>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              As notas emitidas em homologacao nao possuem validade fiscal. Use apenas para testes.
            </p>
          </div>
        )}

        {formData.ambiente === '1' && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="font-medium text-green-800 dark:text-green-200">
                Ambiente de Producao
              </p>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              As notas terao validade fiscal e serao transmitidas oficialmente para a SEFAZ.
            </p>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Dados da Empresa</h4>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Razao Social:</span>
              <span className="font-medium">{empresa?.razao_social || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CNPJ:</span>
              <span className="font-mono">{empresa?.cnpj || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inscricao Estadual:</span>
              <span className="font-mono">{empresa?.inscricao_estadual || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">UF:</span>
              <span>{empresa?.endereco?.uf || 'SC'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
