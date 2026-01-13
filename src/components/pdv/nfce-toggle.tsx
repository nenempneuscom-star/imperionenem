'use client'

import Link from 'next/link'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { FileText } from 'lucide-react'

interface NFCeToggleProps {
  emitirNFCe: boolean
  onEmitirNFCeChange: (emitir: boolean) => void
  fiscalConfigurado: boolean
  cpfCliente: string
  onCpfClienteChange: (cpf: string) => void
}

export function NFCeToggle({
  emitirNFCe,
  onEmitirNFCeChange,
  fiscalConfigurado,
  cpfCliente,
  onCpfClienteChange,
}: NFCeToggleProps) {
  return (
    <div className="p-3 border-t">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Emitir NFC-e</span>
        </div>
        <Switch
          checked={emitirNFCe}
          onCheckedChange={onEmitirNFCeChange}
          disabled={!fiscalConfigurado}
        />
      </div>
      {!fiscalConfigurado && (
        <Link href="/dashboard/fiscal/configuracoes" className="text-xs text-primary underline mt-1 block">
          Configurar certificado
        </Link>
      )}
      {emitirNFCe && fiscalConfigurado && (
        <Input
          placeholder="CPF na nota (opcional)"
          value={cpfCliente}
          onChange={(e) => onCpfClienteChange(e.target.value)}
          className="h-8 text-xs mt-2"
        />
      )}
    </div>
  )
}
