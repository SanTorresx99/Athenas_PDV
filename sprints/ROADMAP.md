# Roadmap — ATHENAS PDV

> Visão macro de sprints. Cada sprint tem objetivo único, perfil-alvo e critério claro de entrada e saída.

---

## Visão geral

```
Sprint 01 ✅  MVP Distribuidora
              PDV completo · Estoque · Compras · Dashboard · Licença AthenCoins

Sprint 02 ▶   Operação Real
              LAN multi-dispositivo · Impressão · Backup · Relatórios · Clientes/Fiado

Sprint 03     Expansão
              Auth real · Android/PWA · PIX automático · TEF · Perfil Serviços · KDS

Sprint 04     Plataforma
              SaaS/Cloud · Multi-tenant · NF-e · Sync nuvem · App Store
```

---

## Sprint 01 — MVP Distribuidora ✅

**Objetivo:** Sistema funcional para distribuidora real — caixa, estoque e compras.

**Perfil-alvo:** Distribuidora / adega

**Critério de entrada:** Projeto do zero

**Entregues:**
- PDV: abertura/fechamento de caixa, sangria, venda com split payment, desconto por item, cancelamento, recibo na tela, leitor de código de barras
- Estoque: entradas, ajustes, baixa automática, alertas de mínimo
- Compras: CRUD fornecedores, ordens de compra, recebimento vinculado ao estoque
- Dashboard: KPIs do dia, produtos críticos, últimas vendas
- Licença: AthenCoins, banners de aviso, modo suspenso, token HMAC offline

**Critério de saída (DoD):** 9/9 ✅ — ver [SPRINT_01.md](SPRINT_01.md)

---

## Sprint 02 — Operação Real ▶

**Objetivo:** Tornar o ATHENAS apto para entrega ao primeiro cliente real.

**Perfil-alvo:** Distribuidora / adega — aprofundamento

**Critério de entrada:** Sprint 01 concluída + banco de dados limpo em produção

**Escopo:**
- **LAN / Multi-dispositivo:** Hub + caixa secundário na mesma rede, mDNS, config de IP manual
- **Impressão e PDF:** recibo em impressora térmica 80mm, export PDF
- **Backup automático:** VACUUM INTO + SQL dump diário, 2 cópias retidas
- **Relatórios:** gráfico de vendas por hora, top produtos, gastos por fornecedor, export CSV
- **Estoque:** histórico de movimentos por produto, inventário em lote, múltiplos códigos de barras
- **Clientes / Fiado:** cadastro, saldo devedor, registro de pagamento

**Critério de saída (DoD):** ver [SPRINT_02.md](SPRINT_02.md)

---

## Sprint 03 — Expansão

**Objetivo:** Autenticação real, suporte a outros perfis de negócio e integrações externas.

**Perfil-alvo:** Restaurante / bar + distribuidora multi-caixa

**Critério de entrada:** Sprint 02 concluída + pelo menos 1 cliente em produção usando Sprint 02

**Escopo previsto:**
- **Auth real:** tela de login, JWT, middleware de permissão por rota, gestão de usuários
- **Configurações:** parâmetros da empresa, desconto máximo por perfil, comportamentos do PDV
- **Android / PWA:** tablet Android como caixa secundário, leitor de câmera
- **PIX automático:** geração de QR + webhook de confirmação de pagamento
- **TEF / maquininha:** integração com SDK de maquininha física (PDV-11)
- **Perfil Serviços:** ordens de serviço, sem controle de estoque físico
- **Cozinha / KDS:** fila de produção, tela KDS, alertas sonoros *(se não feito na Sprint 02)*
- **Painel DEV web:** gestão de instalações, geração de tokens, renovações (LIC-07)
- **Modo offline secundário:** fila local no dispositivo + sync ao reconectar (INF-09)
- **Histórico de preços:** auditoria de alterações de preço/custo (PRD-02)

**Critério de saída:** Auth funcionando, pelo menos 1 integração externa (PIX ou TEF), perfil Serviços operacional

---

## Sprint 04 — Plataforma

**Objetivo:** Transformar o ATHENAS em plataforma SaaS multi-tenant.

**Perfil-alvo:** Revendedores / implementadores / franquias

**Critério de entrada:** Sprint 03 concluída + produto validado com ≥ 3 clientes pagantes

**Escopo previsto:**
- **Sync nuvem opcional:** delta sync com servidor remoto, rollback
- **Multi-tenant:** isolamento por instalação, painel de gestão SaaS
- **Emissão fiscal:** NF-e, NFC-e, SAT/MFE
- **App Store:** distribuição via loja (Windows Store, instalador assinado)
- **Multi-implementador:** HMAC secrets isolados por parceiro, white-label
- **Relatórios avançados:** BI básico, exportação Excel, comparativo entre períodos
- **Integração contábil:** exportação para sistemas contábeis (SPED, plano de contas)

---

## Princípios do roadmap

1. **Local-first sempre** — nenhuma funcionalidade core exige internet
2. **Uma sprint, um perfil de negócio** — foco evita escopo inflado
3. **DoD antes de avançar** — não abre Sprint N+1 sem fechar Sprint N
4. **Feedback de cliente real é gate** — Sprint 03+ só começa com usuário real em produção
