# Sprint 03 — Expansão

**Objetivo:** Autenticação real, suporte a outros perfis de negócio e primeiras integrações externas.
**Perfil de negócio alvo:** Restaurante / bar + distribuidora multi-caixa com autenticação.
**Critério de entrada:** Sprint 02 concluída + pelo menos 1 cliente real em produção com Sprint 02.

> Este arquivo é um **outline** — tasks serão detalhadas ao abrir a sprint.

---

## Critérios de conclusão (DoD — rascunho)

- [ ] Operadores fazem login com usuário e senha — sem acesso sem autenticação
- [ ] Middleware valida permissões por rota conforme perfil (operador / supervisor / admin)
- [ ] Tablet Android funciona como caixa secundário via PWA ou WebView
- [ ] PIX gera QR Code automático e confirma pagamento via webhook
- [ ] Cozinha/KDS funciona em segundo monitor ou tablet dedicado *(se não feito na Sprint 02)*
- [ ] Tela de Configurações permite parametrizar empresa, descontos e alertas
- [ ] Painel DEV permite gerar tokens de renovação para qualquer instalação

---

## Módulos previstos

### Autenticação (AUTH)

- **AUTH-01** — Tela de login: formulário usuário + senha com feedback de erro; sem acesso a nenhuma rota sem sessão válida
- **AUTH-02** — Sessão JWT: token assinado com secret local; expiração 8h (turno de trabalho); refresh automático
- **AUTH-03** — Middleware de permissão: cada rota declara perfil mínimo; retorna 403 com mensagem clara ao violar

### Configurações (CFG)

- **CFG-01** — Dados da empresa: nome fantasia, razão social, CNPJ, endereço, logo (base64 armazenado); exibidos no recibo
- **CFG-02** — Gestão de usuários: CRUD completo (criar, editar, desativar, reset de senha); vinculação a perfil
- **CFG-03** — Parâmetros do PDV: desconto máximo por perfil, permitir estoque negativo (on/off), timeout de sessão, campo obrigatório de cliente no fiado

### Android / PWA (AND)

- **AND-01** — PWA: `manifest.json` + service worker básico; instalável em tablet Android 10"; ícone ATHENAS na home
- **AND-02** — Leitor de câmera: API `getUserMedia` + biblioteca de decodificação de código de barras (ZXing ou QuaggaJS) como alternativa ao scanner USB
- **AND-03** — Interface touch: botões maiores (min 48px), gestos de swipe no carrinho, teclado numérico na tela para quantidade e preço

### PIX Automático (LIC)

- **PIX-01** — Geração de QR Code: integração com API de cobrança (Efí / Mercado Pago / Sicoob); exibir QR + código copia-e-cola no modal de pagamento
- **PIX-02** — Webhook de confirmação: endpoint `POST /api/pix/webhook`; valida assinatura; confirma pagamento automaticamente na venda; toast no PDV
- **PIX-03** — Configuração de chave PIX: tela de configuração para inserir credenciais da API do banco/PSP

### TEF / Maquininha (PDV)

- **PDV-11** — Integração TEF: SDK da maquininha (Stone, PagSeguro, Cielo); captura automática do valor; retorno de aprovação/negação; sem necessidade de digitar manualmente

### Perfil Serviços

- **SVC-01** — Flag de negócio: `tipo_negocio = 'servico'` nas configurações; habilita módulo OS, oculta controle de estoque físico
- **SVC-02** — Ordem de serviço: tabela `ordem_servico` (cliente, equipamento, defeito, valor, status); fluxo: aberto → em_andamento → concluído → entregue
- **SVC-03** — Interface OS: tela de listagem + modal de abertura/edição

### Painel DEV Web (LIC)

- **LIC-07** — Painel web: aplicação separada (ou rota restrita); lista instalações; gera token HMAC para renovação; visualiza histórico de renovações por cliente

### Infraestrutura

- **INF-09** — Modo offline secundário: fila local em `localStorage` + SQLite lite no secundário; sincroniza ao reconectar com Hub; evita perda de vendas em queda de rede
- **INF-10** — Sync nuvem opcional: delta sync (apenas registros novos/alterados) com servidor remoto configurável; útil para backup remoto e acesso a relatórios fora da loja

### Produto (catálogo)

- **PRD-02** — Histórico de alterações de preço: `audit_log` registra `alteracao_preco` com valor anterior, novo valor e usuário; visível na tela de produto

---

## Fora do escopo desta Sprint

- Emissão NF-e / NFC-e / SAT (Sprint 04)
- Multi-tenant / SaaS (Sprint 04)
- Integração contábil (Sprint 04)
- App Store / instalador assinado (Sprint 04)
- Variações de produto / grade (Sprint 04)
