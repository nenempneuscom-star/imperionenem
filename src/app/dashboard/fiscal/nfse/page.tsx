'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Search, FileText, Download, Eye, XCircle, FileCode, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NFSe {
  id: string;
  numero_rps: number;
  serie_rps: string;
  numero_nfse: string | null;
  codigo_verificacao: string | null;
  data_emissao: string;
  data_competencia: string;
  tomador_cpf_cnpj: string;
  tomador_razao_social: string;
  valor_servicos: number;
  valor_iss: number;
  valor_liquido: number;
  status: string;
  xml_rps: string | null;
  discriminacao: string;
}

export default function NFSePage() {
  const router = useRouter();
  const [nfses, setNfses] = useState<NFSe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchNFSe();
  }, [statusFilter]);

  async function fetchNFSe() {
    try {
      let query = supabase
        .from('nfse')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'todos') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNfses(data || []);
    } catch (error) {
      console.error('Erro ao carregar NFS-e:', error);
      toast.error('Erro ao carregar NFS-e');
    } finally {
      setLoading(false);
    }
  }

  function downloadXml(nfse: NFSe) {
    if (!nfse.xml_rps) {
      toast.error('XML não disponível');
      return;
    }

    const blob = new Blob([nfse.xml_rps], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RPS_${nfse.numero_rps}_${nfse.serie_rps}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('XML baixado com sucesso');
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      rascunho: 'secondary',
      pendente: 'outline',
      processando: 'outline',
      autorizada: 'default',
      cancelada: 'destructive',
      rejeitada: 'destructive',
    };

    const labels: Record<string, string> = {
      rascunho: 'Rascunho',
      pendente: 'Pendente',
      processando: 'Processando',
      autorizada: 'Autorizada',
      cancelada: 'Cancelada',
      rejeitada: 'Rejeitada',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  }

  function formatCpfCnpj(value: string) {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (digits.length === 14) {
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
  }

  const filteredNfses = nfses.filter(
    (n) =>
      n.tomador_razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.tomador_cpf_cnpj.includes(searchTerm) ||
      n.numero_rps.toString().includes(searchTerm)
  );

  const totalValor = filteredNfses.reduce((acc, n) => acc + (n.valor_servicos || 0), 0);
  const totalIss = filteredNfses.reduce((acc, n) => acc + (n.valor_iss || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NFS-e</h1>
          <p className="text-muted-foreground">
            Nota Fiscal de Serviço Eletrônica - Capivari de Baixo/SC
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/fiscal/nfse/nova')}>
          <Plus className="mr-2 h-4 w-4" />
          Emitir NFS-e
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Notas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredNfses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total dos Serviços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total ISS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalIss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de NFS-e</CardTitle>
          <CardDescription>
            Gerencie suas notas fiscais de serviço
          </CardDescription>
          <div className="flex items-center gap-4 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por tomador, CPF/CNPJ ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="autorizada">Autorizada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredNfses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhuma NFS-e encontrada</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/dashboard/fiscal/nfse/nova')}
              >
                Emitir primeira NFS-e
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RPS</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tomador</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">ISS</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNfses.map((nfse) => (
                  <TableRow key={nfse.id}>
                    <TableCell className="font-medium">
                      {nfse.numero_rps}/{nfse.serie_rps}
                    </TableCell>
                    <TableCell>
                      {format(new Date(nfse.data_emissao), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{nfse.tomador_razao_social}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCpfCnpj(nfse.tomador_cpf_cnpj)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {nfse.discriminacao}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {nfse.valor_servicos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {(nfse.valor_iss || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{getStatusBadge(nfse.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ver Detalhes"
                          asChild
                        >
                          <Link href={`/dashboard/fiscal/nfse/${nfse.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Baixar XML"
                          onClick={() => downloadXml(nfse)}
                        >
                          <FileCode className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como emitir NFS-e em Capivari de Baixo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Clique em "Emitir NFS-e" e preencha os dados do serviço prestado</li>
            <li>O sistema irá gerar o RPS (Recibo Provisório de Serviços) em formato XML</li>
            <li>Baixe o XML clicando no botão de download</li>
            <li>
              Acesse o portal da prefeitura:{' '}
              <a
                href="https://capivari-de-baixo-sc.prefeituramoderna.com.br/meuiss_new/nfe/index.php?cidade=capivari"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Portal NFS-e Capivari de Baixo
              </a>
            </li>
            <li>Faça login e importe o arquivo XML ou digite os dados manualmente</li>
            <li>Após autorização, atualize o status da nota no sistema</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
