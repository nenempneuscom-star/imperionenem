'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Percent, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ConfigDesconto {
  desconto_maximo_percentual: number;
  desconto_maximo_valor: number | null;
  motivo_obrigatorio: boolean;
  permitir_desconto_item: boolean;
  permitir_desconto_total: boolean;
  requer_autorizacao_acima_percentual: number | null;
  motivos_predefinidos: string[];
}

interface DiscountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ConfigDesconto | null;
  // Para desconto no total
  subtotal: number;
  onApplyDiscount: (valor: number, percentual: number, motivo: string) => void;
  // Para desconto por item
  item?: {
    id: string;
    nome: string;
    preco: number;
    quantidade: number;
  };
  onApplyItemDiscount?: (itemId: string, valor: number, percentual: number, motivo: string) => void;
}

export function DiscountModal({
  open,
  onOpenChange,
  config,
  subtotal,
  onApplyDiscount,
  item,
  onApplyItemDiscount,
}: DiscountModalProps) {
  const [tipo, setTipo] = useState<'percentual' | 'valor'>('percentual');
  const [valor, setValor] = useState('');
  const [motivo, setMotivo] = useState('');
  const [motivoCustom, setMotivoCustom] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isItemDiscount = !!item;
  const valorBase = isItemDiscount ? item.preco * item.quantidade : subtotal;

  // Calcular valor do desconto
  const valorDesconto =
    tipo === 'percentual'
      ? (valorBase * (parseFloat(valor) || 0)) / 100
      : parseFloat(valor) || 0;

  const percentualDesconto =
    tipo === 'valor'
      ? valorBase > 0 ? ((parseFloat(valor) || 0) / valorBase) * 100 : 0
      : parseFloat(valor) || 0;

  // Validacoes
  const maxPercentual = config?.desconto_maximo_percentual || 100;
  const maxValor = config?.desconto_maximo_valor || Infinity;
  const motivoObrigatorio = config?.motivo_obrigatorio ?? true;
  const motivoFinal = motivo === 'Outro' ? motivoCustom : motivo;

  const isExcedeLimite =
    percentualDesconto > maxPercentual ||
    (maxValor !== null && valorDesconto > maxValor);

  const isExcedeValorBase = valorDesconto > valorBase;

  const isMotivoValido = !motivoObrigatorio || motivoFinal.trim().length > 0;

  const canApply =
    valorDesconto > 0 &&
    !isExcedeLimite &&
    !isExcedeValorBase &&
    isMotivoValido;

  // Focus no input quando abrir
  useEffect(() => {
    if (open) {
      setValor('');
      setMotivo('');
      setMotivoCustom('');
      setTipo('percentual');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  function handleApply() {
    if (!canApply) return;

    if (isItemDiscount && onApplyItemDiscount) {
      onApplyItemDiscount(item.id, valorDesconto, percentualDesconto, motivoFinal);
    } else {
      onApplyDiscount(valorDesconto, percentualDesconto, motivoFinal);
    }

    toast.success(
      `Desconto de ${formatCurrency(valorDesconto)} (${percentualDesconto.toFixed(1)}%) aplicado`
    );
    onOpenChange(false);
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  // Verificar permissao
  if (isItemDiscount && !config?.permitir_desconto_item) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Desconto por Item Desabilitado
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            O desconto por item esta desabilitado nas configuracoes.
            Entre em contato com o administrador.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isItemDiscount && !config?.permitir_desconto_total) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Desconto no Total Desabilitado
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            O desconto no total da venda esta desabilitado nas configuracoes.
            Entre em contato com o administrador.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            {isItemDiscount ? 'Desconto no Item' : 'Desconto na Venda'}
          </DialogTitle>
          <DialogDescription>
            {isItemDiscount
              ? `Aplicar desconto em: ${item.nome}`
              : 'Aplicar desconto no total da venda'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tipo de desconto */}
          <div className="space-y-2">
            <Label>Tipo de Desconto</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={tipo === 'percentual' ? 'default' : 'outline'}
                onClick={() => setTipo('percentual')}
                className="flex-1"
              >
                <Percent className="h-4 w-4 mr-1" />
                Percentual
              </Button>
              <Button
                type="button"
                variant={tipo === 'valor' ? 'default' : 'outline'}
                onClick={() => setTipo('valor')}
                className="flex-1"
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Valor (R$)
              </Button>
            </div>
          </div>

          {/* Valor/Percentual */}
          <div className="space-y-2">
            <Label>{tipo === 'percentual' ? 'Percentual (%)' : 'Valor (R$)'}</Label>
            <div className="flex items-center gap-2">
              {tipo === 'valor' && <span className="text-muted-foreground">R$</span>}
              <Input
                ref={inputRef}
                type="number"
                min="0"
                step={tipo === 'percentual' ? '0.5' : '0.01'}
                max={tipo === 'percentual' ? maxPercentual : undefined}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder={tipo === 'percentual' ? '5' : '10,00'}
                className="text-lg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canApply) {
                    e.preventDefault();
                    handleApply();
                  }
                }}
              />
              {tipo === 'percentual' && <span className="text-muted-foreground">%</span>}
            </div>
            <p className="text-xs text-muted-foreground">
              Maximo permitido: {maxPercentual}%
              {maxValor !== null && maxValor !== Infinity && ` ou ${formatCurrency(maxValor)}`}
            </p>
          </div>

          {/* Preview */}
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <div className="flex justify-between text-sm">
              <span>{isItemDiscount ? 'Valor do item:' : 'Subtotal:'}</span>
              <span>{formatCurrency(valorBase)}</span>
            </div>
            <div className="flex justify-between text-sm text-destructive">
              <span>Desconto ({percentualDesconto.toFixed(1)}%):</span>
              <span>-{formatCurrency(valorDesconto)}</span>
            </div>
            <div className="flex justify-between font-bold pt-1 border-t">
              <span>{isItemDiscount ? 'Valor final:' : 'Total:'}</span>
              <span>{formatCurrency(Math.max(0, valorBase - valorDesconto))}</span>
            </div>
          </div>

          {/* Alertas */}
          {isExcedeLimite && (
            <div className="p-2 bg-destructive/10 text-destructive rounded text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Desconto excede o limite permitido
            </div>
          )}

          {isExcedeValorBase && (
            <div className="p-2 bg-destructive/10 text-destructive rounded text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Desconto nao pode ser maior que o valor
            </div>
          )}

          {/* Motivo */}
          <div className="space-y-2">
            <Label>
              Motivo do Desconto
              {motivoObrigatorio && <span className="text-destructive">*</span>}
            </Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo..." />
              </SelectTrigger>
              <SelectContent>
                {config?.motivos_predefinidos.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {motivo === 'Outro' && (
              <Input
                placeholder="Descreva o motivo..."
                value={motivoCustom}
                onChange={(e) => setMotivoCustom(e.target.value)}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={!canApply}>
            Aplicar Desconto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
