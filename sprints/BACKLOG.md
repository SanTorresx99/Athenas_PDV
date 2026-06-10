# Backlog — ATHENAS PDV

Prioridade: P1 (crítico MVP) → P2 (importante) → P3 (desejável) → P4 (futuro)

---

## Infraestrutura / Backend

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| INF-01 | Setup projeto Bun + Hono + TypeScript | P1 | 01 ✅ |
| INF-02 | Schema SQLite inicial (produto, venda, estoque, usuario, licenca) | P1 | 01 ✅ |
| INF-03 | Script de migrations com versionamento | P1 | 01 ✅ |
| INF-04 | Seed de dados para desenvolvimento | P1 | 01 ✅ |
| INF-05 | Middleware de autenticação (token de instalação) | P1 | 01 ✅ |
| INF-06 | Logger de requisições (arquivo local rotativo) | P2 | 01 ✅ |
| INF-07 | Descoberta mDNS (anúncio do Hub na LAN) | P2 | 02 |
| INF-08 | WebSocket server (Hono WS) | P2 | 02 |
| INF-09 | Modo offline do módulo secundário (fila local) | P3 | 03 |
| INF-10 | Sync com nuvem opcional (delta + retry) | P3 | 03 |
| INF-11 | Backup automático diário (VACUUM INTO + SQL dump) | P2 | 02 |

---

## Sistema de Licença (AthenCoins)

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| LIC-01 | Tabela `licenca` e lógica de decremento diário | P1 | 01 ✅ |
| LIC-02 | Validação de AthenCoins por módulo no startup | P1 | 01 ✅ |
| LIC-03 | Geração e validação de token HMAC (renovação offline) | P1 | 01 ✅ |
| LIC-04 | Banner de notificação em todos os módulos (7, 3, 0 dias) | P1 | 01 ✅ |
| LIC-05 | Modo suspenso (somente leitura após vencimento) | P1 | 01 ✅ |
| LIC-06 | Fluxo de renovação via PIX (QR Code + webhook) | P3 | 03 |
| LIC-07 | Painel DEV web (gestão de clientes e tokens) | P3 | 03 |

---

## Módulo PDV / Caixa

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| PDV-01 | Endpoint POST /api/venda (abrir + fechar) | P1 | 01 ✅ |
| PDV-02 | Busca de produto por código e nome | P1 | 01 ✅ |
| PDV-03 | Cálculo de troco, formas de pagamento e split payment | P1 | 01 ✅ |
| PDV-04 | Cancelamento de venda (com estorno de estoque) | P1 | 01 ✅ |
| PDV-05 | Geração de recibo não-fiscal (exibição na tela) | P1 | 01 ✅ |
| PDV-06 | Interface React do caixa | P1 | 01 ✅ |
| PDV-07 | Histórico de vendas do dia com paginação e reimpressão | P2 | 01 ✅ |
| PDV-12 | Abertura de caixa com fundo de troco | P1 | 01 ✅ |
| PDV-13 | Fechamento de caixa com acerto (contagem física vs. esperado) | P1 | 01 ✅ |
| PDV-14 | Sangria (retirada de numerário durante o turno) | P1 | 01 ✅ |
| PDV-15 | Desconto por item no PDV (campo inline no carrinho) | P2 | 01 ✅ |
| PDV-16 | Suporte a leitor de código de barras (Enter com código exato) | P2 | 01 ✅ |
| PDV-08 | Impressão térmica 80mm | P2 | 02 |
| PDV-09 | Geração de PDF do recibo | P2 | 02 |
| PDV-10 | Controle de fiado (requer CLI-01) | P2 | 02 |
| PDV-11 | Integração TEF (maquininha física) | P4 | 03 |

---

## Módulo Estoque

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| EST-01 | Endpoint GET /api/estoque (saldos calculados) | P1 | 01 ✅ |
| EST-02 | Endpoint POST /api/estoque/entrada | P1 | 01 ✅ |
| EST-03 | Endpoint POST /api/estoque/ajuste | P1 | 01 ✅ |
| EST-04 | Baixa automática de estoque ao fechar venda | P1 | 01 ✅ |
| EST-05 | Cadastro de produto (CRUD completo) | P1 | 01 ✅ |
| EST-06 | Alerta de estoque mínimo | P2 | 01 ✅ |
| EST-07 | Interface React do estoque | P1 | 01 ✅ |
| EST-08 | Filtro de produtos críticos (abaixo do mínimo) | P2 | 01 ✅ |
| EST-09 | Histórico de movimentos por produto | P2 | 02 |
| EST-10 | Inventário (contagem física + ajuste em lote) | P2 | 02 |
| EST-11 | Códigos de barras múltiplos por produto | P3 | 02 |

---

## Módulo Compras / Adm

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| CMP-01 | CRUD de fornecedores | P1 | 01 ✅ |
| CMP-02 | Criar e editar ordem de compra | P1 | 01 ✅ |
| CMP-03 | Registrar recebimento de mercadoria | P1 | 01 ✅ |
| CMP-04 | Interface React de compras | P1 | 01 ✅ |
| CMP-05 | Vinculação automática entrada estoque ← recebimento | P1 | 01 ✅ |
| CMP-06 | Relatório de gastos por fornecedor e período | P2 | 02 |
| CMP-07 | Sugestão automática de compra (produtos críticos) | P2 | 02 |

---

## Dashboard / Relatórios

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| DSH-01 | KPIs do dia (faturamento, ticket médio, qtd vendas) | P1 | 01 ✅ |
| DSH-02 | Card de produtos críticos | P1 | 01 ✅ |
| DSH-03 | Últimas vendas (mini-lista) | P2 | 01 ✅ |
| DSH-04 | Gráfico de vendas por hora/dia | P2 | 02 |
| DSH-05 | Relatório de produtos mais vendidos | P2 | 02 |
| DSH-06 | Exportação de relatórios (CSV) | P2 | 02 |

---

## Módulo Clientes (novo)

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| CLI-01 | Cadastro de clientes (nome, CPF/CNPJ, telefone, endereço, limite fiado) | P2 | 02 |
| CLI-02 | Tabela `conta_corrente` e cálculo de saldo devedor | P2 | 02 |
| CLI-03 | Registro de pagamento de fiado (POST /api/cliente/:id/pagar) | P2 | 02 |
| CLI-04 | Interface React do módulo Clientes | P2 | 02 |
| CLI-05 | Integração PDV: vincular venda a cliente via fiado | P2 | 02 |
| CLI-06 | Relatório de inadimplência (saldo devedor por cliente) | P3 | 03 |

---

## Módulo Cozinha / KDS

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| COZ-01 | Flag `requer_producao` no produto | P2 | 02 |
| COZ-02 | Tabela pedido_producao + item_pedido_producao (migration 003) | P2 | 02 |
| COZ-03 | Endpoints de fila de produção | P2 | 02 |
| COZ-04 | Interface KDS (tela de cozinha) | P2 | 02 |
| COZ-05 | Alerta sonoro para novo pedido (AudioContext + WS) | P2 | 02 |
| COZ-06 | Timer visual por pedido + destaque vermelho > 10min | P3 | 02 |

---

## Multi-dispositivo / LAN

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| LAN-01 | Configuração de dispositivo (Hub / secundário) + token de pareamento | P1 | 02 |
| LAN-02 | Autenticação de módulo secundário no Hub | P1 | 02 |
| LAN-03 | mDNS discovery automático | P2 | 02 |
| LAN-04 | Config manual de IP do Hub (fallback) | P2 | 02 |
| LAN-05 | Banner "Hub desconectado" em módulos secundários | P2 | 02 |

---

## Autenticação de Usuários (novo)

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| AUTH-01 | Tela de login (usuário + senha) | P1 | 03 |
| AUTH-02 | Sessão JWT (token local, expiração 8h, refresh automático) | P1 | 03 |
| AUTH-03 | Middleware de permissão por rota conforme perfil | P1 | 03 |

---

## Configurações do Sistema (novo)

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| CFG-01 | Dados da empresa (nome, CNPJ, logo — exibidos no recibo) | P2 | 03 |
| CFG-02 | Gestão de usuários e perfis (CRUD + reset senha) | P1 | 03 |
| CFG-03 | Parâmetros do PDV (desconto máximo, estoque negativo, timeout sessão) | P2 | 03 |

---

## Produto / Catálogo (melhorias)

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| PRD-01 | Edição de custo e preço em lote (CSV import/export) | P2 | 02 |
| PRD-02 | Histórico de alterações de preço (auditoria via audit_log) | P3 | 03 |
| PRD-03 | Variações de produto (sabor, tamanho, cor — grade) | P3 | 04 |

---

## Android / Mobile

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| AND-01 | PWA (Progressive Web App) para tablets Android | P3 | 03 |
| AND-02 | Leitor de código de barras via câmera (QuaggaJS / ZXing) | P3 | 03 |
| AND-03 | Interface otimizada para touch (tela 10", botões 48px+) | P3 | 03 |

---

## Integrações Externas

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| PIX-01 | Geração de QR Code PIX (Efí / Mercado Pago / Sicoob) | P2 | 03 |
| PIX-02 | Webhook de confirmação de pagamento PIX | P2 | 03 |
| PIX-03 | Configuração de chave PIX e credenciais de API | P2 | 03 |
| PDV-11 | Integração TEF (maquininha física via SDK) | P4 | 03 |

---

## Perfil Serviços

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| SVC-01 | Flag `tipo_negocio = 'servico'` nas configurações | P3 | 03 |
| SVC-02 | Ordem de serviço (tabela + fluxo: aberto → em_andamento → concluído) | P3 | 03 |
| SVC-03 | Interface React do módulo OS | P3 | 03 |

---

## Plataforma / Sprint 04+

| ID | Tarefa | Prioridade | Sprint |
|----|--------|------------|--------|
| PLT-01 | Emissão NF-e / NFC-e | P2 | 04 |
| PLT-02 | Multi-tenant (isolamento por instalação) | P2 | 04 |
| PLT-03 | Sync nuvem e backup remoto | P3 | 04 |
| PLT-04 | App Store / instalador assinado Windows | P3 | 04 |
| PLT-05 | Integração contábil (exportação SPED / plano de contas) | P3 | 04 |
