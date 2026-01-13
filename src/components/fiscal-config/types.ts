// Tipos compartilhados para Configuracoes Fiscais

export interface ConfigFiscal {
  ambiente?: number
  crt?: number
  serie_nfce?: number
  serie_nfe?: number
  ultimo_numero_nfce?: number
  ultimo_numero_nfe?: number
  id_token_nfce?: number
  csc_nfce?: string
  cfop_venda?: string
  cfop_venda_nfe?: string
  certificado_base64?: string
  certificado_senha?: string
  certificado_validade?: string
  certificado_nome?: string
}

export interface Empresa {
  id: string
  razao_social: string
  nome_fantasia?: string
  cnpj: string
  inscricao_estadual?: string
  endereco?: {
    uf?: string
  }
  config_fiscal?: ConfigFiscal
}

export interface StatusSEFAZ {
  nfce: { online: boolean; mensagem: string }
  nfe: { online: boolean; mensagem: string }
  ambiente?: string
  uf?: string
}

export interface FormDataFiscal {
  crt: string
  ambiente: string
  serie_nfce: string
  ultimo_numero_nfce: string
  serie_nfe: string
  ultimo_numero_nfe: string
  id_token_nfce: string
  csc_nfce: string
  cfop_venda: string
  cfop_venda_nfe: string
}

export interface CertificadoInfo {
  configurado: boolean
  validade: string | null
  nome: string | null
}
