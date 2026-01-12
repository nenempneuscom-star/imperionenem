-- =============================================
-- IMPÉRIO SISTEMAS DE ALTO NÍVEL
-- Migration 017: Tabela IBPT - Lei da Transparência Fiscal
-- Lei 12.741/2012
-- =============================================

-- =============================================
-- TABELA: IBPT ALÍQUOTAS (NCM - Produtos)
-- =============================================

CREATE TABLE ibpt_aliquotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ncm VARCHAR(10) NOT NULL,
    ex VARCHAR(3), -- Exceção Tarifária
    tipo VARCHAR(1) DEFAULT '0', -- 0=Nacional, 1=Importado
    descricao VARCHAR(500),
    aliquota_nacional_federal DECIMAL(8,4) DEFAULT 0, -- Tributos federais (produtos nacionais)
    aliquota_importado_federal DECIMAL(8,4) DEFAULT 0, -- Tributos federais (produtos importados)
    aliquota_estadual DECIMAL(8,4) DEFAULT 0, -- ICMS
    aliquota_municipal DECIMAL(8,4) DEFAULT 0, -- ISS (quando aplicável)
    vigencia_inicio DATE,
    vigencia_fim DATE,
    versao VARCHAR(20),
    fonte VARCHAR(100) DEFAULT 'IBPT',
    chave VARCHAR(50), -- Chave única NCM+EX+TIPO
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ncm, ex, tipo)
);

CREATE INDEX idx_ibpt_aliquotas_ncm ON ibpt_aliquotas(ncm);
CREATE INDEX idx_ibpt_aliquotas_vigencia ON ibpt_aliquotas(vigencia_inicio, vigencia_fim);

-- =============================================
-- TABELA: IBPT SERVIÇOS (NBS - Serviços)
-- =============================================

CREATE TABLE ibpt_servicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) NOT NULL, -- Código NBS ou Item LC 116
    tipo VARCHAR(10) DEFAULT 'NBS', -- NBS ou LC116
    descricao VARCHAR(500),
    aliquota_federal DECIMAL(8,4) DEFAULT 0,
    aliquota_estadual DECIMAL(8,4) DEFAULT 0,
    aliquota_municipal DECIMAL(8,4) DEFAULT 0,
    vigencia_inicio DATE,
    vigencia_fim DATE,
    versao VARCHAR(20),
    fonte VARCHAR(100) DEFAULT 'IBPT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(codigo, tipo)
);

CREATE INDEX idx_ibpt_servicos_codigo ON ibpt_servicos(codigo);

-- =============================================
-- TABELA: CONTROLE DE IMPORTAÇÃO IBPT
-- =============================================

CREATE TABLE ibpt_importacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    versao VARCHAR(20) NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- 'produtos' ou 'servicos'
    arquivo_nome VARCHAR(255),
    registros_importados INTEGER DEFAULT 0,
    vigencia_inicio DATE,
    vigencia_fim DATE,
    importado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usuario_id UUID REFERENCES usuarios(id)
);

CREATE INDEX idx_ibpt_importacoes_empresa ON ibpt_importacoes(empresa_id);

-- =============================================
-- FUNÇÃO: Buscar alíquota por NCM
-- =============================================

CREATE OR REPLACE FUNCTION buscar_aliquota_ibpt(p_ncm VARCHAR, p_tipo VARCHAR DEFAULT '0')
RETURNS TABLE (
    ncm VARCHAR,
    descricao VARCHAR,
    aliquota_federal DECIMAL,
    aliquota_estadual DECIMAL,
    aliquota_municipal DECIMAL,
    aliquota_total DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ia.ncm,
        ia.descricao,
        CASE WHEN p_tipo = '0' THEN ia.aliquota_nacional_federal ELSE ia.aliquota_importado_federal END as aliquota_federal,
        ia.aliquota_estadual,
        ia.aliquota_municipal,
        (CASE WHEN p_tipo = '0' THEN ia.aliquota_nacional_federal ELSE ia.aliquota_importado_federal END + ia.aliquota_estadual + ia.aliquota_municipal) as aliquota_total
    FROM ibpt_aliquotas ia
    WHERE ia.ncm = p_ncm
      AND (ia.vigencia_fim IS NULL OR ia.vigencia_fim >= CURRENT_DATE)
    ORDER BY ia.vigencia_inicio DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNÇÃO: Buscar alíquota de serviço
-- =============================================

CREATE OR REPLACE FUNCTION buscar_aliquota_servico_ibpt(p_codigo VARCHAR)
RETURNS TABLE (
    codigo VARCHAR,
    descricao VARCHAR,
    aliquota_federal DECIMAL,
    aliquota_estadual DECIMAL,
    aliquota_municipal DECIMAL,
    aliquota_total DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ibs.codigo,
        ibs.descricao,
        ibs.aliquota_federal,
        ibs.aliquota_estadual,
        ibs.aliquota_municipal,
        (ibs.aliquota_federal + ibs.aliquota_estadual + ibs.aliquota_municipal) as aliquota_total
    FROM ibpt_servicos ibs
    WHERE ibs.codigo = p_codigo
      AND (ibs.vigencia_fim IS NULL OR ibs.vigencia_fim >= CURRENT_DATE)
    ORDER BY ibs.vigencia_inicio DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ADICIONAR CAMPOS DE IMPOSTOS NAS VENDAS
-- =============================================

ALTER TABLE vendas ADD COLUMN IF NOT EXISTS valor_tributos DECIMAL(15,2) DEFAULT 0;
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS percentual_tributos DECIMAL(8,4) DEFAULT 0;

ALTER TABLE venda_itens ADD COLUMN IF NOT EXISTS valor_tributos DECIMAL(15,2) DEFAULT 0;
ALTER TABLE venda_itens ADD COLUMN IF NOT EXISTS aliquota_tributos DECIMAL(8,4) DEFAULT 0;

-- =============================================
-- ADICIONAR CAMPO NCM SE NÃO EXISTIR
-- =============================================

-- Já existe na tabela produtos (ncm VARCHAR(10))

-- =============================================
-- RLS POLICIES
-- =============================================

-- As tabelas IBPT são públicas (mesmas alíquotas para todos)
-- Não precisa de RLS restritivo

ALTER TABLE ibpt_aliquotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ibpt_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ibpt_importacoes ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública das alíquotas
CREATE POLICY "Aliquotas IBPT são públicas para leitura" ON ibpt_aliquotas
    FOR SELECT USING (true);

CREATE POLICY "Servicos IBPT são públicos para leitura" ON ibpt_servicos
    FOR SELECT USING (true);

-- Política para importação (apenas usuários autenticados)
CREATE POLICY "Usuarios autenticados podem inserir aliquotas" ON ibpt_aliquotas
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados podem inserir servicos" ON ibpt_servicos
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados podem deletar aliquotas" ON ibpt_aliquotas
    FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados podem deletar servicos" ON ibpt_servicos
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Importações são por empresa
CREATE POLICY "Usuarios podem ver importacoes da sua empresa" ON ibpt_importacoes
    FOR SELECT USING (
        empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
    );

CREATE POLICY "Usuarios podem inserir importacoes na sua empresa" ON ibpt_importacoes
    FOR INSERT WITH CHECK (
        empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
    );
