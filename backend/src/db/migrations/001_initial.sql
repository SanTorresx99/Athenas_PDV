-- ATHENAS PDV — Schema inicial
-- Migration: 001_initial
-- Criado: 2026-05-27

CREATE TABLE IF NOT EXISTS produto (
  id            TEXT PRIMARY KEY,
  codigo        TEXT UNIQUE NOT NULL,
  nome          TEXT NOT NULL,
  descricao     TEXT,
  unidade       TEXT NOT NULL DEFAULT 'UN',
  preco_venda   REAL NOT NULL,
  preco_custo   REAL,
  categoria     TEXT,
  estoque_min   REAL DEFAULT 0,
  ativo         INTEGER DEFAULT 1,
  criado_em     TEXT DEFAULT (datetime('now')),
  atualizado_em TEXT
);

CREATE TABLE IF NOT EXISTS venda (
  id             TEXT PRIMARY KEY,
  numero         INTEGER NOT NULL,
  status         TEXT DEFAULT 'fechada',
  forma_pagto    TEXT NOT NULL,
  total          REAL NOT NULL DEFAULT 0,
  desconto       REAL DEFAULT 0,
  troco          REAL DEFAULT 0,
  operador_id    TEXT,
  dispositivo_id TEXT,
  observacao     TEXT,
  criado_em      TEXT DEFAULT (datetime('now')),
  fechado_em     TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS item_venda (
  id         TEXT PRIMARY KEY,
  venda_id   TEXT NOT NULL,
  produto_id TEXT NOT NULL,
  quantidade REAL NOT NULL,
  preco_unit REAL NOT NULL,
  desconto   REAL DEFAULT 0,
  total      REAL NOT NULL,
  FOREIGN KEY (venda_id)   REFERENCES venda(id),
  FOREIGN KEY (produto_id) REFERENCES produto(id)
);

CREATE TABLE IF NOT EXISTS movimento_estoque (
  id          TEXT PRIMARY KEY,
  produto_id  TEXT NOT NULL,
  tipo        TEXT NOT NULL,
  quantidade  REAL NOT NULL,
  saldo_apos  REAL NOT NULL,
  origem      TEXT,
  origem_id   TEXT,
  operador_id TEXT,
  observacao  TEXT,
  criado_em   TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (produto_id) REFERENCES produto(id)
);

CREATE TABLE IF NOT EXISTS fornecedor (
  id        TEXT PRIMARY KEY,
  nome      TEXT NOT NULL,
  cnpj_cpf  TEXT,
  telefone  TEXT,
  email     TEXT,
  endereco  TEXT,
  contato   TEXT,
  ativo     INTEGER DEFAULT 1,
  criado_em TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ordem_compra (
  id               TEXT PRIMARY KEY,
  numero           INTEGER NOT NULL,
  fornecedor_id    TEXT NOT NULL,
  status           TEXT DEFAULT 'rascunho',
  total            REAL DEFAULT 0,
  previsao_entrega TEXT,
  observacao       TEXT,
  operador_id      TEXT,
  criado_em        TEXT DEFAULT (datetime('now')),
  recebido_em      TEXT,
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedor(id)
);

CREATE TABLE IF NOT EXISTS item_ordem_compra (
  id                  TEXT PRIMARY KEY,
  ordem_compra_id     TEXT NOT NULL,
  produto_id          TEXT NOT NULL,
  quantidade          REAL NOT NULL,
  preco_unit          REAL,
  total               REAL,
  quantidade_recebida REAL DEFAULT 0,
  FOREIGN KEY (ordem_compra_id) REFERENCES ordem_compra(id),
  FOREIGN KEY (produto_id)      REFERENCES produto(id)
);

CREATE TABLE IF NOT EXISTS usuario (
  id          TEXT PRIMARY KEY,
  nome        TEXT NOT NULL,
  login       TEXT UNIQUE NOT NULL,
  senha_hash  TEXT NOT NULL,
  perfil      TEXT DEFAULT 'operador',
  ativo       INTEGER DEFAULT 1,
  criado_em   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS dispositivo (
  id            TEXT PRIMARY KEY,
  nome          TEXT NOT NULL,
  tipo          TEXT NOT NULL,
  ip_local      TEXT,
  ativo         INTEGER DEFAULT 1,
  ultimo_acesso TEXT
);

CREATE TABLE IF NOT EXISTS licenca (
  id                TEXT PRIMARY KEY DEFAULT 'principal',
  coins_disponiveis INTEGER NOT NULL DEFAULT 0,
  dias_restantes    INTEGER NOT NULL DEFAULT 0,
  modo              TEXT DEFAULT 'trial',
  token_hash        TEXT,
  ultimo_check      TEXT DEFAULT (datetime('now')),
  notificou_7dias   INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS migration_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nome       TEXT NOT NULL UNIQUE,
  aplicado_em TEXT DEFAULT (datetime('now'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_produto_codigo   ON produto(codigo);
CREATE INDEX IF NOT EXISTS idx_produto_ativo    ON produto(ativo);
CREATE INDEX IF NOT EXISTS idx_venda_data       ON venda(criado_em);
CREATE INDEX IF NOT EXISTS idx_venda_status     ON venda(status);
CREATE INDEX IF NOT EXISTS idx_item_venda_venda ON item_venda(venda_id);
CREATE INDEX IF NOT EXISTS idx_mov_produto      ON movimento_estoque(produto_id);
CREATE INDEX IF NOT EXISTS idx_mov_data         ON movimento_estoque(criado_em);
CREATE INDEX IF NOT EXISTS idx_ordem_status     ON ordem_compra(status);
