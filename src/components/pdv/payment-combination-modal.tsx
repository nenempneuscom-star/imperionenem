'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CreditCard,
  DollarSign,
  QrCode,
  Users,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

interface Cliente {
  id: string;
  nome: string;
  cpf_cnpj: string;
  telefone?: string;
  limite_credito: number;
  saldo_devedor: number;
}

interface PaymentEntry {
  id: string;
  forma: string;
  valor: number;
  label: string;
}

interface PaymentCombinationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  clienteSelecionado: Cliente | null;
  onConfirm: (pagamentos: { forma: string; valor: number }[], valorRecebidoDinheiro?: number) => void;
  onSelectCliente: () => void;
}

const PAYMENT_METHODS = [
  { id: 'dinheiro', label: 'Dinheiro', icon: DollarSign, color: 'bg-green-500' },
  { id: 'cartao_credito', label: 'Crédito', icon: CreditCard, color: 'bg-blue-500' },
  { id: 'cartao_debito', label: 'Débito', icon: CreditCard, color: 'bg-indigo-500' },
  { id: 'pix', label: 'PIX', icon: QrCode, color: 'bg-teal-500' },
  { id: 'crediario', label: 'Fiado', icon: Users, color: 'bg-orange-500' },
];

export function PaymentCombinationModal({
  open,
  onOpenChange,
  total,
  clienteSelecionado,
  onConfirm,
  onSelectCliente,
}: PaymentCombinationModalProps) {
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [valorInput, setValorInput] = useState('');
  const [valorRecebidoDinheiro, setValorRecebidoDinheiro] = useState('');

  // Calcular totais
  const totalPagamentos = payments.reduce((acc, p) => acc + p.valor, 0);
  const restante = total - totalPagamentos;
  const isComplete = Math.abs(restante) < 0.01;

  // Verificar se tem dinheiro nos pagamentos
  const temDinheiro = payments.some(p => p.forma === 'dinheiro');
  const valorDinheiro = payments.find(p => p.forma === 'dinheiro')?.valor || 0;

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setPayments([]);
      setSelectedMethod(null);
      setValorInput('');
      setValorRecebidoDinheiro('');
    }
  }, [open]);

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  function addPayment() {
    if (!selectedMethod) {
      toast.error('Selecione uma forma de pagamento');
      return;
    }

    const valor = parseFloat(valorInput) || 0;
    if (valor <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    if (valor > restante + 0.01) {
      toast.error('Valor excede o restante');
      return;
    }

    // Validar crediário
    if (selectedMethod === 'crediario') {
      if (!clienteSelecionado) {
        toast.error('Selecione um cliente para usar crediário');
        onSelectCliente();
        return;
      }
      const creditoDisponivel = clienteSelecionado.limite_credito - clienteSelecionado.saldo_devedor;
      if (valor > creditoDisponivel) {
        toast.error(`Crédito insuficiente. Disponível: ${formatCurrency(creditoDisponivel)}`);
        return;
      }
    }

    const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);

    setPayments([
      ...payments,
      {
        id: `${selectedMethod}-${Date.now()}`,
        forma: selectedMethod,
        valor,
        label: method?.label || selectedMethod,
      },
    ]);

    setSelectedMethod(null);
    setValorInput('');
  }

  function removePayment(id: string) {
    setPayments(payments.filter(p => p.id !== id));
  }

  function handleConfirm() {
    if (!isComplete) {
      toast.error('Complete o valor total da venda');
      return;
    }

    const pagamentos = payments.map(p => ({
      forma: p.forma,
      valor: p.valor,
    }));

    // Se tiver dinheiro, passar o valor recebido
    const valorRecebido = temDinheiro ? parseFloat(valorRecebidoDinheiro || '0') : undefined;

    if (temDinheiro && (!valorRecebido || valorRecebido < valorDinheiro)) {
      toast.error('Informe o valor recebido em dinheiro');
      return;
    }

    onConfirm(pagamentos, valorRecebido);
    onOpenChange(false);
  }

  function setRestanteComoValor() {
    if (restante > 0) {
      setValorInput(restante.toFixed(2));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Pagamento Combinado
          </DialogTitle>
          <DialogDescription>
            Divida o pagamento entre diferentes formas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Resumo do Total */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Total da Venda</span>
              <span className="text-xl font-bold">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Já informado</span>
              <span className="text-lg font-medium text-green-600">{formatCurrency(totalPagamentos)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">Restante</span>
              <span className={`text-lg font-bold ${restante > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                {formatCurrency(Math.max(0, restante))}
              </span>
            </div>
          </div>

          {/* Pagamentos Adicionados */}
          {payments.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">Pagamentos</Label>
              <ScrollArea className="max-h-[150px]">
                <div className="space-y-2">
                  {payments.map((payment) => {
                    const method = PAYMENT_METHODS.find(m => m.id === payment.forma);
                    const Icon = method?.icon || DollarSign;
                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-2 bg-background border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded ${method?.color || 'bg-gray-500'}`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-medium">{payment.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{formatCurrency(payment.valor)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removePayment(payment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Adicionar Pagamento */}
          {!isComplete && (
            <div className="space-y-3 p-3 border rounded-lg">
              <Label className="text-xs text-muted-foreground uppercase">Adicionar Pagamento</Label>

              {/* Formas de Pagamento */}
              <div className="grid grid-cols-5 gap-2">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedMethod === method.id;
                  // Verificar se crediário já foi usado
                  const isCrediarioUsed = method.id === 'crediario' && payments.some(p => p.forma === 'crediario');

                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      disabled={isCrediarioUsed}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                        isSelected
                          ? `${method.color} text-white ring-2 ring-offset-1`
                          : isCrediarioUsed
                          ? 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[10px] font-medium">{method.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Valor */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Valor"
                    value={valorInput}
                    onChange={(e) => setValorInput(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={setRestanteComoValor}
                  className="whitespace-nowrap"
                >
                  Restante
                </Button>
                <Button onClick={addPayment} disabled={!selectedMethod}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Info do crediário */}
              {selectedMethod === 'crediario' && (
                <div className="text-xs text-muted-foreground">
                  {clienteSelecionado ? (
                    <span className="text-green-600">
                      Cliente: {clienteSelecionado.nome} - Disponível: {formatCurrency(clienteSelecionado.limite_credito - clienteSelecionado.saldo_devedor)}
                    </span>
                  ) : (
                    <button
                      onClick={onSelectCliente}
                      className="text-primary underline"
                    >
                      Selecione um cliente para usar crediário
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Valor Recebido em Dinheiro */}
          {temDinheiro && isComplete && (
            <div className="space-y-2 p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
              <Label>Valor Recebido em Dinheiro</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={valorRecebidoDinheiro}
                onChange={(e) => setValorRecebidoDinheiro(e.target.value)}
                className="text-lg"
              />
              {parseFloat(valorRecebidoDinheiro || '0') >= valorDinheiro && (
                <div className="text-center">
                  <span className="text-sm text-muted-foreground">Troco: </span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(parseFloat(valorRecebidoDinheiro || '0') - valorDinheiro)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Status */}
          {isComplete && (
            <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-700 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Pagamento completo!</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!isComplete}>
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
