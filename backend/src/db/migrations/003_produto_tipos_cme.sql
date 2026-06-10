-- ATHENAS PDV — Tipos de produto, CME/CMV, ficha técnica e recursos de serviço
-- Migration: 003_produto_tipos_cme
-- Sprint 02

-- Novos campos em produto
ALTER TABLE produto ADD COLUMN tipo TEXT NOT NULL DEFAULT 'revenda';
ALTER TABLE produto ADD COLUMN custo_medio REAL DEFAULT 0;
ALTER TABLE produto ADD COLUMN tempo_preparo_min INTEGER;
ALTER TABLE produto ADD COLUMN rendimento_qtd REAL;
ALTER TABLE produto ADD COLUMN rendimento_un TEXT;
ALTER TABLE produto ADD COLUMN qtd_embalagem REAL;
ALTER TABLE produto ADD COLUMN requer_producao INTEGER DEFAULT 0;

-- Snapshot de custo nas movimentações de estoque
ALTER TABLE movimento_estoque ADD COLUMN custo_unitario REAL;

-- CMV snapshot na venda (custo no momento da venda)
ALTER TABLE item_venda ADD COLUMN custo_unitario REAL;

-- Ficha técnica (BOM) — produtos fabricados
CREATE TABLE IF NOT EXISTS ficha_tecnica (
  id             TEXT PRIMARY KEY,
  produto_id     TEXT NOT NULL,
  insumo_id      TEXT,
  insumo_nome    TEXT NOT NULL,
  quantidade     REAL NOT NULL,
  unidade        TEXT NOT NULL DEFAULT 'UN',
  custo_unitario REAL DEFAULT 0,
  ordem          INTEGER DEFAULT 0,
  observacao     TEXT,
  FOREIGN KEY (produto_id) REFERENCES produto(id),
  FOREIGN KEY (insumo_id)  REFERENCES produto(id)
);

-- Recursos de serviço — ferramentas, equipamentos, consumíveis
CREATE TABLE IF NOT EXISTS recurso_servico (
  id          TEXT PRIMARY KEY,
  produto_id  TEXT NOT NULL,
  tipo        TEXT NOT NULL DEFAULT 'material',
  nome        TEXT NOT NULL,
  insumo_id   TEXT,
  quantidade  REAL DEFAULT 1,
  unidade     TEXT DEFAULT 'UN',
  obrigatorio INTEGER DEFAULT 1,
  observacao  TEXT,
  FOREIGN KEY (produto_id) REFERENCES produto(id),
  FOREIGN KEY (insumo_id)  REFERENCES produto(id)
);

CREATE INDEX IF NOT EXISTS idx_ficha_produto    ON ficha_tecnica(produto_id);
CREATE INDEX IF NOT EXISTS idx_recurso_produto  ON recurso_servico(produto_id);
CREATE INDEX IF NOT EXISTS idx_produto_tipo     ON produto(tipo);
