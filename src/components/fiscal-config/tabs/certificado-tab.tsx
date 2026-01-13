'use client'

import { useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileKey, Shield, AlertTriangle, Upload, Loader2 } from 'lucide-react'
import { type CertificadoInfo } from '../types'

interface CertificadoTabProps {
  certificadoInfo: CertificadoInfo
  certificadoSenha: string
  uploadingCert: boolean
  onSenhaChange: (senha: string) => void
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function CertificadoTab({
  certificadoInfo,
  certificadoSenha,
  uploadingCert,
  onSenhaChange,
  onUpload,
}: CertificadoTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificado Digital A1</CardTitle>
        <CardDescription>
          O certificado digital e obrigatorio para emissao de notas fiscais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status do Certificado */}
        <div className={`p-4 rounded-md border ${
          certificadoInfo.configurado
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {certificadoInfo.configurado ? (
              <Shield className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            <p className={`font-medium ${
              certificadoInfo.configurado
                ? 'text-green-800 dark:text-green-200'
                : 'text-red-800 dark:text-red-200'
            }`}>
              {certificadoInfo.configurado ? 'Certificado Configurado' : 'Certificado Nao Configurado'}
            </p>
          </div>
          {certificadoInfo.configurado && certificadoInfo.nome && (
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Arquivo: {certificadoInfo.nome}
            </p>
          )}
          {certificadoInfo.validade && (
            <p className="text-sm text-green-700 dark:text-green-300">
              Valido ate: {new Date(certificadoInfo.validade).toLocaleDateString('pt-BR')}
            </p>
          )}
          {!certificadoInfo.configurado && (
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Faca o upload do certificado A1 (.pfx) para habilitar a emissao fiscal.
            </p>
          )}
        </div>

        {/* Upload de Certificado */}
        <div className="border-2 border-dashed rounded-lg p-8">
          <div className="text-center">
            <FileKey className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">
              {certificadoInfo.configurado ? 'Substituir Certificado A1' : 'Upload do Certificado A1'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Selecione o arquivo .pfx do seu certificado digital
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certificado_senha">Senha do Certificado</Label>
              <Input
                id="certificado_senha"
                type="password"
                placeholder="Digite a senha do certificado"
                value={certificadoSenha}
                onChange={(e) => onSenhaChange(e.target.value)}
                disabled={uploadingCert}
              />
            </div>

            <div className="flex justify-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pfx,.p12"
                onChange={onUpload}
                className="hidden"
                id="certificado_file"
                disabled={uploadingCert || !certificadoSenha}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingCert || !certificadoSenha}
              >
                {uploadingCert ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Selecionar Arquivo
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Apenas certificados do tipo A1 (arquivo .pfx ou .p12) sao suportados
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Seguranca:</strong> O certificado e armazenado de forma segura no banco de dados.
            A senha e necessaria para assinar as notas fiscais.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
