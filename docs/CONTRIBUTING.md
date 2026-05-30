# Como Contribuir — ATHENAS PDV

## Pré-requisitos

```bash
# Instalar Bun
curl -fsSL https://bun.sh/install | bash   # Linux/Mac
# Windows: powershell -c "irm bun.sh/install.ps1 | iex"

# Verificar
bun --version   # >= 1.1.0
```

## Rodando o projeto

```bash
# Backend
cd backend
bun install
bun run dev     # servidor em http://localhost:3000

# Frontend (MOKUP VISUAL)
# Abrir PROJETO_ATHENAS/ no VS Code → Go Live → http://127.0.0.1:5500/MOKUP%20VISUAL/index.html
```

---

## Estrutura de branches

```
main          → código estável (só merge via PR revisado)
dev           → integração contínua (base para PRs)
feat/nome     → nova funcionalidade
fix/nome      → correção de bug
chore/nome    → infraestrutura, config, docs
```

## Fluxo de trabalho

1. Criar branch a partir de `dev`: `git checkout -b feat/minha-feature dev`
2. Commitar com mensagem clara (ver padrão abaixo)
3. Abrir PR para `dev` com descrição do que foi feito e como testar
4. Review + merge
5. `dev` → `main` ao final de cada sprint

---

## Padrão de commits

```
tipo: descrição curta em português (max 72 chars)

Tipos:
  feat     → nova funcionalidade
  fix      → correção de bug
  data     → alteração de schema/modelo de dados
  ui       → mudança visual/frontend
  docs     → documentação
  chore    → build, config, dependências
  refactor → refatoração sem mudança de comportamento
  test     → testes

Exemplos:
  feat: adicionar endpoint POST /api/venda
  fix: corrigir cálculo de troco quando desconto é aplicado
  data: adicionar índice em movimento_estoque.produto_id
  ui: atualizar logo na sidebar para AthenasSymbol oficial
```

---

## Convenções de código

### Backend (TypeScript / Bun)
- Usar TypeScript estrito (`"strict": true`)
- Funções pequenas e focadas — sem funções com mais de 40 linhas
- Nomes em português para domínio de negócio, inglês para infraestrutura
- Sem `any` — preferir tipos explícitos ou `unknown`
- Transações SQLite para qualquer operação que envolva múltiplas tabelas

```typescript
// BOM
const buscarProduto = (codigo: string): Produto | null => {
  return db.query<Produto>('SELECT * FROM produto WHERE codigo = ?').get(codigo);
};

// RUIM
const getP = (c: any) => { return db.query('SELECT * FROM produto WHERE codigo = ' + c).get(); };
```

### Frontend (React / JSX)
- Componentes em PascalCase, funções utilitárias em camelCase
- Sem `useState` aninhado além de 2 níveis — extrair componente
- CSS via variáveis (`var(--primary)`) — sem valores hex hardcoded no JSX
- Ícones sempre via `<Icon name="..." />` — sem SVG inline fora de `logo.jsx`

---

## Adicionando um novo módulo

1. Criar `modules/NOME_MODULO.md` com fluxos e regras de negócio
2. Criar `backend/src/routes/nome_modulo.ts` com os endpoints
3. Criar `NOME_MODULO VISUAL/nome-modulo.jsx` com o componente React
4. Adicionar script tag em `index.html`
5. Adicionar rota no roteador em `app.jsx`
6. Adicionar item de menu na sidebar em `app.jsx`
7. Atualizar `sprints/BACKLOG.md` com tasks concluídas

---

## Alterando o modelo de dados

1. Nunca alterar schema sem criar migration em `backend/src/db/migrations/`
2. Nomear migration: `YYYYMMDD_descricao.sql`
3. Atualizar `docs/DATA_MODEL.md`
4. Testar migração em banco existente (não só banco vazio)

---

## Não faça

- Não commitar `athenas.db` (está no `.gitignore`)
- Não commitar chaves secretas ou tokens
- Não usar SQL dinâmico com concatenação de string (risco de SQL injection)
- Não escrever diretamente no SQLite a partir de módulos secundários — sempre via API do Hub
- Não alterar o símbolo SVG em `LOGOTIPO/` sem alinhar com o design system
