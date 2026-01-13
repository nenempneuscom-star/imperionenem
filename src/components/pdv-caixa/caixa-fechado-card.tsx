'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, LockOpen } from 'lucide-react'

interface CaixaFechadoCardProps {
  onAbrir: () => void
}

export function CaixaFechadoCard({ onAbrir }: CaixaFechadoCardProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Lock className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Caixa Fechado</h2>
        <p className="text-muted-foreground mb-6">
          Abra o caixa para iniciar as operações
        </p>
        <Button size="lg" onClick={onAbrir}>
          <LockOpen className="mr-2 h-5 w-5" />
          Abrir Caixa
        </Button>
      </CardContent>
    </Card>
  )
}
