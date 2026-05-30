# Arquitetura do Sistema — ATHENAS PDV

## Princípios

1. **Local-first:** toda operação funciona sem internet
2. **Zero infraestrutura obrigatória:** roda em um PC comum sem servidor dedicado
3. **Modular:** cada módulo é independente e pode ser ativado por AthenCoins
4. **Escalável para nuvem:** a mesma base pode sincronizar com host remoto se o cliente tiver

---

## Topologia de implantação

### Configuração mínima (1 máquina)
```
PC Principal
├── Servidor Bun (porta 3000)
├── SQLite (athenas.db)
└── Frontend React (todos os módulos)
```

### Configuração multi-módulo (LAN)
```
PC Principal (Hub)                PC Secundário — Caixa
├── Servidor Bun :3000    ←→     └── Cliente React → /api (PC Hub)
├── SQLite                
└── mDNS: athenas.local   ←→     PC Secundário — Estoque
                                  └── Cliente React → /api (PC Hub)
```

### Configuração com nuvem (opcional)
```
PC Principal ──sync periódico──► VPS / Cloud
                                  └── SQLite replicado
```

---

## Stack técnica

### Backend
- **Runtime:** Bun (startup < 5ms, ~2x menos RAM que Node.js)
- **Framework:** Hono (ultra-leve, ~14kb, alta performance)
- **Banco:** SQLite com WAL mode via `bun:sqlite` nativo
- **Descoberta de rede:** mDNS / Bonjour para localizar o Hub na LAN automaticamente

### Frontend
- **React 18** via CDN (sem build pipeline — abre direto no navegador)
- **Babel Standalone** para JSX no browser
- **CSS Variables** para temas dinâmico (dark/light, accent)
- Fontes: Sora (wordmark/UI), JetBrains Mono (valores técnicos), Manrope (corpo)

### Comunicação entre módulos
- Protocolo: **REST HTTP/JSON** interno (LAN)
- Módulos secundários nunca escrevem direto no SQLite — sempre via API do Hub
- WebSocket para atualizações em tempo real (fila de cozinha, alertas de estoque)

---

## Módulos do sistema

| Módulo | PC | AthenCoins | Descrição |
|--------|-----|------------|-----------|
| Hub / Adm | Principal | 100 | Servidor central, todos os módulos unificados |
| PDV / Caixa | Secundário | 50 | Frente de caixa, fechamento de vendas |
| Estoque | Secundário | 50 | Entradas, saídas, inventário |
| Cozinha / Fabricação | Secundário | 50 | Fila de produção, comandas |
| Compras / Adm | Principal ou secundário | — | Incluído no Hub (100 coins) |

---

## Fluxo de dados principal (venda)

```
Operador (PDV)
  → POST /api/venda  (Hub)
    → INSERT venda + itens (SQLite)
    → UPDATE saldo estoque
    → WebSocket broadcast → Cozinha (se pedido)
    → Retorna recibo
```

---

## Estrutura de pastas do backend (a implementar)

```
backend/
├── src/
│   ├── index.ts          → servidor Hono, roteamento principal
│   ├── db/
│   │   ├── schema.ts     → definição das tabelas SQLite
│   │   ├── seed.ts       → dados iniciais
│   │   └── migrations/   → versionamento do schema
│   ├── routes/
│   │   ├── venda.ts
│   │   ├── produto.ts
│   │   ├── estoque.ts
│   │   ├── compras.ts
│   │   └── licenca.ts
│   ├── sync/
│   │   ├── mdns.ts       → descoberta de dispositivos na LAN
│   │   └── replicator.ts → sincronização hub ↔ secundários
│   └── license/
│       └── coins.ts      → validação e controle de AthenCoins
├── athenas.db            → banco SQLite (gerado em runtime)
├── package.json
└── bunfig.toml
```
