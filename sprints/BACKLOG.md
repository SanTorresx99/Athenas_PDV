# Backlog — ATHENAS PDV

Prioridade: P1 (crítico MVP) → P2 (importante) → P3 (desejável) → P4 (futuro)

---

## Infraestrutura / Backend

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| INF-01 | Setup projeto Bun + Hono + TypeScript | P1 | 01 |
| INF-02 | Schema SQLite inicial (produto, venda, estoque, usuario, licenca) | P1 | 01 |
| INF-03 | Script de migrations com versionamento | P1 | 01 |
| INF-04 | Seed de dados para desenvolvimento | P1 | 01 |
| INF-05 | Middleware de autenticação (token de instalação) | P1 | 01 |
| INF-06 | Logger de requisições (arquivo local rotativo) | P2 | 01 |
| INF-07 | Descoberta mDNS (anúncio do Hub na LAN) | P2 | 02 |
| INF-08 | WebSocket server (Hono WS) | P2 | 02 |
| INF-09 | Modo offline do módulo secundário (fila local) | P3 | 03 |
| INF-10 | Sync com nuvem opcional (delta + retry) | P3 | 03 |
| INF-11 | Backup automático diário (export SQLite) | P2 | 02 |

---

## Sistema de Licença (AthenCoins)

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| LIC-01 | Tabela `licenca` e lógica de decremento diário | P1 | 01 |
| LIC-02 | Validação de AthenCoins por módulo no startup | P1 | 01 |
| LIC-03 | Geração e validação de token HMAC (renovação offline) | P1 | 01 |
| LIC-04 | Banner de notificação em todos os módulos (7, 3, 0 dias) | P1 | 01 |
| LIC-05 | Modo suspenso (somente leitura após vencimento) | P1 | 01 |
| LIC-06 | Fluxo de renovação via PIX (QR Code + webhook) | P3 | 03 |
| LIC-07 | Painel DEV web (gestão de clientes e tokens) | P3 | 03 |

---

## Módulo PDV / Caixa

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| PDV-01 | Endpoint POST /api/venda (abrir + fechar) | P1 | 01 |
| PDV-02 | Busca de produto por código e nome | P1 | 01 |
| PDV-03 | Cálculo de troco, formas de pagamento e split payment (múltiplos pagamentos por venda) | P1 | 01 |
| PDV-04 | Cancelamento de venda (com estorno de estoque) | P1 | 01 |
| PDV-05 | Geração de recibo não-fiscal (exibição na tela) | P1 | 01 |
| PDV-06 | Interface React do caixa | P1 | 01 |
| PDV-07 | Histórico de vendas do dia | P2 | 01 |
| PDV-08 | Impressão térmica 80mm | P2 | 02 |
| PDV-09 | Geração de PDF do recibo | P2 | 02 |
| PDV-10 | Controle de fiado (requer módulo Clientes) | P3 | 02 |
| PDV-11 | Integração TEF (maquininha física) | P4 | 03+ |

---

## Módulo Estoque

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| EST-01 | Endpoint GET /api/estoque (saldos calculados) | P1 | 01 |
| EST-02 | Endpoint POST /api/estoque/entrada | P1 | 01 |
| EST-03 | Endpoint POST /api/estoque/ajuste | P1 | 01 |
| EST-04 | Baixa automática de estoque ao fechar venda | P1 | 01 |
| EST-05 | Cadastro de produto (CRUD completo) | P1 | 01 |
| EST-06 | Alerta de estoque mínimo (broadcast WS) | P2 | 01 |
| EST-07 | Interface React do estoque | P1 | 01 |
| EST-08 | Filtro de produtos críticos (abaixo do mínimo) | P2 | 01 |
| EST-09 | Histórico de movimentos por produto | P2 | 02 |
| EST-10 | Inventário (contagem física + ajuste em lote) | P3 | 02 |
| EST-11 | Códigos de barras múltiplos por produto | P3 | 02 |

---

## Módulo Compras / Adm

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| CMP-01 | CRUD de fornecedores | P1 | 01 |
| CMP-02 | Criar e editar ordem de compra | P1 | 01 |
| CMP-03 | Registrar recebimento de mercadoria | P1 | 01 |
| CMP-04 | Interface React de compras | P1 | 01 |
| CMP-05 | Vinculação automática entrada estoque ← recebimento | P1 | 01 |
| CMP-06 | Relatório de gastos por fornecedor e período | P2 | 02 |
| CMP-07 | Sugestão automática de compra (produtos críticos) | P2 | 02 |

---

## Dashboard / Relatórios

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| DSH-01 | KPIs do dia (faturamento, ticket médio, qtd vendas) | P1 | 01 |
| DSH-02 | Card de produtos críticos | P1 | 01 |
| DSH-03 | Últimas vendas (mini-lista) | P2 | 01 |
| DSH-04 | Gráfico de vendas por hora/dia | P2 | 02 |
| DSH-05 | Relatório de produtos mais vendidos | P2 | 02 |
| DSH-06 | Exportação de relatórios (CSV / PDF) | P3 | 02 |

---

## Módulo Cozinha / Fabricação

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| COZ-01 | Flag `requer_producao` no produto | P2 | 02 |
| COZ-02 | Tabela pedido_producao + item_pedido_producao | P2 | 02 |
| COZ-03 | Endpoints de fila de produção | P2 | 02 |
| COZ-04 | Interface KDS (tela de cozinha) | P2 | 02 |
| COZ-05 | Alerta sonoro para novo pedido | P2 | 02 |
| COZ-06 | Timer visual por pedido + destaque vermelho | P3 | 02 |

---

## Multi-dispositivo / LAN

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| LAN-01 | Configuração de dispositivo (Hub / secundário) | P1 | 01 |
| LAN-02 | Autenticação de módulo secundário no Hub | P1 | 01 |
| LAN-03 | mDNS discovery automático | P2 | 02 |
| LAN-04 | Config manual de IP do Hub (fallback) | P2 | 01 |
| LAN-05 | Banner "Hub desconectado" em módulos secundários | P2 | 02 |

---

## Android / Mobile

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| AND-01 | PWA (Progressive Web App) para tablets Android | P3 | 03 |
| AND-02 | Leitor de código de barras via câmera | P3 | 03 |
| AND-03 | Interface otimizada para touch (tela 10") | P3 | 03 |
