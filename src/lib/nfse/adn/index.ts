// =============================================
// MODULO ADN - AMBIENTE DE DADOS NACIONAL NFS-e
// Imperio Sistemas - Integracao Padrao Nacional
// =============================================

// Tipos
export * from './types'

// Gerador DPS (XML/JSON)
export {
  converterParaDPS,
  gerarXMLDPS,
  gerarJSONDPS,
  validarDPS,
  gerarIdDPS,
  limparNumeros,
  formatarCNPJ,
  formatarCPF,
  formatarNumeroDPS,
  formatarSerie,
  formatarValor,
  formatarAliquota,
  formatarDataHora,
  formatarData,
  type DadosFormularioNFSe,
} from './dps-generator'

// Cliente API
export {
  ADNClient,
  getADNClient,
  criarADNClient,
  decodificarChaveAcesso,
  validarChaveAcesso,
  type ChaveAcessoNFSe,
} from './api-client'
