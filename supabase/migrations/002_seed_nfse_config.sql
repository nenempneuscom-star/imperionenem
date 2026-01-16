-- Seed: Configuracao inicial de NFS-e para testes
-- Execute este script APOS o 001_create_nfse_tables.sql
-- Substitua 'SUA_EMPRESA_ID' pelo ID da sua empresa

-- =============================================
-- Inserir configuracao de NFS-e
-- =============================================

-- IMPORTANTE: Primeiro, obtenha o ID da sua empresa:
-- SELECT id, razao_social FROM empresas LIMIT 1;

-- Depois, substitua 'SUA_EMPRESA_ID' abaixo pelo ID retornado:

INSERT INTO config_nfse (
  empresa_id,
  ambiente,
  inscricao_municipal,
  codigo_municipio,
  uf,
  serie_rps,
  proximo_numero_rps,
  aliquota_iss_padrao,
  usar_adn
) VALUES (
  -- Substitua pela ID da sua empresa (UUID)
  (SELECT id FROM empresas LIMIT 1),
  'homologacao', -- Ambiente de testes
  '12345', -- Inscricao municipal (altere conforme necessario)
  '4203709', -- Codigo IBGE de Capivari de Baixo/SC
  'SC', -- UF
  'NFSE', -- Serie do RPS
  1, -- Proximo numero RPS
  5.00, -- Aliquota ISS padrao (5%)
  TRUE -- Usar ADN (Ambiente de Dados Nacional)
) ON CONFLICT (empresa_id) DO UPDATE SET
  ambiente = EXCLUDED.ambiente,
  updated_at = NOW();

-- =============================================
-- Inserir servicos de exemplo
-- =============================================

-- Servico 1: Consultoria
INSERT INTO servicos (
  empresa_id,
  codigo,
  item_lista_servico,
  descricao,
  aliquota_iss,
  valor_padrao,
  ativo
) VALUES (
  (SELECT id FROM empresas LIMIT 1),
  '001',
  '17.01',
  'Assessoria ou consultoria de qualquer natureza',
  5.00,
  100.00,
  TRUE
) ON CONFLICT DO NOTHING;

-- Servico 2: Manutencao de veiculos
INSERT INTO servicos (
  empresa_id,
  codigo,
  item_lista_servico,
  descricao,
  aliquota_iss,
  valor_padrao,
  ativo
) VALUES (
  (SELECT id FROM empresas LIMIT 1),
  '002',
  '14.01',
  'Lubrificacao, limpeza, lustramento, revisao, carga e recarga, conserto, restauracao, blindagem, manutencao e conservacao de maquinas, veiculos, aparelhos, equipamentos, motores, elevadores ou de qualquer objeto (exceto pecas e partes empregadas, que ficam sujeitas ao ICMS)',
  5.00,
  150.00,
  TRUE
) ON CONFLICT DO NOTHING;

-- Servico 3: Borracharia
INSERT INTO servicos (
  empresa_id,
  codigo,
  item_lista_servico,
  descricao,
  aliquota_iss,
  valor_padrao,
  ativo
) VALUES (
  (SELECT id FROM empresas LIMIT 1),
  '003',
  '14.01',
  'Servicos de borracharia - conserto e manutencao de pneus',
  5.00,
  50.00,
  TRUE
) ON CONFLICT DO NOTHING;

-- Servico 4: Alinhamento e balanceamento
INSERT INTO servicos (
  empresa_id,
  codigo,
  item_lista_servico,
  descricao,
  aliquota_iss,
  valor_padrao,
  ativo
) VALUES (
  (SELECT id FROM empresas LIMIT 1),
  '004',
  '14.01',
  'Alinhamento e balanceamento de rodas',
  5.00,
  80.00,
  TRUE
) ON CONFLICT DO NOTHING;

-- =============================================
-- Verificar dados inseridos
-- =============================================
-- SELECT * FROM config_nfse;
-- SELECT * FROM servicos WHERE ativo = TRUE;
