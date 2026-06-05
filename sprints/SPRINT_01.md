# Sprint 01 — MVP Distribuidora

**Objetivo:** sistema funcional para uma distribuidora real com caixa, estoque e compras.
**Perfil de negócio:** distribuidora / adega
**Módulos:** Hub (PC principal) + 1 caixa secundário (opcional)

---

## Critérios de conclusão (Definition of Done)

- [x] Operador consegue fechar uma venda completa do início ao fim
- [x] Estoque baixa automaticamente ao fechar a venda
- [x] Entrada de mercadoria atualiza o estoque
- [x] Ordem de compra pode ser criada e recebida
- [x] Recibo não-fiscal é exibido na tela
- [x] Sistema bloqueia ao vencer a licença (modo suspenso)
- [x] Banner de aviso aparece com 7 dias de antecedência
- [x] Token DEV de renovação funciona offline
- [x] Dashboard exibe faturamento do dia e produtos críticos
- [ ] PC secundário (caixa) consegue vender via API do Hub *(Sprint 02 — LAN)*

---

## Tasks da Sprint

### Infraestrutura
- [x] INF-01 — Setup projeto Bun + Hono + TypeScript
- [x] INF-02 — Schema SQLite inicial
- [x] INF-03 — Sistema de migrations
- [x] INF-04 — Seed de dados para dev
- [x] INF-05 — Middleware de autenticação
- [x] INF-06 — Logger de requisições
- [ ] LAN-01 — Configuração Hub / secundário *(Sprint 02)*
- [ ] LAN-02 — Autenticação de módulo secundário *(Sprint 02)*
- [ ] LAN-04 — Config manual de IP do Hub *(Sprint 02)*

### Licença
- [x] LIC-01 — Tabela licenca + decremento diário
- [x] LIC-02 — Validação de AthenCoins no startup
- [x] LIC-03 — Token HMAC (geração + validação)
- [x] LIC-04 — Banners de aviso (7, 3, 0 dias)
- [x] LIC-05 — Modo suspenso

### PDV / Caixa
- [x] PDV-01 — POST /api/venda
- [x] PDV-02 — Busca de produto
- [x] PDV-03 — Formas de pagamento + troco
- [x] PDV-04 — Cancelamento de venda
- [x] PDV-05 — Recibo não-fiscal (tela)
- [x] PDV-06 — Interface React do caixa — conectada ao backend
- [x] PDV-07 — Histórico de vendas do dia (mini-lista no sidebar do PDV)
- [x] PDV-12 — Abertura de caixa com fundo de troco
- [x] PDV-13 — Fechamento de caixa com acerto (contagem física vs. esperado)
- [x] PDV-14 — Sangria (retirada de numerário durante o turno)
- [x] PDV-15 — Desconto por item no PDV (campo inline no carrinho)
- [x] PDV-16 — Suporte a leitor de código de barras (Enter com código exato)

### Estoque
- [x] EST-01 — GET /api/estoque
- [x] EST-02 — POST /api/estoque/entrada
- [x] EST-03 — POST /api/estoque/ajuste
- [x] EST-04 — Baixa automática ao fechar venda
- [x] EST-05 — CRUD de produto
- [x] EST-06 — Alerta de estoque mínimo
- [x] EST-07 — Interface React do estoque — catálogo conectado ao backend
- [x] EST-08 — Filtro de produtos críticos

### Compras / Adm
- [x] CMP-01 — CRUD de fornecedores
- [x] CMP-02 — Criar / editar ordem de compra
- [x] CMP-03 — Registrar recebimento
- [x] CMP-04 — Interface React de compras
- [x] CMP-05 — Vinculação recebimento → estoque

### Dashboard
- [x] DSH-01 — KPIs do dia
- [x] DSH-02 — Card de produtos críticos
- [x] DSH-03 — Últimas vendas (mini-lista)

---

## Fora do escopo desta Sprint

- Módulo Cozinha/Fabricação (Sprint 02)
- Impressão térmica (Sprint 02)
- Geração de PDF (Sprint 02)
- mDNS discovery automático (Sprint 02)
- Relatórios avançados (Sprint 02)
- Fiado / cadastro de clientes (Sprint 02)
- Integração PIX automática (Sprint 03)
- Android / PWA (Sprint 03)
- Emissão fiscal / NF-e (Sprint 03+)

---

## Ambiente de desenvolvimento

```
PC de desenvolvimento: Windows
Runtime: Bun >= 1.1.0
Porta do Hub: 3001
SQLite: backend/athenas.db (gitignored)
Frontend: design/mockup/ (Live Server porta 5500)
```

## Dados de seed (distribuidora)

Categorias: Bebidas, Destilados, Cervejas, Águas, Sucos, Snacks, Outros

Produtos iniciais para teste:
- Cerveja Lata 350ml (UN, R$4,50)
- Cerveja Long Neck 600ml (UN, R$7,00)
- Vodka 1L (UN, R$35,00)
- Água Mineral 500ml (UN, R$2,00)
- Refrigerante 2L (UN, R$7,50)

Usuário admin padrão: `admin / athenas@123` (trocar no primeiro login)
