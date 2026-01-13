// =============================================
// TIPOS ADN - AMBIENTE DE DADOS NACIONAL NFS-e
// Padrao Nacional conforme Ajuste SINIEF e LC 116
// Atualizado para Reforma Tributaria 2026 (IBS/CBS)
// =============================================

// Ambiente de operacao
export type AmbienteADN = 1 | 2  // 1=Producao, 2=Homologacao

// Tipo de emitente
export type TipoEmitente = 1 | 2  // 1=Prestador, 2=Tomador

// Tipo de retencao
export type TipoRetencao = 1 | 2  // 1=Retido, 2=Nao retido

// Tipo de tributacao ISSQN
export type TipoTributacaoISSQN = 1 | 2 | 3  // 1=Tributavel, 2=Isenta, 3=Imune

// Endpoints ADN
export const ADN_ENDPOINTS = {
  producao: {
    base: 'https://sefin.nfse.gov.br/sefinnacional',
    enviarDPS: '/DPS',
    consultarDPS: '/DPS/{IDPS}',
    consultarNFSe: '/NFSe/{chaveAcesso}',
    cancelar: '/NFSe/{chaveAcesso}/cancelar',
    substituir: '/NFSe/{chaveAcesso}/substituir',
    danfse: '/DANFSe/{chaveAcesso}',
    eventos: '/NFSe/{chaveAcesso}/eventos',
  },
  homologacao: {
    base: 'https://sefin.producaorestrita.nfse.gov.br/sefinnacional',
    enviarDPS: '/DPS',
    consultarDPS: '/DPS/{IDPS}',
    consultarNFSe: '/NFSe/{chaveAcesso}',
    cancelar: '/NFSe/{chaveAcesso}/cancelar',
    substituir: '/NFSe/{chaveAcesso}/substituir',
    danfse: '/DANFSe/{chaveAcesso}',
    eventos: '/NFSe/{chaveAcesso}/eventos',
  },
} as const

// Codigos de Situacao Tributaria (CST) IBS/CBS
export const CST_IBS_CBS = {
  '00': 'Tributacao normal',
  '10': 'Tributacao com reducao de base de calculo',
  '20': 'Isencao',
  '30': 'Imunidade',
  '40': 'Nao incidencia',
  '50': 'Suspensao',
  '51': 'Diferimento',
  '90': 'Outros',
} as const

// Codigos de municipio IBGE - SC (principais)
export const MUNICIPIOS_SC_IBGE = {
  CAPIVARI_DE_BAIXO: '4203907',
  TUBARAO: '4218202',
  LAGUNA: '4209409',
  IMBITUBA: '4207007',
  FLORIANOPOLIS: '4205407',
  CRICIUMA: '4204608',
  JARAGUA_DO_SUL: '4208906',
  JOINVILLE: '4209102',
  BLUMENAU: '4202404',
  ITAJAI: '4208203',
} as const

// =============================================
// Estrutura DPS (Declaracao de Prestacao de Servico)
// =============================================

export interface DPSEndereco {
  xLgr: string         // Logradouro (max 60)
  nro: string          // Numero (max 10)
  xCpl?: string        // Complemento (max 60)
  xBairro: string      // Bairro (max 60)
  cMun: string         // Codigo municipio IBGE (7 digitos)
  UF: string           // UF (2 chars)
  CEP: string          // CEP (8 digitos, sem formatacao)
  cPais?: string       // Codigo pais (1058 = Brasil)
  xPais?: string       // Nome pais
}

export interface DPSPrestador {
  CNPJ?: string        // CNPJ (14 digitos) - obrigatorio se PJ
  CPF?: string         // CPF (11 digitos) - obrigatorio se PF
  IM?: string          // Inscricao Municipal
  xNome: string        // Razao Social / Nome (max 150)
  end?: DPSEndereco
  fone?: string        // Telefone (max 14)
  email?: string       // Email (max 80)
}

export interface DPSTomador {
  CNPJ?: string
  CPF?: string
  NIF?: string         // Numero Identificacao Fiscal (estrangeiro)
  cNaoNIF?: string     // Codigo motivo nao ter NIF
  IM?: string
  xNome: string
  end?: DPSEndereco
  fone?: string
  email?: string
}

export interface DPSIntermediario {
  CNPJ?: string
  CPF?: string
  xNome: string
}

export interface DPSServico {
  cServ: {
    cTribNac: string       // Codigo tributacao nacional (item LC 116 sem ponto)
    cTribMun?: string      // Codigo tributacao municipal
    xDescServ: string      // Descricao servico (max 2000)
    cNBS?: string          // Codigo NBS (se aplicavel)
    cIntContrib?: string   // Codigo interno contribuinte
  }
  cLocPrest: {
    cMun: string           // Municipio prestacao (codigo IBGE)
    cPais?: string         // Pais prestacao (1058 = Brasil)
  }
}

export interface DPSTribMunicipal {
  tribISSQN: TipoTributacaoISSQN
  cPaisResult?: string     // Pais resultado (exportacao)
  tpImun?: number          // Tipo imunidade
  pAliq?: number           // Aliquota ISS (decimal: 0.05 = 5%)
  tpRetISSQN?: TipoRetencao
}

export interface DPSTribIBS {
  CST: string              // Codigo Situacao Tributaria
  pIBS: number             // Aliquota IBS (decimal)
  vIBS: number             // Valor IBS
  tpRetIBS?: TipoRetencao
}

export interface DPSTribCBS {
  CST: string
  pCBS: number             // Aliquota CBS (decimal)
  vCBS: number             // Valor CBS
  tpRetCBS?: TipoRetencao
}

export interface DPSTotTrib {
  vTotTribFed?: number     // Total tributos federais
  vTotTribEst?: number     // Total tributos estaduais
  vTotTribMun?: number     // Total tributos municipais
  pTotTribFed?: number     // % tributos federais
  pTotTribEst?: number     // % tributos estaduais
  pTotTribMun?: number     // % tributos municipais
}

export interface DPSValores {
  vServPrest: {
    vServ: number          // Valor servico
    vDescIncond?: number   // Desconto incondicionado
    vDescCond?: number     // Desconto condicionado
    vDed?: number          // Deducoes
  }
  vReceb?: number          // Valor recebido (se diferente)
  trib: {
    tribMun?: DPSTribMunicipal
    tribIBS?: DPSTribIBS
    tribCBS?: DPSTribCBS
    totTrib?: DPSTotTrib
  }
}

export interface DPSSubstituicao {
  chSubstda: string        // Chave DPS substituida (44 digitos)
  cMotivo: string          // Codigo motivo
  xMotivo?: string         // Descricao motivo
}

export interface DPSInfoAdicional {
  infAdFisco?: string      // Info adicional fisco (max 2000)
  infCpl?: string          // Info complementar contribuinte (max 2000)
}

// DPS Completo
export interface DPS {
  infDPS: {
    Id: string             // ID unico (DPS + CNPJ14 + serie5 + num15)
    versao: string         // Versao layout (1.00)
    tpAmb: AmbienteADN
    dhEmi: string          // Data/hora emissao ISO8601
    verAplic: string       // Versao aplicativo
    serie: string          // Serie (max 5)
    nDPS: number           // Numero DPS
    dCompet: string        // Data competencia AAAA-MM-DD
    tpEmit: TipoEmitente
    cLocEmi: string        // Codigo municipio emissor
    subst?: DPSSubstituicao
    prest: DPSPrestador
    toma: DPSTomador
    interm?: DPSIntermediario
    serv: DPSServico
    valores: DPSValores
    infAdic?: DPSInfoAdicional
  }
  Signature?: XMLSignature
}

// Estrutura da assinatura XML-Signature
export interface XMLSignature {
  SignedInfo: {
    CanonicalizationMethod: { Algorithm: string }
    SignatureMethod: { Algorithm: string }
    Reference: {
      URI: string
      Transforms: { Transform: { Algorithm: string }[] }
      DigestMethod: { Algorithm: string }
      DigestValue: string
    }
  }
  SignatureValue: string
  KeyInfo: {
    X509Data: {
      X509Certificate: string
    }
  }
}

// =============================================
// Respostas ADN
// =============================================

export interface ADNErro {
  cErro: string            // Codigo erro
  xErro: string            // Descricao erro
  xCorrecao?: string       // Sugestao correcao
}

export interface ADNRetornoDPS {
  IDPS: string             // ID do DPS processado
  chDPS?: string           // Chave de acesso DPS
  dhProc: string           // Data/hora processamento
  cStat: string            // Codigo status
  xMotivo: string          // Descricao status
  erros?: ADNErro[]
}

export interface ADNRetornoNFSe {
  chNFSe: string           // Chave acesso NFS-e (44 digitos)
  nNFSe: string            // Numero NFS-e
  cStat: string            // Codigo status
  xMotivo: string          // Descricao status
  dhAut: string            // Data/hora autorizacao
  nProt: string            // Numero protocolo
  cVerif?: string          // Codigo verificacao
  linkDANFSe?: string      // Link DANFSE
  xmlNFSe?: string         // XML NFS-e autorizada
}

export interface ADNRetornoCancelamento {
  chNFSe: string
  cStat: string
  xMotivo: string
  dhCanc: string           // Data/hora cancelamento
  nProt: string            // Protocolo cancelamento
}

export interface ADNRetornoEvento {
  tpEvento: string         // Tipo evento
  nSeqEvento: number       // Sequencial evento
  dhEvento: string         // Data/hora evento
  cStat: string
  xMotivo: string
}

// =============================================
// Configuracao ADN
// =============================================

export interface ConfigADN {
  ambiente: AmbienteADN
  versao: string
  certificado?: {
    pfxBase64: string      // Certificado A1 em base64
    senha: string          // Senha do certificado
    validade?: string      // Data validade
    titular?: string       // Nome titular
  }
  empresa: {
    cnpj: string
    razaoSocial: string
    inscricaoMunicipal?: string
    codigoMunicipio: string
    uf: string
  }
  nfse: {
    serie: string
    proximoNumero: number
    regimeTributario: string
  }
}

// =============================================
// Request/Response API
// =============================================

export interface EnviarDPSRequest {
  dps: DPS
  ambiente: AmbienteADN
}

export interface EnviarDPSResponse {
  sucesso: boolean
  retornoDPS?: ADNRetornoDPS
  retornoNFSe?: ADNRetornoNFSe
  erros?: ADNErro[]
}

export interface ConsultarNFSeRequest {
  chaveAcesso: string
  ambiente: AmbienteADN
}

export interface ConsultarNFSeResponse {
  sucesso: boolean
  nfse?: ADNRetornoNFSe
  eventos?: ADNRetornoEvento[]
  erros?: ADNErro[]
}

export interface CancelarNFSeRequest {
  chaveAcesso: string
  codigoCancelamento: string
  justificativa: string
  ambiente: AmbienteADN
}

export interface CancelarNFSeResponse {
  sucesso: boolean
  retorno?: ADNRetornoCancelamento
  erros?: ADNErro[]
}

export interface GerarDANFSeRequest {
  chaveAcesso: string
  ambiente: AmbienteADN
  formato?: 'pdf' | 'html'
}

export interface GerarDANFSeResponse {
  sucesso: boolean
  linkDANFSe?: string
  pdfBase64?: string
  erros?: ADNErro[]
}
