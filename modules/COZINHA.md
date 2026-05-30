# Módulo Cozinha / Fabricação

## Responsabilidade

Gestão da fila de produção — recebimento de pedidos do caixa, controle de status e
notificação de pronto. Voltado para restaurantes, bares, lanchonetes e distribuidoras
com área de fabricação.

Roda em PC ou tablet secundário (50 AthenCoins).

> **Sprint 02** — este módulo não faz parte do MVP da distribuidora (Sprint 01).

---

## Conceito de "pedido de produção"

Nem toda venda gera um pedido de cozinha. Apenas produtos com flag `requer_producao = true`
no cadastro disparam um item na fila da cozinha.

Exemplo (restaurante):
- Cerveja → não gera pedido (entrega imediata)
- Prato feito → gera pedido na cozinha

Exemplo (distribuidora):
- Produto unitário → não gera pedido
- Kit montado / fracionamento → pode gerar pedido de fabricação

---

## Fluxo principal — Pedido

```
1. Caixa fecha venda com itens que requerem produção
2. Hub:
   - INSERT pedido_producao
   - INSERT item_pedido_producao (apenas itens com requer_producao)
   - WebSocket broadcast → módulo Cozinha
3. Cozinha recebe notificação + som de alerta
4. Operador da cozinha vê o pedido na fila
5. Clica em "Iniciar" → status: em_producao
6. Clica em "Pronto" → status: pronto
   - WebSocket broadcast → Caixa (notificação de pedido pronto)
7. Pedido entregue → status: entregue
```

---

## Status de um pedido de produção

```
pendente → em_producao → pronto → entregue
         ↘ cancelado (se venda for cancelada)
```

---

## Interface (tela única — KDS)

KDS = Kitchen Display System — tela simples e grande, legível à distância.

| Coluna | Pedidos |
|--------|---------|
| Pendente | Novos pedidos (ordenados por horário) |
| Em produção | Em andamento |
| Pronto | Aguardando retirada/entrega |

- Fundo escuro, texto grande (legível em ambiente de cozinha)
- Alerta sonoro para novo pedido
- Timer visual por pedido (tempo desde entrada)
- Pedido com timer > X minutos fica em vermelho (tempo configurável)

---

## Regras de negócio

- Cancelamento de venda envia cancelamento para a fila (se pedido ainda pendente ou em produção)
- Pedido em produção não pode ser cancelado sem confirmação do supervisor
- Observações do cliente (ex: "sem cebola") aparecem em destaque no pedido
- Ordem de exibição: FIFO (primeiro pedido, primeiro atendido) por padrão
- Prioridade manual: supervisor pode mover pedido para o topo da fila

---

## Tabelas adicionais (a criar na Sprint 02)

```sql
CREATE TABLE pedido_producao (
  id          TEXT PRIMARY KEY,
  venda_id    TEXT NOT NULL,
  status      TEXT DEFAULT 'pendente',
  observacao  TEXT,
  criado_em   TEXT DEFAULT (datetime('now')),
  iniciado_em TEXT,
  pronto_em   TEXT,
  entregue_em TEXT
);

CREATE TABLE item_pedido_producao (
  id                  TEXT PRIMARY KEY,
  pedido_producao_id  TEXT NOT NULL,
  produto_id          TEXT NOT NULL,
  quantidade          REAL NOT NULL,
  observacao          TEXT           -- ex: "sem sal", "bem passado"
);

-- Flag no produto
ALTER TABLE produto ADD COLUMN requer_producao INTEGER DEFAULT 0;
```

---

## Endpoints API (Hub)

```
GET    /api/fila-producao              → todos os pedidos ativos
PUT    /api/fila-producao/:id/iniciar  → marcar em produção
PUT    /api/fila-producao/:id/pronto   → marcar pronto
PUT    /api/fila-producao/:id/entregue → marcar entregue
PUT    /api/fila-producao/:id/cancelar → cancelar pedido

WebSocket: ws://hub:3000/ws
  evento recebido: 'novo_pedido'       → toca alerta, adiciona à fila
  evento recebido: 'cancelar_pedido'   → remove da fila com animação
```

---

## Permissões por perfil

| Ação | operador (cozinha) | supervisor | admin |
|------|--------------------|------------|-------|
| Ver fila | ✓ | ✓ | ✓ |
| Iniciar / Pronto / Entregue | ✓ | ✓ | ✓ |
| Cancelar pedido em produção | — | ✓ | ✓ |
| Reordenar fila (prioridade) | — | ✓ | ✓ |
