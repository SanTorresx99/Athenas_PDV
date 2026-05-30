import { Hono } from 'hono'
import { db, getSaldoProduto } from '../db/index'

export const estoqueRoutes = new Hono()

// GET /api/estoque — saldos de todos os produtos
estoqueRoutes.get('/', (c) => {
  const saldos = db.query<Record<string, unknown>, []>(`
    SELECT
      p.id, p.codigo, p.nome, p.unidade, p.categoria,
      p.preco_venda, p.preco_custo, p.estoque_min,
      COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade ELSE -m.quantidade END), 0) AS saldo,
      CASE
        WHEN COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade ELSE -m.quantidade END), 0) <= p.estoque_min
        THEN 1 ELSE 0
      END AS critico
    FROM produto p
    LEFT JOIN movimento_estoque m ON m.produto_id = p.id
    WHERE p.ativo = 1
    GROUP BY p.id
    ORDER BY p.nome
  `).all()

  return c.json(saldos)
})

// GET /api/estoque/criticos — produtos abaixo do mínimo
estoqueRoutes.get('/criticos', (c) => {
  const criticos = db.query<Record<string, unknown>, []>(`
    SELECT
      p.id, p.codigo, p.nome, p.unidade, p.estoque_min,
      COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade ELSE -m.quantidade END), 0) AS saldo
    FROM produto p
    LEFT JOIN movimento_estoque m ON m.produto_id = p.id
    WHERE p.ativo = 1
    GROUP BY p.id
    HAVING saldo <= p.estoque_min
    ORDER BY saldo ASC
  `).all()

  return c.json(criticos)
})

// GET /api/estoque/:produto_id — saldo e histórico de um produto
estoqueRoutes.get('/:produto_id', (c) => {
  const produto_id = c.req.param('produto_id')

  const produto = db.query<Record<string, unknown>, [string]>(
    'SELECT id, codigo, nome, unidade, estoque_min FROM produto WHERE id = ?'
  ).get(produto_id)
  if (!produto) return c.json({ erro: 'Produto não encontrado' }, 404)

  const saldo = getSaldoProduto(produto_id)
  const historico = db.query<Record<string, unknown>, [string]>(`
    SELECT * FROM movimento_estoque WHERE produto_id = ? ORDER BY criado_em DESC LIMIT 50
  `).all(produto_id)

  return c.json({ ...produto, saldo, historico })
})

// POST /api/estoque/entrada — entrada manual de mercadoria
estoqueRoutes.post('/entrada', async (c) => {
  const body = await c.req.json()
  const { produto_id, quantidade, preco_custo, observacao, operador_id } = body

  if (!produto_id || !quantidade || quantidade <= 0) {
    return c.json({ erro: 'produto_id e quantidade (> 0) são obrigatórios' }, 400)
  }

  const produto = db.query<{ id: string }, [string]>(
    'SELECT id FROM produto WHERE id = ? AND ativo = 1'
  ).get(produto_id)
  if (!produto) return c.json({ erro: 'Produto não encontrado' }, 404)

  db.transaction(() => {
    const saldoApos = getSaldoProduto(produto_id) + quantidade
    db.prepare(`
      INSERT INTO movimento_estoque (id, produto_id, tipo, quantidade, saldo_apos, origem, operador_id, observacao)
      VALUES (?, ?, 'entrada', ?, ?, 'manual', ?, ?)
    `).run(crypto.randomUUID(), produto_id, quantidade, saldoApos, operador_id ?? null, observacao ?? null)

    if (preco_custo != null) {
      db.prepare(`UPDATE produto SET preco_custo = ?, atualizado_em = datetime('now') WHERE id = ?`)
        .run(preco_custo, produto_id)
    }
  })()

  return c.json({ mensagem: 'Entrada registrada', saldo: getSaldoProduto(produto_id) }, 201)
})

// POST /api/estoque/ajuste — ajuste manual (perda, inventário)
estoqueRoutes.post('/ajuste', async (c) => {
  const body = await c.req.json()
  const { produto_id, tipo = 'ajuste', quantidade, observacao, operador_id } = body

  if (!produto_id || !quantidade || quantidade <= 0) {
    return c.json({ erro: 'produto_id e quantidade são obrigatórios' }, 400)
  }

  const tiposValidos = ['ajuste', 'perda', 'entrada']
  if (!tiposValidos.includes(tipo)) {
    return c.json({ erro: `tipo deve ser um de: ${tiposValidos.join(', ')}` }, 400)
  }

  const produto = db.query<{ id: string }, [string]>(
    'SELECT id FROM produto WHERE id = ? AND ativo = 1'
  ).get(produto_id)
  if (!produto) return c.json({ erro: 'Produto não encontrado' }, 404)

  const saldoAtual = getSaldoProduto(produto_id)
  const delta = tipo === 'entrada' ? quantidade : -quantidade
  const saldoApos = saldoAtual + delta

  db.prepare(`
    INSERT INTO movimento_estoque (id, produto_id, tipo, quantidade, saldo_apos, origem, operador_id, observacao)
    VALUES (?, ?, ?, ?, ?, 'manual', ?, ?)
  `).run(crypto.randomUUID(), produto_id, tipo, quantidade, saldoApos, operador_id ?? null, observacao ?? null)

  return c.json({ mensagem: 'Ajuste registrado', saldo_anterior: saldoAtual, saldo_atual: saldoApos })
})
