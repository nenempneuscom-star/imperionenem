'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2, Save } from 'lucide-react'
import { type FidelidadeConfig, formatCurrency, formatPontos } from './types'

interface ConfigTabProps {
  config: FidelidadeConfig | null
  saving: boolean
  onConfigChange: (config: FidelidadeConfig | null) => void
  onSave: () => void
}

export function ConfigTab({
  config,
  saving,
  onConfigChange,
  onSave,
}: ConfigTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuracoes do Programa</CardTitle>
        <CardDescription>
          Defina as regras de acumulo e resgate de pontos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ativar/Desativar */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label className="text-base">Programa Ativo</Label>
            <p className="text-sm text-muted-foreground">
              Quando ativo, os clientes acumulam pontos automaticamente
            </p>
          </div>
          <Switch
            checked={config?.ativo || false}
            onCheckedChange={(checked) => onConfigChange(config ? { ...config, ativo: checked } : null)}
          />
        </div>

        {/* Pontos por real */}
        <div className="space-y-2">
          <Label>Pontos por Real Gasto</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.1"
              min="0.1"
              className="w-32"
              value={config?.pontos_por_real || ''}
              onChange={(e) => onConfigChange(config ? { ...config, pontos_por_real: parseFloat(e.target.value) || 0 } : null)}
            />
            <span className="text-muted-foreground">pontos a cada R$ 1,00 gasto</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Exemplo: Se configurado 1, uma compra de R$ 100 gera 100 pontos
          </p>
        </div>

        {/* Valor do ponto */}
        <div className="space-y-2">
          <Label>Valor do Ponto no Resgate</Label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">R$</span>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              className="w-32"
              value={config?.valor_ponto_resgate || ''}
              onChange={(e) => onConfigChange(config ? { ...config, valor_ponto_resgate: parseFloat(e.target.value) || 0 } : null)}
            />
            <span className="text-muted-foreground">por ponto</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Exemplo: Se configurado R$ 0,10, 100 pontos valem R$ 10,00 de desconto
          </p>
        </div>

        {/* Validade */}
        <div className="space-y-2">
          <Label>Validade dos Pontos</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              className="w-32"
              value={config?.validade_dias || ''}
              onChange={(e) => onConfigChange(config ? { ...config, validade_dias: parseInt(e.target.value) || 0 } : null)}
            />
            <span className="text-muted-foreground">dias (0 = nao expira)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Pontos expiram apos este periodo desde o acumulo
          </p>
        </div>

        {/* Simulacao */}
        {config && config.pontos_por_real > 0 && config.valor_ponto_resgate > 0 && (
          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-medium mb-2">Simulacao</h4>
            <div className="space-y-1 text-sm">
              <p>
                Compra de <strong>R$ 100,00</strong> → <strong>{formatPontos(100 * config.pontos_por_real)} pontos</strong>
              </p>
              <p>
                {formatPontos(100 * config.pontos_por_real)} pontos → <strong>{formatCurrency(100 * config.pontos_por_real * config.valor_ponto_resgate)}</strong> de desconto
              </p>
              <p className="text-muted-foreground">
                Retorno efetivo: {((config.pontos_por_real * config.valor_ponto_resgate) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        <Button onClick={onSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configuracoes
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
