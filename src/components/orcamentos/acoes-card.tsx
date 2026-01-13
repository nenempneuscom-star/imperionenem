'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, ShoppingCart } from 'lucide-react'

interface AcoesCardProps {
  status: string
  onAprovar: () => void
  onRejeitar: () => void
  onConverter: () => void
}

export function AcoesCard({
  status,
  onAprovar,
  onRejeitar,
  onConverter,
}: AcoesCardProps) {
  if (status === 'convertido') return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acoes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {status === 'pendente' && (
          <>
            <Button className="w-full" variant="outline" onClick={onAprovar}>
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Aprovar
            </Button>
            <Button className="w-full" variant="outline" onClick={onRejeitar}>
              <XCircle className="h-4 w-4 mr-2 text-red-600" />
              Rejeitar
            </Button>
          </>
        )}
        {(status === 'pendente' || status === 'aprovado') && (
          <Button className="w-full" onClick={onConverter}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Converter em Venda
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
