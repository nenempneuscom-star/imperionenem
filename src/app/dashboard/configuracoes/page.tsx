'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2, Building2, MapPin, FileText, Save, Settings } from 'lucide-react'
import { validarCNPJ, formatarCNPJ, formatarTelefone, formatarCEP } from '@/lib/utils/validators'
import {
  type Empresa,
  type FormDataConfiguracoes,
  initialFormData,
  EmpresaTab,
  EnderecoTab,
  FiscalTab,
  SistemaTab,
} from '@/components/configuracoes'

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [buscandoCnpj, setBuscandoCnpj] = useState(false)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [restaurando, setRestaurando] = useState(false)
  const [confirmacaoTexto, setConfirmacaoTexto] = useState('')
  const [senhaConfirmacao, setSenhaConfirmacao] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [limparDadosEmpresa, setLimparDadosEmpresa] = useState(false)

  // Estados para senha mestre
  const [temSenhaMestre, setTemSenhaMestre] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenhaMestre, setNovaSenhaMestre] = useState('')
  const [confirmarSenhaMestre, setConfirmarSenhaMestre] = useState('')
  const [salvandoSenhaMestre, setSalvandoSenhaMestre] = useState(false)
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false)
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)

  const [formData, setFormData] = useState<FormDataConfiguracoes>(initialFormData)

  useEffect(() => {
    carregarEmpresa()
    verificarSenhaMestre()
  }, [])

  async function verificarSenhaMestre() {
    try {
      const response = await fetch('/api/senha-mestre')
      if (response.ok) {
        const data = await response.json()
        setTemSenhaMestre(data.temSenhaMestre)
      }
    } catch (error) {
      console.error('Erro ao verificar senha mestre:', error)
    }
  }

  async function handleSalvarSenhaMestre() {
    if (novaSenhaMestre.length < 6) {
      toast.error('A senha mestre deve ter pelo menos 6 caracteres')
      return
    }

    if (novaSenhaMestre !== confirmarSenhaMestre) {
      toast.error('As senhas não conferem')
      return
    }

    if (temSenhaMestre && !senhaAtual) {
      toast.error('Informe a senha mestre atual')
      return
    }

    setSalvandoSenhaMestre(true)
    try {
      const response = await fetch('/api/senha-mestre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senhaAtual: temSenhaMestre ? senhaAtual : undefined,
          novaSenha: novaSenhaMestre,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar senha mestre')
      }

      toast.success(data.message)
      setTemSenhaMestre(true)
      setSenhaAtual('')
      setNovaSenhaMestre('')
      setConfirmarSenhaMestre('')
    } catch (error: any) {
      toast.error('Erro ao salvar senha mestre', {
        description: error.message,
      })
    } finally {
      setSalvandoSenhaMestre(false)
    }
  }

  async function carregarEmpresa() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('auth_id', user.id)
        .single()

      if (!userData?.empresa_id) return

      const { data: empresaData, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', userData.empresa_id)
        .single()

      if (error) throw error

      if (empresaData) {
        setEmpresa(empresaData)
        setFormData({
          razao_social: empresaData.razao_social || '',
          nome_fantasia: empresaData.nome_fantasia || '',
          cnpj: formatarCNPJ(empresaData.cnpj || ''),
          ie: empresaData.ie || '',
          telefone: formatarTelefone(empresaData.telefone || ''),
          email: empresaData.email || '',
          // Endereço
          cep: formatarCEP(empresaData.endereco?.cep || ''),
          logradouro: empresaData.endereco?.logradouro || '',
          numero: empresaData.endereco?.numero || '',
          complemento: empresaData.endereco?.complemento || '',
          bairro: empresaData.endereco?.bairro || '',
          cidade: empresaData.endereco?.cidade || '',
          uf: empresaData.endereco?.uf || '',
          // Fiscal
          regime_tributario: empresaData.config_fiscal?.regime_tributario || '1',
          ambiente: empresaData.config_fiscal?.ambiente || '2',
          serie_nfce: empresaData.config_fiscal?.serie_nfce || '1',
          numero_nfce: empresaData.config_fiscal?.numero_nfce?.toString() || '1',
          serie_nfe: empresaData.config_fiscal?.serie_nfe || '1',
          numero_nfe: empresaData.config_fiscal?.numero_nfe?.toString() || '1',
          // PIX
          chave_pix: empresaData.config_fiscal?.chave_pix || '',
        })
      }
    } catch (error) {
      toast.error('Erro ao carregar dados da empresa')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target

    if (name === 'cnpj') {
      setFormData(prev => ({ ...prev, [name]: formatarCNPJ(value) }))
    } else if (name === 'telefone') {
      setFormData(prev => ({ ...prev, [name]: formatarTelefone(value) }))
    } else if (name === 'cep') {
      setFormData(prev => ({ ...prev, [name]: formatarCEP(value) }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  async function buscarCNPJ() {
    const cnpj = formData.cnpj.replace(/\D/g, '')
    if (cnpj.length !== 14) {
      toast.error('CNPJ inválido')
      return
    }

    if (!validarCNPJ(cnpj)) {
      toast.error('CNPJ inválido')
      return
    }

    setBuscandoCnpj(true)
    try {
      const response = await fetch(`/api/buscar-cnpj?cnpj=${cnpj}`)
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'CNPJ não encontrado')
        return
      }

      setFormData(prev => ({
        ...prev,
        razao_social: data.nome || prev.razao_social,
        nome_fantasia: data.fantasia || '',
        telefone: formatarTelefone(data.telefone?.replace(/\D/g, '') || ''),
        email: data.email?.toLowerCase() || '',
        cep: formatarCEP(data.cep?.replace(/\D/g, '') || ''),
        logradouro: data.logradouro || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        cidade: data.municipio || '',
        uf: data.uf || '',
      }))
      toast.success('Dados do CNPJ encontrados!')
    } catch (error) {
      toast.error('Erro ao buscar CNPJ', {
        description: 'Tente novamente mais tarde',
      })
    } finally {
      setBuscandoCnpj(false)
    }
  }

  async function buscarCEP() {
    const cep = formData.cep.replace(/\D/g, '')
    if (cep.length !== 8) {
      toast.error('CEP inválido')
      return
    }

    setBuscandoCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (data.erro) {
        toast.error('CEP não encontrado')
        return
      }

      setFormData(prev => ({
        ...prev,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        uf: data.uf || '',
      }))
      toast.success('Endereço encontrado!')
    } catch (error) {
      toast.error('Erro ao buscar CEP')
    } finally {
      setBuscandoCep(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!empresa) {
      toast.error('Empresa não encontrada')
      return
    }

    const cnpjLimpo = formData.cnpj.replace(/\D/g, '')
    if (cnpjLimpo && !validarCNPJ(cnpjLimpo)) {
      toast.error('CNPJ inválido')
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

      const config_fiscal = {
        regime_tributario: formData.regime_tributario,
        ambiente: formData.ambiente,
        serie_nfce: formData.serie_nfce,
        numero_nfce: parseInt(formData.numero_nfce) || 1,
        serie_nfe: formData.serie_nfe,
        numero_nfe: parseInt(formData.numero_nfe) || 1,
        chave_pix: formData.chave_pix || null,
      }

      const { error } = await supabase
        .from('empresas')
        .update({
          razao_social: formData.razao_social,
          nome_fantasia: formData.nome_fantasia || null,
          cnpj: cnpjLimpo,
          ie: formData.ie || null,
          telefone: formData.telefone.replace(/\D/g, '') || null,
          email: formData.email || null,
          endereco,
          config_fiscal,
        })
        .eq('id', empresa.id)

      if (error) throw error

      toast.success('Configurações salvas com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao salvar configurações', {
        description: error.message,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleRestaurarPadrao() {
    if (confirmacaoTexto !== 'CONFIRMAR') {
      toast.error('Digite CONFIRMAR para continuar')
      return
    }

    if (!senhaConfirmacao) {
      toast.error('Digite a senha mestre para continuar')
      return
    }

    setRestaurando(true)
    try {
      const payload = {
        confirmacao: 'CONFIRMAR',
        senhaMestre: senhaConfirmacao,
        limparDadosEmpresa: limparDadosEmpresa,
      }
      console.log('Enviando para API:', { ...payload, senhaMestre: '***' })

      const response = await fetch('/api/restaurar-padrao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      console.log('Resposta da API:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao restaurar')
      }

      if (data.success) {
        toast.success('Padrão de fábrica restaurado!', {
          description: limparDadosEmpresa
            ? 'Todos os dados e cadastro da empresa foram excluídos.'
            : 'Todos os dados foram excluídos.',
        })
        setDialogOpen(false)
        setConfirmacaoTexto('')
        setSenhaConfirmacao('')
        setLimparDadosEmpresa(false)
        // Recarregar a página para atualizar os dados
        window.location.reload()
      } else {
        toast.warning('Restauração concluída com avisos', {
          description: 'Verifique o console para detalhes.',
        })
        console.log('Resultados:', data.resultados)
      }
    } catch (error: any) {
      toast.error('Erro ao restaurar padrão', {
        description: error.message,
      })
    } finally {
      setRestaurando(false)
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Configure os dados da empresa e preferências do sistema
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="empresa" className="space-y-4">
          <TabsList>
            <TabsTrigger value="empresa">
              <Building2 className="mr-2 h-4 w-4" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="endereco">
              <MapPin className="mr-2 h-4 w-4" />
              Endereço
            </TabsTrigger>
            <TabsTrigger value="fiscal">
              <FileText className="mr-2 h-4 w-4" />
              Fiscal
            </TabsTrigger>
            <TabsTrigger value="sistema">
              <Settings className="mr-2 h-4 w-4" />
              Sistema
            </TabsTrigger>
          </TabsList>

          {/* Dados da Empresa */}
          <TabsContent value="empresa">
            <EmpresaTab
              formData={formData}
              onChange={handleChange}
              onBuscarCNPJ={buscarCNPJ}
              saving={saving}
              buscandoCnpj={buscandoCnpj}
            />
          </TabsContent>

          {/* Endereço */}
          <TabsContent value="endereco">
            <EnderecoTab
              formData={formData}
              onChange={handleChange}
              onBuscarCEP={buscarCEP}
              saving={saving}
              buscandoCep={buscandoCep}
            />
          </TabsContent>

          {/* Configurações Fiscais */}
          <TabsContent value="fiscal">
            <FiscalTab
              formData={formData}
              onChange={handleChange}
              saving={saving}
            />
          </TabsContent>

          {/* Sistema */}
          <TabsContent value="sistema">
            <SistemaTab
              empresa={empresa}
              temSenhaMestre={temSenhaMestre}
              senhaAtual={senhaAtual}
              novaSenhaMestre={novaSenhaMestre}
              confirmarSenhaMestre={confirmarSenhaMestre}
              salvandoSenhaMestre={salvandoSenhaMestre}
              mostrarSenhaAtual={mostrarSenhaAtual}
              mostrarNovaSenha={mostrarNovaSenha}
              onSenhaAtualChange={setSenhaAtual}
              onNovaSenhaMestreChange={setNovaSenhaMestre}
              onConfirmarSenhaMestreChange={setConfirmarSenhaMestre}
              onMostrarSenhaAtualToggle={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
              onMostrarNovaSenhaToggle={() => setMostrarNovaSenha(!mostrarNovaSenha)}
              onSalvarSenhaMestre={handleSalvarSenhaMestre}
              dialogOpen={dialogOpen}
              onDialogOpenChange={setDialogOpen}
              confirmacaoTexto={confirmacaoTexto}
              senhaConfirmacao={senhaConfirmacao}
              limparDadosEmpresa={limparDadosEmpresa}
              restaurando={restaurando}
              onConfirmacaoTextoChange={setConfirmacaoTexto}
              onSenhaConfirmacaoChange={setSenhaConfirmacao}
              onLimparDadosEmpresaChange={setLimparDadosEmpresa}
              onRestaurarPadrao={handleRestaurarPadrao}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
