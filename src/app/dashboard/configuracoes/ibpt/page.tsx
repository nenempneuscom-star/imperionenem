'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, Search, FileSpreadsheet, AlertCircle, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface IBPTStats {
  total_produtos: number;
  total_servicos: number;
  ultima_importacao: {
    versao: string;
    tipo: string;
    arquivo_nome: string;
    registros_importados: number;
    vigencia_inicio: string;
    vigencia_fim: string;
    importado_em: string;
  } | null;
}

interface AliquotaResult {
  ncm?: string;
  codigo?: string;
  descricao: string;
  aliquota_federal: number;
  aliquota_estadual: number;
  aliquota_municipal: number;
  aliquota_total: number;
  vigencia_inicio?: string;
  vigencia_fim?: string;
  versao?: string;
}

export default function IBPTPage() {
  const [stats, setStats] = useState<IBPTStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searching, setSearching] = useState(false);

  // Importação
  const [tipoImportacao, setTipoImportacao] = useState('produtos');
  const [versao, setVersao] = useState('');
  const [vigenciaInicio, setVigenciaInicio] = useState('');
  const [vigenciaFim, setVigenciaFim] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Consulta
  const [ncmBusca, setNcmBusca] = useState('');
  const [servicoBusca, setServicoBusca] = useState('');
  const [resultadoBusca, setResultadoBusca] = useState<AliquotaResult | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const response = await fetch('/api/ibpt');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      toast.error('Selecione um arquivo CSV');
      return;
    }

    setImporting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tipo', tipoImportacao);
      formData.append('versao', versao);
      formData.append('vigencia_inicio', vigenciaInicio);
      formData.append('vigencia_fim', vigenciaFim);

      const response = await fetch('/api/ibpt', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na importação');
      }

      toast.success(`${data.registros_importados} registros importados com sucesso!`);
      fetchStats();

      // Limpar formulário
      if (fileInputRef.current) fileInputRef.current.value = '';
      setVersao('');
      setVigenciaInicio('');
      setVigenciaFim('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao importar tabela');
    } finally {
      setImporting(false);
    }
  }

  async function handleSearch() {
    if (!ncmBusca && !servicoBusca) {
      toast.error('Digite um NCM ou código de serviço');
      return;
    }

    setSearching(true);
    setResultadoBusca(null);

    try {
      const params = new URLSearchParams();
      if (ncmBusca) params.append('ncm', ncmBusca.replace(/\D/g, ''));
      if (servicoBusca) params.append('servico', servicoBusca);

      const response = await fetch(`/api/ibpt?${params}`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Não encontrado');
        return;
      }

      setResultadoBusca(data);
    } catch (error) {
      toast.error('Erro ao buscar alíquota');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tabela IBPT</h1>
        <p className="text-muted-foreground">
          Lei da Transparência Fiscal (Lei 12.741/2012)
        </p>
      </div>

      {/* Informativo */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Sobre a Lei da Transparência Fiscal
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 dark:text-blue-300 text-sm space-y-2">
          <p>
            A Lei 12.741/2012 obriga estabelecimentos comerciais a informar nos cupons fiscais
            o <strong>valor aproximado dos tributos</strong> incidentes sobre produtos e serviços.
          </p>
          <p>
            Baixe a tabela gratuitamente em:{' '}
            <a
              href="https://deolhonoimposto.ibpt.org.br"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium inline-flex items-center gap-1"
            >
              deolhonoimposto.ibpt.org.br
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Status atual */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Produtos (NCM)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats?.total_produtos?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">registros na tabela</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Serviços (NBS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats?.total_servicos?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">registros na tabela</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Última Importação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.ultima_importacao ? (
              <>
                <div className="text-lg font-bold">
                  Versão {stats.ultima_importacao.versao || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(stats.ultima_importacao.importado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </>
            ) : (
              <div className="text-muted-foreground">Nenhuma importação</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Importação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Importar Tabela IBPT
            </CardTitle>
            <CardDescription>
              Faça upload do arquivo CSV baixado do site do IBPT
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleImport} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Tabela</Label>
                <Select value={tipoImportacao} onValueChange={setTipoImportacao}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produtos">Produtos (NCM)</SelectItem>
                    <SelectItem value="servicos">Serviços (NBS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Arquivo CSV</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv,.txt"
                  ref={fileInputRef}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label>Versão</Label>
                  <Input
                    value={versao}
                    onChange={(e) => setVersao(e.target.value)}
                    placeholder="25.2.H"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vigência Início</Label>
                  <Input
                    type="date"
                    value={vigenciaInicio}
                    onChange={(e) => setVigenciaInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vigência Fim</Label>
                  <Input
                    type="date"
                    value={vigenciaFim}
                    onChange={(e) => setVigenciaFim(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={importing}>
                {importing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Importar Tabela
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Consulta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Consultar Alíquota
            </CardTitle>
            <CardDescription>
              Busque a alíquota de impostos por NCM ou código de serviço
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>NCM do Produto</Label>
              <div className="flex gap-2">
                <Input
                  value={ncmBusca}
                  onChange={(e) => {
                    setNcmBusca(e.target.value);
                    setServicoBusca('');
                  }}
                  placeholder="Ex: 40111000"
                />
                <Button
                  type="button"
                  onClick={handleSearch}
                  disabled={searching || (!ncmBusca && !servicoBusca)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Código de Serviço (LC 116)</Label>
              <div className="flex gap-2">
                <Input
                  value={servicoBusca}
                  onChange={(e) => {
                    setServicoBusca(e.target.value);
                    setNcmBusca('');
                  }}
                  placeholder="Ex: 14.01"
                />
                <Button
                  type="button"
                  onClick={handleSearch}
                  disabled={searching || (!ncmBusca && !servicoBusca)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {resultadoBusca && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">
                    {resultadoBusca.ncm || resultadoBusca.codigo}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {resultadoBusca.descricao}
                </p>
                <Separator />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Federal:</div>
                  <div className="font-medium">{resultadoBusca.aliquota_federal?.toFixed(2)}%</div>
                  <div>Estadual:</div>
                  <div className="font-medium">{resultadoBusca.aliquota_estadual?.toFixed(2)}%</div>
                  <div>Municipal:</div>
                  <div className="font-medium">{resultadoBusca.aliquota_municipal?.toFixed(2)}%</div>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-bold">Total de Tributos:</span>
                  <Badge variant="default" className="text-lg">
                    {resultadoBusca.aliquota_total?.toFixed(2)}%
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Exemplo de uso */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplo no Cupom Fiscal</CardTitle>
          <CardDescription>
            Como a informação aparecerá para o consumidor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm max-w-md">
            <div className="border-b pb-2 mb-2">
              <strong>NENEM PNEUS LTDA</strong>
              <br />
              CNPJ: 36.985.207/0001-00
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>1x PNEU GOODYEAR 195/55</span>
                <span>450,00</span>
              </div>
              <div className="flex justify-between">
                <span>1x SERV. BALANCEAMENTO</span>
                <span>40,00</span>
              </div>
            </div>
            <div className="border-t mt-2 pt-2">
              <div className="flex justify-between font-bold">
                <span>TOTAL</span>
                <span>R$ 490,00</span>
              </div>
            </div>
            <div className="border-t mt-2 pt-2 text-xs text-muted-foreground">
              <strong>Val. Aprox. Tributos:</strong> R$ 172,55 (35,21%)
              <br />
              <span className="text-[10px]">Fonte: IBPT - Lei 12.741/2012</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
