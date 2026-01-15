'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Loader2,
  Save,
  FileKey,
  Building2,
  Settings,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react'

// Import components and types
import {
  GeralTab,
  CertificadoTab,
  NFCeTab,
  NFeTab,
  type ConfigFiscal,
  type Empresa,
  type StatusSEFAZ,
  type FormDataFiscal,
  type CertificadoInfo,
} from '@/components/fiscal-config'

export default function ConfiguracoesFiscaisPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingCert, setUploadingCert] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [statusSEFAZ, setStatusSEFAZ] = useState<StatusSEFAZ | null>(null)

  const [formData, setFormData] = useState<FormDataFiscal>({
    crt: '1',
    ambiente: '2',
    serie_nfce: '1',
    ultimo_numero_nfce: '0',
    serie_nfe: '1',
    ultimo_numero_nfe: '0',
    id_token_nfce: '1',
    csc_nfce: '',
    cfop_venda: '5102',
    cfop_venda_nfe: '5102',
  })

  const [certificadoSenha, setCertificadoSenha] = useState('')
  const [certificadoInfo, setCertificadoInfo] = useState<CertificadoInfo>({
    configurado: false,
    validade: null,
    nome: null,
  })

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('auth_id', user.id)
        .single()

      if (!userData?.empresa_id) return

      const { data: empresaData, error } = await supabase
        .from('empresas')
        .select('id, razao_social, nome_fantasia, cnpj, inscricao_estadual, endereco, config_fiscal')
        .eq('id', userData.empresa_id)
        .single()

      if (error) throw error

      if (empresaData) {
        setEmpresa(empresaData)
        const config = empresaData.config_fiscal || {}
        setFormData({
          crt: config.crt?.toString() || '1',
          ambiente: config.ambiente?.toString() || '2',
          serie_nfce: config.serie_nfce?.toString() || '1',
          ultimo_numero_nfce: config.ultimo_numero_nfce?.toString() || '0',
          serie_nfe: config.serie_nfe?.toString() || '1',
          ultimo_numero_nfe: config.ultimo_numero_nfe?.toString() || '0',
          id_token_nfce: config.id_token_nfce?.toString() || '1',
          csc_nfce: config.csc_nfce || '',
          cfop_venda: config.cfop_venda || '5102',
          cfop_venda_nfe: config.cfop_venda_nfe || '5102',
        })
        setCertificadoInfo({
          configurado: !!config.certificado_base64,
          validade: config.certificado_validade || null,
          nome: config.certificado_nome || null,
        })
      }
    } catch (error) {
      toast.error('Erro ao carregar configuracoes')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!empresa) {
      toast.error('Empresa nao encontrada')
      return
    }

    setSaving(true)

    try {
      // Buscar config_fiscal atualizado do banco para nao perder o certificado
      const { data: empresaAtual } = await supabase
        .from('empresas')
        .select('config_fiscal')
        .eq('id', empresa.id)
        .single()

      const configAtual = empresaAtual?.config_fiscal || {}

      const config_fiscal: ConfigFiscal = {
        ...configAtual,
        crt: parseInt(formData.crt) || 1,
        ambiente: parseInt(formData.ambiente) as 1 | 2,
        serie_nfce: parseInt(formData.serie_nfce) || 1,
        ultimo_numero_nfce: parseInt(formData.ultimo_numero_nfce) || 0,
        serie_nfe: parseInt(formData.serie_nfe) || 1,
        ultimo_numero_nfe: parseInt(formData.ultimo_numero_nfe) || 0,
        id_token_nfce: parseInt(formData.id_token_nfce) || 1,
        csc_nfce: formData.csc_nfce,
        cfop_venda: formData.cfop_venda,
        cfop_venda_nfe: formData.cfop_venda_nfe,
      }

      const { error } = await supabase
        .from('empresas')
        .update({ config_fiscal })
        .eq('id', empresa.id)

      if (error) throw error

      setEmpresa(prev => prev ? { ...prev, config_fiscal } : null)
      toast.success('Configuracoes salvas com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao salvar configuracoes', {
        description: error.message,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleCertificadoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!certificadoSenha) {
      toast.error('Digite a senha do certificado')
      return
    }

    if (!empresa) {
      toast.error('Empresa nao encontrada')
      return
    }

    setUploadingCert(true)

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const base64 = (event.target?.result as string).split(',')[1]

          const config_fiscal: ConfigFiscal = {
            ...(empresa.config_fiscal || {}),
            certificado_base64: base64,
            certificado_senha: certificadoSenha,
            certificado_nome: file.name,
          }

          const { error } = await supabase
            .from('empresas')
            .update({ config_fiscal })
            .eq('id', empresa.id)

          if (error) throw error

          setEmpresa(prev => prev ? { ...prev, config_fiscal } : null)
          setCertificadoInfo({
            configurado: true,
            validade: null,
            nome: file.name,
          })
          setCertificadoSenha('')
          toast.success('Certificado enviado com sucesso!')

          await consultarStatusSEFAZ()
        } catch (error: any) {
          toast.error('Erro ao salvar certificado', {
            description: error.message,
          })
        } finally {
          setUploadingCert(false)
        }
      }
      reader.onerror = () => {
        toast.error('Erro ao ler arquivo')
        setUploadingCert(false)
      }
      reader.readAsDataURL(file)
    } catch (error: any) {
      toast.error('Erro ao processar certificado', {
        description: error.message,
      })
      setUploadingCert(false)
    }
  }

  async function consultarStatusSEFAZ() {
    setCheckingStatus(true)
    try {
      const response = await fetch('/api/fiscal/status')
      const data = await response.json()

      if (response.ok) {
        setStatusSEFAZ(data)
        if (data.nfce?.online && data.nfe?.online) {
          toast.success('SEFAZ online!')
        } else if (data.nfce?.online || data.nfe?.online) {
          toast.warning('SEFAZ parcialmente online')
        } else {
          toast.error('SEFAZ offline ou erro de conexao')
        }
      } else {
        toast.error('Erro ao consultar status', {
          description: data.error,
        })
      }
    } catch (error: any) {
      toast.error('Erro ao consultar SEFAZ', {
        description: error.message,
      })
    } finally {
      setCheckingStatus(false)
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuracoes Fiscais</h1>
          <p className="text-muted-foreground">
            Configure os parametros para emissao de NFC-e e NF-e
          </p>
        </div>
        <Button
          variant="outline"
          onClick={consultarStatusSEFAZ}
          disabled={checkingStatus || !certificadoInfo.configurado}
        >
          {checkingStatus ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Testar Conexao SEFAZ
        </Button>
      </div>

      {/* Status SEFAZ */}
      {statusSEFAZ && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className={statusSEFAZ.nfce?.online ? 'border-green-500' : 'border-red-500'}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                {statusSEFAZ.nfce?.online ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium">NFC-e (Modelo 65)</p>
                  <p className="text-sm text-muted-foreground">{statusSEFAZ.nfce?.mensagem}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={statusSEFAZ.nfe?.online ? 'border-green-500' : 'border-red-500'}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                {statusSEFAZ.nfe?.online ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium">NF-e (Modelo 55)</p>
                  <p className="text-sm text-muted-foreground">{statusSEFAZ.nfe?.mensagem}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="geral" className="space-y-4">
          <TabsList>
            <TabsTrigger value="geral">
              <Settings className="mr-2 h-4 w-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="certificado">
              <FileKey className="mr-2 h-4 w-4" />
              Certificado
            </TabsTrigger>
            <TabsTrigger value="nfce">
              <Building2 className="mr-2 h-4 w-4" />
              NFC-e
            </TabsTrigger>
            <TabsTrigger value="nfe">
              <Building2 className="mr-2 h-4 w-4" />
              NF-e
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral">
            <GeralTab
              formData={formData}
              empresa={empresa}
              saving={saving}
              onChange={handleChange}
            />
          </TabsContent>

          <TabsContent value="certificado">
            <CertificadoTab
              certificadoInfo={certificadoInfo}
              certificadoSenha={certificadoSenha}
              uploadingCert={uploadingCert}
              onSenhaChange={setCertificadoSenha}
              onUpload={handleCertificadoUpload}
            />
          </TabsContent>

          <TabsContent value="nfce">
            <NFCeTab
              formData={formData}
              saving={saving}
              onChange={handleChange}
            />
          </TabsContent>

          <TabsContent value="nfe">
            <NFeTab
              formData={formData}
              saving={saving}
              onChange={handleChange}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configuracoes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
