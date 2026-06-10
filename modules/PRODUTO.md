# Módulo Produto / Catálogo

## Responsabilidade

Cadastro e gestão do catálogo de itens comercializáveis: produtos de revenda, fabricados, serviços e itens variáveis. Centraliza os dados de custo, precificação e composição usados por PDV, Estoque, Compras e Cozinha/KDS.

---

## Tipos de produto

O campo `produto.tipo` define o comportamento do item em todo o sistema:

| Tipo | Descrição | Controla estoque | Tem ficha técnica |
|---|---|---|---|
| `revenda` | Comprado de fornecedor para revender | ✅ Sim | ❌ Não |
| `fabricado` | Produzido internamente a partir de insumos | ✅ Sim (produto acabado) | ✅ Sim (BOM) |
| `servico` | Prestação de serviço (mão de obra + tempo) | ❌ Não | ❌ (lista de recursos) |
| `variavel` | Vendido por peso, volume ou medida (pesado na hora) | ✅ Sim | ❌ Não |

> **Reutilização entre perfis de negócio:** os conceitos de CME e CMV se aplicam tanto a `revenda` quanto a `fabricado`. Insumos de um produto fabricado são produtos do tipo `revenda` ou `variavel`, com seu próprio CME. O CMV do fabricado é calculado a partir dos CMEs dos insumos.

---

## Indicadores financeiros por tipo

### CME — Custo Médio do Estoque (Preço Médio Ponderado)

Método de custeio padrão do ATHENAS. O CME é recalculado a cada entrada de estoque usando o Preço Médio Ponderado (PMP):

$$\text{CME}_\text{novo} = \frac{(\text{saldo\_atual} \times \text{CME\_atual}) + (\text{qtd\_entrada} \times \text{custo\_entrada})}{\text{saldo\_atual} + \text{qtd\_entrada}}$$

- Armazenado em `produto.custo_medio` (atualizado em cada `POST /api/estoque/entrada`)
- Registrado em `movimento_estoque.custo_unitario` no momento da movimentação
- Registrado em `item_venda.custo_unitario` no momento da venda (snapshot histórico)

**Aplicação por tipo:**

| Tipo | CME | Quando é calculado |
|---|---|---|
| `revenda` | CME dos itens comprados | Ao registrar recebimento de compra |
| `fabricado` (insumo) | CME da matéria-prima | Ao registrar entrada do insumo |
| `variavel` | CME da unidade de medida base (ex: R$/kg) | Ao registrar entrada |
| `servico` (consumível) | CME do material consumido | Ao registrar entrada do material |

---

### CMV — Custo da Mercadoria Vendida

O CMV representa o custo real do que foi vendido, calculado no momento da venda.

**Revenda e Variável:**
$$\text{CMV} = \text{qtd\_vendida} \times \text{CME\_no\_momento\_da\_venda}$$

**Fabricado:**
$$\text{CMV}_\text{fabricado} = \sum_{\text{insumo}} (\text{qtd\_insumo} \times \text{CME\_insumo})$$
O CMV do produto fabricado é a soma dos custos dos insumos conforme a ficha técnica, usando o CME de cada insumo no momento da produção.

**Serviço:**
$$\text{CMV}_\text{serviço} = \text{custo\_hora} \times \text{horas} + \sum \text{CME\_materiais\_utilizados}$$

---

### Indicadores derivados (calculados, não armazenados)

| Indicador | Fórmula | Aplicável a |
|---|---|---|
| **Margem Bruta** | `(PV − CMV) / PV × 100` | Todos |
| **Markup** | `PV / CMV − 1` | Todos |
| **Lucro Unitário** | `PV − CMV` | Todos |
| **Giro de Estoque** | `CMV_período / CME_médio_período` | Revenda, Variável |
| **Cobertura de Estoque** | `saldo_atual / consumo_médio_diário` | Revenda, Variável, Fabricado |

---

## Estrutura de dados

### Tabela `produto` (campos novos em relação à Sprint 01)

```sql
tipo              TEXT NOT NULL DEFAULT 'revenda',  -- revenda|fabricado|servico|variavel
custo_medio       REAL DEFAULT 0,                   -- CME atual (PMP); atualizado a cada entrada
custo_fixo_servico REAL,                            -- custo/hora ou custo fixo do serviço
tempo_preparo_min INTEGER,                          -- fabricado: tempo médio em minutos
rendimento_qtd    REAL,                             -- fabricado: quantas unidades rende a receita
rendimento_un     TEXT,                             -- fabricado: unidade do rendimento
qtd_embalagem     REAL,                             -- revenda: qtd por embalagem de compra
preco_por_unidade REAL,                             -- revenda: preço calculado por unidade (emb)
```

### Tabela `movimento_estoque` (campo novo)

```sql
custo_unitario    REAL,  -- CME no momento da movimentação (snapshot histórico)
```

### Tabela `item_venda` (campo novo)

```sql
custo_unitario    REAL,  -- CME no momento da venda → base do CMV histórico
```

### Nova tabela `ficha_tecnica` (BOM — Bill of Materials)

Usada por produtos `fabricado`. Cada linha é um insumo da receita.

```sql
CREATE TABLE ficha_tecnica (
  id              TEXT PRIMARY KEY,
  produto_id      TEXT NOT NULL,          -- produto fabricado
  insumo_id       TEXT,                   -- FK produto (NULL se insumo livre)
  insumo_nome     TEXT NOT NULL,          -- nome do insumo (redundante para histórico)
  quantidade      REAL NOT NULL,
  unidade         TEXT NOT NULL DEFAULT 'UN',
  custo_unitario  REAL DEFAULT 0,         -- CME do insumo quando a ficha foi salva
  ordem           INTEGER DEFAULT 0,      -- sequência na receita
  observacao      TEXT,
  FOREIGN KEY (produto_id) REFERENCES produto(id),
  FOREIGN KEY (insumo_id)  REFERENCES produto(id)
);
```

> Exemplo — Pizza Mussarela (rende 1 un, 20 min):
> - Massa de pizza 300g · custo R$ 1,20
> - Molho de tomate 100ml · custo R$ 0,40
> - Mussarela 150g · custo R$ 3,60
> - **CMV total: R$ 5,20** | PV: R$ 35,00 | Margem: 85,1%

> Exemplo — Prateleira MDF (rende 1 un, 45 min):
> - MDF 15mm 1,80m² · CME R$ 48,00
> - Parafusos 12 un · CME R$ 1,80
> - Tinta base água 200ml · CME R$ 6,40
> - **CMV total: R$ 56,20** | PV: R$ 180,00 | Margem: 68,8%

### Nova tabela `recurso_servico`

Ferramentas, equipamentos e materiais necessários para um serviço. Materiais consumíveis têm CME e impactam no CMV do serviço.

```sql
CREATE TABLE recurso_servico (
  id              TEXT PRIMARY KEY,
  produto_id      TEXT NOT NULL,              -- produto do tipo servico
  tipo            TEXT NOT NULL,              -- ferramenta|equipamento|material|consumivel
  nome            TEXT NOT NULL,
  insumo_id       TEXT,                       -- FK produto (quando é consumível cadastrado)
  quantidade      REAL DEFAULT 1,
  unidade         TEXT DEFAULT 'UN',
  obrigatorio     INTEGER DEFAULT 1,          -- 0 = opcional
  observacao      TEXT,
  FOREIGN KEY (produto_id) REFERENCES produto(id),
  FOREIGN KEY (insumo_id)  REFERENCES produto(id)
);
```

> Exemplo — Serviço de Troca de Vidro:
> - ferramentas: cortador de vidro (não consumível), ventosa dupla (não consumível)
> - materiais: silicone neutro 100ml (consumível, tem CME) → impacta CMV
> - equipamentos: esmerilhadeira (não consumível)

---

## Fluxo de atualização do CME

```
Entrada de estoque (POST /api/estoque/entrada)
  ├─ saldo_atual = getSaldoProduto(produto_id)
  ├─ CME_atual   = produto.custo_medio
  ├─ CME_novo    = (saldo_atual × CME_atual + qtd × custo_unit) / (saldo_atual + qtd)
  ├─ UPDATE produto SET custo_medio = CME_novo
  └─ INSERT movimento_estoque (... custo_unitario = custo_unit)

Fechamento de venda (POST /api/venda)
  └─ Para cada item:
       INSERT item_venda (... custo_unitario = produto.custo_medio)  ← snapshot CME

Recebimento de OC (POST /api/compras/ordem/:id/receber)
  └─ Para cada item recebido:
       custo_unit = item_ordem.preco_unit
       → mesmo fluxo de entrada de estoque acima
```

---

## Endpoints

```
GET    /api/produto                    → lista com CME, margem e tipo
GET    /api/produto/:id                → detalhe + ficha técnica (se fabricado) + recursos (se serviço)
POST   /api/produto                    → criar produto (qualquer tipo)
PUT    /api/produto/:id                → editar produto
GET    /api/produto/categorias         → lista de categorias únicas
GET    /api/produto/:id/custo          → breakdown: CME, CMV estimado, margem, histórico de custo
POST   /api/produto/:id/ficha          → salvar/substituir ficha técnica (fabricado)
PUT    /api/produto/:id/ficha/:item_id → editar linha da ficha técnica
DELETE /api/produto/:id/ficha/:item_id → remover linha da ficha técnica
POST   /api/produto/:id/recurso        → adicionar recurso ao serviço
DELETE /api/produto/:id/recurso/:rid   → remover recurso do serviço
```

---

## Regras de negócio

1. **CME nunca negativo:** se o saldo for zero antes de uma entrada, o CME é simplesmente o custo da entrada (não há média a ponderar).
2. **Snapshot imutável:** `item_venda.custo_unitario` e `movimento_estoque.custo_unitario` jamais são alterados após a inserção — representam o custo no exato momento da operação.
3. **Ficha técnica não vincula estoque de insumos:** o vínculo entre ficha e estoque é feito pelo módulo Cozinha/KDS ao baixar insumos na produção. O cadastro da ficha é apenas uma referência de composição.
4. **Produto fabricado pode ter insumos livres:** insumos sem `insumo_id` (campo livre) não afetam o estoque — são apenas informativos no cálculo de custo.
5. **CMV do serviço é estimado:** calculado a partir dos consumíveis (`tipo = 'consumivel'`) da tabela `recurso_servico`, usando o CME de cada um no momento da venda.
6. **Atualização de ficha não retroage:** alterar a ficha técnica de um produto fabricado não altera o custo das vendas já realizadas (imutabilidade histórica).

---

## Permissões por perfil

| Ação | operador | supervisor | admin |
|---|---|---|---|
| Ver catálogo e preços | ✓ | ✓ | ✓ |
| Ver custo (CME/CMV) | — | ✓ | ✓ |
| Criar / editar produto | — | ✓ | ✓ |
| Editar preço de custo | — | — | ✓ |
| Editar ficha técnica | — | ✓ | ✓ |
| Importar planilha | — | — | ✓ |

---

## Interface (telas)

| Tela | Descrição |
|---|---|
| Catálogo | Tabs Comércio / Fabricados / Serviços + KPIs (total, margem média, críticos, fabricados) |
| Lista/Grid | Tabela com tipo, categoria, preço, estoque, margem bruta inline |
| Painel de detalhe | Sidebar direita com dados específicos por tipo |
| Ficha técnica | Editor de BOM: adicionar/remover/reordenar insumos com custo calculado |
| Recursos do serviço | Lista de ferramentas, equipamentos e materiais do serviço |
| Histórico de custo | Gráfico CME ao longo do tempo + tabela de entradas com custo |
