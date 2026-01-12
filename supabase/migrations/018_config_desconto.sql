-- =============================================
-- IMPERIO SISTEMAS DE ALTO NIVEL
-- Migration 018: Configuracao de Desconto no PDV
-- =============================================

-- =============================================
-- TABELA: CONFIGURACAO DE DESCONTO
-- =============================================

CREATE TABLE config_desconto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,

    -- Limites de desconto
    desconto_maximo_percentual DECIMAL(5,2) DEFAULT 15.00, -- Max 15% por padrao
    desconto_maximo_valor DECIMAL(15,2) DEFAULT NULL, -- Sem limite de valor por padrao

    -- Regras
    motivo_obrigatorio BOOLEAN DEFAULT true,
    permitir_desconto_item BOOLEAN DEFAULT true,
    permitir_desconto_total BOOLEAN DEFAULT true,

    -- Autorizacao
    requer_autorizacao_acima_percentual DECIMAL(5,2) DEFAULT NULL, -- Ex: acima de 10% requer supervisor

    -- Motivos pre-definidos (JSON array)
    motivos_predefinidos JSONB DEFAULT '["Cliente fidelidade", "Promocao", "Avaria no produto", "Negociacao", "Outro"]'::jsonb,

    -- Controle
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(empresa_id)
);

CREATE INDEX idx_config_desconto_empresa ON config_desconto(empresa_id);

-- =============================================
-- ADICIONAR CAMPOS DE DESCONTO NOS ITENS DA VENDA
-- =============================================

-- Desconto por item (ja existe campo desconto, vamos adicionar motivo)
ALTER TABLE venda_itens ADD COLUMN IF NOT EXISTS desconto_percentual DECIMAL(5,2) DEFAULT 0;
ALTER TABLE venda_itens ADD COLUMN IF NOT EXISTS desconto_motivo VARCHAR(255);

-- Desconto geral da venda (motivo)
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS desconto_motivo VARCHAR(255);
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS desconto_percentual DECIMAL(5,2) DEFAULT 0;

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE config_desconto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver config de desconto da sua empresa" ON config_desconto
    FOR SELECT USING (
        empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
    );

CREATE POLICY "Usuarios podem inserir config de desconto na sua empresa" ON config_desconto
    FOR INSERT WITH CHECK (
        empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
    );

CREATE POLICY "Usuarios podem atualizar config de desconto da sua empresa" ON config_desconto
    FOR UPDATE USING (
        empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
    );

-- =============================================
-- TRIGGER PARA UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_config_desconto_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_config_desconto_updated_at
    BEFORE UPDATE ON config_desconto
    FOR EACH ROW
    EXECUTE FUNCTION update_config_desconto_updated_at();

-- =============================================
-- INSERIR CONFIGURACAO PADRAO PARA EMPRESAS EXISTENTES
-- =============================================

INSERT INTO config_desconto (empresa_id)
SELECT id FROM empresas
WHERE id NOT IN (SELECT empresa_id FROM config_desconto WHERE empresa_id IS NOT NULL)
ON CONFLICT (empresa_id) DO NOTHING;
