# Sprint 02 — Operação Real

**Objetivo:** Tornar o ATHENAS apto para entrega ao primeiro cliente real.
**Perfil de negócio:** Distribuidora / adega — aprofundamento da Sprint 01.
**Módulos:** Hub (PC principal) + 1 caixa secundário via LAN.

---

## Critérios de conclusão (Definition of Done)

- [ ] Caixa secundário consegue vender via API do Hub na mesma rede LAN
- [ ] Recibo pode ser impresso em impressora térmica 80mm sem formatação quebrada
- [ ] Recibo pode ser exportado como PDF e compartilhado (WhatsApp / email)
- [ ] Backup automático diário roda sem intervenção do operador
- [ ] Operador vê histórico completo de movimentos de cada produto
- [ ] Dashboard exibe gráfico de vendas por hora do dia atual
- [ ] Relatório de gastos por fornecedor é exportável em CSV
- [ ] Cadastro de clientes permite registrar fiado e consultar saldo devedor

---

## Tasks da Sprint

### Infraestrutura / LAN

- [ ] LAN-01 — Configuração de dispositivo: tela de setup Hub vs. secundário; token de pareamento gerado no Hub e inserido no secundário
- [ ] LAN-02 — Autenticação de módulo secundário no Hub: header `x-device-token` validado por middleware; token registrado na tabela `dispositivo`
- [ ] LAN-04 — Config manual de IP do Hub: variável de ambiente `HUB_URL` + tela de configuração no frontend para digitação de IP quando mDNS falha
- [ ] LAN-05 — Banner "Hub desconectado": componente permanente no topo de módulos secundários quando o ping ao Hub falha (polling a cada 10s)
- [ ] INF-07 — mDNS discovery automático: anunciar Hub na LAN com serviço `_athenas._tcp` usando `mdns` ou `bonjour`; secundário descobre automaticamente
- [ ] INF-08 — WebSocket server: adicionar Hono WS ao backend; eventos: `estoque_critico`, `nova_venda`, `cancelamento`; usado por Dashboard e KDS
- [ ] INF-11 — Backup automático diário: job cron ao fechar caixa ou às 03h00; `VACUUM INTO athenas_YYYY-MM-DD.db`; manter apenas 2 arquivos mais recentes; log de confirmação

### PDV / Caixa

- [ ] PDV-08 — Impressão térmica 80mm: CSS `@media print` com largura 80mm, fonte 11px, sem cores, recibo colapsado em coluna única; botão "Imprimir" no ReceiptModal
- [ ] PDV-09 — PDF do recibo: integrar `html2pdf.js` ou `print-js`; botão "Salvar PDF" gera arquivo `recibo-V0001.pdf`; compartilhável via WhatsApp Web
- [ ] PDV-10 — Controle de fiado: ao finalizar venda, operador pode selecionar cliente e forma "fiado"; requer CLI-01 concluído; cria registro em `conta_corrente`

### Estoque

- [ ] EST-09 — Histórico de movimentos por produto: modal/drawer com timeline de entradas, saídas, ajustes e perdas; filtrável por tipo e período; paginado
- [ ] EST-10 — Inventário em lote: congelar saldos como referência → operador digita contagem física → sistema calcula diferença → gera ajustes em lote com aprovação de admin
- [ ] EST-11 — Múltiplos códigos de barras: tabela `produto_codigo` (produto_id, codigo, tipo); busca por qualquer código alias; CRUD na tela de produto

### Compras / Adm

- [ ] CMP-06 — Relatório de gastos: tela com filtro por fornecedor e período; tabela com total por OC; gráfico de linha mensal; export CSV via `Blob` + `URL.createObjectURL`
- [ ] CMP-07 — Sugestão automática de compra: botão "Gerar sugestões" cria pré-ordens (status `sugerida`) para todos os produtos abaixo do estoque mínimo; admin revisa e converte

### Dashboard / Relatórios

- [ ] DSH-04 — Gráfico de vendas por hora: barras com faturamento por hora do dia atual; comparativo com mesmo dia da semana anterior; usando `<canvas>` + Chart.js leve
- [ ] DSH-05 — Top produtos: tabela com os 10 mais vendidos no período selecionado (hoje / 7d / 30d); colunas: produto, qtd vendida, faturamento, % do total
- [ ] DSH-06 — Export CSV: botão em cada relatório (top produtos, gastos fornecedor); gera CSV com cabeçalho em PT-BR via `Blob`

### Módulo Produto — CME, Ficha Técnica e Tipos (novo)

- [ ] PRD-04 — Migration: adicionar `tipo`, `custo_medio`, `tempo_preparo_min`, `rendimento_qtd`, `rendimento_un`, `qtd_embalagem` à tabela `produto`
- [ ] PRD-05 — Migration: adicionar `custo_unitario` a `movimento_estoque` e `item_venda`
- [ ] PRD-06 — Migration: criar tabelas `ficha_tecnica` e `recurso_servico`
- [ ] PRD-07 — CME automático: atualizar `POST /api/estoque/entrada` e `POST /api/compras/ordem/:id/receber` para recalcular `produto.custo_medio` pelo PMP a cada entrada; gravar `custo_unitario` no movimento
- [ ] PRD-08 — CMV na venda: atualizar `POST /api/venda` para gravar `item_venda.custo_unitario = produto.custo_medio` no momento do fechamento
- [ ] PRD-09 — Endpoint `GET /api/produto/:id/custo`: retorna CME atual, CMV estimado, margem bruta, markup, histórico de custo (últimas entradas com custo)
- [ ] PRD-10 — CRUD ficha técnica: `POST/PUT/DELETE /api/produto/:id/ficha` — gerenciar insumos do produto fabricado; retornar custo total calculado
- [ ] PRD-11 — CRUD recursos de serviço: `POST/DELETE /api/produto/:id/recurso` — ferramentas, equipamentos, consumíveis
- [ ] PRD-12 — UI: painel de detalhe do produto com dados específicos por tipo (BodyRevenda com CME/margem/markup, BodyFabricado com ficha técnica editável, BodyServico com lista de recursos)
- [ ] PRD-13 — UI: formulário de cadastro/edição de produto com campo `tipo` e seções condicionais por tipo

### Módulo Clientes (novo)

- [ ] CLI-01 — Cadastro de clientes: tabela `cliente` (id, nome, cpf_cnpj, telefone, endereco, limite_fiado, ativo); CRUD completo com validação de CPF/CNPJ
- [ ] CLI-02 — Fiado: tabela `conta_corrente` (id, cliente_id, tipo `compra`/`pagamento`, valor, venda_id, criado_em); saldo = SUM(pagamentos) - SUM(compras)
- [ ] CLI-03 — Pagamento de fiado: `POST /api/cliente/:id/pagar`; registra entrada em `conta_corrente`; exibe recibo de pagamento
- [ ] CLI-04 — Interface React: tela Clientes com lista, busca por nome/CPF, card de saldo devedor, histórico e modal de pagamento
- [ ] CLI-05 — PDV integration: no modal de pagamento, forma "fiado" ativa busca de cliente; vincula venda ao cliente via `cliente_id` em `venda`

### Cozinha / KDS (novo — para negócios com produção)

- [ ] COZ-01 — Flag de produção: `ALTER TABLE produto ADD requer_producao INTEGER DEFAULT 0`; campo no formulário de produto
- [ ] COZ-02 — Schema: migration 003 com tabelas `pedido_producao` e `item_pedido_producao`
- [ ] COZ-03 — Endpoints da fila: `GET /api/fila-producao` (pendentes + em produção); `PUT /api/fila-producao/:id/iniciar|pronto|entregar|cancelar`; criação automática ao fechar venda com itens `requer_producao`
- [ ] COZ-04 — Interface KDS: tela `kds.jsx` com 3 colunas (Pendente / Em Produção / Pronto); modo escuro obrigatório; fonte grande (16px+); timer por pedido; destaque vermelho > 10 min
- [ ] COZ-05 — Alerta sonoro: `AudioContext` toca beep ao receber novo pedido via WebSocket (`nova_venda` com itens de produção)

---

## Fora do escopo desta Sprint

- Tela de login / autenticação de usuário (Sprint 03)
- Integração PIX automática / webhook (Sprint 03)
- Android / PWA / leitor de câmera (Sprint 03)
- Emissão fiscal NF-e / NFC-e (Sprint 04)
- Sync nuvem / modo offline secundário (Sprint 03)
- Relatórios avançados com múltiplos gráficos (Sprint 03)
- Variações de produto / grade (Sprint 04)

---

## Dependências entre tasks

```
INF-08 (WebSocket) ← COZ-05 (alerta sonoro KDS)
INF-08 (WebSocket) ← LAN-05 (banner desconectado)
CLI-01 (tabela cliente) ← CLI-02 (conta_corrente)
CLI-01 ← CLI-03 (pagamento)
CLI-01 ← CLI-04 (UI)
CLI-01 ← CLI-05 (PDV integration)
CLI-05 ← PDV-10 (fiado no PDV)
COZ-02 (schema) ← COZ-03 (endpoints)
COZ-03 ← COZ-04 (UI KDS)
COZ-03 + INF-08 ← COZ-05 (alerta)
LAN-01 ← LAN-02 (auth secundário)
```

---

## Ambiente de desenvolvimento

```
Runtime:       Bun >= 1.1.0
Porta Hub:     3001
Porta frontend: 5500 (python -m http.server ou Live Server)
SQLite:        backend/athenas.db
Migration 003: backend/src/db/migrations/003_clientes_kds.sql
```

## Dados de seed adicionais (Sprint 02)

Clientes de exemplo para teste de fiado:
- João Silva (CPF: 123.456.789-00, limite: R$ 200,00)
- Maria Costa (CPF: 987.654.321-00, limite: R$ 500,00)
