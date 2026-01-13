'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Save, Loader2 } from 'lucide-react'
import { formatCurrency } from './types'

interface ResumoCardProps {
  validadeDias: number
  onValidadeChange: (value: number) => void
  subtotal: number
  desconto: number
  onDescontoChange: (value: number) => void
  total: number
  itensCount: number
  saving: boolean
  onSalvar: () => void
  disabled?: boolean
}

export function ResumoCard({
  validadeDias,
  onValidadeChange,
  subtotal,
  desconto,
  onDescontoChange,
  total,
  itensCount,
  saving,
  onSalvar,
  disabled = false,
}: ResumoCardProps) {
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Resumo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Validade (dias)</Label>
          <Input
            type="number"
            min="1"
            value={validadeDias}
            onChange={(e) => onValidadeChange(parseInt(e.target.value) || 7)}
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Desconto</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={desconto}
              onChange={(e) => onDescontoChange(parseFloat(e.target.value) || 0)}
              className="w-28 text-right"
            />
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <Separator />

        <div className="text-sm text-muted-foreground">
          <p>{itensCount} item(s)</p>
          <p>Valido por {validadeDias} dias</p>
        </div>

        <Button className="w-full" onClick={onSalvar} disabled={saving || disabled}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Orcamento
        </Button>
      </CardContent>
    </Card>
  )
}
