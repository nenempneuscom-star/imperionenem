// =============================================
// CLIENTE API ADN - AMBIENTE DE DADOS NACIONAL NFS-e
// Comunicacao REST/JSON com o sistema nacional
// =============================================

import type {
  DPS,
  AmbienteADN,
  ADN_ENDPOINTS,
  EnviarDPSRequest,
  EnviarDPSResponse,
  ConsultarNFSeRequest,
  ConsultarNFSeResponse,
  CancelarNFSeRequest,
  CancelarNFSeResponse,
  GerarDANFSeRequest,
  GerarDANFSeResponse,
  ADNErro,
  ConfigADN,
} from './types'
import { gerarXMLDPS, gerarJSONDPS, validarDPS } from './dps-generator'

// URLs base dos ambientes
const URLS_ADN = {
  1: 'https://sefin.nfse.gov.br/sefinnacional', // Producao
  2: 'https://sefin.producaorestrita.nfse.gov.br/sefinnacional', // Homologacao
} as const

// Headers padrao
const HEADERS_PADRAO = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}

// =============================================
// Cliente ADN
// =============================================

export class ADNClient {
  private ambiente: AmbienteADN
  private baseUrl: string
  private certificado?: {
    pfxBase64: string
    senha: string
  }
  private timeout: number

  constructor(config: {
    ambiente: AmbienteADN
    certificado?: { pfxBase64: string; senha: string }
    timeout?: number
  }) {
    this.ambiente = config.ambiente
    this.baseUrl = URLS_ADN[config.ambiente]
    this.certificado = config.certificado
    this.timeout = config.timeout || 30000 // 30 segundos padrao
  }

  /**
   * Altera o ambiente (producao/homologacao)
   */
  setAmbiente(ambiente: AmbienteADN): void {
    this.ambiente = ambiente
    this.baseUrl = URLS_ADN[ambiente]
  }

  /**
   * Configura certificado digital
   */
  setCertificado(pfxBase64: string, senha: string): void {
    this.certificado = { pfxBase64, senha }
  }

  /**
   * Retorna a URL base atual
   */
  getBaseUrl(): string {
    return this.baseUrl
  }

  /**
   * Retorna o ambiente atual
   */
  getAmbiente(): AmbienteADN {
    return this.ambiente
  }

  /**
   * Verifica se tem certificado configurado
   */
  temCertificado(): boolean {
    return !!this.certificado?.pfxBase64
  }

  // =============================================
  // Metodos de API
  // =============================================

  /**
   * Envia DPS para o ADN
   */
  async enviarDPS(dps: DPS): Promise<EnviarDPSResponse> {
    // Valida DPS antes de enviar
    const validacao = validarDPS(dps)
    if (!validacao.valido) {
      return {
        sucesso: false,
        erros: validacao.erros.map((e) => ({
          cErro: 'VALIDACAO',
          xErro: e,
        })),
      }
    }

    // Verifica certificado
    if (!this.certificado) {
      return {
        sucesso: false,
        erros: [{
          cErro: 'CERT_NAO_CONFIG',
          xErro: 'Certificado digital A1 nao configurado',
          xCorrecao: 'Configure o certificado digital nas configuracoes fiscais',
        }],
      }
    }

    try {
      const url = `${this.baseUrl}/DPS`
      const xmlDPS = gerarXMLDPS(dps)

      // Em ambiente real, aqui seria feita a assinatura do XML
      // e o envio com mTLS usando o certificado A1

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...HEADERS_PADRAO,
          'X-Ambiente': this.ambiente.toString(),
        },
        body: JSON.stringify({
          dps: dps,
          xmlAssinado: xmlDPS, // Em producao, seria o XML assinado
        }),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          sucesso: false,
          erros: [{
            cErro: response.status.toString(),
            xErro: errorData.message || `Erro HTTP ${response.status}`,
          }],
        }
      }

      const data = await response.json()

      return {
        sucesso: true,
        retornoDPS: data.retornoDPS,
        retornoNFSe: data.retornoNFSe,
      }
    } catch (error: any) {
      return {
        sucesso: false,
        erros: [{
          cErro: 'ERRO_COMUNICACAO',
          xErro: error.message || 'Erro de comunicacao com o ADN',
          xCorrecao: 'Verifique sua conexao com a internet e tente novamente',
        }],
      }
    }
  }

  /**
   * Consulta NFS-e por chave de acesso
   */
  async consultarNFSe(chaveAcesso: string): Promise<ConsultarNFSeResponse> {
    if (!chaveAcesso || chaveAcesso.length !== 44) {
      return {
        sucesso: false,
        erros: [{
          cErro: 'CHAVE_INVALIDA',
          xErro: 'Chave de acesso deve ter 44 digitos',
        }],
      }
    }

    try {
      const url = `${this.baseUrl}/NFSe/${chaveAcesso}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...HEADERS_PADRAO,
          'X-Ambiente': this.ambiente.toString(),
        },
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          sucesso: false,
          erros: [{
            cErro: response.status.toString(),
            xErro: errorData.message || `Erro HTTP ${response.status}`,
          }],
        }
      }

      const data = await response.json()

      return {
        sucesso: true,
        nfse: data.nfse,
        eventos: data.eventos,
      }
    } catch (error: any) {
      return {
        sucesso: false,
        erros: [{
          cErro: 'ERRO_COMUNICACAO',
          xErro: error.message || 'Erro de comunicacao com o ADN',
        }],
      }
    }
  }

  /**
   * Cancela NFS-e
   */
  async cancelarNFSe(
    chaveAcesso: string,
    codigoCancelamento: string,
    justificativa: string
  ): Promise<CancelarNFSeResponse> {
    if (!chaveAcesso || chaveAcesso.length !== 44) {
      return {
        sucesso: false,
        erros: [{
          cErro: 'CHAVE_INVALIDA',
          xErro: 'Chave de acesso deve ter 44 digitos',
        }],
      }
    }

    if (!justificativa || justificativa.length < 15) {
      return {
        sucesso: false,
        erros: [{
          cErro: 'JUSTIFICATIVA_INVALIDA',
          xErro: 'Justificativa deve ter no minimo 15 caracteres',
        }],
      }
    }

    if (!this.certificado) {
      return {
        sucesso: false,
        erros: [{
          cErro: 'CERT_NAO_CONFIG',
          xErro: 'Certificado digital A1 nao configurado',
        }],
      }
    }

    try {
      const url = `${this.baseUrl}/NFSe/${chaveAcesso}/cancelar`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...HEADERS_PADRAO,
          'X-Ambiente': this.ambiente.toString(),
        },
        body: JSON.stringify({
          cMotivo: codigoCancelamento,
          xJust: justificativa,
        }),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          sucesso: false,
          erros: [{
            cErro: response.status.toString(),
            xErro: errorData.message || `Erro HTTP ${response.status}`,
          }],
        }
      }

      const data = await response.json()

      return {
        sucesso: true,
        retorno: data.retorno,
      }
    } catch (error: any) {
      return {
        sucesso: false,
        erros: [{
          cErro: 'ERRO_COMUNICACAO',
          xErro: error.message || 'Erro de comunicacao com o ADN',
        }],
      }
    }
  }

  /**
   * Gera link/PDF do DANFSe
   */
  async gerarDANFSe(
    chaveAcesso: string,
    formato: 'pdf' | 'html' = 'pdf'
  ): Promise<GerarDANFSeResponse> {
    if (!chaveAcesso || chaveAcesso.length !== 44) {
      return {
        sucesso: false,
        erros: [{
          cErro: 'CHAVE_INVALIDA',
          xErro: 'Chave de acesso deve ter 44 digitos',
        }],
      }
    }

    try {
      const url = `${this.baseUrl}/DANFSe/${chaveAcesso}?formato=${formato}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': formato === 'pdf' ? 'application/pdf' : 'text/html',
          'X-Ambiente': this.ambiente.toString(),
        },
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        return {
          sucesso: false,
          erros: [{
            cErro: response.status.toString(),
            xErro: `Erro ao gerar DANFSe: HTTP ${response.status}`,
          }],
        }
      }

      if (formato === 'pdf') {
        const buffer = await response.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        return {
          sucesso: true,
          pdfBase64: base64,
        }
      } else {
        return {
          sucesso: true,
          linkDANFSe: url,
        }
      }
    } catch (error: any) {
      return {
        sucesso: false,
        erros: [{
          cErro: 'ERRO_COMUNICACAO',
          xErro: error.message || 'Erro ao gerar DANFSe',
        }],
      }
    }
  }

  /**
   * Consulta eventos de uma NFS-e
   */
  async consultarEventos(chaveAcesso: string): Promise<{
    sucesso: boolean
    eventos?: any[]
    erros?: ADNErro[]
  }> {
    if (!chaveAcesso || chaveAcesso.length !== 44) {
      return {
        sucesso: false,
        erros: [{
          cErro: 'CHAVE_INVALIDA',
          xErro: 'Chave de acesso deve ter 44 digitos',
        }],
      }
    }

    try {
      const url = `${this.baseUrl}/NFSe/${chaveAcesso}/eventos`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...HEADERS_PADRAO,
          'X-Ambiente': this.ambiente.toString(),
        },
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        return {
          sucesso: false,
          erros: [{
            cErro: response.status.toString(),
            xErro: `Erro HTTP ${response.status}`,
          }],
        }
      }

      const data = await response.json()

      return {
        sucesso: true,
        eventos: data.eventos || [],
      }
    } catch (error: any) {
      return {
        sucesso: false,
        erros: [{
          cErro: 'ERRO_COMUNICACAO',
          xErro: error.message || 'Erro de comunicacao',
        }],
      }
    }
  }

  /**
   * Verifica status do servico ADN
   */
  async verificarStatus(): Promise<{
    online: boolean
    ambiente: string
    versao?: string
    mensagem?: string
  }> {
    try {
      const url = `${this.baseUrl}/status`

      const response = await fetch(url, {
        method: 'GET',
        headers: HEADERS_PADRAO,
        signal: AbortSignal.timeout(5000), // 5 segundos para status
      })

      if (response.ok) {
        const data = await response.json()
        return {
          online: true,
          ambiente: this.ambiente === 1 ? 'Producao' : 'Homologacao',
          versao: data.versao,
          mensagem: data.mensagem,
        }
      }

      return {
        online: false,
        ambiente: this.ambiente === 1 ? 'Producao' : 'Homologacao',
        mensagem: `Servico retornou status ${response.status}`,
      }
    } catch (error: any) {
      return {
        online: false,
        ambiente: this.ambiente === 1 ? 'Producao' : 'Homologacao',
        mensagem: error.message || 'Erro ao verificar status',
      }
    }
  }
}

// =============================================
// Factory e instancia singleton
// =============================================

let clienteADN: ADNClient | null = null

/**
 * Obtem instancia do cliente ADN (singleton)
 */
export function getADNClient(config?: {
  ambiente?: AmbienteADN
  certificado?: { pfxBase64: string; senha: string }
}): ADNClient {
  if (!clienteADN) {
    clienteADN = new ADNClient({
      ambiente: config?.ambiente || 2, // Homologacao por padrao
      certificado: config?.certificado,
    })
  } else if (config) {
    if (config.ambiente) {
      clienteADN.setAmbiente(config.ambiente)
    }
    if (config.certificado) {
      clienteADN.setCertificado(config.certificado.pfxBase64, config.certificado.senha)
    }
  }

  return clienteADN
}

/**
 * Cria nova instancia do cliente ADN
 */
export function criarADNClient(config: {
  ambiente: AmbienteADN
  certificado?: { pfxBase64: string; senha: string }
  timeout?: number
}): ADNClient {
  return new ADNClient(config)
}

// =============================================
// Utilitarios de chave de acesso
// =============================================

/**
 * Estrutura da chave de acesso NFS-e (44 digitos)
 * UF(2) + AAMM(4) + CNPJ(14) + MOD(2) + SERIE(3) + NUM(9) + FORMA(1) + COD(8) + DV(1)
 */
export interface ChaveAcessoNFSe {
  uf: string           // Codigo UF (42 = SC)
  anoMes: string       // AAMM
  cnpj: string         // CNPJ emitente
  modelo: string       // Modelo (99 = NFS-e)
  serie: string        // Serie
  numero: string       // Numero NFS-e
  formaEmissao: string // 1=Normal
  codigoAleatorio: string // Codigo numerico aleatorio
  digitoVerificador: string // DV mod 11
}

/**
 * Decodifica chave de acesso NFS-e
 */
export function decodificarChaveAcesso(chave: string): ChaveAcessoNFSe | null {
  if (!chave || chave.length !== 44) {
    return null
  }

  return {
    uf: chave.substring(0, 2),
    anoMes: chave.substring(2, 6),
    cnpj: chave.substring(6, 20),
    modelo: chave.substring(20, 22),
    serie: chave.substring(22, 25),
    numero: chave.substring(25, 34),
    formaEmissao: chave.substring(34, 35),
    codigoAleatorio: chave.substring(35, 43),
    digitoVerificador: chave.substring(43, 44),
  }
}

/**
 * Valida formato da chave de acesso
 */
export function validarChaveAcesso(chave: string): boolean {
  if (!chave || chave.length !== 44) {
    return false
  }

  // Verifica se contem apenas numeros
  if (!/^\d{44}$/.test(chave)) {
    return false
  }

  // Valida digito verificador (mod 11)
  const corpo = chave.substring(0, 43)
  const dv = parseInt(chave.substring(43, 44))

  let soma = 0
  let peso = 2

  for (let i = corpo.length - 1; i >= 0; i--) {
    soma += parseInt(corpo.charAt(i)) * peso
    peso = peso === 9 ? 2 : peso + 1
  }

  const resto = soma % 11
  const dvCalculado = resto < 2 ? 0 : 11 - resto

  return dv === dvCalculado
}
