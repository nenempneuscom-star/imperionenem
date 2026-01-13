'use client'

interface OrcamentoItem {
  codigo: string
  nome: string
  unidade: string
  quantidade: number
  preco_unitario: number
  desconto: number
  total: number
}

interface OrcamentoPrintData {
  orcamento: {
    numero: number
    data: Date
    validade: Date
    status: string
    observacoes?: string | null
    condicoes?: string | null
  }
  empresa: {
    nome: string
    cnpj: string
    telefone?: string | null
    endereco?: any
  } | null
  cliente: {
    nome?: string | null
    cpf_cnpj?: string | null
    telefone?: string | null
    email?: string | null
  } | null
  itens: OrcamentoItem[]
  subtotal: number
  desconto: number
  total: number
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR')
}

function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '')
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

function formatEndereco(endereco: any): string {
  if (!endereco || typeof endereco !== 'object') return ''
  const parts = []
  if (endereco.logradouro) parts.push(endereco.logradouro)
  if (endereco.numero) parts.push(endereco.numero)
  if (endereco.bairro) parts.push(endereco.bairro)
  if (endereco.cidade) parts.push(endereco.cidade)
  if (endereco.uf) parts.push(endereco.uf)
  if (endereco.cep) parts.push(`CEP: ${endereco.cep}`)
  return parts.join(', ')
}

export function printOrcamento(data: OrcamentoPrintData) {
  const { orcamento, empresa, cliente, itens, subtotal, desconto, total } = data

  const empresaNome = empresa?.nome || 'EMPRESA'
  const empresaCnpj = empresa?.cnpj ? formatCNPJ(empresa.cnpj) : ''
  const empresaTelefone = empresa?.telefone || ''
  const empresaEndereco = empresa?.endereco ? formatEndereco(empresa.endereco) : ''

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Orcamento #${orcamento.numero}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          padding: 20px;
          max-width: 210mm;
          margin: 0 auto;
          background: #fff;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #1a1a1a;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }

        .empresa-info {
          flex: 1;
        }

        .empresa-nome {
          font-size: 24px;
          font-weight: bold;
          color: #1a1a1a;
          margin-bottom: 5px;
        }

        .empresa-dados {
          font-size: 11px;
          color: #666;
        }

        .orcamento-info {
          text-align: right;
        }

        .orcamento-titulo {
          font-size: 28px;
          font-weight: bold;
          color: #1a1a1a;
        }

        .orcamento-numero {
          font-size: 18px;
          color: #666;
          margin-bottom: 5px;
        }

        .orcamento-data {
          font-size: 11px;
          color: #666;
        }

        .section {
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 14px;
          font-weight: bold;
          background: #f5f5f5;
          padding: 8px 12px;
          border-left: 4px solid #1a1a1a;
          margin-bottom: 10px;
        }

        .cliente-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          padding: 10px;
          background: #fafafa;
          border-radius: 4px;
        }

        .cliente-item label {
          font-size: 10px;
          color: #666;
          display: block;
        }

        .cliente-item span {
          font-size: 12px;
          font-weight: 500;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }

        .items-table th {
          background: #1a1a1a;
          color: #fff;
          padding: 10px 8px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
        }

        .items-table th.text-center {
          text-align: center;
        }

        .items-table th.text-right {
          text-align: right;
        }

        .items-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #eee;
          font-size: 11px;
        }

        .items-table td.text-center {
          text-align: center;
        }

        .items-table td.text-right {
          text-align: right;
        }

        .items-table tr:nth-child(even) {
          background: #fafafa;
        }

        .totais {
          display: flex;
          justify-content: flex-end;
        }

        .totais-box {
          width: 250px;
          border: 2px solid #1a1a1a;
          border-radius: 4px;
          overflow: hidden;
        }

        .totais-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          border-bottom: 1px solid #eee;
        }

        .totais-row:last-child {
          border-bottom: none;
        }

        .totais-row.total {
          background: #1a1a1a;
          color: #fff;
          font-size: 16px;
          font-weight: bold;
        }

        .totais-row.desconto {
          color: #dc2626;
        }

        .validade-box {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 4px;
          padding: 12px;
          text-align: center;
          margin-bottom: 20px;
        }

        .validade-titulo {
          font-size: 12px;
          color: #92400e;
          margin-bottom: 5px;
        }

        .validade-data {
          font-size: 18px;
          font-weight: bold;
          color: #92400e;
        }

        .observacoes {
          background: #f5f5f5;
          padding: 12px;
          border-radius: 4px;
          font-size: 11px;
          white-space: pre-wrap;
        }

        .condicoes {
          background: #e0f2fe;
          border: 1px solid #0284c7;
          padding: 12px;
          border-radius: 4px;
          font-size: 11px;
          white-space: pre-wrap;
        }

        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #eee;
          display: flex;
          justify-content: space-between;
        }

        .assinatura {
          text-align: center;
          width: 45%;
        }

        .assinatura-linha {
          border-top: 1px solid #333;
          margin-top: 50px;
          padding-top: 5px;
          font-size: 11px;
        }

        .rodape {
          text-align: center;
          margin-top: 30px;
          font-size: 10px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="empresa-info">
          <div class="empresa-nome">${empresaNome}</div>
          <div class="empresa-dados">
            ${empresaCnpj ? `CNPJ: ${empresaCnpj}<br>` : ''}
            ${empresaEndereco ? `${empresaEndereco}<br>` : ''}
            ${empresaTelefone ? `Tel: ${empresaTelefone}` : ''}
          </div>
        </div>
        <div class="orcamento-info">
          <div class="orcamento-titulo">ORCAMENTO</div>
          <div class="orcamento-numero">#${String(orcamento.numero).padStart(6, '0')}</div>
          <div class="orcamento-data">
            Emissao: ${formatDate(orcamento.data)}
          </div>
        </div>
      </div>

      <!-- Validade -->
      <div class="validade-box">
        <div class="validade-titulo">ORCAMENTO VALIDO ATE</div>
        <div class="validade-data">${formatDate(orcamento.validade)}</div>
      </div>

      <!-- Cliente -->
      <div class="section">
        <div class="section-title">DADOS DO CLIENTE</div>
        <div class="cliente-grid">
          <div class="cliente-item">
            <label>Nome / Razao Social</label>
            <span>${cliente?.nome || 'Nao informado'}</span>
          </div>
          <div class="cliente-item">
            <label>CPF / CNPJ</label>
            <span>${cliente?.cpf_cnpj || '-'}</span>
          </div>
          <div class="cliente-item">
            <label>Telefone</label>
            <span>${cliente?.telefone || '-'}</span>
          </div>
          <div class="cliente-item">
            <label>Email</label>
            <span>${cliente?.email || '-'}</span>
          </div>
        </div>
      </div>

      <!-- Itens -->
      <div class="section">
        <div class="section-title">PRODUTOS / SERVICOS</div>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 80px;">Codigo</th>
              <th>Descricao</th>
              <th class="text-center" style="width: 60px;">Qtd</th>
              <th class="text-center" style="width: 50px;">Un</th>
              <th class="text-right" style="width: 100px;">Unitario</th>
              <th class="text-right" style="width: 100px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itens.map(item => `
              <tr>
                <td>${item.codigo || '-'}</td>
                <td>${item.nome}</td>
                <td class="text-center">${item.quantidade}</td>
                <td class="text-center">${item.unidade}</td>
                <td class="text-right">${formatCurrency(item.preco_unitario)}</td>
                <td class="text-right">${formatCurrency(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Totais -->
        <div class="totais">
          <div class="totais-box">
            <div class="totais-row">
              <span>Subtotal</span>
              <span>${formatCurrency(subtotal)}</span>
            </div>
            ${desconto > 0 ? `
              <div class="totais-row desconto">
                <span>Desconto</span>
                <span>-${formatCurrency(desconto)}</span>
              </div>
            ` : ''}
            <div class="totais-row total">
              <span>TOTAL</span>
              <span>${formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Observacoes -->
      ${orcamento.observacoes ? `
        <div class="section">
          <div class="section-title">OBSERVACOES</div>
          <div class="observacoes">${orcamento.observacoes}</div>
        </div>
      ` : ''}

      <!-- Condicoes -->
      ${orcamento.condicoes ? `
        <div class="section">
          <div class="section-title">CONDICOES COMERCIAIS</div>
          <div class="condicoes">${orcamento.condicoes}</div>
        </div>
      ` : ''}

      <!-- Assinaturas -->
      <div class="footer">
        <div class="assinatura">
          <div class="assinatura-linha">
            ${empresaNome}
          </div>
        </div>
        <div class="assinatura">
          <div class="assinatura-linha">
            ${cliente?.nome || 'Cliente'}
          </div>
        </div>
      </div>

      <!-- Rodape -->
      <div class="rodape">
        Documento gerado em ${new Date().toLocaleString('pt-BR')} | Imperio Sistemas
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        }
      </script>
    </body>
    </html>
  `

  const printWindow = window.open('', '_blank', 'width=800,height=600')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  }
}
