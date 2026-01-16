-- =============================================
-- Migration 020: Corrigir código IBGE do município
-- Capivari de Baixo/SC: 4203709 (não 4203907)
-- =============================================

-- Corrigir config_nfse
UPDATE config_nfse
SET codigo_municipio = '4203709'
WHERE codigo_municipio = '4203907';

-- Corrigir nfse
UPDATE nfse
SET local_prestacao_codigo_municipio = '4203709'
WHERE local_prestacao_codigo_municipio = '4203907';

-- Corrigir tomador_endereco JSONB (se tiver codigo_municipio errado)
UPDATE nfse
SET tomador_endereco = jsonb_set(tomador_endereco, '{codigo_municipio}', '"4203709"')
WHERE tomador_endereco->>'codigo_municipio' = '4203907';

-- Atualizar default das colunas (se ainda não foi alterado)
ALTER TABLE config_nfse
ALTER COLUMN codigo_municipio SET DEFAULT '4203709';

-- Nota: Em caso de erro, as tabelas podem ter estruturas diferentes
-- dependendo de qual migration foi executada primeiro
