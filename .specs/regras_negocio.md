# ATHENAS PDV — Regras de Negócio Globais

Este documento detalha o controle de usuários, concessão de descontos, sessões de caixa e a parametrização dos perfis de atividade da empresa.

---

## 1. Níveis de Usuários e Permissões

O ATHENAS PDV possui quatro níveis de acesso com responsabilidades claras:

| Nível / Perfil | Descrição e Permissões |
|---|---|
| **dev** (Desenvolvedor) | Acesso irrestrito ao sistema. Único que pode alterar o tipo de movimentação da empresa (Comércio, Serviço, Fabricação). Pode ser configurado diretamente no `.env` e constar na tabela de usuários. |
| **admin** (Administrador) | Gerencia o cadastro de usuários, define os limites de descontos flexíveis, altera parametrizações gerais do sistema e tem acesso completo ao dashboard financeiro. |
| **supervisor** | Responsável por autorizar ações críticas no PDV do dia a dia, como sangrias (retiradas de dinheiro), cancelamento de vendas do dia e liberação de descontos além da margem padrão do operador. |
| **operador** (Caixa) | Responsável pela abertura de caixa, registro de vendas e recebimento de pagamentos. Permissão de desconto restrita ao seu limite pessoal cadastrado. |

---

## 2. Configuração de Movimentações da Empresa

* **Controle do DEV:** Apenas o usuário com nível `dev` pode definir quais atividades de negócio estão habilitadas no sistema (ex: somente Comércio, Comércio + Serviço, Comércio + Fabricação, etc.).
* **Aplicação das Regras:**
  * **Comércio:** Habilita controle padrão de produtos físicos, compras de fornecedores e baixa automática de estoque.
  * **Serviço:** Habilita ordens de serviço e cadastro de serviços prestados (sem controle físico de estoque). Materiais consumíveis do serviço têm CME e impactam o CMV.
  * **Fabricação:** Habilita o módulo de Cozinha/KDS, ficha técnica (BOM), controle de insumos e matérias-primas. O CMV do fabricado é calculado a partir do CME dos insumos.

---

## 5. Custeio de Produtos — CME e CMV

### Princípio geral

O ATHENAS utiliza o **Preço Médio Ponderado (PMP)** como método de custeio padrão para todos os tipos de produto que controlam estoque. Isso garante que o CMV reflita sempre o custo real médio do período, independente da ordem de entrada das mercadorias.

### CME (Custo Médio do Estoque)

O CME é recalculado a cada entrada de estoque e armazenado em `produto.custo_medio`. Regras:

1. **CME inicial zero:** produto recém-cadastrado tem `custo_medio = 0` até receber a primeira entrada.
2. **Saldo zero antes da entrada:** `CME_novo = custo_da_entrada` (não há média a ponderar).
3. **CME nunca negativo:** saídas (vendas, ajustes) não alteram o CME — apenas entradas o recalculam.
4. **Insumo livre na ficha técnica:** insumos sem `insumo_id` (campo livre) não têm CME rastreado pelo sistema — seu custo é informado manualmente na ficha.

### CMV por tipo de negócio

| Perfil / Tipo de produto | Cálculo do CMV | Reutiliza CME de |
|---|---|---|
| Comércio — revenda | `qtd × CME_produto` | Compras de fornecedor |
| Comércio — variável | `qtd × CME_produto` (ex: R$/kg) | Entradas em KG/LT |
| Fabricação — fabricado | `Σ(qtd_insumo × CME_insumo)` | Insumos (revenda/variável) |
| Fabricação — insumo | `qtd × CME_insumo` | Compras de matéria-prima |
| Serviço — consumível | `qtd × CME_material` | Entradas do material consumível |

> **Reutilização:** um produto `revenda` (ex: Farinha de Trigo 1kg) tem seu CME calculado normalmente pelas entradas. Quando é usado como insumo em uma ficha técnica de um fabricado (ex: Pão Artesanal), o CME da farinha é automaticamente o custo unitário daquele insumo no fabricado.

### Regras de visibilidade do custo

* **operador:** não vê CME nem CMV — apenas preço de venda.
* **supervisor:** vê CME dos produtos e margem bruta — não vê histórico detalhado de custo.
* **admin:** acesso completo a CME, CMV, margem, markup e histórico de alterações de custo.

---

## 3. Parametrização e Limites de Descontos

Os descontos aplicados nos itens ou no total da venda são totalmente configuráveis e flexíveis:
* **Configuração por Usuário:** O administrador define o percentual máximo de desconto permitido para cada usuário de forma individualizada (ex: Operador A = 5%, Operador B = 10%, Supervisor = 30%).
* **Validação no PDV:** O backend valida o desconto enviado com base nas credenciais do usuário ativo. Se o limite do operador for ultrapassado, o sistema exige o PIN/validação de um `supervisor` ou `admin` para autorizar a operação.

---

## 4. Fluxo e Sessão do Caixa (`caixa_sessao`)

Para garantir a integridade dos fluxos financeiros e evitar vendas avulsas sem controle de turno:

### Abertura de Caixa
* Nenhuma venda ou sangria pode ser realizada se não houver uma sessão de caixa aberta (`status = 'aberto'`) vinculada ao dispositivo.
* A abertura do caixa exige o preenchimento opcional do valor de fundo de troco (fundo inicial).

### Fechamento de Caixa
* O encerramento da sessão de caixa exige o preenchimento obrigatório da **contagem física de valores** em posse do operador.
* É obrigatória a confirmação dos dados (senha/PIN) do operador que está fechando e a validação de um `supervisor` ou `admin`.
* O sistema deve calcular a diferença de caixa automaticamente:
  $$\text{Diferença} = \text{Valor Contado} - (\text{Fundo Inicial} + \text{Vendas em Dinheiro} - \text{Sangrias})$$
* Qualquer divergência entre o saldo teórico e a contagem física deve ser registrada para fins de auditoria.
