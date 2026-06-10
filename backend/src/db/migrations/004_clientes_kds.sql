-- ATHENAS PDV — Clientes, conta corrente (fiado) e fila de produção (KDS)
-- Migration: 004_clientes_kds
-- Sprint 02

-- Clientes
CREATE TABLE IF NOT EXISTS cliente (
  id            TEXT PRIMARY KEY,
  nome          TEXT NOT NULL,
  cpf_cnpj      TEXT,
  telefone      TEXT,
  email         TEXT,
  endereco      TEXT,
  limite_fiado  REAL DEFAULT 0,
  ativo         INTEGER DEFAULT 1,
  criado_em     TEXT DEFAULT (datetime('now'))
);

-- Conta corrente (fiado): compras e pagamentos por cliente
CREATE TABLE IF NOT EXISTS conta_corrente (
  id         TEXT PRIMARY KEY,
  cliente_id TEXT NOT NULL,
  tipo       TEXT NOT NULL,             -- compra | pagamento
  valor      REAL NOT NULL,
  venda_id   TEXT,                      -- NULL para pagamentos
  observacao TEXT,
  criado_em  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (cliente_id) REFERENCES cliente(id),
  FOREIGN KEY (venda_id)   REFERENCES venda(id)
);

-- Vinculação de venda a cliente (fiado)
ALTER TABLE venda ADD COLUMN cliente_id TEXT REFERENCES cliente(id);

-- Fila de produção (KDS)
CREATE TABLE IF NOT EXISTS pedido_producao (
  id          TEXT PRIMARY KEY,
  venda_id    TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pendente',  -- pendente|em_producao|pronto|entregue|cancelado
  observacao  TEXT,
  criado_em   TEXT DEFAULT (datetime('now')),
  iniciado_em TEXT,
  pronto_em   TEXT,
  entregue_em TEXT,
  FOREIGN KEY (venda_id) REFERENCES venda(id)
);

CREATE TABLE IF NOT EXISTS item_pedido_producao (
  id                  TEXT PRIMARY KEY,
  pedido_producao_id  TEXT NOT NULL,
  produto_id          TEXT NOT NULL,
  quantidade          REAL NOT NULL,
  observacao          TEXT,
  FOREIGN KEY (pedido_producao_id) REFERENCES pedido_producao(id),
  FOREIGN KEY (produto_id)         REFERENCES produto(id)
);

CREATE INDEX IF NOT EXISTS idx_cliente_ativo     ON cliente(ativo);
CREATE INDEX IF NOT EXISTS idx_cc_cliente        ON conta_corrente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cc_tipo           ON conta_corrente(tipo);
CREATE INDEX IF NOT EXISTS idx_pedido_status     ON pedido_producao(status);
CREATE INDEX IF NOT EXISTS idx_pedido_venda      ON pedido_producao(venda_id);
CREATE INDEX IF NOT EXISTS idx_item_pedido       ON item_pedido_producao(pedido_producao_id);
