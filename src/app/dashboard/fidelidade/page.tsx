'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Gift, Loader2, Star, Settings } from 'lucide-react'

// Import components and types
import {
  PontosTab,
  ConfigTab,
  AjusteModal,
  type FidelidadeConfig,
  type ClientePontos,
  type Movimento,
} from '@/components/fidelidade'

export default function FidelidadePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [empresaId, setEmpresaId] = useState<string | null>(null)

  // Configuracao
  const [config, setConfig] = useState<FidelidadeConfig | null>(null)

  // Clientes
  const [clientes, setClientes] = useState<ClientePontos[]>([])
  const [search, setSearch] = useState('')
  const [clienteSelecionado, setClienteSelecionado] = useState<ClientePontos | null>(null)
  const [movimentos, setMovimentos] = useState<Movimento[]>([])
  const [loadingMovimentos, setLoadingMovimentos] = useState(false)

  // Modal de ajuste
  const [showAjuste, setShowAjuste] = useState(false)
  const [tipoAjuste, setTipoAjuste] = useState<'adicionar' | 'remover'>('adicionar')
  const [valorAjuste, setValorAjuste] = useState('')
  const [descricaoAjuste, setDescricaoAjuste] = useState('')
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('auth_id', user.id)
        .single()

      if (!usuario) return
      setEmpresaId(usuario.empresa_id)

      // Buscar configuracao
      const { data: configData } = await supabase
        .from('fidelidade_config')
        .select('*')
        .eq('empresa_id', usuario.empresa_id)
        .single()

      if (configData) {
        setConfig(configData)
      } else {
        // Criar config padrao
        setConfig({
          empresa_id: usuario.empresa_id,
          pontos_por_real: 1,
          valor_ponto_resgate: 0.10,
          validade_dias: 365,
          ativo: false,
        })
      }

      // Buscar clientes com pontos
      const { data: clientesData } = await supabase
        .from('fidelidade_pontos')
        .select(`
          id,
          cliente_id,
          saldo_pontos,
          total_acumulado,
          total_resgatado,
          cliente:clientes(id, nome, cpf_cnpj, telefone)
        `)
        .eq('empresa_id', usuario.empresa_id)
        .order('saldo_pontos', { ascending: false })

      if (clientesData) {
        setClientes(clientesData.map(c => ({
          ...c,
          cliente: Array.isArray(c.cliente) ? c.cliente[0] : c.cliente
        })))
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  async function salvarConfig() {
    if (!config || !empresaId) return

    setSaving(true)
    try {
      if (config.id) {
        const { error } = await supabase
          .from('fidelidade_config')
          .update({
            pontos_por_real: config.pontos_por_real,
            valor_ponto_resgate: config.valor_ponto_resgate,
            validade_dias: config.validade_dias,
            ativo: config.ativo,
            updated_at: new Date().toISOString(),
          })
          .eq('id', config.id)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('fidelidade_config')
          .insert({
            empresa_id: empresaId,
            pontos_por_real: config.pontos_por_real,
            valor_ponto_resgate: config.valor_ponto_resgate,
            validade_dias: config.validade_dias,
            ativo: config.ativo,
          })
          .select()
          .single()

        if (error) throw error
        setConfig(data)
      }

      toast.success('Configuracoes salvas!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar configuracoes')
    } finally {
      setSaving(false)
    }
  }

  async function buscarMovimentos(clienteId: string) {
    setLoadingMovimentos(true)
    try {
      const { data, error } = await supabase
        .from('fidelidade_movimentos')
        .select(`
          id,
          tipo,
          pontos,
          saldo_anterior,
          saldo_posterior,
          valor_venda,
          descricao,
          created_at,
          venda:vendas(numero)
        `)
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setMovimentos(data || [])
    } catch (error) {
      console.error('Erro ao buscar movimentos:', error)
      toast.error('Erro ao carregar historico')
    } finally {
      setLoadingMovimentos(false)
    }
  }

  function selecionarCliente(cliente: ClientePontos) {
    setClienteSelecionado(cliente)
    buscarMovimentos(cliente.cliente_id)
  }

  async function realizarAjuste() {
    if (!clienteSelecionado || !empresaId) return

    const pontos = parseFloat(valorAjuste)
    if (isNaN(pontos) || pontos <= 0) {
      toast.error('Informe um valor valido')
      return
    }

    if (tipoAjuste === 'remover' && pontos > clienteSelecionado.saldo_pontos) {
      toast.error('Valor maior que o saldo de pontos')
      return
    }

    setProcessando(true)
    try {
      const pontosAjuste = tipoAjuste === 'adicionar' ? pontos : -pontos

      const { error } = await supabase
        .from('fidelidade_movimentos')
        .insert({
          empresa_id: empresaId,
          cliente_id: clienteSelecionado.cliente_id,
          tipo: 'ajuste',
          pontos: pontosAjuste,
          saldo_anterior: clienteSelecionado.saldo_pontos,
          saldo_posterior: clienteSelecionado.saldo_pontos + pontosAjuste,
          descricao: descricaoAjuste || `Ajuste manual: ${tipoAjuste === 'adicionar' ? '+' : '-'}${pontos} pontos`,
        })

      if (error) throw error

      toast.success('Ajuste realizado com sucesso!')

      // Atualizar dados
      setShowAjuste(false)
      setValorAjuste('')
      setDescricaoAjuste('')

      // Recarregar
      carregarDados()
      if (clienteSelecionado) {
        buscarMovimentos(clienteSelecionado.cliente_id)
      }
    } catch (error) {
      console.error('Erro ao realizar ajuste:', error)
      toast.error('Erro ao realizar ajuste')
    } finally {
      setProcessando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gift className="h-8 w-8" />
            Programa de Fidelidade
          </h1>
          <p className="text-muted-foreground">
            Gerencie pontos e recompensas dos clientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/fidelidade/produtos">
            <Button variant="outline">
              <Gift className="h-4 w-4 mr-2" />
              Produtos Resgataveis
            </Button>
          </Link>
          <Badge variant={config?.ativo ? 'default' : 'secondary'} className="text-sm">
            {config?.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="pontos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pontos">
            <Star className="h-4 w-4 mr-2" />
            Pontos
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Configuracoes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pontos">
          <PontosTab
            config={config}
            clientes={clientes}
            clienteSelecionado={clienteSelecionado}
            movimentos={movimentos}
            loadingMovimentos={loadingMovimentos}
            search={search}
            onSearchChange={setSearch}
            onSelectCliente={selecionarCliente}
            onAdicionar={() => {
              setTipoAjuste('adicionar')
              setShowAjuste(true)
            }}
            onRemover={() => {
              setTipoAjuste('remover')
              setShowAjuste(true)
            }}
          />
        </TabsContent>

        <TabsContent value="config">
          <ConfigTab
            config={config}
            saving={saving}
            onConfigChange={setConfig}
            onSave={salvarConfig}
          />
        </TabsContent>
      </Tabs>

      <AjusteModal
        open={showAjuste}
        onOpenChange={setShowAjuste}
        tipo={tipoAjuste}
        cliente={clienteSelecionado}
        valor={valorAjuste}
        descricao={descricaoAjuste}
        processando={processando}
        onValorChange={setValorAjuste}
        onDescricaoChange={setDescricaoAjuste}
        onConfirm={realizarAjuste}
      />
    </div>
  )
}
