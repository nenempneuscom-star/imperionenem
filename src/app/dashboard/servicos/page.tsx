'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, Wrench } from 'lucide-react';

interface Servico {
  id: string;
  codigo: string;
  codigo_tributacao: string;
  item_lista_servico: string;
  descricao: string;
  aliquota_iss: number;
  valor_padrao: number;
  cnae: string;
  ativo: boolean;
}

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    codigo: '',
    codigo_tributacao: '',
    item_lista_servico: '14.01',
    descricao: '',
    aliquota_iss: 5,
    valor_padrao: 0,
    cnae: '',
    ativo: true,
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchServicos();
  }, []);

  async function fetchServicos() {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('codigo');

      if (error) throw error;
      setServicos(data || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(servico: Servico) {
    setEditingServico(servico);
    setFormData({
      codigo: servico.codigo,
      codigo_tributacao: servico.codigo_tributacao || '',
      item_lista_servico: servico.item_lista_servico,
      descricao: servico.descricao,
      aliquota_iss: servico.aliquota_iss,
      valor_padrao: servico.valor_padrao || 0,
      cnae: servico.cnae || '',
      ativo: servico.ativo,
    });
    setDialogOpen(true);
  }

  function handleNew() {
    setEditingServico(null);
    setFormData({
      codigo: '',
      codigo_tributacao: '',
      item_lista_servico: '14.01',
      descricao: '',
      aliquota_iss: 5,
      valor_padrao: 0,
      cnae: '',
      ativo: true,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    try {
      if (!formData.codigo || !formData.descricao) {
        toast.error('Preencha os campos obrigatórios');
        return;
      }

      if (editingServico) {
        const { error } = await supabase
          .from('servicos')
          .update({
            codigo: formData.codigo,
            codigo_tributacao: formData.codigo_tributacao,
            item_lista_servico: formData.item_lista_servico,
            descricao: formData.descricao,
            aliquota_iss: formData.aliquota_iss,
            valor_padrao: formData.valor_padrao,
            cnae: formData.cnae,
            ativo: formData.ativo,
          })
          .eq('id', editingServico.id);

        if (error) throw error;
        toast.success('Serviço atualizado com sucesso');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data: usuario } = await supabase
          .from('usuarios')
          .select('empresa_id')
          .eq('auth_id', user.id)
          .single();

        if (!usuario) throw new Error('Usuário não encontrado');

        const { error } = await supabase
          .from('servicos')
          .insert({
            empresa_id: usuario.empresa_id,
            codigo: formData.codigo,
            codigo_tributacao: formData.codigo_tributacao,
            item_lista_servico: formData.item_lista_servico,
            descricao: formData.descricao,
            aliquota_iss: formData.aliquota_iss,
            valor_padrao: formData.valor_padrao,
            cnae: formData.cnae,
            ativo: formData.ativo,
          });

        if (error) throw error;
        toast.success('Serviço criado com sucesso');
      }

      setDialogOpen(false);
      fetchServicos();
    } catch (error: any) {
      console.error('Erro ao salvar serviço:', error);
      toast.error(error.message || 'Erro ao salvar serviço');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

    try {
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Serviço excluído com sucesso');
      fetchServicos();
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      toast.error('Erro ao excluir serviço');
    }
  }

  const filteredServicos = servicos.filter(
    (s) =>
      s.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Itens da LC 116 comuns para serviços de pneus
  const itensLC116 = [
    { value: '14.01', label: '14.01 - Conserto, manutenção, conservação de veículos' },
    { value: '14.02', label: '14.02 - Assistência técnica' },
    { value: '14.03', label: '14.03 - Recondicionamento de motores' },
    { value: '14.04', label: '14.04 - Recauchutagem de pneus' },
    { value: '14.05', label: '14.05 - Restauração, recondicionamento' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
          <p className="text-muted-foreground">
            Cadastre os serviços para emissão de NFS-e
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar serviços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredServicos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum serviço encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Item LC 116</TableHead>
                  <TableHead>Alíquota ISS</TableHead>
                  <TableHead>Valor Padrão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServicos.map((servico) => (
                  <TableRow key={servico.id}>
                    <TableCell className="font-medium">{servico.codigo}</TableCell>
                    <TableCell>{servico.descricao}</TableCell>
                    <TableCell>{servico.item_lista_servico}</TableCell>
                    <TableCell>{servico.aliquota_iss}%</TableCell>
                    <TableCell>
                      {servico.valor_padrao > 0
                        ? `R$ ${servico.valor_padrao.toFixed(2)}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={servico.ativo ? 'default' : 'secondary'}>
                        {servico.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(servico)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(servico.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingServico ? 'Editar Serviço' : 'Novo Serviço'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do serviço para emissão de NFS-e
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo: e.target.value })
                  }
                  placeholder="001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo_tributacao">Cód. Tributação Municipal</Label>
                <Input
                  id="codigo_tributacao"
                  value={formData.codigo_tributacao}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo_tributacao: e.target.value })
                  }
                  placeholder="Código da prefeitura"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item_lista_servico">Item Lista de Serviços (LC 116) *</Label>
              <select
                id="item_lista_servico"
                value={formData.item_lista_servico}
                onChange={(e) =>
                  setFormData({ ...formData, item_lista_servico: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {itensLC116.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descrição detalhada do serviço"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aliquota_iss">Alíquota ISS (%)</Label>
                <Input
                  id="aliquota_iss"
                  type="number"
                  step="0.01"
                  value={formData.aliquota_iss}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      aliquota_iss: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor_padrao">Valor Padrão (R$)</Label>
                <Input
                  id="valor_padrao"
                  type="number"
                  step="0.01"
                  value={formData.valor_padrao}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      valor_padrao: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnae">CNAE</Label>
                <Input
                  id="cnae"
                  value={formData.cnae}
                  onChange={(e) =>
                    setFormData({ ...formData, cnae: e.target.value })
                  }
                  placeholder="0000000"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ativo: checked })
                }
              />
              <Label htmlFor="ativo">Serviço ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
