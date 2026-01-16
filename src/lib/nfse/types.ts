// =============================================
// TIPOS PARA NFS-e - PADRÃO ABRASF 2.04
// =============================================

export interface Prestador {
  cnpj: string;
  inscricaoMunicipal: string;
  razaoSocial: string;
  nomeFantasia?: string;
  endereco: Endereco;
  contato?: Contato;
}

export interface Tomador {
  tipoPessoa: 'PF' | 'PJ';
  cpfCnpj: string;
  inscricaoMunicipal?: string;
  razaoSocial: string;
  endereco?: Endereco;
  contato?: Contato;
}

export interface Endereco {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  codigoMunicipio: string;
  uf: string;
  cep: string;
}

export interface Contato {
  telefone?: string;
  email?: string;
}

export interface Servico {
  itemListaServico: string; // Código LC 116 (ex: 14.01)
  codigoTributacao?: string;
  discriminacao: string;
  codigoCnae?: string;
  codigoMunicipio: string; // Local de prestação
}

export interface Valores {
  valorServicos: number;
  valorDeducoes?: number;
  valorPis?: number;
  valorCofins?: number;
  valorInss?: number;
  valorIr?: number;
  valorCsll?: number;
  outrasRetencoes?: number;
  valorIss?: number;
  aliquotaIss: number; // Em decimal (ex: 0.05 para 5%)
  descontoIncondicionado?: number;
  descontoCondicionado?: number;
}

export interface RPS {
  numero: number;
  serie: string;
  tipo: 1 | 2 | 3; // 1-RPS, 2-Nota Fiscal Conjugada, 3-Cupom
  dataEmissao: Date;
  competencia: Date;
  naturezaOperacao: '1' | '2' | '3' | '4' | '5' | '6';
  regimeEspecialTributacao?: '0' | '1' | '2' | '3' | '4' | '5' | '6';
  optanteSimplesNacional: boolean;
  incentivadorCultural: boolean;
  issRetido: boolean;
  prestador: Prestador;
  tomador: Tomador;
  servico: Servico;
  valores: Valores;
}

export interface LoteRPS {
  numeroLote: number;
  cnpjPrestador: string;
  inscricaoMunicipalPrestador: string;
  quantidadeRps: number;
  listaRps: RPS[];
}

export interface ConfigNFSe {
  ambiente: 'homologacao' | 'producao';
  codigoMunicipio: string;
  uf: string;
  inscricaoMunicipal: string;
  serieRps: string;
  proximoNumeroRps: number;
  regimeTributacao: string;
  naturezaOperacao: string;
  optanteSimplesNacional: boolean;
  incentivadorCultural: boolean;
  aliquotaIssPadrao: number;
  reterIssPadrao: boolean;
}

export interface RetornoNFSe {
  sucesso: boolean;
  numeroNfse?: string;
  codigoVerificacao?: string;
  dataEmissao?: Date;
  linkVisualizacao?: string;
  xmlNfse?: string;
  protocolo?: string;
  mensagem?: string;
  erros?: string[];
}

// Códigos de Município IBGE - Santa Catarina
export const MUNICIPIOS_SC = {
  'CAPIVARI_DE_BAIXO': '4203709',
  'TUBARAO': '4218202',
  'LAGUNA': '4209409',
  'IMBITUBA': '4207007',
  'FLORIANOPOLIS': '4205407',
} as const;

// Itens da Lista de Serviços LC 116 - Comuns para oficina de pneus
export const ITENS_SERVICO_PNEUS = {
  '14.01': 'Lubrificação, limpeza, lustração, revisão, carga e recarga, conserto, restauração, blindagem, manutenção e conservação de máquinas, veículos, aparelhos, equipamentos, motores, elevadores ou de qualquer objeto (exceto peças e partes empregadas, que ficam sujeitas ao ICMS)',
  '14.02': 'Assistência técnica',
  '14.03': 'Recondicionamento de motores',
  '14.04': 'Recauchutagem ou regeneração de pneus',
  '14.05': 'Restauração, recondicionamento, acondicionamento, pintura, beneficiamento, lavagem, secagem, tingimento, galvanoplastia, anodização, corte, recorte, plastificação, costura, acabamento, polimento e congêneres de objetos quaisquer',
} as const;
