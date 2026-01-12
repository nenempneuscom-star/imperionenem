'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Save, FileText, Search } from 'lucide-react';

interface Servico {
  id: string;
  codigo: string;
  item_lista_servico: string;
  descricao: string;
  aliquota_iss: number;
  valor_padrao: number;
}

interface Cliente {
  id: string;
  cpf_cnpj: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: any;
  tipo_pessoa: string;
}

export default function NovaNFSePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchCliente, setSearchCliente] = useState('');

  const [formData, setFormData] = useState({
    // Tomador
    tomador_tipo_pessoa: 'PF',
    tomador_cpf_cnpj: '',
    tomador_razao_social: '',
    tomador_inscricao_municipal: '',
    tomador_email: '',
    tomador_telefone: '',
    tomador_endereco: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      codigo_municipio: '4203907',
      uf: 'SC',
      cep: '',
    },

    // Serviço
    servico_id: '',
    item_lista_servico: '14.01',
    codigo_tributacao: '',
    discriminacao: '',
    codigo_cnae: '',

    // Valores
    valor_servicos: 0,
    valor_deducoes: 0,
    desconto_incondicionado: 0,
    aliquota_iss: 5,
    iss_retido: false,

    // Retenções
    valor_pis: 0,
    valor_cofins: 0,
    valor_inss: 0,
    valor_ir: 0,
    valor_csll: 0,

    // Outros
    data_competencia: new Date().toISOString().split('T')[0],
    natureza_operacao: '1',
    local_prestacao_codigo_municipio: '4203907',
    local_prestacao_uf: 'SC',
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchServicos();
    fetchClientes();
  }, []);

  async function fetchServicos() {
    const { data } = await supabase
      .from('servicos')
      .select('*')
      .eq('ativo', true)
      .order('codigo');
    setServicos(data || []);
  }

  async function fetchClientes() {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .eq('ativo', true)
      .order('nome');
    setClientes(data || []);
  }

  function handleServicoChange(servicoId: string) {
    const servico = servicos.find((s) => s.id === servicoId);
    if (servico) {
      setFormData({
        ...formData,
        servico_id: servicoId,
        item_lista_servico: servico.item_lista_servico,
        discriminacao: servico.descricao,
        aliquota_iss: servico.aliquota_iss,
        valor_servicos: servico.valor_padrao || formData.valor_servicos,
      });
    }
  }

  function handleClienteSelect(cliente: Cliente) {
    setFormData({
      ...formData,
      tomador_tipo_pessoa: cliente.tipo_pessoa || 'PF',
      tomador_cpf_cnpj: cliente.cpf_cnpj,
      tomador_razao_social: cliente.nome,
      tomador_email: cliente.email || '',
      tomador_telefone: cliente.telefone || '',
      tomador_endereco: cliente.endereco || formData.tomador_endereco,
    });
    setSearchCliente('');
  }

  async function buscarCep(cep: string) {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData({
          ...formData,
          tomador_endereco: {
            ...formData.tomador_endereco,
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            uf: data.uf || 'SC',
            cep: cepLimpo,
          },
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  }

  // Cálculos
  const baseCalculo = formData.valor_servicos - formData.valor_deducoes - formData.desconto_incondicionado;
  const valorIss = baseCalculo * (formData.aliquota_iss / 100);
  const totalRetencoes =
    formData.valor_pis +
    formData.valor_cofins +
    formData.valor_inss +
    formData.valor_ir +
    formData.valor_csll;
  const valorLiquido = formData.valor_servicos - totalRetencoes - formData.desconto_incondicionado;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Validações
      if (!formData.tomador_cpf_cnpj || !formData.tomador_razao_social) {
        toast.error('Preencha os dados do tomador');
        return;
      }

      if (!formData.discriminacao) {
        toast.error('Preencha a discriminação do serviço');
        return;
      }

      if (formData.valor_servicos <= 0) {
        toast.error('O valor do serviço deve ser maior que zero');
        return;
      }

      const response = await fetch('/api/nfse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'rascunho',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao emitir NFS-e');
      }

      toast.success('RPS gerado com sucesso! Baixe o XML para enviar à prefeitura.');
      router.push('/dashboard/fiscal/nfse');
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(error.message || 'Erro ao emitir NFS-e');
    } finally {
      setLoading(false);
    }
  }

  const filteredClientes = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(searchCliente.toLowerCase()) ||
      c.cpf_cnpj.includes(searchCliente)
  );

  // Itens da LC 116
  const itensLC116 = [
    { value: '14.01', label: '14.01 - Conserto, manutenção de veículos' },
    { value: '14.02', label: '14.02 - Assistência técnica' },
    { value: '14.03', label: '14.03 - Recondicionamento de motores' },
    { value: '14.04', label: '14.04 - Recauchutagem de pneus' },
    { value: '14.05', label: '14.05 - Restauração, recondicionamento' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emitir NFS-e</h1>
          <p className="text-muted-foreground">
            Nota Fiscal de Serviço Eletrônica
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tomador do Serviço */}
        <Card>
          <CardHeader>
            <CardTitle>Tomador do Serviço</CardTitle>
            <CardDescription>Dados de quem está contratando o serviço</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Busca de cliente */}
            <div className="space-y-2">
              <Label>Buscar Cliente Cadastrado</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Digite o nome ou CPF/CNPJ..."
                  value={searchCliente}
                  onChange={(e) => setSearchCliente(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchCliente && filteredClientes.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-auto">
                  {filteredClientes.slice(0, 5).map((cliente) => (
                    <div
                      key={cliente.id}
                      className="p-2 hover:bg-muted cursor-pointer"
                      onClick={() => handleClienteSelect(cliente)}
                    >
                      <div className="font-medium">{cliente.nome}</div>
                      <div className="text-sm text-muted-foreground">{cliente.cpf_cnpj}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Pessoa</Label>
                <Select
                  value={formData.tomador_tipo_pessoa}
                  onValueChange={(v) => setFormData({ ...formData, tomador_tipo_pessoa: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PF">Pessoa Física</SelectItem>
                    <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{formData.tomador_tipo_pessoa === 'PF' ? 'CPF *' : 'CNPJ *'}</Label>
                <Input
                  value={formData.tomador_cpf_cnpj}
                  onChange={(e) => setFormData({ ...formData, tomador_cpf_cnpj: e.target.value })}
                  placeholder={formData.tomador_tipo_pessoa === 'PF' ? '000.000.000-00' : '00.000.000/0001-00'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{formData.tomador_tipo_pessoa === 'PF' ? 'Nome Completo *' : 'Razão Social *'}</Label>
              <Input
                value={formData.tomador_razao_social}
                onChange={(e) => setFormData({ ...formData, tomador_razao_social: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={formData.tomador_email}
                  onChange={(e) => setFormData({ ...formData, tomador_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.tomador_telefone}
                  onChange={(e) => setFormData({ ...formData, tomador_telefone: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input
                  value={formData.tomador_endereco.cep}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      tomador_endereco: { ...formData.tomador_endereco, cep: e.target.value },
                    });
                    if (e.target.value.replace(/\D/g, '').length === 8) {
                      buscarCep(e.target.value);
                    }
                  }}
                  placeholder="00000-000"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Logradouro</Label>
                <Input
                  value={formData.tomador_endereco.logradouro}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tomador_endereco: { ...formData.tomador_endereco, logradouro: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Número</Label>
                <Input
                  value={formData.tomador_endereco.numero}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tomador_endereco: { ...formData.tomador_endereco, numero: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Complemento</Label>
                <Input
                  value={formData.tomador_endereco.complemento}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tomador_endereco: { ...formData.tomador_endereco, complemento: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input
                  value={formData.tomador_endereco.bairro}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tomador_endereco: { ...formData.tomador_endereco, bairro: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>UF</Label>
                <Input
                  value={formData.tomador_endereco.uf}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tomador_endereco: { ...formData.tomador_endereco, uf: e.target.value },
                    })
                  }
                  maxLength={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Serviço */}
        <Card>
          <CardHeader>
            <CardTitle>Serviço Prestado</CardTitle>
            <CardDescription>Dados do serviço realizado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Serviço Cadastrado</Label>
                <Select value={formData.servico_id} onValueChange={handleServicoChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicos.map((servico) => (
                      <SelectItem key={servico.id} value={servico.id}>
                        {servico.codigo} - {servico.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Item Lista de Serviços (LC 116) *</Label>
                <Select
                  value={formData.item_lista_servico}
                  onValueChange={(v) => setFormData({ ...formData, item_lista_servico: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {itensLC116.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Discriminação do Serviço *</Label>
              <Textarea
                value={formData.discriminacao}
                onChange={(e) => setFormData({ ...formData, discriminacao: e.target.value })}
                placeholder="Descreva detalhadamente o serviço prestado..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Competência</Label>
              <Input
                type="date"
                value={formData.data_competencia}
                onChange={(e) => setFormData({ ...formData, data_competencia: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Valores */}
        <Card>
          <CardHeader>
            <CardTitle>Valores</CardTitle>
            <CardDescription>Valores do serviço e impostos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Valor do Serviço (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_servicos}
                  onChange={(e) =>
                    setFormData({ ...formData, valor_servicos: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Deduções (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_deducoes}
                  onChange={(e) =>
                    setFormData({ ...formData, valor_deducoes: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Desconto (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.desconto_incondicionado}
                  onChange={(e) =>
                    setFormData({ ...formData, desconto_incondicionado: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Alíquota ISS (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.aliquota_iss}
                  onChange={(e) =>
                    setFormData({ ...formData, aliquota_iss: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2 flex items-end pb-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="iss_retido"
                    checked={formData.iss_retido}
                    onCheckedChange={(checked) => setFormData({ ...formData, iss_retido: checked })}
                  />
                  <Label htmlFor="iss_retido">ISS Retido na Fonte</Label>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>PIS (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_pis}
                  onChange={(e) =>
                    setFormData({ ...formData, valor_pis: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>COFINS (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_cofins}
                  onChange={(e) =>
                    setFormData({ ...formData, valor_cofins: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>INSS (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_inss}
                  onChange={(e) =>
                    setFormData({ ...formData, valor_inss: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>IR (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_ir}
                  onChange={(e) =>
                    setFormData({ ...formData, valor_ir: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>CSLL (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_csll}
                  onChange={(e) =>
                    setFormData({ ...formData, valor_csll: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <Separator />

            {/* Resumo */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Base de Cálculo:</span>
                <span className="font-medium">R$ {baseCalculo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>ISS ({formData.aliquota_iss}%):</span>
                <span className="font-medium">R$ {valorIss.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Retenções:</span>
                <span className="font-medium">R$ {totalRetencoes.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-bold">Valor Líquido:</span>
                <span className="font-bold text-primary">R$ {valorLiquido.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Gerando...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Gerar RPS
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
