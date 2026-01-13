'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Loader2,
  Lock,
  ArrowDownCircle,
  ArrowUpCircle,
  ShoppingCart,
  RefreshCw,
} from 'lucide-react'

import {
  type Caixa,
  type Movimento,
  type Resumo,
  formatCurrency,
  CaixaFechadoCard,
  ResumoCards,
  FormasPagamentoCard,
  MovimentosTable,
  AbrirCaixaModal,
  FecharCaixaModal,
  SangriaModal,
  SuprimentoModal,
} from '@/components/pdv-caixa'

export default function CaixaPage() {
  const [loading, setLoading] = useState(true)
  const [operando, setOperando] = useState(false)
  const [caixa, setCaixa] = useState<Caixa | null>(null)
  const [movimentos, setMovimentos] = useState<Movimento[]>([])
  const [resumo, setResumo] = useState<Resumo>({
    total_vendas: 0,
    total_sangrias: 0,
    total_suprimentos: 0,
    total_dinheiro: 0,
    total_cartao_credito: 0,
    total_cartao_debito: 0,
    total_pix: 0,
    quantidade_vendas: 0,
  })
  const [nomeUsuario, setNomeUsuario] = useState('')

  // Dialogs
  const [dialogAbrir, setDialogAbrir] = useState(false)
  const [dialogFechar, setDialogFechar] = useState(false)
  const [dialogSangria, setDialogSangria] = useState(false)
  const [dialogSuprimento, setDialogSuprimento] = useState(false)

  // Form values
  const [valorAbertura, setValorAbertura] = useState('')
  const [valorFechamento, setValorFechamento] = useState('')
  const [valorSangria, setValorSangria] = useState('')
  const [valorSuprimento, setValorSuprimento] = useState('')
  const [observacao, setObservacao] = useState('')

  const carregarCaixa = useCallback(async () => {
    try {
      const response = await fetch('/api/caixa')
      const data = await response.json()

      if (response.ok) {
        setCaixa(data.caixa)
        setMovimentos(data.movimentos || [])
        setResumo(data.resumo)
        setNomeUsuario(data.usuario?.nome || '')
      }
    } catch {
      toast.error('Erro ao carregar caixa')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregarCaixa()
  }, [carregarCaixa])

  const handleAbrir = async () => {
    setOperando(true)
    try {
      const response = await fetch('/api/caixa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operacao: 'abrir',
          valor: parseFloat(valorAbertura) || 0,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      toast.success('Caixa aberto com sucesso!')
      setDialogAbrir(false)
      setValorAbertura('')
      carregarCaixa()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setOperando(false)
    }
  }

  const handleFechar = async () => {
    setOperando(true)
    try {
      const response = await fetch('/api/caixa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operacao: 'fechar',
          valor: parseFloat(valorFechamento) || 0,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      const diferenca = data.resumo?.diferenca || 0
      if (diferenca === 0) {
        toast.success('Caixa fechado! Valores conferem.')
      } else if (diferenca > 0) {
        toast.warning(`Caixa fechado com sobra de ${formatCurrency(diferenca)}`)
      } else {
        toast.error(`Caixa fechado com falta de ${formatCurrency(Math.abs(diferenca))}`)
      }

      setDialogFechar(false)
      setValorFechamento('')
      carregarCaixa()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setOperando(false)
    }
  }

  const handleSangria = async () => {
    setOperando(true)
    try {
      const response = await fetch('/api/caixa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operacao: 'sangria',
          valor: parseFloat(valorSangria) || 0,
          observacao,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      toast.success('Sangria registrada!')
      setDialogSangria(false)
      setValorSangria('')
      setObservacao('')
      carregarCaixa()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setOperando(false)
    }
  }

  const handleSuprimento = async () => {
    setOperando(true)
    try {
      const response = await fetch('/api/caixa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operacao: 'suprimento',
          valor: parseFloat(valorSuprimento) || 0,
          observacao,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      toast.success('Suprimento registrado!')
      setDialogSuprimento(false)
      setValorSuprimento('')
      setObservacao('')
      carregarCaixa()
    } catch (error) {
      toast.error((error as Error).message)
    } finally {
      setOperando(false)
    }
  }

  // Calcular saldo atual
  const saldoAtual = caixa
    ? (caixa.valor_abertura || 0) +
      resumo.total_dinheiro +
      resumo.total_suprimentos -
      resumo.total_sangrias
    : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/pdv">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Controle de Caixa</h1>
              <p className="text-muted-foreground">Operador: {nomeUsuario}</p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={carregarCaixa}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Status do Caixa */}
        {!caixa ? (
          <CaixaFechadoCard onAbrir={() => setDialogAbrir(true)} />
        ) : (
          <>
            <ResumoCards caixa={caixa} resumo={resumo} saldoAtual={saldoAtual} />

            <FormasPagamentoCard resumo={resumo} />

            {/* Acoes */}
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setDialogSangria(true)}>
                <ArrowUpCircle className="mr-2 h-4 w-4 text-red-500" />
                Sangria
              </Button>
              <Button variant="outline" onClick={() => setDialogSuprimento(true)}>
                <ArrowDownCircle className="mr-2 h-4 w-4 text-green-500" />
                Suprimento
              </Button>
              <Button variant="default" asChild>
                <Link href="/pdv">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Ir para PDV
                </Link>
              </Button>
              <Button variant="destructive" onClick={() => setDialogFechar(true)}>
                <Lock className="mr-2 h-4 w-4" />
                Fechar Caixa
              </Button>
            </div>

            <MovimentosTable movimentos={movimentos} />
          </>
        )}
      </div>

      {/* Modals */}
      <AbrirCaixaModal
        open={dialogAbrir}
        onOpenChange={setDialogAbrir}
        valor={valorAbertura}
        onValorChange={setValorAbertura}
        onConfirm={handleAbrir}
        operando={operando}
      />

      <FecharCaixaModal
        open={dialogFechar}
        onOpenChange={setDialogFechar}
        valor={valorFechamento}
        onValorChange={setValorFechamento}
        onConfirm={handleFechar}
        operando={operando}
        saldoEsperado={saldoAtual}
      />

      <SangriaModal
        open={dialogSangria}
        onOpenChange={setDialogSangria}
        valor={valorSangria}
        onValorChange={setValorSangria}
        observacao={observacao}
        onObservacaoChange={setObservacao}
        onConfirm={handleSangria}
        operando={operando}
      />

      <SuprimentoModal
        open={dialogSuprimento}
        onOpenChange={setDialogSuprimento}
        valor={valorSuprimento}
        onValorChange={setValorSuprimento}
        observacao={observacao}
        onObservacaoChange={setObservacao}
        onConfirm={handleSuprimento}
        operando={operando}
      />
    </div>
  )
}
