'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Star,
  Users,
  TrendingUp,
  Search,
  Loader2,
  Plus,
  Minus,
  Award,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react'
import {
  type FidelidadeConfig,
  type ClientePontos,
  type Movimento,
  formatCurrency,
  formatDate,
  formatPontos,
} from './types'

interface PontosTabProps {
  config: FidelidadeConfig | null
  clientes: ClientePontos[]
  clienteSelecionado: ClientePontos | null
  movimentos: Movimento[]
  loadingMovimentos: boolean
  search: string
  onSearchChange: (value: string) => void
  onSelectCliente: (cliente: ClientePontos) => void
  onAdicionar: () => void
  onRemover: () => void
}

export function PontosTab({
  config,
  clientes,
  clienteSelecionado,
  movimentos,
  loadingMovimentos,
  search,
  onSearchChange,
  onSelectCliente,
  onAdicionar,
  onRemover,
}: PontosTabProps) {
  // Estatisticas
  const totalPontosAtivos = clientes.reduce((acc, c) => acc + c.saldo_pontos, 0)
  const totalClientes = clientes.length
  const valorEmPontos = config ? totalPontosAtivos * config.valor_ponto_resgate : 0

  // Filtrar clientes
  const clientesFiltrados = clientes.filter(
    (c) =>
      c.cliente?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      c.cliente?.cpf_cnpj?.includes(search)
  )

  return (
    <div className="space-y-4">
      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pontos em Circulacao</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPontos(totalPontosAtivos)}</div>
            <p className="text-xs text-muted-foreground">
              Equivalente a {formatCurrency(valorEmPontos)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes Fidelidade</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClientes}</div>
            <p className="text-xs text-muted-foreground">
              Com pontos acumulados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversao</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {config ? `${config.pontos_por_real} pts/R$` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {config ? `1 ponto = ${formatCurrency(config.valor_ponto_resgate)}` : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lista de clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>Clientes com pontos no programa</CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CPF/CNPJ..."
                className="pl-10"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {clientesFiltrados.length > 0 ? (
                <div className="space-y-2">
                  {clientesFiltrados.map((cp) => (
                    <button
                      key={cp.id}
                      className={`w-full p-3 rounded-lg border text-left transition-colors hover:bg-muted ${
                        clienteSelecionado?.id === cp.id ? 'bg-muted border-primary' : ''
                      }`}
                      onClick={() => onSelectCliente(cp)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{cp.cliente?.nome}</p>
                          <p className="text-sm text-muted-foreground">{cp.cliente?.cpf_cnpj}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold text-lg">{formatPontos(cp.saldo_pontos)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            = {formatCurrency(cp.saldo_pontos * (config?.valor_ponto_resgate || 0))}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Nenhum cliente com pontos</p>
                  <p className="text-sm">Os pontos sao acumulados automaticamente nas vendas</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Detalhes do cliente */}
        <Card>
          <CardHeader>
            <CardTitle>
              {clienteSelecionado ? clienteSelecionado.cliente?.nome : 'Selecione um cliente'}
            </CardTitle>
            {clienteSelecionado && (
              <CardDescription>{clienteSelecionado.cliente?.cpf_cnpj}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {clienteSelecionado ? (
              <div className="space-y-4">
                {/* Resumo */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-xs text-muted-foreground">Saldo</p>
                    <p className="text-lg font-bold">{formatPontos(clienteSelecionado.saldo_pontos)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-xs text-muted-foreground">Acumulado</p>
                    <p className="text-lg font-bold text-green-600">{formatPontos(clienteSelecionado.total_acumulado)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-xs text-muted-foreground">Resgatado</p>
                    <p className="text-lg font-bold text-blue-600">{formatPontos(clienteSelecionado.total_resgatado)}</p>
                  </div>
                </div>

                {/* Botoes de acao */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onAdicionar}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onRemover}
                    disabled={clienteSelecionado.saldo_pontos === 0}
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                </div>

                {/* Historico */}
                <div>
                  <h3 className="font-medium mb-2">Historico</h3>
                  {loadingMovimentos ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : movimentos.length > 0 ? (
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {movimentos.map((mov) => (
                          <div
                            key={mov.id}
                            className="flex items-center justify-between p-2 rounded border text-sm"
                          >
                            <div className="flex items-center gap-2">
                              {mov.tipo === 'acumulo' || (mov.tipo === 'ajuste' && mov.pontos > 0) ? (
                                <ArrowUpCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <ArrowDownCircle className="h-4 w-4 text-red-500" />
                              )}
                              <div>
                                <p className="font-medium">
                                  {mov.tipo === 'acumulo' && 'Acumulo'}
                                  {mov.tipo === 'resgate' && 'Resgate'}
                                  {mov.tipo === 'expiracao' && 'Expiracao'}
                                  {mov.tipo === 'ajuste' && 'Ajuste'}
                                  {mov.venda && mov.venda[0] && ` - Venda #${mov.venda[0].numero}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(mov.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium ${mov.pontos > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {mov.pontos > 0 ? '+' : ''}{formatPontos(mov.pontos)} pts
                              </p>
                              {mov.valor_venda && (
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(mov.valor_venda)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma movimentacao
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Selecione um cliente para ver os detalhes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
