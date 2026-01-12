import { create } from 'zustand'

export interface CartItem {
  id: string
  codigo: string
  nome: string
  preco: number
  quantidade: number
  unidade?: string // UN, KG, L, etc.
  ncm?: string // Codigo NCM para calculo IBPT
  // Desconto por item
  desconto?: number // Valor do desconto em reais
  descontoPercentual?: number // Percentual de desconto
  descontoMotivo?: string // Motivo do desconto
}

interface DescontoGeral {
  valor: number
  percentual: number
  motivo: string
}

interface CartStore {
  items: CartItem[]
  descontoGeral: DescontoGeral
  addItem: (item: Omit<CartItem, 'quantidade'> & { quantidade?: number }) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantidade: number) => void
  // Desconto geral (no total)
  setDescontoGeral: (desconto: DescontoGeral) => void
  clearDescontoGeral: () => void
  // Desconto por item
  setDescontoItem: (id: string, desconto: number, percentual: number, motivo: string) => void
  clearDescontoItem: (id: string) => void
  // Geral
  clearCart: () => void
  getSubtotal: () => number
  getDescontoItens: () => number
  getDescontoTotal: () => number
  getTotal: () => number
  getTotalItems: () => number
  // Legacy - manter compatibilidade
  desconto: number
  setDesconto: (desconto: number) => void
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  descontoGeral: { valor: 0, percentual: 0, motivo: '' },
  desconto: 0, // Legacy

  addItem: (item) => {
    const quantidade = item.quantidade ?? 1
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id)
      if (existing) {
        // Para produtos pesaveis, nao soma - adiciona como item separado ou atualiza
        // Para produtos unitarios, soma a quantidade
        const isPesavel = item.unidade && ['KG', 'G', 'L', 'ML', 'M', 'CM', 'M2', 'M3'].includes(item.unidade.toUpperCase())
        if (isPesavel) {
          // Produtos pesaveis: atualiza a quantidade (substitui)
          return {
            items: state.items.map((i) =>
              i.id === item.id ? { ...i, quantidade: i.quantidade + quantidade } : i
            ),
          }
        }
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantidade: i.quantidade + quantidade } : i
          ),
        }
      }
      return {
        items: [...state.items, { ...item, quantidade }],
      }
    })
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    }))
  },

  updateQuantity: (id, quantidade) => {
    if (quantidade <= 0) {
      get().removeItem(id)
      return
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, quantidade } : i
      ),
    }))
  },

  // Desconto geral (no total da venda)
  setDescontoGeral: (desconto) => {
    set({
      descontoGeral: desconto,
      desconto: desconto.valor // Legacy
    })
  },

  clearDescontoGeral: () => {
    set({
      descontoGeral: { valor: 0, percentual: 0, motivo: '' },
      desconto: 0 // Legacy
    })
  },

  // Desconto por item
  setDescontoItem: (id, desconto, percentual, motivo) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id
          ? { ...i, desconto, descontoPercentual: percentual, descontoMotivo: motivo }
          : i
      ),
    }))
  },

  clearDescontoItem: (id) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id
          ? { ...i, desconto: undefined, descontoPercentual: undefined, descontoMotivo: undefined }
          : i
      ),
    }))
  },

  // Legacy - manter compatibilidade
  setDesconto: (desconto) => {
    set({
      desconto,
      descontoGeral: { valor: desconto, percentual: 0, motivo: '' }
    })
  },

  clearCart: () => {
    set({
      items: [],
      desconto: 0,
      descontoGeral: { valor: 0, percentual: 0, motivo: '' }
    })
  },

  // Subtotal (sem descontos)
  getSubtotal: () => {
    return get().items.reduce((acc, item) => acc + item.preco * item.quantidade, 0)
  },

  // Total de descontos dos itens
  getDescontoItens: () => {
    return get().items.reduce((acc, item) => acc + (item.desconto || 0), 0)
  },

  // Total de descontos (itens + geral)
  getDescontoTotal: () => {
    const descontoItens = get().getDescontoItens()
    const descontoGeral = get().descontoGeral.valor
    return descontoItens + descontoGeral
  },

  // Total final
  getTotal: () => {
    const subtotal = get().getSubtotal()
    const descontoTotal = get().getDescontoTotal()
    return Math.max(0, subtotal - descontoTotal)
  },

  getTotalItems: () => {
    return get().items.reduce((acc, item) => acc + item.quantidade, 0)
  },
}))
