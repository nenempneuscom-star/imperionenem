-- Migracao: Criar tabelas para NFS-e (Nota Fiscal de Servico Eletronica)
-- Execute este script no Supabase SQL Editor

-- =============================================
-- Tabela: config_nfse
-- Configuracoes de NFS-e por empresa
-- =============================================
CREATE TABLE IF NOT EXISTS config_nfse (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

  -- Ambiente
  ambiente VARCHAR(20) DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao', 'producao')),

  -- Dados do prestador
  inscricao_municipal VARCHAR(30),
  codigo_municipio VARCHAR(10) DEFAULT '4203709', -- Capivari de Baixo/SC
  uf VARCHAR(2) DEFAULT 'SC',

  -- Serie e numeracao RPS
  serie_rps VARCHAR(10) DEFAULT 'NFSE',
  proximo_numero_rps INTEGER DEFAULT 1,

  -- Aliquotas padrao
  aliquota_iss_padrao NUMERIC(5,2) DEFAULT 5.00,

  -- Configuracoes ADN (Ambiente de Dados Nacional)
  usar_adn BOOLEAN DEFAULT TRUE,

  -- Certificado digital (para producao)
  certificado_base64 TEXT,
  certificado_senha TEXT,
  certificado_validade TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(empresa_id)
);

-- =============================================
-- Tabela: nfse
-- Notas fiscais de servico eletronicas emitidas
-- =============================================
CREATE TABLE IF NOT EXISTS nfse (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES usuarios(id),

  -- RPS (Recibo Provisorio de Servicos)
  numero_rps INTEGER NOT NULL,
  serie_rps VARCHAR(10) DEFAULT 'NFSE',

  -- NFS-e (apos autorizacao)
  numero_nfse VARCHAR(20),

  -- Datas
  data_emissao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_competencia DATE,
  data_autorizacao TIMESTAMP WITH TIME ZONE,

  -- Tomador (cliente)
  tomador_tipo_pessoa VARCHAR(2) DEFAULT 'PF' CHECK (tomador_tipo_pessoa IN ('PF', 'PJ')),
  tomador_cpf_cnpj VARCHAR(20) NOT NULL,
  tomador_inscricao_municipal VARCHAR(30),
  tomador_razao_social VARCHAR(200) NOT NULL,
  tomador_email VARCHAR(100),
  tomador_telefone VARCHAR(20),
  tomador_endereco JSONB DEFAULT '{}',

  -- Servico
  servico_id UUID REFERENCES servicos(id),
  item_lista_servico VARCHAR(10), -- Codigo LC 116
  codigo_tributacao VARCHAR(20),
  discriminacao TEXT NOT NULL,
  codigo_cnae VARCHAR(10),

  -- Valores
  valor_servicos NUMERIC(15,2) NOT NULL,
  valor_deducoes NUMERIC(15,2) DEFAULT 0,
  desconto_incondicionado NUMERIC(15,2) DEFAULT 0,
  base_calculo NUMERIC(15,2),

  -- ISS
  aliquota_iss NUMERIC(5,4) DEFAULT 0.05,
  valor_iss NUMERIC(15,2) DEFAULT 0,
  iss_retido BOOLEAN DEFAULT FALSE,

  -- IBS/CBS (Reforma Tributaria 2026)
  aliquota_ibs NUMERIC(5,2) DEFAULT 17.7,
  valor_ibs NUMERIC(15,2) DEFAULT 0,
  ibs_retido BOOLEAN DEFAULT FALSE,
  aliquota_cbs NUMERIC(5,2) DEFAULT 8.8,
  valor_cbs NUMERIC(15,2) DEFAULT 0,
  cbs_retido BOOLEAN DEFAULT FALSE,

  -- Retencoes federais
  valor_pis NUMERIC(15,2) DEFAULT 0,
  valor_cofins NUMERIC(15,2) DEFAULT 0,
  valor_inss NUMERIC(15,2) DEFAULT 0,
  valor_ir NUMERIC(15,2) DEFAULT 0,
  valor_csll NUMERIC(15,2) DEFAULT 0,

  -- Valor final
  valor_liquido NUMERIC(15,2),

  -- ADN (Ambiente de Dados Nacional)
  usar_adn BOOLEAN DEFAULT TRUE,
  id_dps VARCHAR(100), -- Identificador do DPS
  xml_dps TEXT, -- XML do DPS
  json_dps JSONB, -- JSON do DPS
  xml_nfse_autorizada TEXT, -- XML da NFS-e autorizada
  ambiente_adn VARCHAR(20) DEFAULT 'homologacao',

  -- Autorizacao/Cancelamento
  chave_acesso VARCHAR(50),
  codigo_verificacao VARCHAR(20),
  status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'pendente', 'processando', 'autorizada', 'rejeitada', 'cancelada', 'substituida')),
  protocolo_autorizacao VARCHAR(50),
  link_danfse TEXT,

  -- Cancelamento
  data_cancelamento TIMESTAMP WITH TIME ZONE,
  motivo_cancelamento TEXT,
  protocolo_cancelamento VARCHAR(50),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Tabela: servicos
-- Cadastro de servicos (LC 116)
-- =============================================
CREATE TABLE IF NOT EXISTS servicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

  codigo VARCHAR(10) NOT NULL, -- Codigo do servico na empresa
  item_lista_servico VARCHAR(10), -- Codigo LC 116 (ex: 14.01)
  descricao TEXT NOT NULL,
  aliquota_iss NUMERIC(5,2) DEFAULT 5.00,
  valor_padrao NUMERIC(15,2),

  ativo BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Indices para performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_nfse_empresa_id ON nfse(empresa_id);
CREATE INDEX IF NOT EXISTS idx_nfse_status ON nfse(status);
CREATE INDEX IF NOT EXISTS idx_nfse_data_emissao ON nfse(data_emissao);
CREATE INDEX IF NOT EXISTS idx_nfse_tomador_cpf_cnpj ON nfse(tomador_cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_nfse_chave_acesso ON nfse(chave_acesso);

CREATE INDEX IF NOT EXISTS idx_servicos_empresa_id ON servicos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_servicos_codigo ON servicos(codigo);

-- =============================================
-- RLS (Row Level Security)
-- =============================================

-- Habilitar RLS
ALTER TABLE config_nfse ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfse ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;

-- Politicas para config_nfse
DROP POLICY IF EXISTS "config_nfse_select" ON config_nfse;
CREATE POLICY "config_nfse_select" ON config_nfse
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "config_nfse_insert" ON config_nfse;
CREATE POLICY "config_nfse_insert" ON config_nfse
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "config_nfse_update" ON config_nfse;
CREATE POLICY "config_nfse_update" ON config_nfse
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

-- Politicas para nfse
DROP POLICY IF EXISTS "nfse_select" ON nfse;
CREATE POLICY "nfse_select" ON nfse
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "nfse_insert" ON nfse;
CREATE POLICY "nfse_insert" ON nfse
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "nfse_update" ON nfse;
CREATE POLICY "nfse_update" ON nfse
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

-- Politicas para servicos
DROP POLICY IF EXISTS "servicos_select" ON servicos;
CREATE POLICY "servicos_select" ON servicos
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "servicos_insert" ON servicos;
CREATE POLICY "servicos_insert" ON servicos
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "servicos_update" ON servicos;
CREATE POLICY "servicos_update" ON servicos
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "servicos_delete" ON servicos;
CREATE POLICY "servicos_delete" ON servicos
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

-- =============================================
-- Triggers para updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_config_nfse_updated_at ON config_nfse;
CREATE TRIGGER update_config_nfse_updated_at
  BEFORE UPDATE ON config_nfse
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nfse_updated_at ON nfse;
CREATE TRIGGER update_nfse_updated_at
  BEFORE UPDATE ON nfse
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_servicos_updated_at ON servicos;
CREATE TRIGGER update_servicos_updated_at
  BEFORE UPDATE ON servicos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
