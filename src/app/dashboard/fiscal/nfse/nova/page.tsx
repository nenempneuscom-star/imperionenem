'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'

import {
  TomadorCard,
  ServicoCard,
  ValoresCard,
  FormActions,
  type Servico,
  type ClienteNFSe,
  type NFSeFormData,
  FORM_DATA_INICIAL,
  ENDERECO_PADRAO,
} from '@/components/nfse'

export default function NovaNFSePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [servicos, setServicos] = useState<Servico[]>([])
  const [clientes, setClientes] = useState<ClienteNFSe[]>([])
  const [searchCliente, setSearchCliente] = useState('')
  const [formData, setFormData] = useState<NFSeFormData>(FORM_DATA_INICIAL)

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

    try {
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

      const response = await fetch('/api/nfse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'rascunho',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao emitir NFS-e')
      }

      toast.success('RPS gerado com sucesso! Baixe o XML para enviar a prefeitura.')
      router.push('/dashboard/fiscal/nfse')
    } catch (error: any) {
      console.error('Erro:', error)
      toast.error(error.message || 'Erro ao emitir NFS-e')
    } finally {
      setLoading(false)
    }
  }

  const filteredClientes = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(searchCliente.toLowerCase()) ||
      c.cpf_cnpj.includes(searchCliente)
  )

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
