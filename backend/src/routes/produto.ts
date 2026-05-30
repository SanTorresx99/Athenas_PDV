import { Hono } from 'hono'
import { db } from '../db/index'

export const produtoRoutes = new Hono()

interface Produto {
  id: string; codigo: string; nome: string; descricao: string | null
  unidade: string; preco_venda: number; preco_custo: number | null
  categoria: string | null; estoque_min: number; ativo: number
  criado_em: string; atualizado_em: string | null
}

// GET /api/produto — lista todos os produtos ativos
produtoRoutes.get('/', (c) => {
  const categoria = c.req.query('categoria')
  const ativo = c.req.query('ativo') ?? '1'

  const produtos = categoria
    ? db.query<Produto, [string, string]>(
        'SELECT * FROM produto WHERE ativo = ? AND categoria = ? ORDER BY nome'
      ).all(ativo, categoria)
    : db.query<Produto, [string]>(
        'SELECT * FROM produto WHERE ativo = ? ORDER BY nome'
      ).all(ativo)

  return c.json(produtos)
})

// GET /api/produto/busca?q= — busca por nome ou código
produtoRoutes.get('/busca', (c) => {
  const q = c.req.query('q') ?? ''
  if (q.length < 1) return c.json([])

  const produtos = db.query<Produto, [string, string]>(
    `SELECT * FROM produto WHERE ativo = 1 AND (nome LIKE ? OR codigo = ?) ORDER BY nome LIMIT 20`
  ).all(`%${q}%`, q)

  return c.json(produtos)
})

// GET /api/produto/categorias — lista categorias distintas
produtoRoutes.get('/categorias', (c) => {
  const rows = db.query<{ categoria: string }, []>(
    `SELECT DISTINCT categoria FROM produto WHERE categoria IS NOT NULL AND ativo = 1 ORDER BY categoria`
  ).all()
  return c.json(rows.map(r => r.categoria))
})

// GET /api/produto/:id
produtoRoutes.get('/:id', (c) => {
  const produto = db.query<Produto, [string]>('SELECT * FROM produto WHERE id = ?').get(c.req.param('id'))
  if (!produto) return c.json({ erro: 'Produto não encontrado' }, 404)
  return c.json(produto)
})

// POST /api/produto — cadastrar produto
produtoRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const { codigo, nome, unidade = 'UN', preco_venda, preco_custo, categoria, estoque_min = 0, descricao } = body

  if (!codigo || !nome || preco_venda == null) {
    return c.json({ erro: 'codigo, nome e preco_venda são obrigatórios' }, 400)
  }

  const existente = db.query<{ id: string }, [string]>('SELECT id FROM produto WHERE codigo = ?').get(codigo)
  if (existente) return c.json({ erro: 'Código já cadastrado' }, 409)

  const id = crypto.randomUUID()
  db.prepare(`
    INSERT INTO produto (id, codigo, nome, descricao, unidade, preco_venda, preco_custo, categoria, estoque_min)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, codigo, nome, descricao ?? null, unidade, preco_venda, preco_custo ?? null, categoria ?? null, estoque_min)

  return c.json({ id, mensagem: 'Produto cadastrado' }, 201)
})

// PUT /api/produto/:id — editar produto
produtoRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { nome, descricao, unidade, preco_venda, preco_custo, categoria, estoque_min, ativo } = body

  const produto = db.query<{ id: string }, [string]>('SELECT id FROM produto WHERE id = ?').get(id)
  if (!produto) return c.json({ erro: 'Produto não encontrado' }, 404)

  db.prepare(`
    UPDATE produto SET
      nome = COALESCE(?, nome),
      descricao = COALESCE(?, descricao),
      unidade = COALESCE(?, unidade),
      preco_venda = COALESCE(?, preco_venda),
      preco_custo = COALESCE(?, preco_custo),
      categoria = COALESCE(?, categoria),
      estoque_min = COALESCE(?, estoque_min),
      ativo = COALESCE(?, ativo),
      atualizado_em = datetime('now')
    WHERE id = ?
  `).run(nome ?? null, descricao ?? null, unidade ?? null, preco_venda ?? null,
         preco_custo ?? null, categoria ?? null, estoque_min ?? null, ativo ?? null, id)

  return c.json({ mensagem: 'Produto atualizado' })
})
