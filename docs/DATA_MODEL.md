# Modelo de Dados — ATHENAS PDV

Banco: SQLite com WAL mode. Um arquivo `athenas.db` por instalação (PC Principal).

---

## Entidades principais

### `produto`
```sql
CREATE TABLE produto (
  id          TEXT PRIMARY KEY,          -- UUID
  codigo      TEXT UNIQUE NOT NULL,      -- código de barras ou interno
  nome        TEXT NOT NULL,
  descricao   TEXT,
  unidade     TEXT NOT NULL DEFAULT 'UN', -- UN, KG, LT, CX, etc.
  preco_venda REAL NOT NULL,
  preco_custo REAL,
  categoria   TEXT,
  estoque_min REAL DEFAULT 0,            -- alerta de estoque mínimo
  ativo       INTEGER DEFAULT 1,
  criado_em   TEXT DEFAULT (datetime('now')),
  atualizado_em TEXT
);
```

### `venda`
```sql
CREATE TABLE venda (
  id           TEXT PRIMARY KEY,
  numero       INTEGER NOT NULL,          -- número sequencial do dia
  status       TEXT DEFAULT 'aberta',     -- aberta | fechada | cancelada
  forma_pagto  TEXT,                      -- dinheiro | pix | credito | debito | misto
  total        REAL NOT NULL DEFAULT 0,
  desconto     REAL DEFAULT 0,
  troco        REAL DEFAULT 0,
  pagamentos   TEXT,                      -- JSON [{forma,valor}] quando múltiplos pagamentos
  operador_id  TEXT,
  dispositivo_id TEXT,
  observacao   TEXT,
  criado_em    TEXT DEFAULT (datetime('now')),
  fechado_em   TEXT,
  FOREIGN KEY (operador_id) REFERENCES usuario(id)
);
```

### `item_venda`
```sql
CREATE TABLE item_venda (
  id          TEXT PRIMARY KEY,
  venda_id    TEXT NOT NULL,
  produto_id  TEXT NOT NULL,
  quantidade  REAL NOT NULL,
  preco_unit  REAL NOT NULL,             -- preço no momento da venda
  desconto    REAL DEFAULT 0,
  total       REAL NOT NULL,
  FOREIGN KEY (venda_id) REFERENCES venda(id),
  FOREIGN KEY (produto_id) REFERENCES produto(id)
);
```

### `movimento_estoque`
```sql
CREATE TABLE movimento_estoque (
  id           TEXT PRIMARY KEY,
  produto_id   TEXT NOT NULL,
  tipo         TEXT NOT NULL,            -- entrada | saida | ajuste | perda
  quantidade   REAL NOT NULL,
  saldo_apos   REAL NOT NULL,
  origem       TEXT,                     -- venda | compra | ajuste_manual
  origem_id    TEXT,                     -- id da venda ou compra que gerou o mov
  operador_id  TEXT,
  observacao   TEXT,
  criado_em    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (produto_id) REFERENCES produto(id)
);
```

### `fornecedor`
```sql
CREATE TABLE fornecedor (
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
```

### `ordem_compra`
```sql
CREATE TABLE ordem_compra (
  id            TEXT PRIMARY KEY,
  numero        INTEGER NOT NULL,
  fornecedor_id TEXT NOT NULL,
  status        TEXT DEFAULT 'rascunho',  -- rascunho | enviada | recebida | cancelada
  total         REAL DEFAULT 0,
  previsao_entrega TEXT,
  observacao    TEXT,
  operador_id   TEXT,
  criado_em     TEXT DEFAULT (datetime('now')),
  recebido_em   TEXT,
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedor(id)
);
```

### `item_ordem_compra`
```sql
CREATE TABLE item_ordem_compra (
  id              TEXT PRIMARY KEY,
  ordem_compra_id TEXT NOT NULL,
  produto_id      TEXT NOT NULL,
  quantidade      REAL NOT NULL,
  preco_unit      REAL,
  total           REAL,
  quantidade_recebida REAL DEFAULT 0,
  FOREIGN KEY (ordem_compra_id) REFERENCES ordem_compra(id),
  FOREIGN KEY (produto_id) REFERENCES produto(id)
);
```

### `usuario`
```sql
CREATE TABLE usuario (
  id       TEXT PRIMARY KEY,
  nome     TEXT NOT NULL,
  login    TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  perfil   TEXT DEFAULT 'operador',      -- admin | operador | caixa | estoque
  ativo    INTEGER DEFAULT 1,
  criado_em TEXT DEFAULT (datetime('now'))
);
```

### `dispositivo`
```sql
CREATE TABLE dispositivo (
  id       TEXT PRIMARY KEY,
  nome     TEXT NOT NULL,                -- "Caixa 1", "Estoque", "Cozinha"
  tipo     TEXT NOT NULL,               -- hub | caixa | estoque | cozinha
  ip_local TEXT,
  ativo    INTEGER DEFAULT 1,
  ultimo_acesso TEXT
);
```

### `licenca`
```sql
CREATE TABLE licenca (
  id              TEXT PRIMARY KEY DEFAULT 'principal',
  coins_disponiveis INTEGER NOT NULL DEFAULT 0,
  dias_restantes  INTEGER NOT NULL DEFAULT 0,
  modo            TEXT DEFAULT 'trial',  -- trial | ativo | suspenso
  token_hash      TEXT,                  -- SHA256 do último token DEV aplicado
  ultimo_check    TEXT DEFAULT (datetime('now')),
  notificou_7dias INTEGER DEFAULT 0      -- flag de notificação já enviada
);
```

---

## Índices recomendados

```sql
CREATE INDEX idx_produto_codigo ON produto(codigo);
CREATE INDEX idx_venda_data ON venda(criado_em);
CREATE INDEX idx_item_venda_venda ON item_venda(venda_id);
CREATE INDEX idx_mov_estoque_produto ON movimento_estoque(produto_id);
CREATE INDEX idx_mov_estoque_data ON movimento_estoque(criado_em);
```

---

## Regras de negócio no banco

- Saldo de estoque é sempre derivado de `movimento_estoque` — nunca atualizado diretamente em `produto`
- `item_venda.preco_unit` registra o preço no momento da venda (imutável após fechamento)
- `venda.total` = SUM(item_venda.total) - venda.desconto
- Cancelamento de venda gera movimentos de estoque de estorno automático
