// Tipos para NFS-e - Componentes UI
// Atualizado para Padrao Nacional NFS-e (ADN) + Reforma Tributaria 2026

export interface Servico {
  id: string
  codigo: string
  item_lista_servico: string
  descricao: string
  aliquota_iss: number
  valor_padrao: number
  // Novos campos Reforma Tributaria 2026
  aliquota_ibs?: number
  aliquota_cbs?: number
}

export interface ClienteNFSe {
  id: string
  cpf_cnpj: string
  nome: string
  email: string
  telefone: string
  endereco: EnderecoTomador | null
  tipo_pessoa: string
}

export interface EnderecoTomador {
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  codigo_municipio: string
  uf: string
  cep: string
}

export interface NFSeFormData {
  // Tomador
  tomador_tipo_pessoa: string
  tomador_cpf_cnpj: string
  tomador_razao_social: string
  tomador_inscricao_municipal: string
  tomador_email: string
  tomador_telefone: string
  tomador_endereco: EnderecoTomador

  // Servico
  servico_id: string
  item_lista_servico: string
  codigo_tributacao: string
  discriminacao: string
  codigo_cnae: string

  // Valores
  valor_servicos: number
  valor_deducoes: number
  desconto_incondicionado: number
  aliquota_iss: number
  iss_retido: boolean

  // Retencoes Federais
  valor_pis: number
  valor_cofins: number
  valor_inss: number
  valor_ir: number
  valor_csll: number

  // IBS/CBS - Reforma Tributaria 2026
  aliquota_ibs: number
  valor_ibs: number
  aliquota_cbs: number
  valor_cbs: number
  ibs_retido: boolean
  cbs_retido: boolean

  // Outros
  data_competencia: string
  natureza_operacao: string
  local_prestacao_codigo_municipio: string
  local_prestacao_uf: string

  // ADN - Ambiente de Dados Nacional
  usar_adn: boolean
}

export interface ItemLC116 {
  value: string
  label: string
}

export const ITENS_LC116: ItemLC116[] = [
  { value: '14.01', label: '14.01 - Conserto, manutencao de veiculos' },
  { value: '14.02', label: '14.02 - Assistencia tecnica' },
  { value: '14.03', label: '14.03 - Recondicionamento de motores' },
  { value: '14.04', label: '14.04 - Recauchutagem de pneus' },
  { value: '14.05', label: '14.05 - Restauracao, recondicionamento' },
]

export const ENDERECO_PADRAO: EnderecoTomador = {
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  codigo_municipio: '4203907', // Capivari de Baixo
  uf: 'SC',
  cep: '',
}

// Aliquotas padrao IBS/CBS 2026
export const ALIQUOTA_IBS_PADRAO = 17.7 // IBS estadual/municipal
export const ALIQUOTA_CBS_PADRAO = 8.8  // CBS federal

export const FORM_DATA_INICIAL: NFSeFormData = {
  tomador_tipo_pessoa: 'PF',
  tomador_cpf_cnpj: '',
  tomador_razao_social: '',
  tomador_inscricao_municipal: '',
  tomador_email: '',
  tomador_telefone: '',
  tomador_endereco: { ...ENDERECO_PADRAO },
  servico_id: '',
  item_lista_servico: '14.01',
  codigo_tributacao: '',
  discriminacao: '',
  codigo_cnae: '',
  valor_servicos: 0,
  valor_deducoes: 0,
  desconto_incondicionado: 0,
  aliquota_iss: 5,
  iss_retido: false,
  valor_pis: 0,
  valor_cofins: 0,
  valor_inss: 0,
  valor_ir: 0,
  valor_csll: 0,
  // IBS/CBS
  aliquota_ibs: ALIQUOTA_IBS_PADRAO,
  valor_ibs: 0,
  aliquota_cbs: ALIQUOTA_CBS_PADRAO,
  valor_cbs: 0,
  ibs_retido: false,
  cbs_retido: false,
  // Outros
  data_competencia: new Date().toISOString().split('T')[0],
  natureza_operacao: '1',
  local_prestacao_codigo_municipio: '4203907',
  local_prestacao_uf: 'SC',
  // ADN
  usar_adn: true, // Padrao para usar o ADN nacional
}

// ==============================================
// Utilitarios de Calculo
// ==============================================

export function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2)}`
}

export function calcularBaseCalculo(formData: NFSeFormData): number {
  return formData.valor_servicos - formData.valor_deducoes - formData.desconto_incondicionado
}

export function calcularValorIss(formData: NFSeFormData): number {
  const base = calcularBaseCalculo(formData)
  return base * (formData.aliquota_iss / 100)
}

export function calcularValorIbs(formData: NFSeFormData): number {
  const base = calcularBaseCalculo(formData)
  return base * (formData.aliquota_ibs / 100)
}

export function calcularValorCbs(formData: NFSeFormData): number {
  const base = calcularBaseCalculo(formData)
  return base * (formData.aliquota_cbs / 100)
}

export function calcularTotalRetencoes(formData: NFSeFormData): number {
  let total = formData.valor_pis +
    formData.valor_cofins +
    formData.valor_inss +
    formData.valor_ir +
    formData.valor_csll

  // Adicionar retencoes IBS/CBS se marcadas
  if (formData.ibs_retido) {
    total += calcularValorIbs(formData)
  }
  if (formData.cbs_retido) {
    total += calcularValorCbs(formData)
  }

  return total
}

export function calcularTotalTributos(formData: NFSeFormData): number {
  return calcularValorIss(formData) + calcularValorIbs(formData) + calcularValorCbs(formData)
}

export function calcularValorLiquido(formData: NFSeFormData): number {
  return formData.valor_servicos - calcularTotalRetencoes(formData) - formData.desconto_incondicionado
}

// ==============================================
// Tipos ADN - Ambiente de Dados Nacional
// ==============================================

export interface DPSIdentificacao {
  cMunGer: string      // Codigo municipio gerador (IBGE 7 digitos)
  serie: string        // Serie do DPS (max 5 chars)
  nDPS: number         // Numero do DPS
  dCompet: string      // Data competencia (AAAA-MM-DD)
  tpEmit: 1 | 2        // 1=Prestador, 2=Tomador
}

export interface DPSPrestador {
  CNPJ?: string
  CPF?: string
  IM?: string          // Inscricao Municipal
  xNome: string        // Razao Social
  end?: DPSEndereco
  fone?: string
  email?: string
}

export interface DPSTomador {
  CNPJ?: string
  CPF?: string
  NIF?: string         // Identificacao fiscal estrangeiro
  IM?: string
  xNome: string
  end?: DPSEndereco
  fone?: string
  email?: string
}

export interface DPSEndereco {
  xLgr: string         // Logradouro
  nro: string          // Numero
  xCpl?: string        // Complemento
  xBairro: string      // Bairro
  cMun: string         // Codigo municipio IBGE
  UF: string           // UF
  CEP: string          // CEP (8 digitos)
  cPais?: string       // Codigo pais (1058 = Brasil)
  xPais?: string       // Nome pais
}

export interface DPSServico {
  cServ: {
    cTribNac: string   // Codigo tributacao nacional (NBS)
    cTribMun?: string  // Codigo tributacao municipal
    xDescServ: string  // Descricao do servico
    cNBS?: string      // Codigo NBS
    cIntContworking?: string
  }
  cLocPrestworking: {
    cMun: string       // Municipio prestacao
    cPais?: string     // Pais prestacao
  }
}

export interface DPSValores {
  vServPrest: {
    vServ: number      // Valor servico
    vDescIncworking?: number  // Desconto incondicionado
    vDescCond?: number // Desconto condicionado
    vDed?: number      // Deducoes
  }
  trib: {
    // ISS (periodo transitorio)
    tribMun?: {
      tribISSQN: 1 | 2 | 3  // 1=Operacao tributavel, 2=Isenta, 3=Imune
      cPaisResult?: string   // Pais resultado
      tpImworking?: number   // Tipo imunidade
      pAliq?: number         // Aliquota ISS
      tpRetISSQN?: 1 | 2     // 1=Retido, 2=Nao retido
    }
    // IBS - Imposto sobre Bens e Servicos
    tribIBS?: {
      CST: string            // Codigo Situacao Tributaria
      pIBS: number           // Aliquota IBS
      vIBS: number           // Valor IBS
      tpRetIBS?: 1 | 2       // 1=Retido, 2=Nao retido
    }
    // CBS - Contribuicao sobre Bens e Servicos
    tribCBS?: {
      CST: string            // Codigo Situacao Tributaria
      pCBS: number           // Aliquota CBS
      vCBS: number           // Valor CBS
      tpRetCBS?: 1 | 2       // 1=Retido, 2=Nao retido
    }
    // Retencoes federais
    totTrib?: {
      vTotTribFed?: number   // Total tributos federais
      vTotTribEst?: number   // Total tributos estaduais
      vTotTribMun?: number   // Total tributos municipais
      pTotTribFed?: number   // % tributos federais
      pTotTribEst?: number   // % tributos estaduais
      pTotTribMun?: number   // % tributos municipais
    }
  }
}

// DPS completo para envio ao ADN
export interface DPS {
  infDPS: {
    Id: string              // ID do DPS (formato: DPS + CNPJ14 + serie5 + num15)
    versao: string          // Versao do layout (1.00)
    tpAmb: 1 | 2            // 1=Producao, 2=Homologacao
    dhEmi: string           // Data/hora emissao ISO8601
    verAplic: string        // Versao aplicativo
    serie: string
    nDPS: number
    dCompet: string
    tpEmit: 1 | 2
    cLocEmi: string         // Codigo municipio emissor
    subst?: {               // Substituicao (se aplicavel)
      chSubstda: string     // Chave DPS substituida
      cMotivo: string       // Codigo motivo
      xMotivo?: string      // Descricao motivo
    }
    prest: DPSPrestador
    toma: DPSTomador
    interm?: {              // Intermediario (se aplicavel)
      CNPJ?: string
      CPF?: string
      xNome?: string
    }
    serv: DPSServico
    valores: DPSValores
    infAdicworking?: {
      infAdFisco?: string   // Info adicional fisco
      infCpl?: string       // Info complementar contribuinte
    }
  }
  Signature?: any           // Assinatura digital XML-Signature
}

// Resposta do ADN
export interface ADNResponse {
  sucesso: boolean
  ambiente: 'homologacao' | 'producao'
  IDPS?: string             // ID do DPS no ADN
  chaveAcesso?: string      // Chave de acesso (44 digitos)
  numeroNFSe?: string       // Numero NFS-e gerado
  dataAutorizacao?: string  // Data autorizacao
  protocolo?: string        // Protocolo de autorizacao
  linkDANFSe?: string       // Link para DANFSE
  xmlAutorizado?: string    // XML autorizado
  erros?: ADNErro[]
}

export interface ADNErro {
  codigo: string
  descricao: string
  correcao?: string
}

// Status possiveis da NFS-e no ADN
export type StatusNFSeADN =
  | 'rascunho'
  | 'pendente'
  | 'processando'
  | 'autorizada'
  | 'rejeitada'
  | 'cancelada'
  | 'substituida'

// Configuracao ADN
export interface ConfigADN {
  ambiente: 'homologacao' | 'producao'
  versao: string
  urlProducao: string
  urlHomologacao: string
  certificadoA1?: {
    arquivo: string
    senha: string
    validade: string
  }
}

export const CONFIG_ADN_PADRAO: ConfigADN = {
  ambiente: 'homologacao',
  versao: '1.00',
  urlProducao: 'https://sefin.nfse.gov.br/sefinnacional',
  urlHomologacao: 'https://sefin.producaorestrita.nfse.gov.br/sefinnacional',
}
