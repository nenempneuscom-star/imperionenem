'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Loader2, Key, Eye, EyeOff, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react'
import { type Empresa } from './types'

interface SistemaTabProps {
  empresa: Empresa | null
  // Senha mestre
  temSenhaMestre: boolean
  senhaAtual: string
  novaSenhaMestre: string
  confirmarSenhaMestre: string
  salvandoSenhaMestre: boolean
  mostrarSenhaAtual: boolean
  mostrarNovaSenha: boolean
  onSenhaAtualChange: (value: string) => void
  onNovaSenhaMestreChange: (value: string) => void
  onConfirmarSenhaMestreChange: (value: string) => void
  onMostrarSenhaAtualToggle: () => void
  onMostrarNovaSenhaToggle: () => void
  onSalvarSenhaMestre: () => void
  // Restaurar padrao
  dialogOpen: boolean
  onDialogOpenChange: (open: boolean) => void
  confirmacaoTexto: string
  senhaConfirmacao: string
  limparDadosEmpresa: boolean
  restaurando: boolean
  onConfirmacaoTextoChange: (value: string) => void
  onSenhaConfirmacaoChange: (value: string) => void
  onLimparDadosEmpresaChange: (checked: boolean) => void
  onRestaurarPadrao: () => void
}

export function SistemaTab({
  empresa,
  temSenhaMestre,
  senhaAtual,
  novaSenhaMestre,
  confirmarSenhaMestre,
  salvandoSenhaMestre,
  mostrarSenhaAtual,
  mostrarNovaSenha,
  onSenhaAtualChange,
  onNovaSenhaMestreChange,
  onConfirmarSenhaMestreChange,
  onMostrarSenhaAtualToggle,
  onMostrarNovaSenhaToggle,
  onSalvarSenhaMestre,
  dialogOpen,
  onDialogOpenChange,
  confirmacaoTexto,
  senhaConfirmacao,
  limparDadosEmpresa,
  restaurando,
  onConfirmacaoTextoChange,
  onSenhaConfirmacaoChange,
  onLimparDadosEmpresaChange,
  onRestaurarPadrao,
}: SistemaTabProps) {
  return (
    <div className="space-y-6">
      {/* Informacoes do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Informacoes do Sistema</CardTitle>
          <CardDescription>
            Dados gerais sobre a instalacao
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Versao do Sistema</p>
              <p className="text-lg font-semibold">1.0.0</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">ID da Empresa</p>
              <p className="text-sm font-mono">{empresa?.id || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Senha Mestre */}
      <Card className="border-amber-200 dark:border-amber-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-600" />
            Senha Mestre
            {temSenhaMestre && (
              <span className="ml-2 inline-flex items-center gap-1 text-sm font-normal text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Configurada
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Senha de seguranca para operacoes criticas. Apenas o dono da empresa deve conhecer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Importante:</strong> Esta senha e diferente da senha de login.
              Ela e necessaria para operacoes criticas como restaurar padrao de fabrica.
              Guarde-a em local seguro e nao compartilhe com funcionarios.
            </p>
          </div>

          <div className="space-y-4 max-w-md">
            {temSenhaMestre && (
              <div className="space-y-2">
                <Label htmlFor="senha-atual">Senha Mestre Atual</Label>
                <div className="relative">
                  <Input
                    id="senha-atual"
                    type={mostrarSenhaAtual ? 'text' : 'password'}
                    placeholder="Digite a senha atual"
                    value={senhaAtual}
                    onChange={(e) => onSenhaAtualChange(e.target.value)}
                    disabled={salvandoSenhaMestre}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={onMostrarSenhaAtualToggle}
                  >
                    {mostrarSenhaAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nova-senha">{temSenhaMestre ? 'Nova Senha Mestre' : 'Criar Senha Mestre'}</Label>
              <div className="relative">
                <Input
                  id="nova-senha"
                  type={mostrarNovaSenha ? 'text' : 'password'}
                  placeholder="Minimo 6 caracteres"
                  value={novaSenhaMestre}
                  onChange={(e) => onNovaSenhaMestreChange(e.target.value)}
                  disabled={salvandoSenhaMestre}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={onMostrarNovaSenhaToggle}
                >
                  {mostrarNovaSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmar-senha">Confirmar Senha</Label>
              <Input
                id="confirmar-senha"
                type="password"
                placeholder="Repita a senha"
                value={confirmarSenhaMestre}
                onChange={(e) => onConfirmarSenhaMestreChange(e.target.value)}
                disabled={salvandoSenhaMestre}
              />
            </div>

            <Button
              type="button"
              onClick={onSalvarSenhaMestre}
              disabled={salvandoSenhaMestre || !novaSenhaMestre || !confirmarSenhaMestre}
              className="w-full"
            >
              {salvandoSenhaMestre ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  {temSenhaMestre ? 'Alterar Senha Mestre' : 'Definir Senha Mestre'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Zona de Perigo */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Acoes irreversiveis que afetam todos os dados do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-950/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 dark:text-red-200">
                  Restaurar Padrao de Fabrica
                </h4>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Esta acao ira apagar TODOS os dados do sistema: produtos, clientes, vendas,
                  estoque, contas e demais registros. Esta acao e IRREVERSIVEL.
                </p>
              </div>
              <AlertDialog open={dialogOpen} onOpenChange={onDialogOpenChange}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={!temSenhaMestre}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restaurar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Confirmar Restauracao
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-4">
                        <p>
                          Voce esta prestes a apagar <strong>TODOS</strong> os dados do sistema.
                          Esta acao e <strong>IRREVERSIVEL</strong>.
                        </p>

                        <div className="space-y-2">
                          <Label htmlFor="confirmacao">
                            Digite <strong>RESTAURAR</strong> para confirmar:
                          </Label>
                          <Input
                            id="confirmacao"
                            value={confirmacaoTexto}
                            onChange={(e) => onConfirmacaoTextoChange(e.target.value.toUpperCase())}
                            placeholder="RESTAURAR"
                            disabled={restaurando}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="senha-confirmacao">Senha Mestre:</Label>
                          <Input
                            id="senha-confirmacao"
                            type="password"
                            value={senhaConfirmacao}
                            onChange={(e) => onSenhaConfirmacaoChange(e.target.value)}
                            placeholder="Digite a senha mestre"
                            disabled={restaurando}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="limpar-empresa"
                            checked={limparDadosEmpresa}
                            onCheckedChange={(checked) => onLimparDadosEmpresaChange(checked === true)}
                            disabled={restaurando}
                          />
                          <label
                            htmlFor="limpar-empresa"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Limpar tambem dados da empresa (CNPJ, endereco, etc)
                          </label>
                        </div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={restaurando}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault()
                        onRestaurarPadrao()
                      }}
                      disabled={confirmacaoTexto !== 'RESTAURAR' || !senhaConfirmacao || restaurando}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {restaurando ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Restaurando...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restaurar Padrao
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            {!temSenhaMestre && (
              <p className="text-xs text-amber-600 mt-2">
                Configure uma senha mestre acima para habilitar esta opcao
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
