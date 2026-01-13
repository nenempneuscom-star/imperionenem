'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Car, Plus, Loader2 } from 'lucide-react'
import { type Veiculo, type Cliente } from './types'
import { toast } from 'sonner'

interface VehicleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente: Cliente | null
  veiculos: Veiculo[]
  loading: boolean
  onSelectVehicle: (veiculo: Veiculo | null) => void
  onRefreshVeiculos: () => void
}

export function VehicleModal({
  open,
  onOpenChange,
  cliente,
  veiculos,
  loading,
  onSelectVehicle,
  onRefreshVeiculos,
}: VehicleModalProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    ano: '',
    placa: '',
    cor: '',
  })

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setShowAddForm(false)
      setFormData({ marca: '', modelo: '', ano: '', placa: '', cor: '' })
    }
  }, [open])

  async function handleAddVehicle() {
    if (!cliente) return
    if (!formData.marca || !formData.modelo) {
      toast.error('Marca e modelo sao obrigatorios')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/veiculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: cliente.id,
          marca: formData.marca,
          modelo: formData.modelo,
          ano: formData.ano || null,
          placa: formData.placa || null,
          cor: formData.cor || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao adicionar veiculo')
      }

      const novoVeiculo = await response.json()
      toast.success('Veiculo adicionado!')
      setShowAddForm(false)
      setFormData({ marca: '', modelo: '', ano: '', placa: '', cor: '' })
      onRefreshVeiculos()
      onSelectVehicle(novoVeiculo)
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar veiculo')
    } finally {
      setSaving(false)
    }
  }

  function formatPlaca(value: string): string {
    // Remove tudo que não é letra ou número
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    // Formato Mercosul: ABC1D23 ou antigo: ABC-1234
    if (clean.length <= 3) return clean
    if (clean.length <= 7) {
      // Check if it's Mercosul pattern (letter at position 5)
      if (clean.length > 4 && /[A-Z]/.test(clean[4])) {
        return clean // Mercosul without dash
      }
      return `${clean.slice(0, 3)}-${clean.slice(3)}`
    }
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`
  }

  if (!cliente) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Selecionar Veiculo
          </DialogTitle>
          <DialogDescription>
            Veiculos de {cliente.nome}
          </DialogDescription>
        </DialogHeader>

        {showAddForm ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marca">Marca *</Label>
                <Input
                  id="marca"
                  placeholder="Ex: Fiat, VW, Honda"
                  value={formData.marca}
                  onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo *</Label>
                <Input
                  id="modelo"
                  placeholder="Ex: Uno, Gol, Civic"
                  value={formData.modelo}
                  onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
                  disabled={saving}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ano">Ano</Label>
                <Input
                  id="ano"
                  placeholder="2024"
                  type="number"
                  min="1900"
                  max="2030"
                  value={formData.ano}
                  onChange={(e) => setFormData(prev => ({ ...prev, ano: e.target.value }))}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="placa">Placa</Label>
                <Input
                  id="placa"
                  placeholder="ABC-1234"
                  value={formData.placa}
                  onChange={(e) => setFormData(prev => ({ ...prev, placa: formatPlaca(e.target.value) }))}
                  maxLength={8}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cor">Cor</Label>
                <Input
                  id="cor"
                  placeholder="Prata"
                  value={formData.cor}
                  onChange={(e) => setFormData(prev => ({ ...prev, cor: e.target.value }))}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddVehicle} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Adicionar Veiculo'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Botão para adicionar veículo */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Novo Veiculo
            </Button>

            {/* Lista de veículos */}
            <ScrollArea className="h-64">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : veiculos.length > 0 ? (
                <div className="space-y-2">
                  {veiculos.map((veiculo) => (
                    <button
                      key={veiculo.id}
                      className="w-full p-3 rounded-lg border text-left hover:bg-muted transition-colors"
                      onClick={() => {
                        onSelectVehicle(veiculo)
                        onOpenChange(false)
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Car className="h-8 w-8 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">
                            {veiculo.marca} {veiculo.modelo}
                            {veiculo.ano && <span className="text-muted-foreground ml-1">({veiculo.ano})</span>}
                          </p>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            {veiculo.placa && <span>Placa: {veiculo.placa}</span>}
                            {veiculo.cor && <span>Cor: {veiculo.cor}</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Car className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Nenhum veiculo cadastrado</p>
                  <p className="text-sm">Adicione um veiculo para este cliente</p>
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              onSelectVehicle(null)
              onOpenChange(false)
            }}
          >
            Continuar sem veiculo
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
