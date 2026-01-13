-- Migration: Criar tabela de veiculos
-- Permite cadastrar veiculos dos clientes para rastreamento de servicos

-- Tabela de veiculos
CREATE TABLE IF NOT EXISTS veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  ano INTEGER,
  placa VARCHAR(10),
  cor VARCHAR(50),
  chassi VARCHAR(50),
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_veiculos_empresa ON veiculos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_cliente ON veiculos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos(placa);

-- Unique constraint para placa por empresa (uma placa nao pode repetir na mesma empresa)
CREATE UNIQUE INDEX IF NOT EXISTS idx_veiculos_placa_empresa
  ON veiculos(empresa_id, placa)
  WHERE placa IS NOT NULL AND placa != '';

-- Adicionar coluna veiculo_id nas vendas
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS veiculo_id UUID REFERENCES veiculos(id);
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id);

-- Indice para buscar vendas por veiculo
CREATE INDEX IF NOT EXISTS idx_vendas_veiculo ON vendas(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON vendas(cliente_id);

-- RLS (Row Level Security)
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;

-- Politica para veiculos
CREATE POLICY "Usuarios podem ver veiculos da sua empresa" ON veiculos
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios podem inserir veiculos na sua empresa" ON veiculos
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios podem atualizar veiculos da sua empresa" ON veiculos
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios podem deletar veiculos da sua empresa" ON veiculos
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios WHERE auth_id = auth.uid()
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_veiculos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_veiculos_updated_at
  BEFORE UPDATE ON veiculos
  FOR EACH ROW
  EXECUTE FUNCTION update_veiculos_updated_at();

-- Comentarios
COMMENT ON TABLE veiculos IS 'Veiculos cadastrados dos clientes';
COMMENT ON COLUMN veiculos.marca IS 'Marca do veiculo (ex: Fiat, VW, Honda)';
COMMENT ON COLUMN veiculos.modelo IS 'Modelo do veiculo (ex: Uno, Gol, Civic)';
COMMENT ON COLUMN veiculos.ano IS 'Ano do veiculo';
COMMENT ON COLUMN veiculos.placa IS 'Placa do veiculo (formato antigo ou Mercosul)';
COMMENT ON COLUMN veiculos.cor IS 'Cor do veiculo';
COMMENT ON COLUMN veiculos.chassi IS 'Numero do chassi';
COMMENT ON COLUMN vendas.veiculo_id IS 'Veiculo associado a venda/servico';
COMMENT ON COLUMN vendas.cliente_id IS 'Cliente associado a venda';
