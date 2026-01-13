'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ArrowLeft, Globe, Building2 } from 'lucide-react'

import {
  TomadorCard,
  ServicoCard,
  ValoresCard,
  FormActions,
  StatusCard,
  type Servico,
  type ClienteNFSe,
  type NFSeFormData,
  type StatusNFSeADN,
  type ADNErro,
  FORM_DATA_INICIAL,
  ENDERECO_PADRAO,
} from '@/components/nfse'

interface NFSeResultado {
  id: string
  numero_rps: number
  numero_nfse?: string
  status: StatusNFSeADN
  chave_acesso?: string
  protocolo_autorizacao?: string
  data_autorizacao?: string
  link_danfse?: string
  ambiente_adn: 'homologacao' | 'producao'
  erros?: ADNErro[]
  xml_dps?: string
}

export default function NovaNFSePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [servicos, setServicos] = useState<Servico[]>([])
  const [clientes, setClientes] = useState<ClienteNFSe[]>([])
  const [searchCliente, setSearchCliente] = useState('')
  const [formData, setFormData] = useState<NFSeFormData>(FORM_DATA_INICIAL)
  const [resultado, setResultado] = useState<NFSeResultado | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchServicos()
    fetchClientes()
  }, [])

  async function fetchServicos() {
    const { data } = await supabase
      .from('servicos')
      .select('*')
      .eq('ativo', true)
      .order('codigo')
    setServicos(data || [])
  }

  async function fetchClientes() {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .eq('ativo', true)
      .order('nome')
    setClientes(data || [])
  }

  function handleFormDataChange(data: Partial<NFSeFormData>) {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  function handleServicoChange(servicoId: string) {
    const servico = servicos.find((s) => s.id === servicoId)
    if (servico) {
      setFormData((prev) => ({
        ...prev,
        servico_id: servicoId,
        item_lista_servico: servico.item_lista_servico,
        discriminacao: servico.descricao,
        aliquota_iss: servico.aliquota_iss,
        valor_servicos: servico.valor_padrao || prev.valor_servicos,
      }))
    }
  }

  function handleClienteSelect(cliente: ClienteNFSe) {
    setFormData((prev) => ({
      ...prev,
      tomador_tipo_pessoa: cliente.tipo_pessoa || 'PF',
      tomador_cpf_cnpj: cliente.cpf_cnpj,
      tomador_razao_social: cliente.nome,
      tomador_email: cliente.email || '',
      tomador_telefone: cliente.telefone || '',
      tomador_endereco: cliente.endereco || ENDERECO_PADRAO,
    }))
    setSearchCliente('')
  }

  async function buscarCep(cep: string) {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          tomador_endereco: {
            ...prev.tomador_endereco,
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            uf: data.uf || 'SC',
            cep: cepLimpo,
          },
        }))
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResultado(null)

    try {
      // Validacoes
      if (!formData.tomador_cpf_cnpj || !formData.tomador_razao_social) {
        toast.error('Preencha os dados do tomador')
        return
      }

      if (!formData.discriminacao) {
        toast.error('Preencha a discriminacao do servico')
        return
      }

      if (formData.valor_servicos <= 0) {
        toast.error('O valor do servico deve ser maior que zero')
        return
      }

      // Escolher endpoint baseado na opcao ADN
      const endpoint = formData.usar_adn ? '/api/nfse/adn' : '/api/nfse'

      // Se usar ADN, emitir diretamente (autoriza em homologacao/producao)
      // Se legado, criar RPS como rascunho para envio manual
      const statusEnvio = formData.usar_adn ? 'pendente' : 'rascunho'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: statusEnvio,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Mostrar erros se houver
        if (data.erros) {
          setResultado({
            id: '',
            numero_rps: 0,
            status: 'rejeitada',
            ambiente_adn: 'homologacao',
            erros: data.erros,
          })
        }
        throw new Error(data.error || 'Erro ao emitir NFS-e')
      }

      // Sucesso - mostrar resultado
      setResultado({
        id: data.id,
        numero_rps: data.numero_rps,
        numero_nfse: data.numero_nfse,
        status: data.status || 'autorizada',
        chave_acesso: data.chave_acesso || data.chaveAcesso,
        protocolo_autorizacao: data.protocolo_autorizacao,
        data_autorizacao: data.data_autorizacao,
        link_danfse: data.link_danfse || data.linkDANFSe,
        ambiente_adn: data.ambiente_adn || 'homologacao',
        xml_dps: data.xml_dps,
      })

      if (formData.usar_adn) {
        toast.success(data.mensagem || 'NFS-e processada com sucesso!')
      } else {
        toast.success('RPS gerado com sucesso! Baixe o XML para enviar a prefeitura.')
      }
    } catch (error: any) {
      console.error('Erro:', error)
      toast.error(error.message || 'Erro ao emitir NFS-e')
    } finally {
      setLoading(false)
    }
  }

  function handleNovaEmissao() {
    setResultado(null)
    setFormData(FORM_DATA_INICIAL)
  }

  function handleDownloadXML() {
    if (!resultado?.xml_dps) return

    const blob = new Blob([resultado.xml_dps], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `DPS_${resultado.numero_rps}.xml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('XML baixado com sucesso!')
  }

  const filteredClientes = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(searchCliente.toLowerCase()) ||
      c.cpf_cnpj.includes(searchCliente)
  )

  // Se ja tem resultado, mostrar o StatusCard
  if (resultado && resultado.status !== 'rejeitada') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">NFS-e Emitida</h1>
            <p className="text-muted-foreground">
              Resultado da emissao
            </p>
          </div>
        </div>

        <StatusCard
          nfse={resultado}
          onDownloadXML={resultado.xml_dps ? handleDownloadXML : undefined}
        />

        <div className="flex gap-4">
          <Button onClick={handleNovaEmissao}>
            Emitir Nova NFS-e
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/fiscal/nfse')}>
            Ver Lista de NFS-e
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emitir NFS-e</h1>
          <p className="text-muted-foreground">
            Nota Fiscal de Servico Eletronica
          </p>
        </div>
      </div>

      {/* Card de selecao ADN vs Legado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Metodo de Emissao
          </CardTitle>
          <CardDescription>
            Escolha como deseja emitir a NFS-e
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              {formData.usar_adn ? (
                <Globe className="h-8 w-8 text-blue-600" />
              ) : (
                <Building2 className="h-8 w-8 text-gray-600" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {formData.usar_adn ? 'ADN - Padrao Nacional' : 'ABRASF - Prefeitura Local'}
                  </span>
                  {formData.usar_adn && (
                    <Badge variant="secondary" className="text-xs">Recomendado</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formData.usar_adn
                    ? 'Emissao via Ambiente de Dados Nacional (gratuito, inclui IBS/CBS)'
                    : 'Emissao via webservice da prefeitura (modelo antigo)'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="usar_adn" className="text-sm">Usar ADN</Label>
              <Switch
                id="usar_adn"
                checked={formData.usar_adn}
                onCheckedChange={(checked) => handleFormDataChange({ usar_adn: checked })}
              />
            </div>
          </div>

          {formData.usar_adn && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Vantagens do ADN:</strong> Servico gratuito do governo, integracao nacional unificada,
                suporte a IBS/CBS (Reforma Tributaria 2026), e DANFSE com QR Code.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Erros de validacao (se houver) */}
      {resultado && resultado.status === 'rejeitada' && resultado.erros && (
        <StatusCard
          nfse={resultado}
          onRefresh={() => setResultado(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <TomadorCard
          formData={formData}
          onFormDataChange={handleFormDataChange}
          searchCliente={searchCliente}
          onSearchClienteChange={setSearchCliente}
          filteredClientes={filteredClientes}
          onClienteSelect={handleClienteSelect}
          onBuscarCep={buscarCep}
        />

        <ServicoCard
          formData={formData}
          onFormDataChange={handleFormDataChange}
          servicos={servicos}
          onServicoChange={handleServicoChange}
        />

        <ValoresCard
          formData={formData}
          onFormDataChange={handleFormDataChange}
        />

        <FormActions
          loading={loading}
          onCancel={() => router.back()}
        />
      </form>
    </div>
  )
}
