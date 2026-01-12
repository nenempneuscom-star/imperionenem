'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save, Percent, DollarSign, Shield, List, Plus, X, Loader2 } from 'lucide-react';

interface ConfigDesconto {
  id: string;
  desconto_maximo_percentual: number;
  desconto_maximo_valor: number | null;
  motivo_obrigatorio: boolean;
  permitir_desconto_item: boolean;
  permitir_desconto_total: boolean;
  requer_autorizacao_acima_percentual: number | null;
  motivos_predefinidos: string[];
  ativo: boolean;
}

export default function ConfigDescontoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ConfigDesconto>({
    id: '',
    desconto_maximo_percentual: 15,
    desconto_maximo_valor: null,
    motivo_obrigatorio: true,
    permitir_desconto_item: true,
    permitir_desconto_total: true,
    requer_autorizacao_acima_percentual: null,
    motivos_predefinidos: ['Cliente fidelidade', 'Promocao', 'Avaria no produto', 'Negociacao', 'Outro'],
    ativo: true,
  });

  const [novoMotivo, setNovoMotivo] = useState('');
  const [usarLimiteValor, setUsarLimiteValor] = useState(false);
  const [usarAutorizacao, setUsarAutorizacao] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const response = await fetch('/api/configuracoes/desconto');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setUsarLimiteValor(data.desconto_maximo_valor !== null);
        setUsarAutorizacao(data.requer_autorizacao_acima_percentual !== null);
      }
    } catch (error) {
      console.error('Erro ao carregar configuracao:', error);
      toast.error('Erro ao carregar configuracao');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...config,
        desconto_maximo_valor: usarLimiteValor ? config.desconto_maximo_valor : null,
        requer_autorizacao_acima_percentual: usarAutorizacao ? config.requer_autorizacao_acima_percentual : null,
      };

      const response = await fetch('/api/configuracoes/desconto', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar');
      }

      toast.success('Configuracoes salvas com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar configuracoes');
    } finally {
      setSaving(false);
    }
  }

  function adicionarMotivo() {
    if (!novoMotivo.trim()) return;
    if (config.motivos_predefinidos.includes(novoMotivo.trim())) {
      toast.error('Este motivo ja existe');
      return;
    }
    setConfig({
      ...config,
      motivos_predefinidos: [...config.motivos_predefinidos, novoMotivo.trim()],
    });
    setNovoMotivo('');
  }

  function removerMotivo(motivo: string) {
    setConfig({
      ...config,
      motivos_predefinidos: config.motivos_predefinidos.filter((m) => m !== motivo),
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuracao de Desconto</h1>
          <p className="text-muted-foreground">
            Defina as regras de desconto para o PDV
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Configuracoes
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Limites */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Limites de Desconto
            </CardTitle>
            <CardDescription>
              Configure os limites maximos permitidos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Limite Percentual */}
            <div className="space-y-2">
              <Label htmlFor="percentual">Desconto Maximo (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="percentual"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={config.desconto_maximo_percentual}
                  onChange={(e) =>
                    setConfig({ ...config, desconto_maximo_percentual: parseFloat(e.target.value) || 0 })
                  }
                  className="w-32"
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Percentual maximo de desconto permitido por venda
              </p>
            </div>

            <Separator />

            {/* Limite em Valor */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Limite por Valor (R$)</Label>
                  <p className="text-xs text-muted-foreground">
                    Definir um valor maximo em reais
                  </p>
                </div>
                <Switch
                  checked={usarLimiteValor}
                  onCheckedChange={setUsarLimiteValor}
                />
              </div>
              {usarLimiteValor && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">R$</span>
                  <Input
                    type="number"
                    min="0"
                    step="10"
                    value={config.desconto_maximo_valor || ''}
                    onChange={(e) =>
                      setConfig({ ...config, desconto_maximo_valor: parseFloat(e.target.value) || null })
                    }
                    className="w-32"
                    placeholder="100,00"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Permissoes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permissoes e Regras
            </CardTitle>
            <CardDescription>
              Configure onde o desconto pode ser aplicado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Permitir desconto no total */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Desconto no Total da Venda</Label>
                <p className="text-xs text-muted-foreground">
                  Permite aplicar desconto no valor total
                </p>
              </div>
              <Switch
                checked={config.permitir_desconto_total}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, permitir_desconto_total: checked })
                }
              />
            </div>

            <Separator />

            {/* Permitir desconto por item */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Desconto por Item</Label>
                <p className="text-xs text-muted-foreground">
                  Permite aplicar desconto em itens individuais
                </p>
              </div>
              <Switch
                checked={config.permitir_desconto_item}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, permitir_desconto_item: checked })
                }
              />
            </div>

            <Separator />

            {/* Motivo obrigatorio */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Motivo Obrigatorio</Label>
                <p className="text-xs text-muted-foreground">
                  Exige informar o motivo do desconto
                </p>
              </div>
              <Switch
                checked={config.motivo_obrigatorio}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, motivo_obrigatorio: checked })
                }
              />
            </div>

            <Separator />

            {/* Autorizacao para desconto alto */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Requer Autorizacao</Label>
                  <p className="text-xs text-muted-foreground">
                    Exigir senha para descontos acima de X%
                  </p>
                </div>
                <Switch
                  checked={usarAutorizacao}
                  onCheckedChange={setUsarAutorizacao}
                />
              </div>
              {usarAutorizacao && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Acima de</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={config.requer_autorizacao_acima_percentual || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        requer_autorizacao_acima_percentual: parseFloat(e.target.value) || null,
                      })
                    }
                    className="w-20"
                    placeholder="10"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Motivos Pre-definidos */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Motivos Pre-definidos
            </CardTitle>
            <CardDescription>
              Lista de motivos que aparecerao para selecao no PDV
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lista de motivos */}
            <div className="flex flex-wrap gap-2">
              {config.motivos_predefinidos.map((motivo) => (
                <Badge
                  key={motivo}
                  variant="secondary"
                  className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-2"
                >
                  {motivo}
                  <button
                    onClick={() => removerMotivo(motivo)}
                    className="ml-1 hover:bg-destructive/20 rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {/* Adicionar novo motivo */}
            <div className="flex gap-2">
              <Input
                placeholder="Novo motivo..."
                value={novoMotivo}
                onChange={(e) => setNovoMotivo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    adicionarMotivo();
                  }
                }}
                className="max-w-xs"
              />
              <Button variant="outline" onClick={adicionarMotivo}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo das Configuracoes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-muted-foreground">Limite %</p>
              <p className="text-2xl font-bold">{config.desconto_maximo_percentual}%</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-muted-foreground">Limite R$</p>
              <p className="text-2xl font-bold">
                {usarLimiteValor && config.desconto_maximo_valor
                  ? `R$ ${config.desconto_maximo_valor.toFixed(2)}`
                  : 'Sem limite'}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-muted-foreground">Motivo</p>
              <p className="text-2xl font-bold">
                {config.motivo_obrigatorio ? 'Obrigatorio' : 'Opcional'}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-muted-foreground">Tipos</p>
              <p className="text-lg font-bold">
                {[
                  config.permitir_desconto_total && 'Total',
                  config.permitir_desconto_item && 'Item',
                ]
                  .filter(Boolean)
                  .join(' + ') || 'Nenhum'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
