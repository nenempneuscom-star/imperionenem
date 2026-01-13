'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText } from 'lucide-react'

interface ObservacoesCardProps {
  observacoes: string
  onObservacoesChange: (value: string) => void
  condicoes: string
  onCondicoesChange: (value: string) => void
}

export function ObservacoesCard({
  observacoes,
  onObservacoesChange,
  condicoes,
  onCondicoesChange,
}: ObservacoesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Observacoes e Condicoes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Observacoes</Label>
          <Textarea
            placeholder="Observacoes gerais do orcamento..."
            value={observacoes}
            onChange={(e) => onObservacoesChange(e.target.value)}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Condicoes de Pagamento/Entrega</Label>
          <Textarea
            placeholder="Ex: Pagamento a vista com 5% de desconto. Entrega em ate 3 dias uteis..."
            value={condicoes}
            onChange={(e) => onCondicoesChange(e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  )
}
