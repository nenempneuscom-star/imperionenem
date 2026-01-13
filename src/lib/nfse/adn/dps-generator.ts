// =============================================
// GERADOR DPS - AMBIENTE DE DADOS NACIONAL NFS-e
// Gera DPS em formato XML e JSON conforme especificacao ADN
// =============================================

import { create } from 'xmlbuilder2'
import type {
  DPS,
  DPSPrestador,
  DPSTomador,
  DPSServico,
  DPSValores,
  DPSEndereco,
  AmbienteADN,
  ConfigADN,
} from './types'

// Namespace ADN
const NAMESPACE_DPS = 'http://www.sped.fazenda.gov.br/nfse'

// =============================================
// Utilitarios de Formatacao
// =============================================

/**
 * Remove caracteres nao numericos
 */
export function limparNumeros(valor: string): string {
  return valor.replace(/\D/g, '')
}

/**
 * Formata CNPJ para 14 digitos
 */
export function formatarCNPJ(cnpj: string): string {
  return limparNumeros(cnpj).padStart(14, '0')
}

/**
 * Formata CPF para 11 digitos
 */
export function formatarCPF(cpf: string): string {
  return limparNumeros(cpf).padStart(11, '0')
}

/**
 * Formata numero DPS para 15 digitos
 */
export function formatarNumeroDPS(numero: number): string {
  return numero.toString().padStart(15, '0')
}

/**
 * Formata serie para 5 caracteres
 */
export function formatarSerie(serie: string): string {
  return serie.toUpperCase().padEnd(5, ' ').substring(0, 5)
}

/**
 * Formata valor monetario (2 casas decimais)
 */
export function formatarValor(valor: number): string {
  return valor.toFixed(2)
}

/**
 * Formata aliquota (4 casas decimais em decimal)
 */
export function formatarAliquota(percentual: number): string {
  // Converte de percentual (5%) para decimal (0.05)
  return (percentual / 100).toFixed(4)
}

/**
 * Gera ID unico do DPS
 * Formato: DPS + CNPJ(14) + SERIE(5) + NUMERO(15) = 37 chars
 */
export function gerarIdDPS(cnpj: string, serie: string, numero: number): string {
  const cnpjFormatado = formatarCNPJ(cnpj)
  const serieFormatada = formatarSerie(serie).replace(/\s/g, '0')
  const numeroFormatado = formatarNumeroDPS(numero)
  return `DPS${cnpjFormatado}${serieFormatada}${numeroFormatado}`
}

/**
 * Gera data/hora no formato ISO8601 com timezone
 */
export function formatarDataHora(data: Date = new Date()): string {
  return data.toISOString()
}

/**
 * Formata data para AAAA-MM-DD
 */
export function formatarData(data: Date | string): string {
  if (typeof data === 'string') {
    return data.split('T')[0]
  }
  return data.toISOString().split('T')[0]
}

// =============================================
// Conversao de Dados do Formulario para DPS
// =============================================

export interface DadosFormularioNFSe {
  // Prestador (empresa)
  prestador: {
    cnpj: string
    razaoSocial: string
    inscricaoMunicipal?: string
    endereco?: {
      logradouro: string
      numero: string
      complemento?: string
      bairro: string
      codigoMunicipio: string
      uf: string
      cep: string
    }
    telefone?: string
    email?: string
  }
  // Tomador
  tomador: {
    tipoPessoa: 'PF' | 'PJ'
    cpfCnpj: string
    razaoSocial: string
    inscricaoMunicipal?: string
    endereco?: {
      logradouro: string
      numero: string
      complemento?: string
      bairro: string
      codigoMunicipio: string
      uf: string
      cep: string
    }
    telefone?: string
    email?: string
  }
  // Servico
  servico: {
    codigoTributacao: string
    codigoTributacaoMunicipal?: string
    descricao: string
    codigoNBS?: string
    municipioPrestacao: string
  }
  // Valores
  valores: {
    valorServico: number
    descontoIncondicionado?: number
    descontoCondicionado?: number
    deducoes?: number
    // ISS
    aliquotaISS?: number
    issRetido?: boolean
    // IBS/CBS
    aliquotaIBS?: number
    valorIBS?: number
    ibsRetido?: boolean
    aliquotaCBS?: number
    valorCBS?: number
    cbsRetido?: boolean
  }
  // Dados gerais
  serie: string
  numero: number
  dataCompetencia: string
  codigoMunicipioEmissor: string
  ambiente: AmbienteADN
  infoAdicional?: string
}

/**
 * Converte endereco do formulario para formato DPS
 */
function converterEndereco(endereco?: {
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  codigoMunicipio: string
  uf: string
  cep: string
}): DPSEndereco | undefined {
  if (!endereco || !endereco.logradouro) {
    return undefined
  }
  return {
    xLgr: endereco.logradouro.substring(0, 60),
    nro: endereco.numero.substring(0, 10) || 'S/N',
    xCpl: endereco.complemento?.substring(0, 60),
    xBairro: endereco.bairro.substring(0, 60),
    cMun: limparNumeros(endereco.codigoMunicipio),
    UF: endereco.uf.toUpperCase(),
    CEP: limparNumeros(endereco.cep),
    cPais: '1058',
    xPais: 'Brasil',
  }
}

/**
 * Converte dados do formulario para estrutura DPS
 */
export function converterParaDPS(dados: DadosFormularioNFSe): DPS {
  const idDPS = gerarIdDPS(dados.prestador.cnpj, dados.serie, dados.numero)
  const dhEmi = formatarDataHora()

  // Prestador
  const prestador: DPSPrestador = {
    CNPJ: formatarCNPJ(dados.prestador.cnpj),
    IM: dados.prestador.inscricaoMunicipal,
    xNome: dados.prestador.razaoSocial.substring(0, 150),
    end: converterEndereco(dados.prestador.endereco),
    fone: dados.prestador.telefone ? limparNumeros(dados.prestador.telefone) : undefined,
    email: dados.prestador.email,
  }

  // Tomador
  const tomador: DPSTomador = {
    xNome: dados.tomador.razaoSocial.substring(0, 150),
    IM: dados.tomador.inscricaoMunicipal,
    end: converterEndereco(dados.tomador.endereco),
    fone: dados.tomador.telefone ? limparNumeros(dados.tomador.telefone) : undefined,
    email: dados.tomador.email,
  }

  if (dados.tomador.tipoPessoa === 'PJ') {
    tomador.CNPJ = formatarCNPJ(dados.tomador.cpfCnpj)
  } else {
    tomador.CPF = formatarCPF(dados.tomador.cpfCnpj)
  }

  // Servico
  const servico: DPSServico = {
    cServ: {
      cTribNac: dados.servico.codigoTributacao.replace(/\./g, ''),
      cTribMun: dados.servico.codigoTributacaoMunicipal,
      xDescServ: dados.servico.descricao.substring(0, 2000),
      cNBS: dados.servico.codigoNBS,
    },
    cLocPrest: {
      cMun: limparNumeros(dados.servico.municipioPrestacao),
      cPais: '1058',
    },
  }

  // Valores
  const baseCalculo = dados.valores.valorServico -
    (dados.valores.deducoes || 0) -
    (dados.valores.descontoIncondicionado || 0)

  const valores: DPSValores = {
    vServPrest: {
      vServ: dados.valores.valorServico,
      vDescIncond: dados.valores.descontoIncondicionado,
      vDescCond: dados.valores.descontoCondicionado,
      vDed: dados.valores.deducoes,
    },
    trib: {},
  }

  // ISS (periodo transitorio - ainda obrigatorio ate 2027)
  if (dados.valores.aliquotaISS !== undefined && dados.valores.aliquotaISS > 0) {
    valores.trib.tribMun = {
      tribISSQN: 1, // Tributavel
      pAliq: dados.valores.aliquotaISS / 100, // Converte % para decimal
      tpRetISSQN: dados.valores.issRetido ? 1 : 2,
    }
  }

  // IBS (Reforma Tributaria 2026)
  if (dados.valores.aliquotaIBS !== undefined && dados.valores.aliquotaIBS > 0) {
    const valorIBS = dados.valores.valorIBS || (baseCalculo * dados.valores.aliquotaIBS / 100)
    valores.trib.tribIBS = {
      CST: '00', // Tributacao normal
      pIBS: dados.valores.aliquotaIBS / 100,
      vIBS: valorIBS,
      tpRetIBS: dados.valores.ibsRetido ? 1 : 2,
    }
  }

  // CBS (Reforma Tributaria 2026)
  if (dados.valores.aliquotaCBS !== undefined && dados.valores.aliquotaCBS > 0) {
    const valorCBS = dados.valores.valorCBS || (baseCalculo * dados.valores.aliquotaCBS / 100)
    valores.trib.tribCBS = {
      CST: '00', // Tributacao normal
      pCBS: dados.valores.aliquotaCBS / 100,
      vCBS: valorCBS,
      tpRetCBS: dados.valores.cbsRetido ? 1 : 2,
    }
  }

  // Total de tributos (Lei da Transparencia Fiscal)
  const valorISS = dados.valores.aliquotaISS
    ? baseCalculo * (dados.valores.aliquotaISS / 100)
    : 0
  const valorIBS = valores.trib.tribIBS?.vIBS || 0
  const valorCBS = valores.trib.tribCBS?.vCBS || 0

  valores.trib.totTrib = {
    vTotTribFed: valorCBS,
    vTotTribEst: valorIBS * 0.5, // IBS dividido 50% estado
    vTotTribMun: valorISS + (valorIBS * 0.5), // ISS + 50% IBS municipio
    pTotTribFed: dados.valores.aliquotaCBS || 0,
    pTotTribEst: (dados.valores.aliquotaIBS || 0) * 0.5,
    pTotTribMun: (dados.valores.aliquotaISS || 0) + ((dados.valores.aliquotaIBS || 0) * 0.5),
  }

  // Monta DPS completo
  const dps: DPS = {
    infDPS: {
      Id: idDPS,
      versao: '1.00',
      tpAmb: dados.ambiente,
      dhEmi,
      verAplic: 'ImperioSistemas_1.0',
      serie: dados.serie,
      nDPS: dados.numero,
      dCompet: formatarData(dados.dataCompetencia),
      tpEmit: 1, // Prestador
      cLocEmi: limparNumeros(dados.codigoMunicipioEmissor),
      prest: prestador,
      toma: tomador,
      serv: servico,
      valores,
      infAdic: dados.infoAdicional ? {
        infCpl: dados.infoAdicional.substring(0, 2000),
      } : undefined,
    },
  }

  return dps
}

// =============================================
// Geracao XML
// =============================================

/**
 * Gera XML do DPS para envio ao ADN
 */
export function gerarXMLDPS(dps: DPS): string {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('DPS', { xmlns: NAMESPACE_DPS })
      .ele('infDPS', { Id: dps.infDPS.Id, versao: dps.infDPS.versao })
        .ele('tpAmb').txt(dps.infDPS.tpAmb.toString()).up()
        .ele('dhEmi').txt(dps.infDPS.dhEmi).up()
        .ele('verAplic').txt(dps.infDPS.verAplic).up()
        .ele('serie').txt(dps.infDPS.serie).up()
        .ele('nDPS').txt(dps.infDPS.nDPS.toString()).up()
        .ele('dCompet').txt(dps.infDPS.dCompet).up()
        .ele('tpEmit').txt(dps.infDPS.tpEmit.toString()).up()
        .ele('cLocEmi').txt(dps.infDPS.cLocEmi).up()

  // Substituicao (se houver)
  if (dps.infDPS.subst) {
    doc.ele('subst')
      .ele('chSubstda').txt(dps.infDPS.subst.chSubstda).up()
      .ele('cMotivo').txt(dps.infDPS.subst.cMotivo).up()
    if (dps.infDPS.subst.xMotivo) {
      doc.ele('xMotivo').txt(dps.infDPS.subst.xMotivo).up()
    }
    doc.up()
  }

  // Prestador
  doc.ele('prest')
  if (dps.infDPS.prest.CNPJ) {
    doc.ele('CNPJ').txt(dps.infDPS.prest.CNPJ).up()
  }
  if (dps.infDPS.prest.CPF) {
    doc.ele('CPF').txt(dps.infDPS.prest.CPF).up()
  }
  if (dps.infDPS.prest.IM) {
    doc.ele('IM').txt(dps.infDPS.prest.IM).up()
  }
  doc.ele('xNome').txt(dps.infDPS.prest.xNome).up()

  // Endereco prestador
  if (dps.infDPS.prest.end) {
    adicionarEndereco(doc, dps.infDPS.prest.end)
  }

  if (dps.infDPS.prest.fone) {
    doc.ele('fone').txt(dps.infDPS.prest.fone).up()
  }
  if (dps.infDPS.prest.email) {
    doc.ele('email').txt(dps.infDPS.prest.email).up()
  }
  doc.up() // prest

  // Tomador
  doc.ele('toma')
  if (dps.infDPS.toma.CNPJ) {
    doc.ele('CNPJ').txt(dps.infDPS.toma.CNPJ).up()
  }
  if (dps.infDPS.toma.CPF) {
    doc.ele('CPF').txt(dps.infDPS.toma.CPF).up()
  }
  if (dps.infDPS.toma.NIF) {
    doc.ele('NIF').txt(dps.infDPS.toma.NIF).up()
  }
  if (dps.infDPS.toma.IM) {
    doc.ele('IM').txt(dps.infDPS.toma.IM).up()
  }
  doc.ele('xNome').txt(dps.infDPS.toma.xNome).up()

  // Endereco tomador
  if (dps.infDPS.toma.end) {
    adicionarEndereco(doc, dps.infDPS.toma.end)
  }

  if (dps.infDPS.toma.fone) {
    doc.ele('fone').txt(dps.infDPS.toma.fone).up()
  }
  if (dps.infDPS.toma.email) {
    doc.ele('email').txt(dps.infDPS.toma.email).up()
  }
  doc.up() // toma

  // Intermediario (se houver)
  if (dps.infDPS.interm) {
    doc.ele('interm')
    if (dps.infDPS.interm.CNPJ) {
      doc.ele('CNPJ').txt(dps.infDPS.interm.CNPJ).up()
    }
    if (dps.infDPS.interm.CPF) {
      doc.ele('CPF').txt(dps.infDPS.interm.CPF).up()
    }
    if (dps.infDPS.interm.xNome) {
      doc.ele('xNome').txt(dps.infDPS.interm.xNome).up()
    }
    doc.up()
  }

  // Servico
  doc.ele('serv')
    .ele('cServ')
      .ele('cTribNac').txt(dps.infDPS.serv.cServ.cTribNac).up()
  if (dps.infDPS.serv.cServ.cTribMun) {
    doc.ele('cTribMun').txt(dps.infDPS.serv.cServ.cTribMun).up()
  }
  doc.ele('xDescServ').txt(dps.infDPS.serv.cServ.xDescServ).up()
  if (dps.infDPS.serv.cServ.cNBS) {
    doc.ele('cNBS').txt(dps.infDPS.serv.cServ.cNBS).up()
  }
  doc.up() // cServ
    .ele('cLocPrest')
      .ele('cMun').txt(dps.infDPS.serv.cLocPrest.cMun).up()
  if (dps.infDPS.serv.cLocPrest.cPais) {
    doc.ele('cPais').txt(dps.infDPS.serv.cLocPrest.cPais).up()
  }
  doc.up() // cLocPrest
  doc.up() // serv

  // Valores
  doc.ele('valores')
    .ele('vServPrest')
      .ele('vServ').txt(formatarValor(dps.infDPS.valores.vServPrest.vServ)).up()
  if (dps.infDPS.valores.vServPrest.vDescIncond) {
    doc.ele('vDescIncond').txt(formatarValor(dps.infDPS.valores.vServPrest.vDescIncond)).up()
  }
  if (dps.infDPS.valores.vServPrest.vDescCond) {
    doc.ele('vDescCond').txt(formatarValor(dps.infDPS.valores.vServPrest.vDescCond)).up()
  }
  if (dps.infDPS.valores.vServPrest.vDed) {
    doc.ele('vDed').txt(formatarValor(dps.infDPS.valores.vServPrest.vDed)).up()
  }
  doc.up() // vServPrest

  // Tributos
  doc.ele('trib')

  // ISS Municipal
  if (dps.infDPS.valores.trib.tribMun) {
    const tribMun = dps.infDPS.valores.trib.tribMun
    doc.ele('tribMun')
      .ele('tribISSQN').txt(tribMun.tribISSQN.toString()).up()
    if (tribMun.pAliq !== undefined) {
      doc.ele('pAliq').txt(tribMun.pAliq.toFixed(4)).up()
    }
    if (tribMun.tpRetISSQN !== undefined) {
      doc.ele('tpRetISSQN').txt(tribMun.tpRetISSQN.toString()).up()
    }
    doc.up()
  }

  // IBS
  if (dps.infDPS.valores.trib.tribIBS) {
    const tribIBS = dps.infDPS.valores.trib.tribIBS
    doc.ele('tribIBS')
      .ele('CST').txt(tribIBS.CST).up()
      .ele('pIBS').txt(tribIBS.pIBS.toFixed(4)).up()
      .ele('vIBS').txt(formatarValor(tribIBS.vIBS)).up()
    if (tribIBS.tpRetIBS !== undefined) {
      doc.ele('tpRetIBS').txt(tribIBS.tpRetIBS.toString()).up()
    }
    doc.up()
  }

  // CBS
  if (dps.infDPS.valores.trib.tribCBS) {
    const tribCBS = dps.infDPS.valores.trib.tribCBS
    doc.ele('tribCBS')
      .ele('CST').txt(tribCBS.CST).up()
      .ele('pCBS').txt(tribCBS.pCBS.toFixed(4)).up()
      .ele('vCBS').txt(formatarValor(tribCBS.vCBS)).up()
    if (tribCBS.tpRetCBS !== undefined) {
      doc.ele('tpRetCBS').txt(tribCBS.tpRetCBS.toString()).up()
    }
    doc.up()
  }

  // Total tributos
  if (dps.infDPS.valores.trib.totTrib) {
    const totTrib = dps.infDPS.valores.trib.totTrib
    doc.ele('totTrib')
    if (totTrib.vTotTribFed !== undefined) {
      doc.ele('vTotTribFed').txt(formatarValor(totTrib.vTotTribFed)).up()
    }
    if (totTrib.vTotTribEst !== undefined) {
      doc.ele('vTotTribEst').txt(formatarValor(totTrib.vTotTribEst)).up()
    }
    if (totTrib.vTotTribMun !== undefined) {
      doc.ele('vTotTribMun').txt(formatarValor(totTrib.vTotTribMun)).up()
    }
    doc.up()
  }

  doc.up() // trib
  doc.up() // valores

  // Info adicional
  if (dps.infDPS.infAdic) {
    doc.ele('infAdic')
    if (dps.infDPS.infAdic.infAdFisco) {
      doc.ele('infAdFisco').txt(dps.infDPS.infAdic.infAdFisco).up()
    }
    if (dps.infDPS.infAdic.infCpl) {
      doc.ele('infCpl').txt(dps.infDPS.infAdic.infCpl).up()
    }
    doc.up()
  }

  doc.up() // infDPS
  doc.up() // DPS

  return doc.end({ prettyPrint: true })
}

/**
 * Adiciona elemento de endereco ao documento XML
 */
function adicionarEndereco(doc: any, endereco: DPSEndereco): void {
  doc.ele('end')
    .ele('xLgr').txt(endereco.xLgr).up()
    .ele('nro').txt(endereco.nro).up()
  if (endereco.xCpl) {
    doc.ele('xCpl').txt(endereco.xCpl).up()
  }
  doc.ele('xBairro').txt(endereco.xBairro).up()
    .ele('cMun').txt(endereco.cMun).up()
    .ele('UF').txt(endereco.UF).up()
    .ele('CEP').txt(endereco.CEP).up()
  if (endereco.cPais) {
    doc.ele('cPais').txt(endereco.cPais).up()
  }
  if (endereco.xPais) {
    doc.ele('xPais').txt(endereco.xPais).up()
  }
  doc.up()
}

// =============================================
// Geracao JSON
// =============================================

/**
 * Gera JSON do DPS para envio ao ADN (alternativa ao XML)
 */
export function gerarJSONDPS(dps: DPS): string {
  return JSON.stringify(dps, null, 2)
}

/**
 * Valida estrutura basica do DPS
 */
export function validarDPS(dps: DPS): { valido: boolean; erros: string[] } {
  const erros: string[] = []

  // Validacoes obrigatorias
  if (!dps.infDPS.Id) {
    erros.push('ID do DPS e obrigatorio')
  }

  if (!dps.infDPS.prest.CNPJ && !dps.infDPS.prest.CPF) {
    erros.push('CPF ou CNPJ do prestador e obrigatorio')
  }

  if (!dps.infDPS.prest.xNome) {
    erros.push('Nome/Razao Social do prestador e obrigatorio')
  }

  if (!dps.infDPS.toma.CNPJ && !dps.infDPS.toma.CPF && !dps.infDPS.toma.NIF) {
    erros.push('CPF, CNPJ ou NIF do tomador e obrigatorio')
  }

  if (!dps.infDPS.toma.xNome) {
    erros.push('Nome/Razao Social do tomador e obrigatorio')
  }

  if (!dps.infDPS.serv.cServ.cTribNac) {
    erros.push('Codigo de tributacao nacional e obrigatorio')
  }

  if (!dps.infDPS.serv.cServ.xDescServ) {
    erros.push('Descricao do servico e obrigatoria')
  }

  if (!dps.infDPS.valores.vServPrest.vServ || dps.infDPS.valores.vServPrest.vServ <= 0) {
    erros.push('Valor do servico deve ser maior que zero')
  }

  // Validacao de formato CNPJ/CPF
  if (dps.infDPS.prest.CNPJ && dps.infDPS.prest.CNPJ.length !== 14) {
    erros.push('CNPJ do prestador deve ter 14 digitos')
  }

  if (dps.infDPS.toma.CPF && dps.infDPS.toma.CPF.length !== 11) {
    erros.push('CPF do tomador deve ter 11 digitos')
  }

  if (dps.infDPS.toma.CNPJ && dps.infDPS.toma.CNPJ.length !== 14) {
    erros.push('CNPJ do tomador deve ter 14 digitos')
  }

  return {
    valido: erros.length === 0,
    erros,
  }
}
