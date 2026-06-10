# ATHENAS PDV — Banco de Dados, API e Formatações

Este documento especifica a persistência de dados, invariantes do banco de dados SQLite, lógica de casas decimais flexíveis, eventos de auditoria e estrutura das APIs.

---

## 1. Regras de Formatação e Casas Decimais

Para atender às variações de negócios (venda de itens fracionados vs unitários) e manter a consistência financeira:

### Valores Monetários ($)
* **Precisão:** Sempre armazenados como valores reais (`REAL`) com precisão total, mas exibidos na interface e recibos com **exatamente 2 casas decimais**.
* **Formato Visual:** Padrão brasileiro, utilizando ponto `.` como separador de milhares e vírgula `,` para separar os centavos (Ex: `R$ 1.250,50`).

### Quantidades de Estoque e Vendas
* **Configuração Padrão por Unidade:** O desenvolvedor (`dev`) ou administrador (`admin`) pode configurar o número de casas decimais suportadas por cada Unidade de Medida (Ex: `UN` = 0 decimais; `KG` = 3 decimais; `LT` = 3 decimais).
* **Sobrescrita por Produto:** É possível definir uma precisão customizada para um produto específico (Ex: insumos químicos de alta precisão configurados com 4 casas decimais), independentemente de sua unidade de medida.

---

## 2. Invariantes do Banco de Dados (Regras Rígidas)

Qualquer operação de escrita deve assegurar a manutenção das seguintes regras de consistência:

1. **Preço Histórico Congelado:** O valor de `item_venda.preco_unit` deve refletir o preço de venda praticado no exato instante do fechamento da venda. Alterações futuras na tabela `produto.preco_venda` não podem afetar vendas passadas.
2. **Custo Histórico Congelado (CMV):** O valor de `item_venda.custo_unitario` deve refletir o CME do produto no exato instante da venda. Alterações futuras de custo não afetam o CMV de vendas passadas.
3. **Cálculo Fiel de Totais:** O total da venda (`venda.total`) deve obedecer rigorosamente à fórmula:
   $$\text{venda.total} = \left( \sum \text{item\_venda.total} \right) - \text{venda.desconto}$$
4. **Saldo de Estoque Dinâmico:** O saldo atual de qualquer produto no estoque deve ser calculado como o somatório histórico de suas movimentações:
   $$\text{Saldo} = \sum \text{quantidade (entradas)} - \sum \text{quantidade (saídas)}$$
5. **CME pelo Preço Médio Ponderado (PMP):** A cada entrada de estoque, o Custo Médio do Estoque é recalculado pela fórmula PMP e armazenado em `produto.custo_medio`:
   $$\text{CME}_\text{novo} = \frac{(\text{saldo} \times \text{CME}_\text{atual}) + (\text{qtd\_entrada} \times \text{custo\_entrada})}{\text{saldo} + \text{qtd\_entrada}}$$
   Quando o saldo é zero antes da entrada, `CME_novo = custo_entrada` (sem média a ponderar).
6. **Imutabilidade de Histórico:** Registros na tabela `movimento_estoque` são imutáveis. Lançamentos de correção são feitos por novas entradas do tipo `ajuste`, nunca por alteração ou exclusão de registros antigos.

---

## 2a. Modelo de Custeio — CME e CMV

### CME (Custo Médio do Estoque)

O CME é o indicador de quanto cada unidade em estoque custou em média, recalculado a cada entrada. É universal: aplica-se a produtos de revenda, matérias-primas de fabricados e materiais consumíveis de serviços.

| Campo | Tabela | Descrição |
|---|---|---|
| `custo_medio` | `produto` | CME atual — atualizado a cada entrada |
| `custo_unitario` | `movimento_estoque` | Custo unitário no momento da movimentação |
| `custo_unitario` | `item_venda` | CME no momento da venda (snapshot do CMV) |

### CMV (Custo da Mercadoria Vendida)

O CMV representa o custo real do que saiu do estoque, calculado no momento da venda:

| Tipo de produto | Fórmula do CMV |
|---|---|
| `revenda` / `variavel` | `qtd_vendida × produto.custo_medio` (no momento da venda) |
| `fabricado` | `SUM(ficha_tecnica.quantidade × insumo.custo_medio)` |
| `servico` | `SUM(recurso_consumivel.quantidade × insumo.custo_medio)` |

### Indicadores derivados

| Indicador | Fórmula |
|---|---|
| **Margem Bruta** | `(PV − CMV) / PV × 100` |
| **Markup** | `PV / CMV − 1` |
| **Lucro Unitário** | `PV − CMV` |
| **Giro de Estoque** | `CMV_período / CME_médio_período` |

Estes indicadores são **calculados** (nunca armazenados), derivados de `item_venda.custo_unitario` e `produto.custo_medio`.

### Novas colunas e tabelas (Sprint 02)

**`produto` — novos campos:**
```sql
tipo               TEXT NOT NULL DEFAULT 'revenda',  -- revenda|fabricado|servico|variavel
custo_medio        REAL DEFAULT 0,                   -- CME atual (PMP)
custo_fixo_servico REAL,                             -- custo/hora ou fixo do serviço
tempo_preparo_min  INTEGER,                          -- fabricado: minutos de preparo
rendimento_qtd     REAL,                             -- fabricado: qtd que a receita rende
rendimento_un      TEXT,                             -- fabricado: unidade do rendimento
qtd_embalagem      REAL,                             -- revenda: qtd por embalagem de compra
```

**`movimento_estoque` — novo campo:**
```sql
custo_unitario     REAL,  -- CME no momento da movimentação
```

**`item_venda` — novo campo:**
```sql
custo_unitario     REAL,  -- CME no momento da venda (base do CMV histórico)
```

**Nova tabela `ficha_tecnica` (BOM — fabricados):**
```sql
CREATE TABLE ficha_tecnica (
  id             TEXT PRIMARY KEY,
  produto_id     TEXT NOT NULL,   -- produto fabricado
  insumo_id      TEXT,            -- FK produto (NULL = insumo livre, não rastreia estoque)
  insumo_nome    TEXT NOT NULL,
  quantidade     REAL NOT NULL,
  unidade        TEXT NOT NULL DEFAULT 'UN',
  custo_unitario REAL DEFAULT 0,  -- CME do insumo quando a ficha foi salva
  ordem          INTEGER DEFAULT 0,
  observacao     TEXT,
  FOREIGN KEY (produto_id) REFERENCES produto(id),
  FOREIGN KEY (insumo_id)  REFERENCES produto(id)
);
```

**Nova tabela `recurso_servico` (serviços):**
```sql
CREATE TABLE recurso_servico (
  id          TEXT PRIMARY KEY,
  produto_id  TEXT NOT NULL,   -- produto do tipo servico
  tipo        TEXT NOT NULL,   -- ferramenta|equipamento|material|consumivel
  nome        TEXT NOT NULL,
  insumo_id   TEXT,            -- FK produto quando é consumível cadastrado
  quantidade  REAL DEFAULT 1,
  unidade     TEXT DEFAULT 'UN',
  obrigatorio INTEGER DEFAULT 1,
  observacao  TEXT,
  FOREIGN KEY (produto_id) REFERENCES produto(id),
  FOREIGN KEY (insumo_id)  REFERENCES produto(id)
);
```

---

## 3. Log de Auditoria Obrigatório (`audit_log`)

A tabela `audit_log` registrará as seguintes operações cruciais para a segurança do negócio:

* `abertura_caixa` / `fechamento_caixa`: Gravando operador, supervisor autorizador, fundos iniciais, valores contados e divergências identificadas.
* `sangria`: Registro de toda retirada de valores em dinheiro do caixa.
* `cancelamento_venda`: Auditoria de vendas canceladas, registrando quem solicitou, quem autorizou e os motivos informados.
* `desconto_excedido`: Disparado sempre que um operador tentar conceder um desconto acima do seu limite configurado e precisar da autorização de um supervisor.
* `ajuste_estoque_manual`: Registro de inventários manuais ou lançamentos de perdas/quebras.
* `alteracao_preco`: Log de alterações manuais de preço de custo ou venda de produtos.
* `falha_login`: Rastreabilidade de tentativas inválidas de acesso ao sistema.

---

## 4. Estrutura e Convenções da API REST

A API do Hub segue padrões REST tradicionais com retornos em formato JSON:

* **Prefixos:** `/api/...`
* **Métodos HTTP:** `GET` para leituras, `POST` para criações/ações, `PUT` para atualizações parciais.
* **Retornos de Erro:** Em caso de falha de validação ou erro interno, as respostas devem retornar o código HTTP adequado (400, 401, 403, 404, 409) e um corpo padronizado:
  ```json
  { "erro": "Mensagem detalhada do erro ocorrido" }
  ```
