'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Wifi,
  WifiOff,
  CloudOff,
  LockOpen,
  Wallet,
  Download,
  RefreshCw,
  Keyboard,
} from 'lucide-react'
import type { CaixaAberto } from './types'

interface PDVHeaderProps {
  isOnline: boolean
  vendasPendentes: number
  caixaAberto: CaixaAberto | null
  loadingCaixa: boolean
  isSyncing: boolean
  onCacheProducts: () => void
  onSincronizar: () => void
  onShowAjuda: () => void
}

export function PDVHeader({
  isOnline,
  vendasPendentes,
  caixaAberto,
  loadingCaixa,
  isSyncing,
  onCacheProducts,
  onSincronizar,
  onShowAjuda,
}: PDVHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">PDV - Ponto de Venda</h1>

        {/* Status de conexao */}
        {isOnline ? (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <Wifi className="h-3 w-3 mr-1" />
            Online
          </Badge>
        ) : (
          <Badge variant="destructive">
            <WifiOff className="h-3 w-3 mr-1" />
            Offline
          </Badge>
        )}

        {/* Vendas pendentes */}
        {vendasPendentes > 0 && (
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700">
            <CloudOff className="h-3 w-3 mr-1" />
            {vendasPendentes} pendente{vendasPendentes > 1 ? 's' : ''}
          </Badge>
        )}

        {/* Status do Caixa */}
        {!loadingCaixa && (
          <Link href="/pdv/caixa">
            {caixaAberto ? (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700 cursor-pointer">
                <LockOpen className="h-3 w-3 mr-1" />
                Caixa Aberto
              </Badge>
            ) : (
              <Badge variant="destructive" className="cursor-pointer">
                <Wallet className="h-3 w-3 mr-1" />
                Abrir Caixa
              </Badge>
            )}
          </Link>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCacheProducts}
          disabled={!isOnline}
          title="Baixar produtos para uso offline"
        >
          <Download className="h-4 w-4 mr-1" />
          <span className="hidden md:inline">Cache</span>
        </Button>

        {vendasPendentes > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSincronizar}
            disabled={!isOnline || isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Sincronizar</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onShowAjuda}
          className="text-muted-foreground"
        >
          <Keyboard className="h-4 w-4 mr-1" />
          <span className="hidden md:inline">F1: Atalhos</span>
        </Button>
      </div>
    </div>
  )
}
