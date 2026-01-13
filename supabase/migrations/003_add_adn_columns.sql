-- Migracao: Adicionar colunas ADN/IBS/CBS as tabelas existentes
-- Execute este script no Supabase SQL Editor
-- URGENTE: Necessario para funcionar a emissao de NFS-e via ADN

-- =============================================
-- Adicionar colunas ADN na tabela nfse
-- =============================================

-- IBS/CBS (Reforma Tributaria 2026)
ALTER TABLE nfse ADD COLUMN IF NOT EXISTS aliquota_ibs NUMERIC(5,2) DEFAULT 17.7;
ALTER TABLE nfse ADD COLUMN IF NOT EXISTS valor_ibs NUMERIC(15,2) DEFAULT 0;
ALTER TABLE nfse ADD COLUMN IF NOT EXISTS ibs_retido BOOLEAN DEFAULT FALSE;
ALTER TABLE nfse ADD COLUMN IF NOT EXISTS aliquota_cbs NUMERIC(5,2) DEFAULT 8.8;
ALTER TABLE nfse ADD COLUMN IF NOT EXISTS valor_cbs NUMERIC(15,2) DEFAULT 0;
ALTER TABLE nfse ADD COLUMN IF NOT EXISTS cbs_retido BOOLEAN DEFAULT FALSE;

-- ADN (Ambiente de Dados Nacional)
ALTER TABLE nfse ADD COLUMN IF NOT EXISTS usar_adn BOOLEAN DEFAULT TRUE;
ALTER TABLE nfse ADD COLUMN IF NOT EXISTS id_dps VARCHAR(100);
ALTER TABLE nfse ADD COLUMN IF NOT EXISTS xml_dps TEXT;
ALTER TABLE nfse ADD COLUMN IF NOT EXISTS json_dps JSONB;
ALTER TABLE nfse ADD COLUMN IF NOT EXISTS xml_nfse_autorizada TEXT;
ALTER TABLE nfse ADD COLUMN IF NOT EXISTS ambiente_adn VARCHAR(20) DEFAULT 'homologacao';

-- Autorizacao/Cancelamento ADN
ALTER TABLE nfse ADD COLUMN IF NOT EXISTS chave_acesso VARCHAR(50);
ALTER TABLE nfse ADD COLUMN IF NOT EXISTS codigo_verificacao VARCHAR(20);
ALTER TABLE nfse ADD COLUMN IF NOT EXISTS protocolo_autorizacao VARCHAR(50);
ALTER TABLE nfse ADD COLUMN IF NOT EXISTS link_danfse TEXT;

-- Cancelamento
ALTER TABLE nfse ADD COLUMN IF NOT EXISTS data_cancelamento TIMESTAMP WITH TIME ZONE;
ALTER TABLE nfse ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT;
ALTER TABLE nfse ADD COLUMN IF NOT EXISTS protocolo_cancelamento VARCHAR(50);

-- Status atualizado (adicionar novos valores se necessario)
-- O status ja deve existir, mas garantir que aceita os novos valores
DO $$
BEGIN
  -- Remover constraint antiga se existir
  ALTER TABLE nfse DROP CONSTRAINT IF EXISTS nfse_status_check;

  -- Adicionar nova constraint com todos os status
  ALTER TABLE nfse ADD CONSTRAINT nfse_status_check
    CHECK (status IN ('rascunho', 'pendente', 'processando', 'autorizada', 'rejeitada', 'cancelada', 'substituida'));
EXCEPTION
  WHEN others THEN
    -- Ignorar erros se a coluna status nao tiver constraint
    NULL;
END $$;

-- =============================================
-- Adicionar colunas ADN na tabela config_nfse (se necessario)
-- =============================================
ALTER TABLE config_nfse ADD COLUMN IF NOT EXISTS usar_adn BOOLEAN DEFAULT TRUE;
ALTER TABLE config_nfse ADD COLUMN IF NOT EXISTS certificado_base64 TEXT;
ALTER TABLE config_nfse ADD COLUMN IF NOT EXISTS certificado_senha TEXT;
ALTER TABLE config_nfse ADD COLUMN IF NOT EXISTS certificado_validade TIMESTAMP WITH TIME ZONE;

-- =============================================
-- Indices para as novas colunas
-- =============================================
CREATE INDEX IF NOT EXISTS idx_nfse_chave_acesso ON nfse(chave_acesso);
CREATE INDEX IF NOT EXISTS idx_nfse_ambiente_adn ON nfse(ambiente_adn);

-- =============================================
-- Verificar colunas adicionadas
-- =============================================
-- Execute para confirmar:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'nfse' ORDER BY ordinal_position;
