# Módulo Estoque

## Responsabilidade

Gestão de inventário — cadastro de produtos, entradas, saídas, saldo atual e alertas de estoque mínimo.
Pode rodar no PC Principal (Hub) ou em PC secundário (50 AthenCoins).

---

## Fluxo principal — Entrada de mercadoria

```
1. Operador acessa Estoque → Nova Entrada
2. Seleciona fornecedor (opcional no MVP)
3. Informa itens:
   - Produto (busca por código ou nome)
   - Quantidade recebida
   - Preço de custo (atualiza preço_custo do produto)
4. Confirma entrada:
   - INSERT movimento_estoque (tipo: 'entrada', origem: 'manual' ou 'compra')
   - Se vinculada a ordem_compra → UPDATE item_ordem_compra.quantidade_recebida
5. Alerta se quantidade recebida ≠ quantidade pedida
```

---

## Fluxo — Saída manual / Ajuste

```
1. Operador acessa Estoque → Ajuste
2. Seleciona produto e tipo:
   - Perda (quebra, vencimento, furto)
   - Ajuste de inventário (acerto de contagem)
   - Transferência (futuro: multi-unidade)
3. Informa quantidade e motivo
4. INSERT movimento_estoque (tipo: 'perda' ou 'ajuste')
```

---

## Cálculo de saldo

Saldo nunca é armazenado como campo direto no produto.
É sempre calculado via query:

```sql
SELECT
  produto_id,
  SUM(CASE WHEN tipo IN ('entrada') THEN quantidade ELSE -quantidade END) AS saldo
FROM movimento_estoque
WHERE produto_id = ?
GROUP BY produto_id;
```

Para performance em produtos com muitos movimentos, uma view materializada ou cache em memória pode ser usado.

---

## Alertas de estoque mínimo

- Ao fechar uma venda, o sistema verifica se `saldo <= produto.estoque_min`
- Se sim: INSERT em tabela `alerta` e broadcast WebSocket para todos os módulos
- Dashboard do Hub exibe card com produtos críticos
- Módulo Compras pode gerar pré-ordem automaticamente para produtos críticos

---

## Inventário (contagem física)

Sprint 02 — fluxo previsto:
1. Operador inicia inventário → sistema congela saldos como referência
2. Operador conta fisicamente e informa quantidades
3. Sistema compara contagem vs saldo calculado
4. Gera ajustes automáticos para diferenças
5. Relatório de divergências para o adm

---

## Regras de negócio

- Saldo não pode ser negativo por padrão (configurável por perfil de negócio)
- Distribuidora pode permitir saldo negativo (venda com entrega futura)
- Preço de custo é atualizado a cada entrada (último custo)
- Unidade de medida por produto: UN, KG, LT, CX, FD (fardo), etc.
- Produto pode ter código de barras múltiplos (aliases) — Sprint 02

---

## Interface (telas)

| Tela | Descrição |
|------|-----------|
| Painel de estoque | Lista de produtos com saldo atual, custo e alertas |
| Entrada de mercadoria | Formulário de lançamento de entrada |
| Histórico de movimentos | Timeline de entradas/saídas por produto |
| Produtos críticos | Filtro de produtos abaixo do estoque mínimo |
| Cadastro de produto | Formulário completo de produto |

---

## Permissões por perfil

| Ação | operador | supervisor | admin |
|------|----------|------------|-------|
| Ver saldos | ✓ | ✓ | ✓ |
| Lançar entrada | — | ✓ | ✓ |
| Ajuste / perda | — | ✓ | ✓ |
| Cadastrar produto | — | ✓ | ✓ |
| Iniciar inventário | — | — | ✓ |

---

## Endpoints API (Hub)

```
GET    /api/estoque                    → saldos de todos os produtos
GET    /api/estoque/:produto_id        → saldo e histórico do produto
POST   /api/estoque/entrada            → lançar entrada de mercadoria
POST   /api/estoque/ajuste             → ajuste manual / perda
GET    /api/produto                    → lista de produtos
POST   /api/produto                    → cadastrar produto
PUT    /api/produto/:id               → editar produto
GET    /api/estoque/criticos           → produtos abaixo do mínimo
```
