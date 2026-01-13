'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Printer,
  Send,
  Edit,
  Loader2,
  FileText,
} from 'lucide-react'
import { printOrcamento } from '@/components/orcamento/orcamento-print'

import {
  type Orcamento,
  type ItemOrcamento,
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusConfig,
  ClienteInfo,
  ItensTable,
  TotaisDisplay,
  ValidadeCard,
  AcoesCard,
  ConvertDialog,
} from '@/components/orcamentos'

export default function OrcamentoViewPage() {
  const params = useParams()
  const router = useRouter()
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null)
  const [itens, setItens] = useState<ItemOrcamento[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showConvertDialog, setShowConvertDialog] = useState(false)

  useEffect(() => {
    fetchOrcamento()
  }, [params.id])

  async function fetchOrcamento() {
    setLoading(true)
    try {
      const response = await fetch(`/api/orcamentos/${params.id}`)
      if (!response.ok) throw new Error('Erro ao buscar orcamento')

      const data = await response.json()
      setOrcamento(data.orcamento)
      setItens(data.itens || [])
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar orcamento')
      router.push('/dashboard/orcamentos')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(status: string) {
    try {
      const response = await fetch(`/api/orcamentos/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error('Erro ao atualizar status')

      toast.success(`Status atualizado para ${status}`)
      fetchOrcamento()
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  async function handleConvert() {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/orcamentos/${params.id}/converter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forma_pagamento: 'dinheiro' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao converter')
      }

      const data = await response.json()
      toast.success(data.message)
      router.push('/dashboard/orcamentos')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao converter orcamento')
    } finally {
      setActionLoading(false)
      setShowConvertDialog(false)
    }
  }

  function handlePrint() {
    if (!orcamento) return

    const empresa = orcamento.empresas ? {
      nome: orcamento.empresas.nome_fantasia || orcamento.empresas.razao_social,
      cnpj: orcamento.empresas.cnpj,
      telefone: orcamento.empresas.telefone,
      endereco: orcamento.empresas.endereco,
    } : null

    const cliente = orcamento.clientes ? {
      nome: orcamento.clientes.nome,
      cpf_cnpj: orcamento.clientes.cpf_cnpj,
      telefone: orcamento.clientes.telefone,
      email: orcamento.clientes.email,
    } : {
      nome: orcamento.cliente_nome,
      cpf_cnpj: orcamento.cliente_cpf_cnpj,
      telefone: orcamento.cliente_telefone,
      email: orcamento.cliente_email,
    }

    printOrcamento({
      orcamento: {
        numero: orcamento.numero,
        data: new Date(orcamento.created_at),
        validade: new Date(orcamento.data_validade),
        status: orcamento.status,
        observacoes: orcamento.observacoes,
        condicoes: orcamento.condicoes,
      },
      empresa,
      cliente,
      itens: itens.map(item => ({
        codigo: item.codigo || '',
        nome: item.nome,
        unidade: item.unidade,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        desconto: item.desconto,
        total: item.total,
      })),
      subtotal: orcamento.subtotal,
      desconto: orcamento.desconto,
      total: orcamento.total,
    })
  }

  function handleWhatsApp() {
    if (!orcamento) return

    const clienteTelefone = orcamento.clientes?.telefone || orcamento.cliente_telefone
    const clienteNome = orcamento.clientes?.nome || orcamento.cliente_nome || 'Cliente'

    const mensagem = `*ORCAMENTO #${orcamento.numero}*
Nenem Pneus

Ola ${clienteNome}!

Segue seu orcamento:

${itens.map(item => `- ${item.nome}: ${item.quantidade}x ${formatCurrency(item.preco_unitario)} = ${formatCurrency(item.total)}`).join('\n')}

*Subtotal:* ${formatCurrency(orcamento.subtotal)}
${orcamento.desconto > 0 ? `*Desconto:* -${formatCurrency(orcamento.desconto)}\n` : ''}*TOTAL: ${formatCurrency(orcamento.total)}*

Valido ate: ${formatDate(orcamento.data_validade)}

${orcamento.condicoes ? `_${orcamento.condicoes}_\n` : ''}
Aguardamos seu retorno!`

    let telefone = clienteTelefone?.replace(/\D/g, '') || ''
    if (telefone.length === 11 || telefone.length === 10) {
      telefone = '55' + telefone
    }

    const url = telefone
      ? `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`
      : `https://wa.me/?text=${encodeURIComponent(mensagem)}`

    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!orcamento) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Orcamento nao encontrado</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/orcamentos">Voltar</Link>
        </Button>
      </div>
    )
  }

  const clienteNome = orcamento.clientes?.nome || orcamento.cliente_nome
  const clienteTelefone = orcamento.clientes?.telefone || orcamento.cliente_telefone
  const clienteEmail = orcamento.clientes?.email || orcamento.cliente_email
  const clienteCpfCnpj = orcamento.clientes?.cpf_cnpj || orcamento.cliente_cpf_cnpj
  const statusConfig = getStatusConfig(orcamento.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/orcamentos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              Orcamento #{orcamento.numero}
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </h1>
            <p className="text-muted-foreground">
              Criado em {formatDateTime(orcamento.created_at)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={handleWhatsApp}>
            <Send className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
          {orcamento.status !== 'convertido' && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/orcamentos/${orcamento.id}/editar`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Info Principal */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes do Orcamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cliente */}
            <ClienteInfo
              nome={clienteNome}
              cpfCnpj={clienteCpfCnpj}
              telefone={clienteTelefone}
              email={clienteEmail}
            />

            {/* Itens */}
            <div>
              <h3 className="font-semibold mb-3">Itens ({itens.length})</h3>
              <ItensTable itens={itens} />
            </div>

            {/* Totais */}
            <TotaisDisplay
              subtotal={orcamento.subtotal}
              desconto={orcamento.desconto}
              total={orcamento.total}
            />

            {/* Observacoes */}
            {orcamento.observacoes && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Observacoes</h3>
                <p className="text-sm whitespace-pre-wrap">{orcamento.observacoes}</p>
              </div>
            )}

            {/* Condicoes */}
            {orcamento.condicoes && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Condicoes</h3>
                <p className="text-sm whitespace-pre-wrap">{orcamento.condicoes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          <ValidadeCard
            dataValidade={orcamento.data_validade}
            status={orcamento.status}
          />

          <AcoesCard
            status={orcamento.status}
            onAprovar={() => updateStatus('aprovado')}
            onRejeitar={() => updateStatus('rejeitado')}
            onConverter={() => setShowConvertDialog(true)}
          />
        </div>
      </div>

      {/* Dialog Converter */}
      <ConvertDialog
        open={showConvertDialog}
        onOpenChange={setShowConvertDialog}
        onConfirm={handleConvert}
        loading={actionLoading}
      />
    </div>
  )
}
