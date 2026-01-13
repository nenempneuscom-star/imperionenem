'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'
import { formatDate, getStatusConfig } from './types'

interface ValidadeCardProps {
  dataValidade: string
  status: string
}

export function ValidadeCard({ dataValidade, status }: ValidadeCardProps) {
  const statusConfig = getStatusConfig(status)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Validade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Valido ate</p>
          <p className="text-xl font-bold">{formatDate(dataValidade)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <div className="mt-1">
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
