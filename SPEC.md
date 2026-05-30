# ATHENAS PDV — Especificação Técnica do Sistema

**Versão:** 0.1.0  
**Data:** 2026-05-27  
**Status:** Em desenvolvimento — Sprint 01

---

## 1. Visão do Produto

### O que é

ATHENAS PDV é um sistema SaaS ERP-PDV de **baixo custo computacional e de implementação**, voltado para pequenos negócios locais. Roda localmente na máquina do cliente, sem dependência de internet para operação, com controle de licença gerenciado pelo implementador.

### Problema que resolve

Pequenos negócios (distribuidoras, restaurantes, bares, mercadinhos, drogarias, brechós) operam sem sistema de gestão por causa do alto custo de implementação e mensalidades de ERPs tradicionais. O ATHENAS oferece um ponto de entrada acessível (R$ 800 de implementação) com custo mensal justo e controle total do implementador local.

### Princípios de design

| Princípio | Decisão |
|-----------|---------|
| Local-first | Opera 100% offline; internet é opcional |
| Baixo consumo | Bun + SQLite rodam em hardware de R$ 800 |
| Modular | Cada módulo é ativado por AthenCoins — paga só o que usa |
| Zero infra obrigatória | Sem servidor em nuvem, sem Docker, sem configuração complexa |
| Multi-dispositivo | Um Hub + N módulos secundários na mesma LAN |

---

## 2. Perfis de Negócio Suportados

| Perfil | Módulos ativos | Particularidades |
|--------|---------------|-----------------|
| **Distribuidora / Adega** (MVP) | Caixa, Estoque, Compras | Saldo negativo permitido (venda com entrega futura) |
| Restaurante / Bar | Caixa, Estoque, Cozinha | Pedidos de produção, comanda, KDS |
| Mercadinho | Caixa, Estoque, Compras | Fracionamento (KG, LT) |
| Drogaria | Caixa, Estoque | Controle de lote e validade (Sprint 03) |
| Brechó | Caixa, Estoque | Produto único (sem estoque múltiplo) |

### Configurações por perfil

```
perfil.saldo_negativo_permitido   → boolean  (default: false; distribuidora: true)
perfil.requer_producao_ativo      → boolean  (default: false; restaurante: true)
perfil.fracionamento_ativo        → boolean  (default: false; mercadinho: true)
perfil.nome                       → string   (exibido na UI e no recibo)
```

---

## 3. Arquitetura do Sistema

### Topologia

```
PC Principal (Hub)
├── Servidor Bun :3001
├── SQLite WAL (athenas.db)
├── mDNS: _athenas._tcp.local
└── Frontend React (todos os módulos)
        ↕ REST + WebSocket (LAN)
PC Secundário A — Caixa          PC Secundário B — Estoque
└── Frontend React → Hub API     └── Frontend React → Hub API
        ↕ sync opcional
    VPS / Cloud (cliente com nuvem)
```

### Regra fundamental

> Módulos secundários **nunca** acessam o SQLite diretamente.  
> Toda escrita passa pela API do Hub. O Hub é a única fonte da verdade.

### Stack técnica

| Camada | Tecnologia | Motivo |
|--------|------------|--------|
| Runtime | Bun ≥ 1.1.0 | 2–3× mais rápido que Node, SQLite nativo, startup < 5ms |
| Framework HTTP | Hono | Ultra-leve (~14kb), alta throughput |
| Banco | SQLite WAL via `bun:sqlite` | Zero infra, ACID, ~100k ops/s em hardware modesto |
| Frontend | React 18 (CDN, sem build) | Abre no navegador sem toolchain |
| Estilo | CSS Variables + Sora / JetBrains Mono | Temas dinâmicos, sem pré-processador |
| Comunicação LAN | REST HTTP/JSON + WebSocket | Universal, sem dependências extras |
| Descoberta | mDNS / Bonjour | Zero configuração manual de IP |

### Portas padrão

| Serviço | Porta |
|---------|-------|
| Servidor Hub | 3001 |
| Frontend (Live Server / dev) | 5500 |

---

## 4. Sistema de AthenCoins (Licença)

### Tabela de coins

| Configuração | AthenCoins |
|---|---|
| PC Principal — Hub (todos os módulos) | 100 |
| Módulo Caixa (PC secundário) | 50 |
| Módulo Estoque (PC secundário) | 50 |
| Módulo Cozinha / Fabricação (PC secundário) | 50 |

### Ciclo de vida

```
Implementação (DEV aplica token trial)
  → trial (7 dias padrão)
  → ativo (após renovação)
  → suspenso (dias_restantes = 0)
  → ativo (após nova renovação)
```

### Notificações por threshold

| Dias restantes | Ação |
|---|---|
| 14 | Banner discreto (info azul) |
| 7 | Banner amarelo persistente em todos os módulos |
| 3 | Banner vermelho + modal ao abrir |
| 0 | Modo suspenso — somente leitura |

### Fluxo de renovação — Online (PIX)

1. Operador acessa **Configurações → Licença → Renovar**
2. Sistema gera QR Code PIX com `txid` único vinculado ao ID da instalação
3. Gateway PIX confirma via webhook → ATHENAS Central gera token
4. Token aplicado automaticamente (se online) ou exibido para o DEV

### Fluxo de renovação — Offline (Token DEV)

1. DEV acessa Painel ATHENAS Central
2. Informa: ID da instalação + quantidade de dias/meses
3. Sistema gera token: `ATHENAS-{base64url(payload)}-{hmac_8chars}`
4. Token tem validade de 30 dias para ser aplicado
5. DEV entrega o token ao cliente → cliente aplica em **Configurações → Licença → Aplicar Token**
6. Sistema valida HMAC e soma os dias

### Modo suspenso

- Leitura de dados: ✓ permitida
- Novas vendas: ✗ bloqueadas
- Edição de estoque: ✗ bloqueada
- Relatórios e exportação: ✓ permitidos

---

## 5. Requisitos Funcionais

### 5.1 Módulo PDV / Caixa

**Fluxo principal:**
1. Operador abre nova venda
2. Adiciona itens por código de barras ou busca por nome
3. Ajusta quantidade e aplica desconto (se autorizado)
4. Seleciona forma de pagamento
5. Sistema fecha venda, baixa estoque, gera recibo

**Formas de pagamento (MVP):**

| Forma | Comportamento |
|-------|---------------|
| Dinheiro | Calcula troco automaticamente |
| PIX | Exibe chave/QR, confirma manualmente |
| Crédito | Registra sem integração TEF |
| Débito | Registra sem integração TEF |
| Misto | Split entre quaisquer formas |
| Split | Múltiplos pagamentos por venda via array `pagamentos` |

**Cancelamento:**
- Permitido no mesmo dia por supervisor ou admin
- Gera estorno automático no estoque para cada item
- Emite recibo de cancelamento

**Recibo não-fiscal (MVP):**
- Nome do estabelecimento, data/hora, número da venda
- Lista de itens (produto, qtd, preço unit, total)
- Subtotal, desconto, total, forma de pagamento, troco
- Rodapé: "Documento não fiscal"

**Regras:**
- Produto sem saldo: alerta + permite venda (configurável por perfil)
- Desconto máximo: configurável pelo adm (padrão: 20%)
- Venda com total = 0 é bloqueada (exceto cancelamento)

---

### 5.2 Módulo Estoque

**Saldo:** sempre calculado via `SUM(movimento_estoque)` — nunca campo direto.

**Tipos de movimento:**

| Tipo | Quando |
|------|--------|
| `entrada` | Recebimento de mercadoria, ajuste positivo |
| `saida` | Fechamento de venda |
| `ajuste` | Acerto de inventário |
| `perda` | Quebra, vencimento, furto |

**Alertas:** ao fechar venda, se `saldo ≤ estoque_min` → broadcast WebSocket para todos os módulos.

**Regras:**
- Saldo negativo bloqueado por padrão (configurável por perfil)
- `preco_custo` do produto atualizado a cada entrada (último custo)
- Cancelamento de venda gera entrada de estorno automática

---

### 5.3 Módulo Compras / Adm

**Status de uma ordem:**
```
rascunho → enviada → recebida
         ↘ cancelada
```

**Recebimento parcial:** uma ordem pode ser recebida em múltiplas entregas.

**Regras:**
- Ordem não movimenta estoque — só o recebimento efetivo o faz
- Ordem `recebida` não pode ser cancelada
- Cancelamento de ordem não reverte movimentos de estoque já gerados

---

### 5.4 Módulo Cozinha / Fabricação *(Sprint 02)*

**Status de pedido de produção:**
```
pendente → em_producao → pronto → entregue
         ↘ cancelado
```

**KDS (Kitchen Display System):** três colunas (Pendente / Em produção / Pronto), fundo escuro, texto grande, alerta sonoro para novos pedidos, timer visual com destaque vermelho após X minutos.

**Trigger:** apenas produtos com `requer_producao = true` geram pedido na cozinha.

---

### 5.5 Dashboard

**KPIs do dia:**
- Faturamento total
- Quantidade de vendas
- Ticket médio
- Produtos críticos (saldo ≤ mínimo)

**Listas:**
- Últimas 5 vendas
- Top 5 produtos mais vendidos
- Distribuição de vendas por hora

---

### 5.6 Sistema de Licença

- `GET /api/licenca/status` → retorna modo, dias restantes, alerta, coins disponíveis
- `POST /api/licenca/token` → valida e aplica token de renovação
- Decremento diário automático ao iniciar o servidor

---

## 6. Requisitos Não-Funcionais

| Requisito | Meta |
|-----------|------|
| Tempo de resposta API (LAN) | < 50ms p95 |
| Startup do servidor | < 3s em hardware básico |
| Banco de dados | Suporta 10.000 vendas/dia sem degradação |
| Concorrência | Até 10 dispositivos simultâneos na LAN |
| Disponibilidade | 100% offline — zero dependência de internet |
| Resolução mínima suportada | 1366 × 768 |
| Operação por teclado numérico | Caixa operável sem mouse |
| Segurança | Sem SQL injection, token HMAC para licença, sem dados sensíveis em log |
| Backup | Export SQLite automático diário (Sprint 02) |

---

## 7. Especificação Completa da API REST

**Base URL:** `http://localhost:3001`  
**Content-Type:** `application/json`

### Produto

```
GET  /api/produto
  Query: ativo (default: 1), categoria
  Response: Produto[]

GET  /api/produto/busca?q={termo}
  Response: Produto[] (max 20, busca nome LIKE ou código exato)

GET  /api/produto/categorias
  Response: string[]

GET  /api/produto/:id
  Response: Produto | 404

POST /api/produto
  Body: { codigo*, nome*, unidade?, preco_venda*, preco_custo?, categoria?, estoque_min?, descricao? }
  Response: { id, mensagem } 201 | 400 | 409 (código duplicado)

PUT  /api/produto/:id
  Body: campos parciais (PATCH semântico)
  Response: { mensagem } | 404
```

### Venda

```
POST /api/venda
  Body: {
    itens*: [{ produto_id*, quantidade*, desconto? }],
    forma_pagto?: 'dinheiro'|'pix'|'credito'|'debito'|'misto',  -- legado, compatibilidade
    pagamentos?: [{ forma*, valor* }],                            -- novo: múltiplos pagamentos
    desconto?: number,
    observacao?: string,
    operador_id?: string
  }
  Regra: fornecer `forma_pagto` OU `pagamentos` (obrigatório um dos dois).
         Se `pagamentos`, soma deve ser ≥ total; troco calculado automaticamente.
  Response: { id, numero, total, troco, mensagem } 201 | 400 | 422

GET  /api/venda/dia
  Response: Venda[] (hoje, exceto canceladas)

GET  /api/venda/:id
  Response: Venda & { itens: ItemVenda[] } | 404

POST /api/venda/:id/cancelar
  Response: { mensagem } | 404 | 409 (já cancelada)
```

### Estoque

```
GET  /api/estoque
  Response: { id, nome, codigo, unidade, saldo, estoque_min, critico }[]

GET  /api/estoque/criticos
  Response: produtos com saldo ≤ estoque_min

GET  /api/estoque/:produto_id
  Response: { ...produto, saldo, historico: Movimento[] } | 404

POST /api/estoque/entrada
  Body: { produto_id*, quantidade*, preco_custo?, observacao?, operador_id? }
  Response: { mensagem, saldo } 201 | 400 | 404

POST /api/estoque/ajuste
  Body: { produto_id*, tipo?: 'ajuste'|'perda'|'entrada', quantidade*, observacao?, operador_id? }
  Response: { mensagem, saldo_anterior, saldo_atual } | 400 | 404
```

### Compras

```
GET  /api/compras/fornecedor
  Response: Fornecedor[]

POST /api/compras/fornecedor
  Body: { nome*, cnpj_cpf?, telefone?, email?, endereco?, contato? }
  Response: { id, mensagem } 201 | 400

PUT  /api/compras/fornecedor/:id
  Body: campos parciais
  Response: { mensagem } | 404

GET  /api/compras/ordem?status={status}
  Response: OrdemCompra[] (com fornecedor_nome)

GET  /api/compras/ordem/:id
  Response: OrdemCompra & { itens: ItemOrdem[] } | 404

POST /api/compras/ordem
  Body: { fornecedor_id*, itens*: [{ produto_id*, quantidade*, preco_unit? }], previsao_entrega?, observacao? }
  Response: { id, numero, mensagem } 201 | 400 | 404

POST /api/compras/ordem/:id/receber
  Body: { itens: [{ item_ordem_compra_id*, quantidade_recebida?, preco_unit? }], operador_id? }
  Response: { mensagem } | 404 | 409

POST /api/compras/ordem/:id/cancelar
  Response: { mensagem } | 404 | 409
```

### Dashboard

```
GET  /api/dashboard
  Response: {
    data: string,
    resumo: { faturamento, qtd_vendas, ticket_medio },
    criticos: Produto[],
    ultimas_vendas: Venda[],
    por_hora: { hora, total, qtd }[],
    mais_vendidos: { nome, unidade, qtd_vendida, receita }[]
  }
```

### Licença

```
GET  /api/licenca/status
  Response: { dias_restantes, modo, coins_disponiveis, alerta, notificou_7dias }

POST /api/licenca/token
  Body: { token* }
  Response: { ok, mensagem }
```

---

## 8. Modelo de Dados

### Tabelas

| Tabela | Propósito |
|--------|-----------|
| `produto` | Cadastro de produtos e preços |
| `venda` | Cabeçalho de cada venda |
| `item_venda` | Itens de cada venda (preço congelado no momento) |
| `movimento_estoque` | Toda entrada/saída — saldo é sempre calculado daqui |
| `fornecedor` | Cadastro de fornecedores |
| `ordem_compra` | Ordens de compra para fornecedores |
| `item_ordem_compra` | Itens de cada ordem de compra |
| `usuario` | Usuários do sistema com perfis |
| `dispositivo` | Dispositivos registrados na instalação |
| `licenca` | Estado da licença (AthenCoins, dias, modo) |
| `migration_log` | Controle de migrations aplicadas |

### Invariantes do banco (nunca violar)

1. `item_venda.preco_unit` é imutável após inserção — congela o preço da venda
2. `venda.total` = SUM(item_venda.total) - venda.desconto
3. Saldo de estoque = SUM(entrada) - SUM(saída) em `movimento_estoque`
4. Cancelamento de venda SEMPRE gera estorno em `movimento_estoque`
5. `licenca` tem exatamente 1 linha (id = 'principal')
6. Token HMAC já aplicado não pode ser reutilizado (`token_hash` registrado)

---

## 9. Regras de Negócio Globais

### Fixas (não configuráveis)

- Toda venda tem número sequencial por dia (reinicia a 1 a cada dia)
- Histórico de movimentos de estoque é imutável — só se adiciona, nunca se edita
- Dados de vendas fechadas são imutáveis (apenas status pode ser alterado para 'cancelada')
- Token de licença expirado (> 30 dias da geração) é rejeitado mesmo que o HMAC seja válido

### Configuráveis por perfil de negócio

| Regra | Padrão | Configurável |
|-------|--------|-------------|
| Permitir venda com saldo negativo | false | ✓ |
| Desconto máximo por venda (%) | 20% | ✓ |
| Desconto por item requer supervisor | true | ✓ |
| Alerta de estoque mínimo | true | ✓ |
| Módulo cozinha ativo | false | ✓ |
| Tempo máximo de produção (minutos) | 30 | ✓ |

---

## 10. Perfis de Usuário e Permissões

| Ação | operador | supervisor | admin |
|------|:--------:|:----------:|:-----:|
| Abrir / fechar venda | ✓ | ✓ | ✓ |
| Buscar produto | ✓ | ✓ | ✓ |
| Aplicar desconto por item | — | ✓ | ✓ |
| Cancelar venda do dia | — | ✓ | ✓ |
| Cancelar venda de dia anterior | — | — | ✓ |
| Ver histórico de vendas | — | ✓ | ✓ |
| Lançar entrada de estoque | — | ✓ | ✓ |
| Ajuste / perda de estoque | — | ✓ | ✓ |
| Cadastrar / editar produto | — | ✓ | ✓ |
| Iniciar inventário | — | — | ✓ |
| Criar / editar ordem de compra | — | ✓ | ✓ |
| Registrar recebimento | — | ✓ | ✓ |
| Cadastrar fornecedor | — | ✓ | ✓ |
| Cancelar ordem de compra | — | — | ✓ |
| Ver dashboard e relatórios | — | ✓ | ✓ |
| Gerenciar usuários | — | — | ✓ |
| Configurações do sistema | — | — | ✓ |
| Aplicar token de licença | — | — | ✓ |
| Configurar perfil de negócio | — | — | ✓ |

---

## 11. Roadmap e Fases

### Sprint 01 — MVP Distribuidora *(atual)*

- [x] Backend Bun + Hono + SQLite rodando (porta 3001)
- [x] Schema completo com migrations automáticas
- [x] Seed: 12 produtos de distribuidora + admin padrão
- [x] API completa: produto, venda, estoque, compras, dashboard, licença
- [x] Sistema de AthenCoins (trial, decremento diário, modo suspenso)
- [x] Token HMAC de renovação offline
- [x] Documentação completa (docs/, modules/, sprints/)
- [ ] Interface React conectada ao backend
- [ ] Multi-dispositivo LAN (Hub + caixa secundário)

### Sprint 02 — Estabilização

- [ ] Módulo Cozinha / KDS
- [ ] Impressão térmica 80mm
- [ ] Modo offline do caixa secundário (fila local + sync)
- [ ] Relatórios básicos (CSV / PDF)
- [ ] Cadastro de clientes e fiado
- [ ] Backup automático diário
- [ ] mDNS discovery automático
- [ ] Suporte a restaurante e mercadinho

### Sprint 03+ — SaaS e escala

- [ ] Painel central do implementador (web)
- [ ] Renovação automática via PIX (webhook)
- [ ] App Android / PWA para tablets
- [ ] NFC-e / SAT fiscal
- [ ] TEF (maquininha física)
- [ ] Sync com nuvem opcional
- [ ] Multi-implementador (cada DEV com chave HMAC própria)
