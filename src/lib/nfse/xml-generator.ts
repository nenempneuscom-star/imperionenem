// =============================================
// GERADOR DE XML NFS-e - PADRÃO ABRASF 2.04
// =============================================

import { create } from 'xmlbuilder2';
import { RPS, LoteRPS, Valores } from './types';

// Namespace ABRASF
const NAMESPACE = 'http://www.abrasf.org.br/nfse.xsd';

/**
 * Formata data para o padrão XML (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Formata data e hora para o padrão XML (YYYY-MM-DDTHH:mm:ss)
 */
function formatDateTime(date: Date): string {
  return date.toISOString().slice(0, 19);
}

/**
 * Formata valor monetário (2 casas decimais)
 */
function formatMoney(value: number): string {
  return value.toFixed(2);
}

/**
 * Formata alíquota (4 casas decimais)
 */
function formatAliquota(value: number): string {
  return value.toFixed(4);
}

/**
 * Remove caracteres especiais de CPF/CNPJ
 */
function cleanCpfCnpj(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Calcula valores da NFS-e
 */
export function calcularValores(valores: Partial<Valores>): Valores {
  const valorServicos = valores.valorServicos || 0;
  const valorDeducoes = valores.valorDeducoes || 0;
  const descontoIncondicionado = valores.descontoIncondicionado || 0;
  const descontoCondicionado = valores.descontoCondicionado || 0;
  const aliquotaIss = valores.aliquotaIss || 0.05;

  // Base de cálculo = Valor dos serviços - Deduções - Desconto Incondicionado
  const baseCalculo = valorServicos - valorDeducoes - descontoIncondicionado;

  // ISS = Base de Cálculo * Alíquota
  const valorIss = baseCalculo * aliquotaIss;

  // Valor líquido = Valor dos serviços - Retenções - Descontos
  const valorPis = valores.valorPis || 0;
  const valorCofins = valores.valorCofins || 0;
  const valorInss = valores.valorInss || 0;
  const valorIr = valores.valorIr || 0;
  const valorCsll = valores.valorCsll || 0;
  const outrasRetencoes = valores.outrasRetencoes || 0;

  const totalRetencoes = valorPis + valorCofins + valorInss + valorIr + valorCsll + outrasRetencoes;
  const valorLiquido = valorServicos - totalRetencoes - descontoIncondicionado;

  return {
    valorServicos,
    valorDeducoes,
    valorPis,
    valorCofins,
    valorInss,
    valorIr,
    valorCsll,
    outrasRetencoes,
    valorIss,
    aliquotaIss,
    descontoIncondicionado,
    descontoCondicionado,
  };
}

/**
 * Gera XML de um RPS individual
 */
export function gerarXmlRps(rps: RPS): string {
  const valores = calcularValores(rps.valores);
  const baseCalculo = rps.valores.valorServicos - (rps.valores.valorDeducoes || 0) - (rps.valores.descontoIncondicionado || 0);
  const valorLiquido = rps.valores.valorServicos -
    (valores.valorPis || 0) -
    (valores.valorCofins || 0) -
    (valores.valorInss || 0) -
    (valores.valorIr || 0) -
    (valores.valorCsll || 0) -
    (valores.outrasRetencoes || 0) -
    (valores.descontoIncondicionado || 0);

  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('Rps')
      .ele('InfDeclaracaoPrestacaoServico', { Id: `rps${rps.numero}` })
        // Identificação do RPS
        .ele('Rps')
          .ele('IdentificacaoRps')
            .ele('Numero').txt(rps.numero.toString()).up()
            .ele('Serie').txt(rps.serie).up()
            .ele('Tipo').txt(rps.tipo.toString()).up()
          .up()
          .ele('DataEmissao').txt(formatDateTime(rps.dataEmissao)).up()
          .ele('Status').txt('1').up() // 1 = Normal
        .up()
        .ele('Competencia').txt(formatDate(rps.competencia)).up()

        // Serviço
        .ele('Servico')
          .ele('Valores')
            .ele('ValorServicos').txt(formatMoney(valores.valorServicos)).up()
            .ele('ValorDeducoes').txt(formatMoney(valores.valorDeducoes || 0)).up()
            .ele('ValorPis').txt(formatMoney(valores.valorPis || 0)).up()
            .ele('ValorCofins').txt(formatMoney(valores.valorCofins || 0)).up()
            .ele('ValorInss').txt(formatMoney(valores.valorInss || 0)).up()
            .ele('ValorIr').txt(formatMoney(valores.valorIr || 0)).up()
            .ele('ValorCsll').txt(formatMoney(valores.valorCsll || 0)).up()
            .ele('OutrasRetencoes').txt(formatMoney(valores.outrasRetencoes || 0)).up()
            .ele('ValorIss').txt(formatMoney(valores.valorIss || 0)).up()
            .ele('Aliquota').txt(formatAliquota(valores.aliquotaIss)).up()
            .ele('DescontoIncondicionado').txt(formatMoney(valores.descontoIncondicionado || 0)).up()
            .ele('DescontoCondicionado').txt(formatMoney(valores.descontoCondicionado || 0)).up()
          .up()
          .ele('IssRetido').txt(rps.issRetido ? '1' : '2').up() // 1 = Sim, 2 = Não
          .ele('ItemListaServico').txt(rps.servico.itemListaServico).up()
          .ele('CodigoTributacaoMunicipio').txt(rps.servico.codigoTributacao || rps.servico.itemListaServico).up()
          .ele('Discriminacao').txt(rps.servico.discriminacao).up()
          .ele('CodigoMunicipio').txt(rps.servico.codigoMunicipio).up()
          .ele('ExigibilidadeISS').txt('1').up() // 1 = Exigível
        .up()

        // Prestador
        .ele('Prestador')
          .ele('CpfCnpj')
            .ele('Cnpj').txt(cleanCpfCnpj(rps.prestador.cnpj)).up()
          .up()
          .ele('InscricaoMunicipal').txt(rps.prestador.inscricaoMunicipal).up()
        .up()

        // Tomador
        .ele('Tomador')
          .ele('IdentificacaoTomador')
            .ele('CpfCnpj');

  // Adiciona CPF ou CNPJ do tomador
  const cpfCnpjTomador = cleanCpfCnpj(rps.tomador.cpfCnpj);
  if (cpfCnpjTomador.length === 11) {
    doc.ele('Cpf').txt(cpfCnpjTomador).up();
  } else {
    doc.ele('Cnpj').txt(cpfCnpjTomador).up();
  }

  doc.up(); // CpfCnpj

  if (rps.tomador.inscricaoMunicipal) {
    doc.ele('InscricaoMunicipal').txt(rps.tomador.inscricaoMunicipal).up();
  }

  doc.up() // IdentificacaoTomador
    .ele('RazaoSocial').txt(rps.tomador.razaoSocial).up();

  // Endereço do tomador
  if (rps.tomador.endereco) {
    doc.ele('Endereco')
      .ele('Endereco').txt(rps.tomador.endereco.logradouro).up()
      .ele('Numero').txt(rps.tomador.endereco.numero).up()
      .ele('Complemento').txt(rps.tomador.endereco.complemento || '').up()
      .ele('Bairro').txt(rps.tomador.endereco.bairro).up()
      .ele('CodigoMunicipio').txt(rps.tomador.endereco.codigoMunicipio).up()
      .ele('Uf').txt(rps.tomador.endereco.uf).up()
      .ele('Cep').txt(rps.tomador.endereco.cep.replace(/\D/g, '')).up()
    .up();
  }

  // Contato do tomador
  if (rps.tomador.contato) {
    doc.ele('Contato');
    if (rps.tomador.contato.telefone) {
      doc.ele('Telefone').txt(rps.tomador.contato.telefone.replace(/\D/g, '')).up();
    }
    if (rps.tomador.contato.email) {
      doc.ele('Email').txt(rps.tomador.contato.email).up();
    }
    doc.up();
  }

  doc.up() // Tomador
    .ele('RegimeEspecialTributacao').txt(rps.regimeEspecialTributacao || '0').up()
    .ele('OptanteSimplesNacional').txt(rps.optanteSimplesNacional ? '1' : '2').up()
    .ele('IncentivoFiscal').txt(rps.incentivadorCultural ? '1' : '2').up()
  .up() // InfDeclaracaoPrestacaoServico
  .up(); // Rps

  return doc.end({ prettyPrint: true });
}

/**
 * Gera XML de um Lote de RPS para envio
 */
export function gerarXmlLoteRps(lote: LoteRPS): string {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('EnviarLoteRpsEnvio', { xmlns: NAMESPACE })
      .ele('LoteRps', { Id: `lote${lote.numeroLote}`, versao: '2.04' })
        .ele('NumeroLote').txt(lote.numeroLote.toString()).up()
        .ele('CpfCnpj')
          .ele('Cnpj').txt(cleanCpfCnpj(lote.cnpjPrestador)).up()
        .up()
        .ele('InscricaoMunicipal').txt(lote.inscricaoMunicipalPrestador).up()
        .ele('QuantidadeRps').txt(lote.quantidadeRps.toString()).up()
        .ele('ListaRps');

  // Adiciona cada RPS ao lote
  for (const rps of lote.listaRps) {
    const rpsXml = gerarXmlRps(rps);
    // Remove declaração XML do RPS individual
    const rpsContent = rpsXml.replace(/<\?xml[^?]*\?>\s*/g, '');
    doc.import(create(rpsContent).root());
  }

  doc.up() // ListaRps
    .up() // LoteRps
    .up(); // EnviarLoteRpsEnvio

  return doc.end({ prettyPrint: true });
}

/**
 * Gera XML para consulta de NFS-e por RPS
 */
export function gerarXmlConsultaNfsePorRps(
  numeroRps: number,
  serieRps: string,
  tipoRps: number,
  cnpjPrestador: string,
  inscricaoMunicipal: string
): string {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('ConsultarNfseRpsEnvio', { xmlns: NAMESPACE })
      .ele('IdentificacaoRps')
        .ele('Numero').txt(numeroRps.toString()).up()
        .ele('Serie').txt(serieRps).up()
        .ele('Tipo').txt(tipoRps.toString()).up()
      .up()
      .ele('Prestador')
        .ele('CpfCnpj')
          .ele('Cnpj').txt(cleanCpfCnpj(cnpjPrestador)).up()
        .up()
        .ele('InscricaoMunicipal').txt(inscricaoMunicipal).up()
      .up()
    .up();

  return doc.end({ prettyPrint: true });
}

/**
 * Gera XML para cancelamento de NFS-e
 */
export function gerarXmlCancelamentoNfse(
  numeroNfse: string,
  cnpjPrestador: string,
  inscricaoMunicipal: string,
  codigoMunicipio: string,
  codigoCancelamento: string = '1' // 1 = Erro na emissão
): string {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('CancelarNfseEnvio', { xmlns: NAMESPACE })
      .ele('Pedido')
        .ele('InfPedidoCancelamento', { Id: `cancel${numeroNfse}` })
          .ele('IdentificacaoNfse')
            .ele('Numero').txt(numeroNfse).up()
            .ele('CpfCnpj')
              .ele('Cnpj').txt(cleanCpfCnpj(cnpjPrestador)).up()
            .up()
            .ele('InscricaoMunicipal').txt(inscricaoMunicipal).up()
            .ele('CodigoMunicipio').txt(codigoMunicipio).up()
          .up()
          .ele('CodigoCancelamento').txt(codigoCancelamento).up()
        .up()
      .up()
    .up();

  return doc.end({ prettyPrint: true });
}

/**
 * Gera XML para consulta de lote de RPS
 */
export function gerarXmlConsultaLoteRps(
  protocolo: string,
  cnpjPrestador: string,
  inscricaoMunicipal: string
): string {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('ConsultarLoteRpsEnvio', { xmlns: NAMESPACE })
      .ele('Prestador')
        .ele('CpfCnpj')
          .ele('Cnpj').txt(cleanCpfCnpj(cnpjPrestador)).up()
        .up()
        .ele('InscricaoMunicipal').txt(inscricaoMunicipal).up()
      .up()
      .ele('Protocolo').txt(protocolo).up()
    .up();

  return doc.end({ prettyPrint: true });
}
