-- =============================================
-- IMPÉRIO SISTEMAS DE ALTO NÍVEL
-- Migration 016: NFS-e e Serviços
-- =============================================

-- =============================================
-- TIPOS ENUMERADOS PARA NFS-e
-- =============================================

CREATE TYPE status_nfse AS ENUM ('rascunho', 'pendente', 'processando', 'autorizada', 'cancelada', 'rejeitada');
CREATE TYPE natureza_operacao_nfse AS ENUM (
    '1', -- Tributação no município
    '2', -- Tributação fora do município
    '3', -- Isenção
    '4', -- Imune
    '5', -- Exigibilidade suspensa por decisão judicial
    '6'  -- Exigibilidade suspensa por procedimento administrativo
);
CREATE TYPE regime_especial_tributacao AS ENUM (
    '0', -- Nenhum
    '1', -- Microempresa municipal
    '2', -- Estimativa
    '3', -- Sociedade de profissionais
    '4', -- Cooperativa
    '5', -- MEI
    '6'  -- ME/EPP Simples Nacional
);

-- =============================================
-- TABELA: SERVIÇOS (LC 116/2003)
-- =============================================

CREATE TABLE servicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(10) NOT NULL, -- Código do serviço interno
    codigo_tributacao VARCHAR(20), -- Código de tributação municipal
    item_lista_servico VARCHAR(10) NOT NULL, -- Item da LC 116 (ex: 14.01)
    descricao VARCHAR(500) NOT NULL,
    aliquota_iss DECIMAL(5, 2) DEFAULT 5.00, -- Alíquota ISS (%)
    valor_padrao DECIMAL(15, 2) DEFAULT 0,
    cnae VARCHAR(10), -- CNAE relacionado
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(empresa_id, codigo)
);

CREATE INDEX idx_servicos_empresa ON servicos(empresa_id);
CREATE INDEX idx_servicos_item_lista ON servicos(item_lista_servico);

-- =============================================
-- TABELA: NFS-e (Nota Fiscal de Serviço Eletrônica)
-- =============================================

CREATE TABLE nfse (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Identificação
    numero_rps INTEGER, -- Número do RPS
    serie_rps VARCHAR(5) DEFAULT 'RPS',
    numero_nfse VARCHAR(20), -- Número da NFS-e (retornado pela prefeitura)
    codigo_verificacao VARCHAR(50), -- Código de verificação

    -- Datas
    data_emissao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_competencia DATE NOT NULL,

    -- Tomador do Serviço
    tomador_tipo_pessoa tipo_pessoa DEFAULT 'PF',
    tomador_cpf_cnpj VARCHAR(18) NOT NULL,
    tomador_inscricao_municipal VARCHAR(20),
    tomador_razao_social VARCHAR(255) NOT NULL,
    tomador_email VARCHAR(255),
    tomador_telefone VARCHAR(20),
    tomador_endereco JSONB DEFAULT '{}',

    -- Serviço
    servico_id UUID REFERENCES servicos(id),
    item_lista_servico VARCHAR(10) NOT NULL,
    codigo_tributacao VARCHAR(20),
    discriminacao TEXT NOT NULL, -- Descrição detalhada do serviço
    codigo_cnae VARCHAR(10),

    -- Valores
    valor_servicos DECIMAL(15, 2) NOT NULL,
    valor_deducoes DECIMAL(15, 2) DEFAULT 0,
    valor_pis DECIMAL(15, 2) DEFAULT 0,
    valor_cofins DECIMAL(15, 2) DEFAULT 0,
    valor_inss DECIMAL(15, 2) DEFAULT 0,
    valor_ir DECIMAL(15, 2) DEFAULT 0,
    valor_csll DECIMAL(15, 2) DEFAULT 0,
    outras_retencoes DECIMAL(15, 2) DEFAULT 0,
    valor_iss DECIMAL(15, 2) DEFAULT 0,
    aliquota_iss DECIMAL(5, 4) DEFAULT 0,
    desconto_incondicionado DECIMAL(15, 2) DEFAULT 0,
    desconto_condicionado DECIMAL(15, 2) DEFAULT 0,
    valor_liquido DECIMAL(15, 2) NOT NULL,
    base_calculo DECIMAL(15, 2) NOT NULL,

    -- Tributação
    iss_retido BOOLEAN DEFAULT false,
    natureza_operacao natureza_operacao_nfse DEFAULT '1',
    regime_especial regime_especial_tributacao DEFAULT '0',
    optante_simples_nacional BOOLEAN DEFAULT true,
    incentivador_cultural BOOLEAN DEFAULT false,

    -- Local de Prestação
    local_prestacao_codigo_municipio VARCHAR(10) DEFAULT '4203907', -- Capivari de Baixo
    local_prestacao_uf VARCHAR(2) DEFAULT 'SC',

    -- Status e Controle
    status status_nfse DEFAULT 'rascunho',
    xml_rps TEXT, -- XML do RPS gerado
    xml_nfse TEXT, -- XML da NFS-e retornado
    protocolo VARCHAR(50),
    mensagem_retorno TEXT,
    link_visualizacao TEXT,

    -- Cancelamento
    cancelada_em TIMESTAMP WITH TIME ZONE,
    motivo_cancelamento TEXT,

    -- Auditoria
    usuario_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_nfse_empresa ON nfse(empresa_id);
CREATE INDEX idx_nfse_numero ON nfse(numero_rps);
CREATE INDEX idx_nfse_tomador ON nfse(tomador_cpf_cnpj);
CREATE INDEX idx_nfse_data ON nfse(data_emissao);
CREATE INDEX idx_nfse_status ON nfse(status);

-- =============================================
-- TABELA: CONFIGURAÇÕES NFS-e POR EMPRESA
-- =============================================

CREATE TABLE config_nfse (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID UNIQUE NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Dados do Prestador
    inscricao_municipal VARCHAR(20),
    codigo_municipio VARCHAR(10) DEFAULT '4203907', -- Capivari de Baixo
    uf VARCHAR(2) DEFAULT 'SC',

    -- Regime Tributário
    regime_tributacao regime_especial_tributacao DEFAULT '6', -- ME/EPP Simples Nacional
    natureza_operacao natureza_operacao_nfse DEFAULT '1', -- Tributação no município
    optante_simples_nacional BOOLEAN DEFAULT true,
    incentivador_cultural BOOLEAN DEFAULT false,

    -- Numeração
    serie_rps VARCHAR(5) DEFAULT 'RPS',
    proximo_numero_rps INTEGER DEFAULT 1,
    lote_rps INTEGER DEFAULT 1,

    -- Ambiente
    ambiente VARCHAR(20) DEFAULT 'homologacao', -- homologacao ou producao

    -- Webservice (para integração futura)
    url_webservice TEXT,
    usuario_webservice VARCHAR(100),
    senha_webservice VARCHAR(255),

    -- Configurações adicionais
    aliquota_iss_padrao DECIMAL(5, 2) DEFAULT 5.00,
    reter_iss_padrao BOOLEAN DEFAULT false,
    enviar_email_tomador BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABELA: LOTES DE RPS
-- =============================================

CREATE TABLE nfse_lotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    numero_lote INTEGER NOT NULL,
    quantidade_rps INTEGER DEFAULT 0,
    xml_lote TEXT,
    protocolo VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pendente',
    data_envio TIMESTAMP WITH TIME ZONE,
    data_retorno TIMESTAMP WITH TIME ZONE,
    mensagem_retorno TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_nfse_lotes_empresa ON nfse_lotes(empresa_id);

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER tr_servicos_updated_at
    BEFORE UPDATE ON servicos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_nfse_updated_at
    BEFORE UPDATE ON nfse
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_config_nfse_updated_at
    BEFORE UPDATE ON config_nfse
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfse ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_nfse ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfse_lotes ENABLE ROW LEVEL SECURITY;

-- Policies para servicos
CREATE POLICY "Usuarios podem ver servicos da sua empresa" ON servicos
    FOR SELECT USING (
        empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
    );

CREATE POLICY "Usuarios podem inserir servicos na sua empresa" ON servicos
    FOR INSERT WITH CHECK (
        empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
    );

CREATE POLICY "Usuarios podem atualizar servicos da sua empresa" ON servicos
    FOR UPDATE USING (
        empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
    );

CREATE POLICY "Usuarios podem deletar servicos da sua empresa" ON servicos
    FOR DELETE USING (
        empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
    );

-- Policies para nfse
CREATE POLICY "Usuarios podem ver nfse da sua empresa" ON nfse
    FOR SELECT USING (
        empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
    );

CREATE POLICY "Usuarios podem inserir nfse na sua empresa" ON nfse
    FOR INSERT WITH CHECK (
        empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
    );

CREATE POLICY "Usuarios podem atualizar nfse da sua empresa" ON nfse
    FOR UPDATE USING (
        empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
    );

-- Policies para config_nfse
CREATE POLICY "Usuarios podem ver config_nfse da sua empresa" ON config_nfse
    FOR SELECT USING (
        empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
    );

CREATE POLICY "Usuarios podem inserir config_nfse na sua empresa" ON config_nfse
    FOR INSERT WITH CHECK (
        empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
    );

CREATE POLICY "Usuarios podem atualizar config_nfse da sua empresa" ON config_nfse
    FOR UPDATE USING (
        empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
    );

-- Policies para nfse_lotes
CREATE POLICY "Usuarios podem ver lotes da sua empresa" ON nfse_lotes
    FOR SELECT USING (
        empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
    );

CREATE POLICY "Usuarios podem inserir lotes na sua empresa" ON nfse_lotes
    FOR INSERT WITH CHECK (
        empresa_id IN (SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid())
    );

-- =============================================
-- DADOS INICIAIS - SERVIÇOS COMUNS PARA PNEUS
-- =============================================

-- Será inserido via aplicação após criar a empresa
