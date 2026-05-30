# Módulo PDV / Caixa

## Responsabilidade

Frente de caixa — registro de vendas, fechamento, recibo e formas de pagamento.
Pode rodar no PC Principal (Hub) ou em PC secundário (50 AthenCoins).

---

## Fluxo principal — Venda

```
1. Operador abre nova venda
2. Adiciona itens:
   a. Leitura de código de barras → busca produto
   b. Busca por nome (autocomplete)
   c. Ajuste de quantidade
3. Aplica desconto (opcional, por item ou total)
4. Seleciona forma de pagamento:
   - Dinheiro → informa valor recebido → sistema calcula troco
   - PIX → exibe QR Code / chave → confirma manualmente
   - Crédito / Débito → registra (sem integração TEF no MVP)
   - Misto → divide entre formas
5. Fecha venda:
   - INSERT venda + itens (transação SQLite)
   - UPDATE movimento_estoque (saída automática)
   - Gera recibo não-fiscal
6. Imprime ou exibe recibo (PDF / impressão térmica futura)
```

---

## Fluxo — Cancelamento de venda

```
1. Operador busca venda pelo número
2. Confirma cancelamento (requer senha de supervisor no futuro)
3. Sistema:
   - UPDATE venda.status = 'cancelada'
   - INSERT movimento_estoque (entrada de estorno para cada item)
4. Recibo de cancelamento gerado
```

---

## Regras de negócio

- Venda só pode ser cancelada no mesmo dia (após fechamento de caixa, requer adm)
- Desconto máximo por venda: configurável pelo adm (padrão: 20%)
- Desconto por item: permitido apenas para perfil `supervisor` ou `admin`
- Produto sem saldo em estoque: exibe alerta mas **permite** a venda (distribuidora pode vender com entrega futura) — configurável
- Venda não pode ser fechada com total = 0 (salvo cancelamento)
- Troco é calculado automaticamente quando a soma dos pagamentos excede o total; válido para qualquer combinação que inclua dinheiro
- Pagamento múltiplo (split): o campo `pagamentos` permite combinar N formas na mesma venda desde que a soma cubra o total

---

## Formas de pagamento (MVP)

| Forma | Comportamento |
|-------|---------------|
| Dinheiro | Calcula troco automaticamente |
| PIX | Exibe chave/QR, confirma manualmente pelo operador |
| Crédito | Registra, sem integração com maquininha (Sprint 3+) |
| Débito | Idem crédito |
| Misto | Permite split entre qualquer combinação |
| Split | N pagamentos via `pagamentos: [{forma, valor}]` — soma deve cobrir o total |
| Fiado | Sprint 02 — requer cadastro de cliente |

---

## Multi-pagamento (Split Payment)

O operador pode registrar uma venda com **N formas de pagamento distintas**, desde que a soma cubra o total. Isso é comum em distribuidoras e bares onde o cliente paga parte em dinheiro e parte em PIX, ou usa dois cartões de débito diferentes.

### Fluxo no PDV

1. Operador clica **Finalizar venda**
2. No modal de pagamento, escolhe a forma + valor → **Adicionar**
3. Repete para cada parcela adicional
4. Quando `Pago ≥ Total`, o botão **Confirmar pagamento** é habilitado
5. O troco (se houver) é calculado automaticamente: `troco = Pago − Total`

### Cenários típicos

| Exemplo | Entradas |
|---------|----------|
| Dinheiro + Pix | `{dinheiro, 50}` + `{pix, 32,50}` |
| 2× Débito (cartões diferentes) | `{debito, 30}` + `{debito, 30}` |
| Crédito + troco em dinheiro | `{credito, 80}` + `{dinheiro, 20}` → troco calculado |
| Pagamento simples (fluxo normal) | `{pix, 45,50}` — comportamento idêntico ao anterior |

### Contrato da API

```
POST /api/venda
  pagamentos: [{ forma: 'pix'|'credit'|'debit'|'cash', valor: number }]
```

Quando `pagamentos` é enviado, o campo `forma_pagto` no banco recebe:
- A forma única, se só houver 1 entrada
- `'multiplo'`, se houver mais de 1

O campo `pagamentos` (coluna TEXT) armazena o array completo em JSON para rastreabilidade.

### Compatibilidade retroativa

O campo `forma_pagto` (string simples) ainda é aceito para integrações legadas ou terminais secundários que não implementem o array. Os dois formatos coexistem.

---

## Recibo não-fiscal

Campos obrigatórios no recibo:
- Nome / fantasia do estabelecimento
- Data e hora
- Número da venda
- Lista de itens (produto, qtd, preço unit, total)
- Subtotal, desconto, total
- Forma de pagamento + troco (se dinheiro)
- Rodapé: "Documento não fiscal — obrigado pela preferência"

Formatos: exibição na tela (MVP) → impressão térmica 80mm (Sprint 02) → PDF (Sprint 02)

---

## Interface (telas)

| Tela | Descrição |
|------|-----------|
| Frente de caixa | Grade de produtos + carrinho lateral + teclado numérico |
| Busca de produto | Campo de texto com autocomplete por nome ou código |
| Pagamento | Modal com formas de pagamento e campos de valor |
| Recibo | Tela de confirmação após fechamento com botão imprimir |
| Histórico do dia | Lista de vendas da sessão atual |

---

## Permissões por perfil

| Ação | operador | supervisor | admin |
|------|----------|------------|-------|
| Abrir venda | ✓ | ✓ | ✓ |
| Fechar venda | ✓ | ✓ | ✓ |
| Aplicar desconto por item | — | ✓ | ✓ |
| Cancelar venda do dia | — | ✓ | ✓ |
| Cancelar venda de dia anterior | — | — | ✓ |
| Ver histórico completo | — | ✓ | ✓ |

---

## Endpoints API (Hub)

```
POST   /api/venda              → abrir + fechar venda
GET    /api/venda/:id          → consultar venda
POST   /api/venda/:id/cancelar → cancelar venda
GET    /api/venda/dia          → vendas do dia atual
GET    /api/produto/busca?q=   → busca por nome ou código
```
