// Tipos compartilhados para Configuracoes

export interface Empresa {
  id: string
  razao_social: string
  nome_fantasia: string | null
  cnpj: string
  ie: string | null
  telefone: string | null
  email: string | null
  endereco: EnderecoEmpresa | null
  config_fiscal: ConfigFiscal | null
}

export interface EnderecoEmpresa {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

export interface ConfigFiscal {
  regime_tributario: string
  ambiente: string
  serie_nfce: string
  numero_nfce: number
  serie_nfe: string
  numero_nfe: number
}

export interface FormDataConfiguracoes {
  // Dados da empresa
  razao_social: string
  nome_fantasia: string
  cnpj: string
  ie: string
  telefone: string
  email: string
  // Endereco
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  // Fiscal
  regime_tributario: string
  ambiente: string
  serie_nfce: string
  numero_nfce: string
  serie_nfe: string
  numero_nfe: string
  // PIX
  chave_pix: string
}

export const initialFormData: FormDataConfiguracoes = {
  razao_social: '',
  nome_fantasia: '',
  cnpj: '',
  ie: '',
  telefone: '',
  email: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  regime_tributario: '1',
  ambiente: '2',
  serie_nfce: '1',
  numero_nfce: '1',
  serie_nfe: '1',
  numero_nfe: '1',
  chave_pix: '',
}

export const regimesTributarios = [
  { value: '1', label: 'Simples Nacional' },
  { value: '2', label: 'Simples Nacional - Excesso de Sublimite' },
  { value: '3', label: 'Regime Normal' },
]

export const ambientes = [
  { value: '1', label: 'Producao' },
  { value: '2', label: 'Homologacao (Testes)' },
]

export const ufs = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]
