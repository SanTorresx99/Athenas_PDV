# ATHENAS PDV

Sistema SaaS ERP-PDV de baixo custo computacional para pequenos negócios locais — restaurantes, distribuidoras, bares, mercadinhos, drogarias, brechós e similares.

## Visão geral

- **Local-first:** funciona sem internet, dados ficam na máquina do cliente
- **Multi-módulo:** um PC principal + módulos secundários por função (caixa, estoque, cozinha)
- **Baixo custo:** roda em hardware modesto, instalação simples, sem mensalidade em nuvem obrigatória
- **SaaS controlado:** sistema de créditos (AthenCoins) gerenciado pelo dev/implementador

## Stack

| Camada | Tecnologia |
|--------|------------|
| Backend | Bun + Hono |
| Banco de dados | SQLite (WAL mode) |
| Frontend desktop | React 18 (browser-native, sem build) |
| Comunicação local | HTTP/LAN + mDNS |
| Estilo | CSS Variables + Sora / JetBrains Mono |

## Estrutura do repositório

```
PROJETO_ATHENAS/
├── design/
│   ├── brand/         → identidade visual, SVGs, paletas, componentes React
│   └── mockup/        → protótipo interativo de UI (browser-native)
├── backend/           → servidor Bun + Hono + SQLite
├── docs/              → arquitetura, dados, sync, licença, visual
├── modules/           → regras de negócio por módulo
└── sprints/           → backlog e sprints
```

## Como visualizar o protótipo

1. Abrir `PROJETO_ATHENAS/` no VS Code (pasta raiz)
2. Abrir `design/mockup/index.html`
3. Clicar em **Go Live** na barra inferior do VS Code
4. Acessar `http://127.0.0.1:5500/design/mockup/index.html`

## Links rápidos

- [Arquitetura do sistema](docs/ARCHITECTURE.md)
- [Modelo de dados](docs/DATA_MODEL.md)
- [Sistema de licença / AthenCoins](docs/LICENSE_SYSTEM.md)
- [Sincronização P2P](docs/SYNC.md)
- [Sistema visual](docs/VISUAL_SYSTEM.md)
- [Roadmap](docs/ROADMAP.md)
- [Como contribuir](docs/CONTRIBUTING.md)
- [Módulo PDV / Caixa](modules/PDV.md)
- [Módulo Estoque](modules/ESTOQUE.md)
- [Módulo Compras / Adm](modules/COMPRAS.md)
- [Módulo Cozinha / Fabricação](modules/COZINHA.md)
- [Backlog](sprints/BACKLOG.md)
- [Sprint 01 — MVP Distribuidora](sprints/SPRINT_01.md)
