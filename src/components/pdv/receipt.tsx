'use client'

import { forwardRef } from 'react'

interface ItemRecibo {
  codigo: string
  nome: string
  quantidade: number
  preco: number
  total: number
}

interface PagamentoRecibo {
  forma: string
  valor: number
}

interface DadosRecibo {
  // Empresa
  empresa: {
    nome: string // Nome Fantasia
    razaoSocial?: string // Razao Social (obrigatorio para NFC-e)
    cnpj: string
    inscricaoEstadual?: string // IE (obrigatorio para NFC-e)
    endereco?: string
    cidade?: string
    uf?: string
    cep?: string
    telefone?: string
  }
  // Venda
  numero?: number
  data: Date
  operador: string
  // Itens
  itens: ItemRecibo[]
  // Valores
  subtotal: number
  desconto: number
  total: number
  qtdItens?: number // Quantidade total de itens
  // Tributos (Lei 12.741/2012 - IBPT)
  valorTributos?: number
  percentualTributos?: number
  // Pagamentos
  pagamentos: PagamentoRecibo[]
  valorRecebido?: number
  troco?: number
  // NFC-e (dados obrigatorios conforme Manual DANFE NFC-e)
  nfce?: {
    numero?: number // Numero da NFC-e
    serie?: number // Serie da NFC-e
    chave?: string
    protocolo?: string
    dataEmissao?: Date // Data/hora de emissao
    dataAutorizacao?: Date // Data/hora de autorizacao
    qrCodeUrl?: string // URL completa do QR Code
    urlConsulta?: string // URL de consulta por UF
  }
  // Cliente/Consumidor
  cliente?: {
    nome?: string
    cpf?: string // CPF ou CNPJ
    telefone?: string
    cidade?: string
    veiculo?: string
  }
}

interface ReceiptProps {
  dados: DadosRecibo
  largura?: '58mm' | '80mm'
}

// Formata moeda
function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

// Formata data e hora
function formatDateTime(date: Date): string {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Formata CNPJ
function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '')
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

// Formata CPF
function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
}

// Formata Chave de Acesso em grupos de 4 digitos
function formatChaveAcesso(chave: string): string {
  if (!chave) return ''
  return chave.replace(/(\d{4})/g, '$1 ').trim()
}

// Formata telefone com DDD
function formatTelefone(tel: string): string {
  if (!tel) return ''
  const cleaned = tel.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)})${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)})${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  return tel
}

// Mapa de formas de pagamento
const formasPagamento: Record<string, string> = {
  dinheiro: 'DINHEIRO',
  cartao_credito: 'CARTÃO CRÉDITO',
  cartao_debito: 'CARTÃO DÉBITO',
  pix: 'PIX',
}

// Componente do Cupom
export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  function Receipt({ dados, largura = '80mm' }, ref) {
    const {
      empresa,
      numero,
      data,
      operador,
      itens,
      subtotal,
      desconto,
      total,
      valorTributos,
      percentualTributos,
      pagamentos,
      valorRecebido,
      troco,
      nfce,
      cliente,
    } = dados

    // Largura em caracteres
    const maxChars = largura === '58mm' ? 32 : 48
    const separador = '-'.repeat(maxChars)

    // Trunca texto se necessário
    function truncate(text: string, max: number): string {
      return text.length > max ? text.substring(0, max - 1) + '.' : text
    }

    return (
      <div
        ref={ref}
        className="receipt-container"
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: largura === '58mm' ? '12px' : '13px',
          fontWeight: 600,
          lineHeight: 1.4,
          width: largura,
          padding: '5mm',
          backgroundColor: 'white',
          color: 'black',
          textTransform: 'uppercase',
        }}
      >
        {/* Header da Empresa */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontWeight: 900, fontSize: largura === '58mm' ? '14px' : '15px' }}>
            {truncate(empresa.nome, maxChars)}
          </div>
          <div style={{ fontWeight: 800 }}>CNPJ: {formatCNPJ(empresa.cnpj)}</div>
          {empresa.endereco && (
            <div style={{ fontSize: largura === '58mm' ? '10px' : '11px', fontWeight: 600 }}>
              {truncate(empresa.endereco, maxChars)}
            </div>
          )}
          {empresa.telefone && <div style={{ fontWeight: 700 }}>Tel: {empresa.telefone}</div>}
        </div>

        <div>{separador}</div>

        {/* Tipo de documento */}
        <div style={{ textAlign: 'center', fontWeight: 900 }}>
          {nfce?.chave ? 'NFC-e - DANFE' : 'CUPOM NÃO FISCAL'}
        </div>

        <div>{separador}</div>

        {/* Info da venda */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Venda: {numero || '---'}</span>
          <span>{formatDateTime(data)}</span>
        </div>
        <div>Operador: {truncate(operador, maxChars - 10)}</div>

        {cliente?.nome && (
          <div>Cliente: {truncate(cliente.nome, maxChars - 9)}</div>
        )}
        {cliente?.cpf && (
          <div>CPF: {formatCPF(cliente.cpf)}</div>
        )}

        <div>{separador}</div>

        {/* Header dos itens */}
        <div style={{ fontWeight: 900 }}>
          {largura === '58mm' ? (
            <>
              <div>ITEM DESCRIÇÃO</div>
              <div>QTD x VALOR = TOTAL</div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ITEM</span>
              <span>QTD x VALOR</span>
              <span>TOTAL</span>
            </div>
          )}
        </div>

        <div>{separador}</div>

        {/* Lista de itens */}
        {itens.map((item, index) => (
          <div key={index} style={{ marginBottom: '4px' }}>
            {largura === '58mm' ? (
              <>
                <div style={{ fontWeight: 800 }}>{String(index + 1).padStart(3, '0')} {truncate(item.nome, maxChars - 4)}</div>
                <div style={{ textAlign: 'right', fontWeight: 700 }}>
                  {item.quantidade.toFixed(2)} x {formatCurrency(item.preco)} = {formatCurrency(item.total)}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 800 }}>{String(index + 1).padStart(3, '0')} {truncate(item.nome, maxChars - 4)}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '20px', fontWeight: 700 }}>
                  <span>{item.quantidade.toFixed(2)} x {formatCurrency(item.preco)}</span>
                  <span style={{ fontWeight: 900 }}>{formatCurrency(item.total)}</span>
                </div>
              </>
            )}
          </div>
        ))}

        <div>{separador}</div>

        {/* Totais */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
          <span>SUBTOTAL:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {desconto > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
            <span>DESCONTO:</span>
            <span>-{formatCurrency(desconto)}</span>
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontWeight: 900,
          fontSize: largura === '58mm' ? '14px' : '15px',
          marginTop: '4px',
        }}>
          <span>TOTAL:</span>
          <span>{formatCurrency(total)}</span>
        </div>

        {/* Tributos - Lei 12.741/2012 (IBPT) */}
        {valorTributos !== undefined && valorTributos > 0 && (
          <div style={{
            marginTop: '8px',
            padding: '4px',
            border: '2px solid black',
            fontSize: largura === '58mm' ? '10px' : '11px',
            fontWeight: 700,
          }}>
            <div style={{ fontWeight: 800 }}>
              Val. Aprox. Tributos: {formatCurrency(valorTributos)}
              {percentualTributos !== undefined && ` (${percentualTributos.toFixed(2)}%)`}
            </div>
            <div style={{ fontSize: largura === '58mm' ? '9px' : '10px', fontWeight: 600 }}>
              Fonte: IBPT - Lei 12.741/2012
            </div>
          </div>
        )}

        <div>{separador}</div>

        {/* Pagamentos */}
        <div style={{ fontWeight: 900 }}>PAGAMENTO:</div>
        {pagamentos.map((pag, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
            <span>{formasPagamento[pag.forma] || pag.forma.toUpperCase()}</span>
            <span>{formatCurrency(pag.valor)}</span>
          </div>
        ))}

        {valorRecebido !== undefined && valorRecebido > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
            <span>Valor Recebido:</span>
            <span>{formatCurrency(valorRecebido)}</span>
          </div>
        )}

        {troco !== undefined && troco > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 900,
            fontSize: largura === '58mm' ? '14px' : '15px',
          }}>
            <span>TROCO:</span>
            <span>{formatCurrency(troco)}</span>
          </div>
        )}

        {/* NFC-e Info */}
        {nfce?.chave && (
          <>
            <div>{separador}</div>
            <div style={{ textAlign: 'center', fontSize: largura === '58mm' ? '10px' : '11px', fontWeight: 600 }}>
              <div style={{ fontWeight: 900 }}>CHAVE DE ACESSO</div>
              <div style={{ wordBreak: 'break-all', fontWeight: 800 }}>{nfce.chave}</div>
              {nfce.protocolo && (
                <div style={{ marginTop: '4px', fontWeight: 800 }}>
                  Protocolo: {nfce.protocolo}
                </div>
              )}
              <div style={{ marginTop: '4px' }}>
                Consulte em www.nfce.fazenda.gov.br
              </div>
            </div>
          </>
        )}

        <div>{separador}</div>

        {/* QR Code placeholder */}
        {nfce?.chave && (
          <div style={{
            textAlign: 'center',
            padding: '10px',
            border: '1px dashed #ccc',
            margin: '8px 0',
          }}>
            [QR CODE]
          </div>
        )}

        {/* Rodapé */}
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <div>{separador}</div>
          <div style={{ fontWeight: 900, marginTop: '4px' }}>
            OBRIGADO PELA PREFERÊNCIA!
          </div>
          <div style={{ fontSize: largura === '58mm' ? '10px' : '11px', marginTop: '4px', fontWeight: 700 }}>
            Volte sempre!
          </div>
          <div style={{ fontSize: largura === '58mm' ? '9px' : '10px', marginTop: '8px', fontWeight: 700 }}>
            Imperio Sistemas
          </div>
        </div>
      </div>
    )
  }
)

// Componente de impressão (abre em nova janela)
interface PrintReceiptProps {
  dados: DadosRecibo
  largura?: '58mm' | '80mm'
  onClose?: () => void
}

export function printReceipt({ dados, largura = '80mm' }: PrintReceiptProps) {
  const {
    empresa,
    numero,
    data,
    itens,
    subtotal,
    desconto,
    total,
    qtdItens,
    valorTributos,
    percentualTributos,
    pagamentos,
    valorRecebido,
    troco,
    nfce,
    cliente,
  } = dados

  const maxChars = largura === '58mm' ? 32 : 42
  const separador = '-'.repeat(maxChars)
  const fontSize = largura === '58mm' ? '12px' : '13px'
  const fontSizeSmall = largura === '58mm' ? '10px' : '11px'
  const fontSizeLarge = largura === '58mm' ? '14px' : '15px'

  // Verificar se e NFC-e (com chave)
  const isNFCe = !!nfce?.chave

  function truncate(text: string, max: number): string {
    return text.length > max ? text.substring(0, max - 1) + '.' : text
  }

  function formatCEP(cep: string): string {
    const cleaned = cep.replace(/\D/g, '')
    return cleaned.replace(/^(\d{5})(\d{3})$/, '$1-$2')
  }

  // URL de consulta por UF (padrao SC)
  const urlConsulta = nfce?.urlConsulta ||
    (empresa.uf === 'SC' ? 'https://sat.sef.sc.gov.br/nfce/consulta' : 'www.nfce.fazenda.gov.br/portal')

  // Montar endereco completo
  let enderecoCompleto = empresa.endereco || ''
  let cidadeUfCep = ''
  if (empresa.cidade || empresa.uf || empresa.cep) {
    const parts = []
    if (empresa.cidade) parts.push(empresa.cidade)
    if (empresa.uf) parts.push(empresa.uf)
    cidadeUfCep = parts.join('-')
    if (empresa.cep) {
      cidadeUfCep += ` - ${formatCEP(empresa.cep)}`
    }
  }

  // Formatar numero da NFC-e com zeros a esquerda
  const numeroNFCe = nfce?.numero ? String(nfce.numero).padStart(9, '0') : ''
  const serieNFCe = nfce?.serie ? String(nfce.serie).padStart(3, '0') : ''

  // Calcular quantidade total de itens se nao fornecido
  const totalItens = qtdItens ?? itens.length

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${isNFCe ? `NFC-e ${numeroNFCe}` : `Cupom ${numero || ''}`}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @media print {
          @page { size: ${largura} auto; margin: 2mm 4mm; }
          html, body { margin: 0 !important; padding: 0 !important; width: ${largura} !important; }
          * { color: #000000 !important; }
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: ${fontSize};
          font-weight: 600;
          line-height: 1.4;
          width: ${largura};
          padding: 2mm 4mm;
          margin: 0 auto;
          background: #fff;
          color: #000;
          text-transform: uppercase;
        }
        .center { text-align: center; }
        .bold { font-weight: 800 !important; }
        .extra-bold { font-weight: 900 !important; }
        .sep { margin: 3px 0; font-weight: 800; letter-spacing: -1px; }
        .flex { display: flex; justify-content: space-between; }
        .small { font-size: ${fontSizeSmall}; font-weight: 600; }
        .xsmall { font-size: 9px; font-weight: 600; }
        .large { font-size: ${fontSizeLarge}; font-weight: 900; }
        .item { margin-bottom: 3px; }
        .item-detail { padding-left: 12px; font-weight: 700; }
        .break-all { word-break: break-all; }
        .tributos { margin-top: 4px; padding: 4px; border: 2px solid #000; font-size: ${fontSizeSmall}; }
        .qrcode { width: 120px; height: 120px; margin: 6px auto; display: block; }
      </style>
    </head>
    <body>
      <!-- CABECALHO EMPRESA - Padrao SEFAZ -->
      <div class="center">
        <div class="bold">CNPJ: ${formatCNPJ(empresa.cnpj)} ${empresa.razaoSocial || empresa.nome}</div>
        ${enderecoCompleto ? `<div class="small">${truncate(enderecoCompleto, maxChars)}</div>` : ''}
        ${cidadeUfCep ? `<div class="small">${truncate(cidadeUfCep, maxChars)}</div>` : ''}
        ${empresa.telefone ? `<div class="small">Fone:${formatTelefone(empresa.telefone)} ${empresa.inscricaoEstadual ? `I.E.:${empresa.inscricaoEstadual}` : ''}</div>` : ''}
        ${!empresa.telefone && empresa.inscricaoEstadual ? `<div class="small">I.E.:${empresa.inscricaoEstadual}</div>` : ''}
      </div>

      <div class="sep">${separador}</div>

      <!-- TITULO DO DOCUMENTO -->
      <div class="center bold">
        ${isNFCe ? 'Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica' : 'CUPOM NÃO FISCAL'}
      </div>

      <div class="sep">${separador}</div>

      <!-- CABECALHO ITENS - Padrao SEFAZ -->
      <div class="small bold">
        <div># Código Descrição Qtde Un Valor unit. Valor total</div>
      </div>

      <!-- ITENS -->
      ${itens.map((item, index) => `
        <div class="item">
          <div class="bold">${String(index + 1).padStart(3, '0')} ${item.codigo || ''} ${truncate(item.nome, maxChars - 8)}</div>
          <div class="flex item-detail small">
            <span>${item.quantidade} UN X ${formatCurrency(item.preco)}</span>
            <span class="extra-bold">${formatCurrency(item.total)}</span>
          </div>
        </div>
      `).join('')}

      ${desconto > 0 ? `
        <div class="flex small">
          <span>Desconto</span>
          <span>-${formatCurrency(desconto)}</span>
        </div>
      ` : ''}

      <div class="sep">${separador}</div>

      <!-- TOTAIS - Padrao SEFAZ -->
      <div class="flex small">
        <span>Qtde. total de itens</span>
        <span>${String(totalItens).padStart(3, '0')}</span>
      </div>
      <div class="flex bold">
        <span>Valor total R$</span>
        <span>${formatCurrency(subtotal)}</span>
      </div>
      ${desconto > 0 ? `
        <div class="flex">
          <span>Desconto total</span>
          <span>-${formatCurrency(desconto)}</span>
        </div>
      ` : ''}
      <div class="flex extra-bold large">
        <span>Valor a Pagar R$</span>
        <span>${formatCurrency(total)}</span>
      </div>

      <div class="sep">${separador}</div>

      <!-- FORMA DE PAGAMENTO -->
      <div class="bold">FORMA DE PAGAMENTO</div>
      ${pagamentos.map(pag => `
        <div class="flex">
          <span>${formasPagamento[pag.forma] || pag.forma}</span>
          <span>VALOR PAGO R$ ${formatCurrency(pag.valor)}</span>
        </div>
      `).join('')}
      ${troco && troco > 0 ? `
        <div class="flex bold">
          <span>Troco R$</span>
          <span>${formatCurrency(troco)}</span>
        </div>
      ` : ''}

      <div class="sep">${separador}</div>

      <!-- CONSULTA E CHAVE DE ACESSO -->
      ${isNFCe ? `
        <div class="center small">
          <div>Consulte pela Chave de Acesso em</div>
          <div class="bold">${urlConsulta}</div>
          <div class="break-all bold" style="margin-top: 4px; letter-spacing: 1px;">
            ${formatChaveAcesso(nfce.chave || '')}
          </div>
        </div>

        <div class="sep">${separador}</div>

        <!-- CONSUMIDOR -->
        <div class="center bold">
          ${cliente?.cpf ? `CONSUMIDOR CPF: ${cliente.cpf.length > 11 ? formatCNPJ(cliente.cpf) : formatCPF(cliente.cpf)}` : 'CONSUMIDOR NÃO IDENTIFICADO'}
        </div>
        ${cliente?.nome ? `<div class="center small">${truncate(cliente.nome, maxChars)}</div>` : ''}

        <div class="sep">${separador}</div>

        <!-- DADOS DA NFC-e -->
        <div class="center small">
          <div>NFC-e nº ${numeroNFCe} Série ${serieNFCe} ${nfce.dataEmissao ? formatDateTime(nfce.dataEmissao) : formatDateTime(data)}</div>
          ${nfce.protocolo ? `<div>Protocolo de Autorização: ${nfce.protocolo}</div>` : ''}
          ${nfce.dataAutorizacao ? `<div>Data de Autorização ${formatDateTime(nfce.dataAutorizacao)}</div>` : ''}
        </div>

        <div class="sep">${separador}</div>

        <!-- QR CODE -->
        <div class="center">
          ${nfce.qrCodeUrl ? `
            <img class="qrcode" src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(nfce.qrCodeUrl)}" alt="QR Code" />
          ` : '<div style="border: 1px dashed #000; padding: 20px; margin: 6px 0;">[QR CODE]</div>'}
        </div>
      ` : `
        <!-- CUPOM NAO FISCAL -->
        <div class="center small">
          <div>Venda: ${numero || '---'}</div>
          <div>${formatDateTime(data)}</div>
        </div>
      `}

      <!-- TRIBUTOS - Lei 12.741/2012 (IBPT) -->
      ${valorTributos && valorTributos > 0 ? `
        <div class="sep">${separador}</div>
        <div class="center small">
          <div>Val Aprox Tributos R$ ${formatCurrency(valorTributos)} (${percentualTributos?.toFixed(2) || '0.00'}%) Fonte:IBPT</div>
        </div>
      ` : ''}

      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 300);
        }
      </script>
    </body>
    </html>
  `

  const printWindow = window.open('', '_blank', 'width=400,height=600')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  }
}

export type { DadosRecibo, ItemRecibo, PagamentoRecibo }
