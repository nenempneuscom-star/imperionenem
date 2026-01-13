import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ServicoFiscal } from '@/lib/fiscal'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verifica autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Busca dados do usuário e empresa
    const { data: userData } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData?.empresa_id) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    // Busca configurações fiscais
    const { data: empresa } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', userData.empresa_id)
      .single()

    if (!empresa) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    const configFiscal = empresa.config_fiscal || {}

    if (!configFiscal.certificado_base64 || !configFiscal.certificado_senha) {
      return NextResponse.json(
        { error: 'Certificado digital não configurado' },
        { status: 400 }
      )
    }

    // Dados da NF-e
    const body = await request.json()
    const {
      naturezaOperacao,
      destinatario,
      produtos,
      pagamentos,
      valorTotal,
      valorDesconto,
      valorFrete,
      informacoesAdicionais,
    } = body

    if (!destinatario || !destinatario.cpfCnpj) {
      return NextResponse.json({ error: 'Destinatário obrigatório para NF-e' }, { status: 400 })
    }

    if (!produtos || produtos.length === 0) {
      return NextResponse.json({ error: 'Nenhum produto informado' }, { status: 400 })
    }

    // Prepara dados da empresa
    const empresaFiscal = {
      cnpj: empresa.cnpj,
      razaoSocial: empresa.razao_social,
      nomeFantasia: empresa.nome_fantasia,
      inscricaoEstadual: empresa.inscricao_estadual,
      crt: configFiscal.crt || 1,
      endereco: {
        logradouro: empresa.endereco?.logradouro || '',
        numero: empresa.endereco?.numero || '',
        complemento: empresa.endereco?.complemento,
        bairro: empresa.endereco?.bairro || '',
        codigoMunicipio: empresa.endereco?.codigo_municipio || '',
        nomeMunicipio: empresa.endereco?.cidade || '',
        uf: empresa.endereco?.uf || 'SC',
        cep: empresa.endereco?.cep || '',
        pais: 'BRASIL',
        codigoPais: '1058',
        telefone: empresa.telefone,
      },
    }

    // Inicializa serviço fiscal
    const servicoFiscal = new ServicoFiscal({
      ambiente: configFiscal.ambiente || 2,
      uf: empresa.endereco?.uf || 'SC',
      serieNFCe: configFiscal.serie_nfce || 1,
      serieNFe: configFiscal.serie_nfe || 1,
      ultimoNumeroNFCe: configFiscal.ultimo_numero_nfce || 0,
      ultimoNumeroNFe: configFiscal.ultimo_numero_nfe || 0,
      idTokenNFCe: configFiscal.id_token_nfce || 1,
      cscNFCe: configFiscal.csc_nfce || '',
    })

    // Inicializa certificado
    await servicoFiscal.inicializar(
      configFiscal.certificado_base64,
      configFiscal.certificado_senha
    )

    // Prepara destinatário
    const destinatarioNFe = {
      cpfCnpj: destinatario.cpfCnpj,
      nome: destinatario.nome,
      email: destinatario.email,
      inscricaoEstadual: destinatario.inscricaoEstadual,
      endereco: destinatario.endereco ? {
        logradouro: destinatario.endereco.logradouro,
        numero: destinatario.endereco.numero,
        complemento: destinatario.endereco.complemento,
        bairro: destinatario.endereco.bairro,
        codigoMunicipio: destinatario.endereco.codigoMunicipio,
        nomeMunicipio: destinatario.endereco.cidade,
        uf: destinatario.endereco.uf,
        cep: destinatario.endereco.cep,
        pais: 'BRASIL',
        codigoPais: '1058',
      } : undefined,
    }

    // Prepara produtos para NF-e
    const produtosNFe = produtos.map((p: any) => ({
      codigo: p.codigo,
      cEAN: p.codigo_barras || 'SEM GTIN',
      descricao: p.nome,
      ncm: p.ncm || '00000000',
      cfop: configFiscal.cfop_venda_nfe || '5102',
      unidade: p.unidade || 'UN',
      quantidade: p.quantidade,
      valorUnitario: p.preco_unitario,
      valorTotal: p.total,
      icms: {
        origem: 0,
        cst: p.icms_cst || '00',
        aliquota: p.icms_aliquota || 0,
        valorBase: p.total,
        valor: (p.total * (p.icms_aliquota || 0)) / 100,
      },
      pis: { cst: p.pis_cst || '07' },
      cofins: { cst: p.cofins_cst || '07' },
    }))

    // Prepara pagamentos
    const pagamentosNFe = pagamentos.map((pag: any) => ({
      forma: pag.forma || '01',
      valor: pag.valor,
      bandeira: pag.bandeira,
    }))

    // Emite NF-e
    const resultado = await servicoFiscal.emitirNFe({
      dataEmissao: new Date(),
      naturezaOperacao: naturezaOperacao || 'Venda de mercadoria',
      empresa: empresaFiscal,
      destinatario: destinatarioNFe,
      produtos: produtosNFe,
      pagamentos: pagamentosNFe,
      valorTotal,
      valorDesconto,
      valorFrete,
      informacoesAdicionais,
      finalidade: 1,
      consumidorFinal: 1,
      presenca: 1,
    })

    if (resultado.sucesso) {
      // Atualiza último número no banco
      const novoNumero = servicoFiscal.getConfig().ultimoNumeroNFe
      await supabase
        .from('empresas')
        .update({
          config_fiscal: {
            ...configFiscal,
            ultimo_numero_nfe: novoNumero,
          },
        })
        .eq('id', userData.empresa_id)

      // Salva nota no banco
      await supabase.from('notas_fiscais').insert({
        empresa_id: userData.empresa_id,
        tipo: 'nfe',
        serie: configFiscal.serie_nfe || 1,
        numero: novoNumero,
        chave: resultado.chave,
        protocolo: resultado.protocolo,
        xml: resultado.xml,
        status: 'autorizada',
        valor_total: valorTotal,
        emitida_em: new Date().toISOString(),
      })
    }

    return NextResponse.json(resultado)
  } catch (error: any) {
    console.error('Erro ao emitir NF-e:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}

// DELETE - Cancelar NF-e
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verifica autenticacao
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    // Busca dados do usuario e empresa
    const { data: userData } = await supabase
      .from('usuarios')
      .select('empresa_id, id')
      .eq('auth_id', user.id)
      .single()

    if (!userData?.empresa_id) {
      return NextResponse.json({ error: 'Empresa nao encontrada' }, { status: 404 })
    }

    // Busca configuracoes fiscais
    const { data: empresa } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', userData.empresa_id)
      .single()

    if (!empresa) {
      return NextResponse.json({ error: 'Empresa nao encontrada' }, { status: 404 })
    }

    const configFiscal = empresa.config_fiscal || {}

    if (!configFiscal.certificado_base64 || !configFiscal.certificado_senha) {
      return NextResponse.json(
        { error: 'Certificado digital nao configurado' },
        { status: 400 }
      )
    }

    // Dados do cancelamento
    const body = await request.json()
    const { chave, protocolo, justificativa } = body

    if (!chave) {
      return NextResponse.json({ error: 'Chave de acesso obrigatoria' }, { status: 400 })
    }

    if (!protocolo) {
      return NextResponse.json({ error: 'Protocolo de autorizacao obrigatorio' }, { status: 400 })
    }

    if (!justificativa || justificativa.length < 15) {
      return NextResponse.json(
        { error: 'Justificativa obrigatoria (minimo 15 caracteres)' },
        { status: 400 }
      )
    }

    // Verifica se a nota existe e pertence a empresa
    const { data: nota } = await supabase
      .from('notas_fiscais')
      .select('*, venda_id')
      .eq('chave', chave)
      .eq('empresa_id', userData.empresa_id)
      .single()

    if (!nota) {
      return NextResponse.json({ error: 'Nota fiscal nao encontrada' }, { status: 404 })
    }

    if (nota.status === 'cancelada') {
      return NextResponse.json({ error: 'Nota ja esta cancelada' }, { status: 400 })
    }

    if (nota.status !== 'autorizada') {
      return NextResponse.json({ error: 'Apenas notas autorizadas podem ser canceladas' }, { status: 400 })
    }

    // Verifica prazo de cancelamento (24 horas para NF-e)
    const dataEmissao = new Date(nota.emitida_em)
    const agora = new Date()
    const horasDesdeEmissao = (agora.getTime() - dataEmissao.getTime()) / (1000 * 60 * 60)

    if (horasDesdeEmissao > 24) {
      return NextResponse.json(
        { error: 'Prazo para cancelamento expirado (maximo 24 horas)' },
        { status: 400 }
      )
    }

    // Inicializa servico fiscal
    const servicoFiscal = new ServicoFiscal({
      ambiente: configFiscal.ambiente || 2,
      uf: empresa.endereco?.uf || 'SC',
      serieNFCe: configFiscal.serie_nfce || 1,
      serieNFe: configFiscal.serie_nfe || 1,
      ultimoNumeroNFCe: configFiscal.ultimo_numero_nfce || 0,
      ultimoNumeroNFe: configFiscal.ultimo_numero_nfe || 0,
      idTokenNFCe: configFiscal.id_token_nfce || 1,
      cscNFCe: configFiscal.csc_nfce || '',
    })

    // Inicializa certificado
    await servicoFiscal.inicializar(
      configFiscal.certificado_base64,
      configFiscal.certificado_senha
    )

    // Cancela a nota na SEFAZ
    const resultado = await servicoFiscal.cancelarNota(
      chave,
      protocolo,
      justificativa,
      empresa.cnpj.replace(/\D/g, '')
    )

    if (resultado.sucesso) {
      // Atualiza status da nota fiscal
      await supabase
        .from('notas_fiscais')
        .update({
          status: 'cancelada',
          cancelada_em: new Date().toISOString(),
          motivo_cancelamento: justificativa,
          protocolo_cancelamento: resultado.protocolo,
          xml_cancelamento: resultado.xml,
        })
        .eq('id', nota.id)

      // === REVERSAO AUTOMATICA ===
      // Busca a venda associada (NF-e pode ter venda_id na nota ou via chave)
      let venda = null

      if (nota.venda_id) {
        const { data } = await supabase
          .from('vendas')
          .select('*, venda_itens(*), venda_pagamentos(*)')
          .eq('id', nota.venda_id)
          .eq('empresa_id', userData.empresa_id)
          .single()
        venda = data
      }

      if (venda && venda.status !== 'cancelada') {
        // 1. Reverter estoque - buscar itens da venda
        if (venda.venda_itens && venda.venda_itens.length > 0) {
          for (const item of venda.venda_itens) {
            // Restaurar quantidade no estoque
            const { data: produto } = await supabase
              .from('produtos')
              .select('estoque_atual')
              .eq('id', item.produto_id)
              .single()

            if (produto) {
              await supabase
                .from('produtos')
                .update({
                  estoque_atual: (produto.estoque_atual || 0) + item.quantidade,
                })
                .eq('id', item.produto_id)

              // Registrar movimento de estoque
              await supabase.from('estoque_movimentos').insert({
                empresa_id: userData.empresa_id,
                produto_id: item.produto_id,
                tipo: 'entrada',
                quantidade: item.quantidade,
                custo_unitario: item.preco_unitario,
                documento_origem: `Cancelamento NF-e ${nota.numero}`,
                observacao: `Estorno por cancelamento - ${justificativa}`,
                usuario_id: userData.id,
                data_hora: new Date().toISOString(),
              })
            }
          }
        }

        // 2. Registrar saida no caixa (se houver caixa aberto)
        if (venda.caixa_id) {
          await supabase.from('caixa_movimentos').insert({
            caixa_id: venda.caixa_id,
            tipo: 'saida',
            valor: venda.total,
            descricao: `Cancelamento NF-e ${nota.numero} - ${justificativa}`,
            venda_id: venda.id,
          })
        }

        // 3. Reverter crediario (se pagamento foi crediario)
        if (venda.venda_pagamentos) {
          const pagamentoCrediario = venda.venda_pagamentos.find(
            (p: any) => p.forma_pagamento === 'crediario'
          )
          if (pagamentoCrediario && venda.cliente_id) {
            // Buscar saldo atual do cliente
            const { data: cliente } = await supabase
              .from('clientes')
              .select('saldo_devedor')
              .eq('id', venda.cliente_id)
              .single()

            if (cliente) {
              // Reduzir saldo devedor
              await supabase
                .from('clientes')
                .update({
                  saldo_devedor: Math.max(0, (cliente.saldo_devedor || 0) - pagamentoCrediario.valor),
                })
                .eq('id', venda.cliente_id)
            }

            // Cancelar conta a receber
            await supabase
              .from('contas_receber')
              .update({ status: 'cancelada' })
              .eq('venda_id', venda.id)
          }
        }

        // 4. Reverter pontos fidelidade (se aplicavel)
        if (venda.cliente_id) {
          // Buscar se houve movimentacao de pontos para esta venda
          const { data: movimentoPontos } = await supabase
            .from('fidelidade_movimentos')
            .select('*')
            .eq('venda_id', venda.id)
            .eq('tipo', 'ganho')
            .single()

          if (movimentoPontos) {
            // Criar movimento de estorno
            await supabase.from('fidelidade_movimentos').insert({
              empresa_id: userData.empresa_id,
              cliente_id: venda.cliente_id,
              venda_id: venda.id,
              tipo: 'estorno',
              pontos: -movimentoPontos.pontos,
              descricao: `Estorno por cancelamento NF-e ${nota.numero}`,
            })

            // Atualizar saldo de pontos do cliente
            const { data: cliente } = await supabase
              .from('clientes')
              .select('pontos_fidelidade')
              .eq('id', venda.cliente_id)
              .single()

            if (cliente) {
              await supabase
                .from('clientes')
                .update({
                  pontos_fidelidade: Math.max(0, (cliente.pontos_fidelidade || 0) - movimentoPontos.pontos),
                })
                .eq('id', venda.cliente_id)
            }
          }
        }

        // 5. Atualizar status da venda para cancelada
        await supabase
          .from('vendas')
          .update({
            status: 'cancelada',
            observacao: `${venda.observacao || ''} | Cancelada em ${new Date().toLocaleString('pt-BR')} - ${justificativa}`.trim(),
          })
          .eq('id', venda.id)
      }

      return NextResponse.json({
        sucesso: true,
        mensagem: 'NF-e cancelada com sucesso. Estoque, caixa e venda revertidos.',
        protocolo: resultado.protocolo,
      })
    }

    return NextResponse.json({
      sucesso: false,
      mensagem: resultado.mensagem,
      codigo: resultado.codigo,
    })
  } catch (error: any) {
    console.error('Erro ao cancelar NF-e:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500 }
    )
  }
}
