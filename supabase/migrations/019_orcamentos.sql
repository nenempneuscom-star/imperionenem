-- Migration: 019_orcamentos.sql
-- Sistema de Orcamentos para Nenem Pneus

-- Tabela de orcamentos
CREATE TABLE IF NOT EXISTS orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  cliente_id UUID REFERENCES clientes(id),
  numero SERIAL,

  -- Dados do cliente (para quando nao tiver cadastro)
  cliente_nome VARCHAR(255),
  cliente_telefone VARCHAR(20),
  cliente_email VARCHAR(255),
  cliente_cpf_cnpj VARCHAR(20),

  -- Valores
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  desconto DECIMAL(10,2) NOT NULL DEFAULT 0,
  desconto_percentual DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Status e validade
  status VARCHAR(20) NOT NULL DEFAULT 'pendente', -- pendente, aprovado, rejeitado, expirado, convertido
  validade_dias INTEGER NOT NULL DEFAULT 7,
  data_validade DATE,

  -- Observacoes
  observacoes TEXT,
  condicoes TEXT, -- Condicoes de pagamento, entrega, etc.

  -- Conversao para venda
  venda_id UUID REFERENCES vendas(id),
  convertido_em TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens do orcamento
CREATE TABLE IF NOT EXISTS orcamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id),
  servico_id UUID REFERENCES servicos(id),

  -- Dados do item (copiados para preservar historico)
  codigo VARCHAR(50),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  unidade VARCHAR(10) DEFAULT 'UN',

  -- Valores
  quantidade DECIMAL(10,3) NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  desconto DECIMAL(10,2) DEFAULT 0,
  desconto_percentual DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,

  -- Ordem
  ordem INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_orcamentos_empresa ON orcamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente ON orcamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_data ON orcamentos(created_at);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_orcamento ON orcamento_itens(orcamento_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_orcamento_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_orcamento_timestamp ON orcamentos;
CREATE TRIGGER trigger_update_orcamento_timestamp
  BEFORE UPDATE ON orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION update_orcamento_timestamp();

-- Trigger para calcular data de validade
CREATE OR REPLACE FUNCTION calcular_validade_orcamento()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data_validade IS NULL THEN
    NEW.data_validade = CURRENT_DATE + NEW.validade_dias;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calcular_validade ON orcamentos;
CREATE TRIGGER trigger_calcular_validade
  BEFORE INSERT ON orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION calcular_validade_orcamento();

-- RLS Policies
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_itens ENABLE ROW LEVEL SECURITY;

-- Politicas para orcamentos
DROP POLICY IF EXISTS orcamentos_select ON orcamentos;
CREATE POLICY orcamentos_select ON orcamentos
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS orcamentos_insert ON orcamentos;
CREATE POLICY orcamentos_insert ON orcamentos
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS orcamentos_update ON orcamentos;
CREATE POLICY orcamentos_update ON orcamentos
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS orcamentos_delete ON orcamentos;
CREATE POLICY orcamentos_delete ON orcamentos
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

-- Politicas para orcamento_itens
DROP POLICY IF EXISTS orcamento_itens_select ON orcamento_itens;
CREATE POLICY orcamento_itens_select ON orcamento_itens
  FOR SELECT USING (
    orcamento_id IN (
      SELECT id FROM orcamentos WHERE empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS orcamento_itens_insert ON orcamento_itens;
CREATE POLICY orcamento_itens_insert ON orcamento_itens
  FOR INSERT WITH CHECK (
    orcamento_id IN (
      SELECT id FROM orcamentos WHERE empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS orcamento_itens_update ON orcamento_itens;
CREATE POLICY orcamento_itens_update ON orcamento_itens
  FOR UPDATE USING (
    orcamento_id IN (
      SELECT id FROM orcamentos WHERE empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS orcamento_itens_delete ON orcamento_itens;
CREATE POLICY orcamento_itens_delete ON orcamento_itens
  FOR DELETE USING (
    orcamento_id IN (
      SELECT id FROM orcamentos WHERE empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
      )
    )
  );

-- Funcao para expirar orcamentos antigos (pode ser chamada por cron)
CREATE OR REPLACE FUNCTION expirar_orcamentos_vencidos()
RETURNS void AS $$
BEGIN
  UPDATE orcamentos
  SET status = 'expirado'
  WHERE status = 'pendente'
    AND data_validade < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;
