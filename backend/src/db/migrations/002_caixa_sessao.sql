-- ATHENAS PDV — Sessão de caixa, sangrias e auditoria
-- Migration: 002_caixa_sessao
-- Criado: 2026-05-30

-- Sessão de abertura/fechamento do caixa
CREATE TABLE IF NOT EXISTS caixa_sessao (
  id               TEXT PRIMARY KEY,
  dispositivo_id   TEXT,
  operador_nome    TEXT NOT NULL,          -- nome informado na abertura
  operador_codigo  TEXT,                   -- PIN informado (futuro: FK usuario.id)
  fundo_inicial    REAL NOT NULL DEFAULT 0,
  aberto_em        TEXT NOT NULL DEFAULT (datetime('now')),
  fechado_em       TEXT,
  supervisor_nome  TEXT,                   -- quem autorizou o fechamento
  supervisor_codigo TEXT,
  contagem_fisica  REAL,                   -- valor contado no fechamento
  status           TEXT DEFAULT 'aberto'   -- aberto | fechado
);

-- Sangrias (retiradas de numerário)
CREATE TABLE IF NOT EXISTS sangria (
  id               TEXT PRIMARY KEY,
  sessao_id        TEXT NOT NULL,
  valor            REAL NOT NULL,
  motivo           TEXT,
  supervisor_nome  TEXT,                   -- quem autorizou
  supervisor_codigo TEXT,
  criado_em        TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (sessao_id) REFERENCES caixa_sessao(id)
);

-- Log de auditoria — ações que requerem autorização de supervisor
CREATE TABLE IF NOT EXISTS audit_log (
  id               TEXT PRIMARY KEY,
  acao             TEXT NOT NULL,          -- 'cancelamento_venda' | 'sangria' | 'abertura_caixa' | 'fechamento_caixa'
  referencia_id    TEXT,                   -- id da venda, sangria, sessão etc.
  operador_nome    TEXT,
  supervisor_nome  TEXT,
  supervisor_codigo TEXT,
  descricao        TEXT,
  criado_em        TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessao_status   ON caixa_sessao(status);
CREATE INDEX IF NOT EXISTS idx_sessao_aberto   ON caixa_sessao(aberto_em);
CREATE INDEX IF NOT EXISTS idx_sangria_sessao  ON sangria(sessao_id);
CREATE INDEX IF NOT EXISTS idx_audit_acao      ON audit_log(acao);
CREATE INDEX IF NOT EXISTS idx_audit_data      ON audit_log(criado_em);
