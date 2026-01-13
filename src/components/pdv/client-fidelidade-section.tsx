'use client'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Users, Star } from 'lucide-react'
import {
  type Cliente,
  type FidelidadeConfig,
  type ClientePontos,
  formatCurrency,
} from './types'

interface ClientFidelidadeSectionProps {
  fidelidadeConfig: FidelidadeConfig | null
  selectedPayment: string | null
  clienteSelecionado: Cliente | null
  clientePontos: ClientePontos | null
  usarPontos: boolean
  onUsarPontosChange: (usar: boolean, pontosDisponiveis: number) => void
  onShowClienteModal: () => void
}

export function ClientFidelidadeSection({
  fidelidadeConfig,
  selectedPayment,
  clienteSelecionado,
  clientePontos,
  usarPontos,
  onUsarPontosChange,
  onShowClienteModal,
}: ClientFidelidadeSectionProps) {
  const shouldShow = fidelidadeConfig || selectedPayment === 'crediario'

  if (!shouldShow) return null

  return (
    <div className="p-3 border-b">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Cliente
        </span>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onShowClienteModal}>
          {clienteSelecionado ? 'Trocar' : 'Selecionar'}
        </Button>
      </div>
      {clienteSelecionado ? (
        <div className="bg-muted/50 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{clienteSelecionado.nome}</p>
              <p className="text-xs text-muted-foreground">{clienteSelecionado.cpf_cnpj}</p>
            </div>
            {fidelidadeConfig && (
              <div className="text-right">
                <div className="flex items-center gap-1 text-amber-600">
                  <Star className="h-3 w-3" />
                  <span className="font-bold text-sm">{(clientePontos?.saldo_pontos || 0).toLocaleString('pt-BR')}</span>
                </div>
                {clientePontos && clientePontos.saldo_pontos > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Switch
                      id="usar-pontos-split"
                      checked={usarPontos}
                      onCheckedChange={(checked) => {
                        onUsarPontosChange(checked, clientePontos.saldo_pontos)
                      }}
                      className="scale-75"
                    />
                    <Label htmlFor="usar-pontos-split" className="text-xs">Usar pts</Label>
                  </div>
                )}
              </div>
            )}
          </div>
          {selectedPayment === 'crediario' && (
            <div className="mt-2 pt-2 border-t flex justify-between text-xs">
              <span>Credito disponivel:</span>
              <span className="font-bold text-green-600">
                {formatCurrency(clienteSelecionado.limite_credito - clienteSelecionado.saldo_devedor)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Identifique para usar pontos ou crediario</p>
      )}
    </div>
  )
}
