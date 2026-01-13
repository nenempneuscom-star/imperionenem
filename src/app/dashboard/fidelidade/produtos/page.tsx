'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Gift, Loader2, Plus, ArrowLeft } from 'lucide-react'

import {
  type ProdutoFidelidade,
  type ProdutoCatalogo,
  ProdutosGrid,
  ProdutoModal,
  DeleteProdutoDialog,
} from '@/components/fidelidade'

export default function ProdutosResgataveisPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [empresaId, setEmpresaId] = useState<string | null>(null)

  const [produtosFidelidade, setProdutosFidelidade] = useState<ProdutoFidelidade[]>([])
  const [search, setSearch] = useState('')

  // Modal de edicao/criacao
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<ProdutoFidelidade | null>(null)
  const [salvando, setSalvando] = useState(false)

  // Form
  const [formNome, setFormNome] = useState('')
  const [formDescricao, setFormDescricao] = useState('')
  const [formPontos, setFormPontos] = useState('')
  const [formEstoque, setFormEstoque] = useState('')
  const [formAtivo, setFormAtivo] = useState(true)
  const [formProdutoId, setFormProdutoId] = useState<string | null>(null)

  // Busca de produto
  const [buscaProduto, setBuscaProduto] = useState('')
  const [produtosEncontrados, setProdutosEncontrados] = useState<ProdutoCatalogo[]>([])
  const [buscandoProduto, setBuscandoProduto] = useState(false)

  // Delete
  const [produtoParaDeletar, setProdutoParaDeletar] = useState<ProdutoFidelidade | null>(null)
  const [deletando, setDeletando] = useState(false)

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

      const { data: produtos } = await supabase
        .from('fidelidade_produtos')
        .select(`
          *,
          produto:produtos(nome, codigo)
        `)
        .eq('empresa_id', usuario.empresa_id)
        .order('pontos_necessarios', { ascending: true })

      if (produtos) {
        setProdutosFidelidade(produtos.map(p => ({
          ...p,
          produto: Array.isArray(p.produto) ? p.produto[0] : p.produto
        })))
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  async function buscarProdutos(termo: string) {
    if (!termo.trim()) {
      setProdutosEncontrados([])
      return
    }

    setBuscandoProduto(true)
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, codigo, nome, preco_venda')
        .eq('ativo', true)
        .or(`codigo.ilike.%${termo}%,nome.ilike.%${termo}%`)
        .order('nome')
        .limit(5)

      if (error) throw error
      setProdutosEncontrados(data || [])
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    } finally {
      setBuscandoProduto(false)
    }
  }

  // Debounce na busca de produtos
  useEffect(() => {
    const timer = setTimeout(() => {
      buscarProdutos(buscaProduto)
    }, 300)
    return () => clearTimeout(timer)
  }, [buscaProduto])

  function abrirModal(produto?: ProdutoFidelidade) {
    if (produto) {
      setEditando(produto)
      setFormNome(produto.nome)
      setFormDescricao(produto.descricao || '')
      setFormPontos(String(produto.pontos_necessarios))
      setFormEstoque(produto.estoque_disponivel !== null ? String(produto.estoque_disponivel) : '')
      setFormAtivo(produto.ativo)
      setFormProdutoId(produto.produto_id)
    } else {
      setEditando(null)
      setFormNome('')
      setFormDescricao('')
      setFormPontos('')
      setFormEstoque('')
      setFormAtivo(true)
      setFormProdutoId(null)
    }
    setBuscaProduto('')
    setProdutosEncontrados([])
    setShowModal(true)
  }

  function selecionarProduto(produto: ProdutoCatalogo) {
    setFormProdutoId(produto.id)
    setFormNome(produto.nome)
    setBuscaProduto('')
    setProdutosEncontrados([])
  }

  async function salvar() {
    if (!empresaId) return

    const pontos = parseFloat(formPontos)
    if (!formNome.trim() || isNaN(pontos) || pontos <= 0) {
      toast.error('Preencha nome e pontos corretamente')
      return
    }

    setSalvando(true)
    try {
      const dados = {
        empresa_id: empresaId,
        produto_id: formProdutoId,
        nome: formNome.trim(),
        descricao: formDescricao.trim() || null,
        pontos_necessarios: pontos,
        estoque_disponivel: formEstoque ? parseInt(formEstoque) : null,
        ativo: formAtivo,
      }

      if (editando) {
        const { error } = await supabase
          .from('fidelidade_produtos')
          .update({
            ...dados,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editando.id)

        if (error) throw error
        toast.success('Produto atualizado!')
      } else {
        const { error } = await supabase
          .from('fidelidade_produtos')
          .insert(dados)

        if (error) throw error
        toast.success('Produto cadastrado!')
      }

      setShowModal(false)
      carregarDados()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar produto')
    } finally {
      setSalvando(false)
    }
  }

  async function deletar() {
    if (!produtoParaDeletar) return

    setDeletando(true)
    try {
      const { error } = await supabase
        .from('fidelidade_produtos')
        .delete()
        .eq('id', produtoParaDeletar.id)

      if (error) throw error
      toast.success('Produto removido!')
      setProdutoParaDeletar(null)
      carregarDados()
    } catch (error) {
      console.error('Erro ao deletar:', error)
      toast.error('Erro ao remover produto')
    } finally {
      setDeletando(false)
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/fidelidade">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Gift className="h-8 w-8" />
              Produtos Resgatáveis
            </h1>
            <p className="text-muted-foreground">
              Gerencie os produtos disponíveis para troca por pontos
            </p>
          </div>
        </div>
        <Button onClick={() => abrirModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <ProdutosGrid
        produtos={produtosFidelidade}
        search={search}
        onSearchChange={setSearch}
        onEdit={abrirModal}
        onDelete={setProdutoParaDeletar}
        onNovo={() => abrirModal()}
      />

      <ProdutoModal
        open={showModal}
        onOpenChange={setShowModal}
        editando={!!editando}
        salvando={salvando}
        onSalvar={salvar}
        nome={formNome}
        onNomeChange={setFormNome}
        descricao={formDescricao}
        onDescricaoChange={setFormDescricao}
        pontos={formPontos}
        onPontosChange={setFormPontos}
        estoque={formEstoque}
        onEstoqueChange={setFormEstoque}
        ativo={formAtivo}
        onAtivoChange={setFormAtivo}
        produtoVinculado={!!formProdutoId}
        onRemoverVinculo={() => setFormProdutoId(null)}
        buscaProduto={buscaProduto}
        onBuscaProdutoChange={setBuscaProduto}
        buscandoProduto={buscandoProduto}
        produtosEncontrados={produtosEncontrados}
        onSelecionarProduto={selecionarProduto}
      />

      <DeleteProdutoDialog
        produto={produtoParaDeletar}
        onOpenChange={() => setProdutoParaDeletar(null)}
        onConfirm={deletar}
        deletando={deletando}
      />
    </div>
  )
}
