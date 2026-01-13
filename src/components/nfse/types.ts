// Tipos para NFS-e

export interface Servico {
  id: string
  codigo: string
  item_lista_servico: string
  descricao: string
  aliquota_iss: number
  valor_padrao: number
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

  // Retencoes
  valor_pis: number
  valor_cofins: number
  valor_inss: number
  valor_ir: number
  valor_csll: number

  // Outros
  data_competencia: string
  natureza_operacao: string
  local_prestacao_codigo_municipio: string
  local_prestacao_uf: string
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
  codigo_municipio: '4203907',
  uf: 'SC',
  cep: '',
}

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
  data_competencia: new Date().toISOString().split('T')[0],
  natureza_operacao: '1',
  local_prestacao_codigo_municipio: '4203907',
  local_prestacao_uf: 'SC',
}

// Utilitarios
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

export function calcularTotalRetencoes(formData: NFSeFormData): number {
  return (
    formData.valor_pis +
    formData.valor_cofins +
    formData.valor_inss +
    formData.valor_ir +
    formData.valor_csll
  )
}

export function calcularValorLiquido(formData: NFSeFormData): number {
  return formData.valor_servicos - calcularTotalRetencoes(formData) - formData.desconto_incondicionado
}
