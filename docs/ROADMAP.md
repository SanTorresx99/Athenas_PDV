# Roadmap — ATHENAS PDV

## Fase 1 — MVP Distribuidora (Sprint 01–02)

**Objetivo:** primeiro estabelecimento real usando o sistema.
**Perfil:** distribuidora/adega com caixa, estoque e compras.

### Entregáveis
- [ ] Backend Bun + Hono + SQLite rodando localmente
- [ ] Módulo PDV/Caixa funcional (venda, recibo não-fiscal, formas de pagamento)
- [ ] Módulo Estoque (cadastro de produto, entradas, saldo, alertas)
- [ ] Módulo Compras/Adm (fornecedores, ordens de compra, recebimento)
- [ ] Sistema de AthenCoins / licença local (trial 7 dias, token DEV)
- [ ] Dashboard com KPIs do dia (faturamento, ticket médio, produtos críticos)
- [ ] Multi-dispositivo via LAN (Hub + 1 caixa secundário)

---

## Fase 2 — Estabilização e expansão (Sprint 03–05)

**Objetivo:** produto estável para outros perfis de negócio.

### Entregáveis
- [ ] Módulo Cozinha/Fabricação (comandas, fila de produção)
- [ ] Modo offline do caixa secundário (fila local + sync ao reconectar)
- [ ] Relatórios básicos (vendas por período, produtos mais vendidos, fluxo de estoque)
- [ ] Cadastro de clientes e controle de fiado (crédito simples)
- [ ] Backup automático local (export SQLite + JSON diário)
- [ ] Sync opcional com nuvem (VPS cliente)
- [ ] Suporte a perfis de negócio: restaurante, mercadinho, bar

---

## Fase 3 — SaaS e escala (Sprint 06+)

**Objetivo:** plataforma replicável por múltiplos implementadores.

### Entregáveis
- [ ] Painel central do DEV/implementador (web)
- [ ] Renovação automática de licença via PIX (webhook)
- [ ] App Android para módulos secundários (tablet no caixa/cozinha)
- [ ] NFC-e / SAT fiscal (emissor de nota)
- [ ] TEF (integração com maquininha física)
- [ ] Multi-implementador: cada DEV tem sua chave HMAC própria
- [ ] Painel de métricas para o implementador (todos os clientes ativos, alertas de vencimento)

---

## Decisões técnicas tomadas

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Runtime backend | Bun | Performance, SQLite nativo, baixo consumo |
| Framework HTTP | Hono | Ultra-leve, alta throughput |
| Banco de dados | SQLite WAL | Zero infra, ACID, ótimo para single-node |
| Frontend | React 18 browser-native | Sem build, sem node_modules no cliente |
| Comunicação LAN | REST HTTP + WebSocket | Simples, universal, sem dependências |
| Descoberta de rede | mDNS | Zero configuração manual de IP |
| Licença | AthenCoins + HMAC token | Funciona offline, seguro, simples |
| Fiscal | Sem fiscal no MVP | Reduz complexidade inicial |
| Mobile | Fase 3 (Android) | POC Windows primeiro |
