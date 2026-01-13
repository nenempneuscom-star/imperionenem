'use client'

import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'

interface FormActionsProps {
  loading: boolean
  onCancel: () => void
}

export function FormActions({ loading, onCancel }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Gerando...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Gerar RPS
          </>
        )}
      </Button>
    </div>
  )
}
