# Módulo Compras / Administração

## Responsabilidade

Gestão de fornecedores, ordens de compra e recebimento de mercadorias.
Roda no PC Principal (Hub) — incluso nos 100 AthenCoins.

---

## Fluxo principal — Ordem de compra

```
1. Adm acessa Compras → Nova Ordem
2. Seleciona fornecedor
3. Adiciona itens:
   - Produto + quantidade desejada
   - Preço negociado (opcional — pode ser preenchido ao receber)
4. Salva como rascunho ou marca como "enviada ao fornecedor"
5. Ao receber a mercadoria:
   a. Abre a ordem → clica em "Registrar recebimento"
   b. Confere itens e informa quantidade efetivamente recebida
   c. Sistema:
      - INSERT movimento_estoque (entrada) para cada item
      - UPDATE ordem_compra.status = 'recebida'
      - Atualiza preço_custo do produto se informado
6. Divergências (falta, excesso) ficam registradas na ordem
```

---

## Fluxo — Sugestão automática de compra

Sprint 02 — baseado em produtos críticos:
```
1. Sistema identifica produtos com saldo ≤ estoque_min
2. Cria pré-ordem automática (status: 'sugerida')
3. Adm revisa, ajusta quantidades e converte em ordem real
```

---

## Cadastro de fornecedor

Campos:
- Nome / Razão social
- CNPJ ou CPF
- Telefone / WhatsApp
- Email
- Endereço (opcional)
- Nome do contato comercial
- Observações (prazo de pagamento habitual, etc.)

---

## Regras de negócio

- Ordem de compra não movimenta estoque — só o recebimento efetivo faz isso
- Uma ordem pode ser recebida parcialmente (em múltiplas entregas)
- Ordem cancelada não reverte movimentos de estoque já gerados
- Múltiplos fornecedores podem fornecer o mesmo produto (histórico de custo por fornecedor — Sprint 02)
- Preço de custo do produto = último preço recebido (não média ponderada no MVP)

---

## Interface (telas)

| Tela | Descrição |
|------|-----------|
| Lista de ordens | Tabela com status, fornecedor, total e data |
| Nova ordem | Formulário de criação com adição de itens |
| Detalhes da ordem | Itens, status, histórico de recebimentos |
| Recebimento | Modal de confirmação com campo por item |
| Fornecedores | CRUD de cadastro de fornecedores |
| Compras por período | Relatório de gastos (Sprint 02) |

---

## Status de uma ordem de compra

```
rascunho → enviada → [recebimento parcial] → recebida
                   ↘ cancelada
```

---

## Permissões por perfil

| Ação | operador | supervisor | admin |
|------|----------|------------|-------|
| Ver ordens | — | ✓ | ✓ |
| Criar ordem | — | ✓ | ✓ |
| Registrar recebimento | — | ✓ | ✓ |
| Cancelar ordem | — | — | ✓ |
| Cadastrar fornecedor | — | ✓ | ✓ |
| Ver relatório de gastos | — | ✓ | ✓ |

---

## Endpoints API (Hub)

```
GET    /api/ordem-compra               → listar ordens
POST   /api/ordem-compra               → criar ordem
GET    /api/ordem-compra/:id           → detalhes da ordem
PUT    /api/ordem-compra/:id           → editar rascunho
POST   /api/ordem-compra/:id/receber   → registrar recebimento
POST   /api/ordem-compra/:id/cancelar  → cancelar ordem
GET    /api/fornecedor                 → listar fornecedores
POST   /api/fornecedor                 → cadastrar fornecedor
PUT    /api/fornecedor/:id            → editar fornecedor
```
