'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Loader2,
  ArrowLeft,
  Search,
  Trash2,
  Car,
  Plus,
  History,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Calendar,
  User,
  Edit,
  Package,
} from 'lucide-react'
import { validarCPFCNPJ, formatarCPFCNPJ, formatarTelefone, formatarCEP } from '@/lib/utils/validators'

interface Veiculo {
  id: string
  marca: string
  modelo: string
  ano?: number
  placa?: string
  cor?: string
  observacoes?: string
}

interface HistoricoData {
  resumo: {
    totalGasto: number
    totalVisitas: number
    ticketMedio: number
    ultimaVisita: string | null
    totalVeiculos: number
  }
  veiculos: Veiculo[]
  vendas: any[]
  formasPagamento: { forma: string; quantidade: number; valor: number }[]
  produtosMaisComprados: { codigo: string; nome: string; quantidade: number; valor: number }[]
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('pt-BR')
}

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartao Credito',
  cartao_debito: 'Cartao Debito',
  pix: 'PIX',
  crediario: 'Crediario',
  combinado: 'Combinado',
}

export default function ClienteDetailPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [activeTab, setActiveTab] = useState('dados')

  // Estados para dados do cliente
  const [formData, setFormData] = useState({
    tipo_pessoa: 'PF',
    cpf_cnpj: '',
    nome: '',
    email: '',
    telefone: '',
    limite_credito: '0',
    ativo: true,
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  })

  // Estados para veiculos
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [loadingVeiculos, setLoadingVeiculos] = useState(false)
  const [showVeiculoModal, setShowVeiculoModal] = useState(false)
  const [editingVeiculo, setEditingVeiculo] = useState<Veiculo | null>(null)
  const [savingVeiculo, setSavingVeiculo] = useState(false)
  const [veiculoForm, setVeiculoForm] = useState({
    marca: '',
    modelo: '',
    ano: '',
    placa: '',
    cor: '',
    observacoes: '',
  })

  // Estados para historico
  const [historico, setHistorico] = useState<HistoricoData | null>(null)
  const [loadingHistorico, setLoadingHistorico] = useState(false)

  // Carregar dados do cliente
  useEffect(() => {
    async function loadCliente() {
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error) throw error

        if (data) {
          const endereco = data.endereco || {}
          setFormData({
            tipo_pessoa: data.tipo_pessoa || 'PF',
            cpf_cnpj: formatarCPFCNPJ(data.cpf_cnpj || ''),
            nome: data.nome || '',
            email: data.email || '',
            telefone: formatarTelefone(data.telefone || ''),
            limite_credito: data.limite_credito?.toString() || '0',
            ativo: data.ativo ?? true,
            cep: formatarCEP(endereco.cep || ''),
            logradouro: endereco.logradouro || '',
            numero: endereco.numero || '',
            complemento: endereco.complemento || '',
            bairro: endereco.bairro || '',
            cidade: endereco.cidade || '',
            uf: endereco.uf || '',
          })
        }
      } catch (error) {
        toast.error('Erro ao carregar cliente')
        router.push('/dashboard/clientes')
      } finally {
        setLoading(false)
      }
    }

    loadCliente()
  }, [params.id, supabase, router])

  // Carregar veiculos quando a aba mudar
  useEffect(() => {
    if (activeTab === 'veiculos' && veiculos.length === 0) {
      loadVeiculos()
    }
    if (activeTab === 'historico' && !historico) {
      loadHistorico()
    }
  }, [activeTab])

  async function loadVeiculos() {
    setLoadingVeiculos(true)
    try {
      const response = await fetch(`/api/veiculos?cliente_id=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setVeiculos(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar veiculos:', error)
      toast.error('Erro ao carregar veiculos')
    } finally {
      setLoadingVeiculos(false)
    }
  }

  async function loadHistorico() {
    setLoadingHistorico(true)
    try {
      const response = await fetch(`/api/clientes/${params.id}/historico`)
      if (response.ok) {
        const data = await response.json()
        setHistorico(data)
      }
    } catch (error) {
      console.error('Erro ao carregar historico:', error)
      toast.error('Erro ao carregar historico')
    } finally {
      setLoadingHistorico(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target

    if (name === 'cpf_cnpj') {
      setFormData(prev => ({ ...prev, [name]: formatarCPFCNPJ(value) }))
    } else if (name === 'telefone') {
      setFormData(prev => ({ ...prev, [name]: formatarTelefone(value) }))
    } else if (name === 'cep') {
      setFormData(prev => ({ ...prev, [name]: formatarCEP(value) }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  async function buscarCEP() {
    const cep = formData.cep.replace(/\D/g, '')
    if (cep.length !== 8) {
      toast.error('CEP invalido')
      return
    }

    setBuscandoCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (data.erro) {
        toast.error('CEP nao encontrado')
        return
      }

      setFormData(prev => ({
        ...prev,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        uf: data.uf || '',
      }))
      toast.success('Endereco encontrado!')
    } catch (error) {
      toast.error('Erro ao buscar CEP')
    } finally {
      setBuscandoCep(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const cpfCnpjLimpo = formData.cpf_cnpj.replace(/\D/g, '')
    if (!validarCPFCNPJ(cpfCnpjLimpo)) {
      toast.error('CPF/CNPJ invalido')
      return
    }

    setSaving(true)

    try {
      const endereco = {
        cep: formData.cep.replace(/\D/g, ''),
        logradouro: formData.logradouro,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        uf: formData.uf,
      }

      const { error } = await supabase
        .from('clientes')
        .update({
          tipo_pessoa: formData.tipo_pessoa,
          cpf_cnpj: cpfCnpjLimpo,
          nome: formData.nome,
          email: formData.email || null,
          telefone: formData.telefone.replace(/\D/g, '') || null,
          endereco,
          limite_credito: parseFloat(formData.limite_credito) || 0,
          ativo: formData.ativo,
        })
        .eq('id', params.id)

      if (error) {
        if (error.code === '23505') {
          toast.error('CPF/CNPJ ja cadastrado')
        } else {
          toast.error('Erro ao atualizar cliente')
        }
        return
      }

      toast.success('Cliente atualizado com sucesso!')
    } catch (error) {
      toast.error('Erro inesperado')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      toast.success('Cliente excluido com sucesso!')
      router.push('/dashboard/clientes')
      router.refresh()
    } catch (error: any) {
      toast.error('Erro ao excluir cliente', { description: error.message })
    } finally {
      setDeleting(false)
    }
  }

  // Funcoes de veiculo
  function openVeiculoModal(veiculo?: Veiculo) {
    if (veiculo) {
      setEditingVeiculo(veiculo)
      setVeiculoForm({
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        ano: veiculo.ano?.toString() || '',
        placa: veiculo.placa || '',
        cor: veiculo.cor || '',
        observacoes: veiculo.observacoes || '',
      })
    } else {
      setEditingVeiculo(null)
      setVeiculoForm({ marca: '', modelo: '', ano: '', placa: '', cor: '', observacoes: '' })
    }
    setShowVeiculoModal(true)
  }

  function formatPlaca(value: string): string {
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (clean.length <= 3) return clean
    if (clean.length <= 7) {
      if (clean.length > 4 && /[A-Z]/.test(clean[4])) return clean
      return `${clean.slice(0, 3)}-${clean.slice(3)}`
    }
    return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`
  }

  async function handleSaveVeiculo() {
    if (!veiculoForm.marca || !veiculoForm.modelo) {
      toast.error('Marca e modelo sao obrigatorios')
      return
    }

    setSavingVeiculo(true)
    try {
      const method = editingVeiculo ? 'PUT' : 'POST'
      const body = editingVeiculo
        ? { id: editingVeiculo.id, ...veiculoForm }
        : { cliente_id: params.id, ...veiculoForm }

      const response = await fetch('/api/veiculos', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar veiculo')
      }

      toast.success(editingVeiculo ? 'Veiculo atualizado!' : 'Veiculo adicionado!')
      setShowVeiculoModal(false)
      loadVeiculos()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSavingVeiculo(false)
    }
  }

  async function handleDeleteVeiculo(id: string) {
    try {
      const response = await fetch(`/api/veiculos?id=${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao excluir')
      toast.success('Veiculo excluido!')
      loadVeiculos()
    } catch (error) {
      toast.error('Erro ao excluir veiculo')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/clientes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{formData.nome}</h1>
            <p className="text-muted-foreground">{formData.cpf_cnpj}</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este cliente? Esta acao nao pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Excluindo...</> : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dados" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Dados
          </TabsTrigger>
          <TabsTrigger value="veiculos" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Veiculos
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historico
          </TabsTrigger>
        </TabsList>

        {/* Aba Dados */}
        <TabsContent value="dados">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Cliente</CardTitle>
                <CardDescription>Informacoes basicas do cliente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
                  />
                  <Label htmlFor="ativo">Cliente ativo</Label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_pessoa">Tipo *</Label>
                    <Select
                      value={formData.tipo_pessoa}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_pessoa: value }))}
                      disabled={saving}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PF">Pessoa Fisica</SelectItem>
                        <SelectItem value="PJ">Pessoa Juridica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf_cnpj">{formData.tipo_pessoa === 'PF' ? 'CPF *' : 'CNPJ *'}</Label>
                    <Input
                      id="cpf_cnpj"
                      name="cpf_cnpj"
                      value={formData.cpf_cnpj}
                      onChange={handleChange}
                      maxLength={formData.tipo_pessoa === 'PF' ? 14 : 18}
                      required
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="limite_credito">Limite de Credito</Label>
                    <Input
                      id="limite_credito"
                      name="limite_credito"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.limite_credito}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">{formData.tipo_pessoa === 'PF' ? 'Nome Completo *' : 'Razao Social *'}</Label>
                  <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} required disabled={saving} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={saving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">WhatsApp</Label>
                    <Input id="telefone" name="telefone" value={formData.telefone} onChange={handleChange} maxLength={15} disabled={saving} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Endereco</CardTitle>
                <CardDescription>Endereco para entrega e cobranca</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <div className="flex gap-2">
                      <Input id="cep" name="cep" value={formData.cep} onChange={handleChange} maxLength={9} disabled={saving} />
                      <Button type="button" variant="outline" size="icon" onClick={buscarCEP} disabled={saving || buscandoCep}>
                        {buscandoCep ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="logradouro">Logradouro</Label>
                    <Input id="logradouro" name="logradouro" value={formData.logradouro} onChange={handleChange} disabled={saving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Numero</Label>
                    <Input id="numero" name="numero" value={formData.numero} onChange={handleChange} disabled={saving} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input id="complemento" name="complemento" value={formData.complemento} onChange={handleChange} disabled={saving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input id="bairro" name="bairro" value={formData.bairro} onChange={handleChange} disabled={saving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input id="cidade" name="cidade" value={formData.cidade} onChange={handleChange} disabled={saving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uf">UF</Label>
                    <Input id="uf" name="uf" value={formData.uf} onChange={handleChange} maxLength={2} disabled={saving} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Salvar Alteracoes'}
              </Button>
              <Button type="button" variant="outline" asChild disabled={saving}>
                <Link href="/dashboard/clientes">Cancelar</Link>
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Aba Veiculos */}
        <TabsContent value="veiculos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Veiculos</CardTitle>
                <CardDescription>Veiculos cadastrados para este cliente</CardDescription>
              </div>
              <Button onClick={() => openVeiculoModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Veiculo
              </Button>
            </CardHeader>
            <CardContent>
              {loadingVeiculos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : veiculos.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {veiculos.map((veiculo) => (
                    <Card key={veiculo.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                            <Car className="h-6 w-6 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold">{veiculo.marca} {veiculo.modelo}</p>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {veiculo.ano && <p>Ano: {veiculo.ano}</p>}
                              {veiculo.placa && <p>Placa: {veiculo.placa}</p>}
                              {veiculo.cor && <p>Cor: {veiculo.cor}</p>}
                            </div>
                          </div>
                        </div>
                        {veiculo.observacoes && (
                          <p className="mt-2 text-sm text-muted-foreground border-t pt-2">{veiculo.observacoes}</p>
                        )}
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <Button variant="outline" size="sm" onClick={() => openVeiculoModal(veiculo)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive">
                                <Trash2 className="h-3 w-3 mr-1" />
                                Excluir
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir veiculo</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este veiculo?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteVeiculo(veiculo.id)}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Car className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">Nenhum veiculo cadastrado</p>
                  <p className="text-sm">Adicione veiculos para rastrear servicos realizados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Historico */}
        <TabsContent value="historico">
          {loadingHistorico ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : historico ? (
            <div className="space-y-6">
              {/* Resumo */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Gasto</p>
                        <p className="text-xl font-bold">{formatCurrency(historico.resumo.totalGasto)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Visitas</p>
                        <p className="text-xl font-bold">{historico.resumo.totalVisitas}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ticket Medio</p>
                        <p className="text-xl font-bold">{formatCurrency(historico.resumo.ticketMedio)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                        <Calendar className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ultima Visita</p>
                        <p className="text-xl font-bold">
                          {historico.resumo.ultimaVisita ? formatDate(historico.resumo.ultimaVisita) : 'Nunca'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Formas de Pagamento e Produtos mais comprados */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Formas de Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {historico.formasPagamento.length > 0 ? (
                      <div className="space-y-3">
                        {historico.formasPagamento.map((fp) => (
                          <div key={fp.forma} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{fp.quantidade}x</Badge>
                              <span>{PAYMENT_LABELS[fp.forma] || fp.forma}</span>
                            </div>
                            <span className="font-medium">{formatCurrency(fp.valor)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">Nenhum registro</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Produtos Mais Comprados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {historico.produtosMaisComprados.length > 0 ? (
                      <div className="space-y-3">
                        {historico.produtosMaisComprados.slice(0, 5).map((prod) => (
                          <div key={prod.codigo} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">{prod.nome}</span>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-medium">{formatCurrency(prod.valor)}</p>
                              <p className="text-xs text-muted-foreground">{prod.quantidade} un</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">Nenhum registro</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Historico de Vendas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Historico de Compras</CardTitle>
                  <CardDescription>Todas as vendas realizadas para este cliente</CardDescription>
                </CardHeader>
                <CardContent>
                  {historico.vendas.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Venda</TableHead>
                            <TableHead>Veiculo</TableHead>
                            <TableHead>Itens</TableHead>
                            <TableHead>Pagamento</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {historico.vendas.map((venda) => (
                            <TableRow key={venda.id}>
                              <TableCell className="whitespace-nowrap">
                                {formatDateTime(venda.data_hora)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">#{venda.numero}</Badge>
                              </TableCell>
                              <TableCell>
                                {venda.veiculos ? (
                                  <span className="text-sm">
                                    {venda.veiculos.marca} {venda.veiculos.modelo}
                                    {venda.veiculos.placa && ` (${venda.veiculos.placa})`}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {venda.venda_itens?.slice(0, 2).map((item: any, idx: number) => (
                                    <p key={idx} className="text-xs truncate max-w-[200px]">
                                      {item.quantidade}x {item.produtos?.nome || 'Produto'}
                                    </p>
                                  ))}
                                  {venda.venda_itens?.length > 2 && (
                                    <p className="text-xs text-muted-foreground">
                                      +{venda.venda_itens.length - 2} itens
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {venda.venda_pagamentos?.map((pag: any, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="mr-1 mb-1">
                                    {PAYMENT_LABELS[pag.forma_pagamento] || pag.forma_pagamento}
                                  </Badge>
                                ))}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(venda.total)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg">Nenhuma compra registrada</p>
                      <p className="text-sm">O historico aparecera aqui quando houver vendas</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Erro ao carregar historico</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Veiculo */}
      <Dialog open={showVeiculoModal} onOpenChange={setShowVeiculoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVeiculo ? 'Editar Veiculo' : 'Adicionar Veiculo'}</DialogTitle>
            <DialogDescription>
              {editingVeiculo ? 'Atualize os dados do veiculo' : 'Cadastre um novo veiculo para este cliente'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="v_marca">Marca *</Label>
                <Input
                  id="v_marca"
                  placeholder="Ex: Fiat, VW, Honda"
                  value={veiculoForm.marca}
                  onChange={(e) => setVeiculoForm(prev => ({ ...prev, marca: e.target.value }))}
                  disabled={savingVeiculo}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="v_modelo">Modelo *</Label>
                <Input
                  id="v_modelo"
                  placeholder="Ex: Uno, Gol, Civic"
                  value={veiculoForm.modelo}
                  onChange={(e) => setVeiculoForm(prev => ({ ...prev, modelo: e.target.value }))}
                  disabled={savingVeiculo}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="v_ano">Ano</Label>
                <Input
                  id="v_ano"
                  placeholder="2024"
                  type="number"
                  min="1900"
                  max="2030"
                  value={veiculoForm.ano}
                  onChange={(e) => setVeiculoForm(prev => ({ ...prev, ano: e.target.value }))}
                  disabled={savingVeiculo}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="v_placa">Placa</Label>
                <Input
                  id="v_placa"
                  placeholder="ABC-1234"
                  value={veiculoForm.placa}
                  onChange={(e) => setVeiculoForm(prev => ({ ...prev, placa: formatPlaca(e.target.value) }))}
                  maxLength={8}
                  disabled={savingVeiculo}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="v_cor">Cor</Label>
                <Input
                  id="v_cor"
                  placeholder="Prata"
                  value={veiculoForm.cor}
                  onChange={(e) => setVeiculoForm(prev => ({ ...prev, cor: e.target.value }))}
                  disabled={savingVeiculo}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="v_obs">Observacoes</Label>
              <Input
                id="v_obs"
                placeholder="Observacoes adicionais..."
                value={veiculoForm.observacoes}
                onChange={(e) => setVeiculoForm(prev => ({ ...prev, observacoes: e.target.value }))}
                disabled={savingVeiculo}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVeiculoModal(false)} disabled={savingVeiculo}>
              Cancelar
            </Button>
            <Button onClick={handleSaveVeiculo} disabled={savingVeiculo}>
              {savingVeiculo ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
