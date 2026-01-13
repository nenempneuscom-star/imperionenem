'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Keyboard, Scan } from 'lucide-react'

interface HelpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scannerEnabled: boolean
  showFidelidade: boolean
}

export function HelpModal({
  open,
  onOpenChange,
  scannerEnabled,
  showFidelidade,
}: HelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atalhos e Scanner
          </DialogTitle>
          <DialogDescription>
            Use os atalhos e o scanner para agilizar suas vendas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scanner info */}
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Scan className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-700">Leitor de Codigo de Barras</span>
              <Badge variant={scannerEnabled ? 'default' : 'secondary'} className={scannerEnabled ? 'bg-green-500' : ''}>
                {scannerEnabled ? 'Ativo' : 'Desativado'}
              </Badge>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Scanner USB funciona automaticamente</li>
              <li>• Produto e adicionado ao escanear</li>
              <li>• Beep sonoro confirma a leitura</li>
              <li>• Borda verde indica deteccao do scanner</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 p-2 rounded bg-muted">
              <kbd className="px-2 py-1 bg-background border rounded text-xs font-mono">F1</kbd>
              <span>Esta ajuda</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-muted">
              <kbd className="px-2 py-1 bg-background border rounded text-xs font-mono">F2</kbd>
              <span>Buscar produto</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-muted">
              <kbd className="px-2 py-1 bg-background border rounded text-xs font-mono">F3</kbd>
              <span>Novo cliente</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-muted">
              <kbd className="px-2 py-1 bg-background border rounded text-xs font-mono">F4</kbd>
              <span>Confirmar venda</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-muted">
              <kbd className="px-2 py-1 bg-background border rounded text-xs font-mono">F5</kbd>
              <span>Limpar carrinho</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-muted">
              <kbd className="px-2 py-1 bg-background border rounded text-xs font-mono">F6</kbd>
              <span>Pagar Dinheiro</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-muted">
              <kbd className="px-2 py-1 bg-background border rounded text-xs font-mono">F7</kbd>
              <span>Pagar Credito</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-muted">
              <kbd className="px-2 py-1 bg-background border rounded text-xs font-mono">F8</kbd>
              <span>Pagar Debito</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-muted">
              <kbd className="px-2 py-1 bg-background border rounded text-xs font-mono">F9</kbd>
              <span>Pagar PIX</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-muted">
              <kbd className="px-2 py-1 bg-background border rounded text-xs font-mono">F10</kbd>
              <span>Crediario</span>
            </div>
            {showFidelidade && (
              <div className="flex items-center gap-2 p-2 rounded bg-muted">
                <kbd className="px-2 py-1 bg-background border rounded text-xs font-mono">F11</kbd>
                <span>Fidelidade</span>
              </div>
            )}
            <div className="flex items-center gap-2 p-2 rounded bg-muted">
              <kbd className="px-2 py-1 bg-background border rounded text-xs font-mono">F12</kbd>
              <span>Abrir/Fechar Caixa</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-muted">
              <kbd className="px-2 py-1 bg-background border rounded text-xs font-mono">Ctrl+D</kbd>
              <span>Aplicar Desconto</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-muted">
              <kbd className="px-2 py-1 bg-background border rounded text-xs font-mono">ESC</kbd>
              <span>Fechar modal / Cancelar</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
