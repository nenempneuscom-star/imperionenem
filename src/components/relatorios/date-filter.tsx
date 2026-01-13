'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Search, Download } from 'lucide-react'

interface DateFilterProps {
  dataInicio: string
  dataFim: string
  onDataInicioChange: (value: string) => void
  onDataFimChange: (value: string) => void
  onBuscar: () => void
  loading: boolean
  onExportar?: () => void
  showExportar?: boolean
}

export function DateFilter({
  dataInicio,
  dataFim,
  onDataInicioChange,
  onDataFimChange,
  onBuscar,
  loading,
  onExportar,
  showExportar = false,
}: DateFilterProps) {
  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="space-y-2">
        <Label>Data Inicio</Label>
        <Input
          type="date"
          value={dataInicio}
          onChange={(e) => onDataInicioChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Data Fim</Label>
        <Input
          type="date"
          value={dataFim}
          onChange={(e) => onDataFimChange(e.target.value)}
        />
      </div>
      <Button onClick={onBuscar} disabled={loading}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Search className="mr-2 h-4 w-4" />
        )}
        Gerar Relatorio
      </Button>
      {showExportar && onExportar && (
        <Button variant="outline" onClick={onExportar}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
      )}
    </div>
  )
}
