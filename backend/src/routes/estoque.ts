import { Hono } from 'hono'
import { db, getSaldoProduto, getCMEProduto, recalcularCME } from '../db/index'

export const estoqueRoutes = new Hono()

// GET /api/estoque — saldos de todos os produtos
estoqueRoutes.get('/', (c) => {
  const saldos = db.query<Record<string, unknown>, []>(`
    SELECT
      p.id, p.codigo, p.nome, p.unidade, p.categoria,
      p.preco_venda, p.preco_custo, p.custo_medio, p.estoque_min, p.tipo,
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

// GET /api/estoque/:produto_id — saldo, CME e histórico de movimentos (EST-09)
estoqueRoutes.get('/:produto_id', (c) => {
  const produto_id = c.req.param('produto_id')
  const limit = Math.min(Number(c.req.query('limit') ?? 100), 500)
  const tipo = c.req.query('tipo') // filtro opcional: entrada|saida|ajuste|perda

  const produto = db.query<Record<string, unknown>, [string]>(
    'SELECT id, codigo, nome, unidade, estoque_min, custo_medio, tipo FROM produto WHERE id = ?'
  ).get(produto_id)
  if (!produto) return c.json({ erro: 'Produto não encontrado' }, 404)

  const saldo = getSaldoProduto(produto_id)
  const cme = getCMEProduto(produto_id)

  const historico = tipo
    ? db.query<Record<string, unknown>, [string, string]>(`
        SELECT * FROM movimento_estoque WHERE produto_id = ? AND tipo = ?
        ORDER BY criado_em DESC LIMIT ${limit}
      `).all(produto_id, tipo)
    : db.query<Record<string, unknown>, [string]>(`
        SELECT * FROM movimento_estoque WHERE produto_id = ?
        ORDER BY criado_em DESC LIMIT ${limit}
      `).all(produto_id)

  return c.json({ ...produto, saldo, custo_medio: cme, historico })
})

// POST /api/estoque/entrada — entrada manual de mercadoria (calcula CME pelo PMP)
estoqueRoutes.post('/entrada', async (c) => {
  const body = await c.req.json()
  const { produto_id, quantidade, custo_unitario, observacao, operador_id } = body

  if (!produto_id || !quantidade || quantidade <= 0) {
    return c.json({ erro: 'produto_id e quantidade (> 0) são obrigatórios' }, 400)
  }

  const produto = db.query<{ id: string; custo_medio: number }, [string]>(
    'SELECT id, custo_medio FROM produto WHERE id = ? AND ativo = 1'
  ).get(produto_id)
  if (!produto) return c.json({ erro: 'Produto não encontrado' }, 404)

  let novoSaldo = 0
  let novoCME = 0

  db.transaction(() => {
    const custoUnit = custo_unitario != null ? Number(custo_unitario) : (produto.custo_medio ?? 0)
    novoCME = recalcularCME(produto_id, quantidade, custoUnit)

    const saldoApos = getSaldoProduto(produto_id) + quantidade
    novoSaldo = saldoApos

    db.prepare(`
      INSERT INTO movimento_estoque (id, produto_id, tipo, quantidade, saldo_apos, custo_unitario, origem, operador_id, observacao)
      VALUES (?, ?, 'entrada', ?, ?, ?, 'manual', ?, ?)
    `).run(crypto.randomUUID(), produto_id, quantidade, saldoApos, custoUnit, operador_id ?? null, observacao ?? null)
  })()

  return c.json({ mensagem: 'Entrada registrada', saldo: novoSaldo, custo_medio: novoCME }, 201)
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

// POST /api/estoque/inventario — ajuste em lote (EST-10)
// Body: { itens: [{ produto_id, contagem_fisica }], operador_id }
estoqueRoutes.post('/inventario', async (c) => {
  const body = await c.req.json()
  const { itens, operador_id } = body

  if (!Array.isArray(itens) || itens.length === 0) {
    return c.json({ erro: 'itens é obrigatório' }, 400)
  }

  const resultado: { produto_id: string; ajuste: number; saldo_anterior: number; saldo_novo: number }[] = []

  db.transaction(() => {
    for (const item of itens) {
      const { produto_id, contagem_fisica } = item
      if (!produto_id || contagem_fisica == null) continue

      const saldoAtual = getSaldoProduto(produto_id)
      const diferenca = Number(contagem_fisica) - saldoAtual
      if (Math.abs(diferenca) < 0.001) continue

      const tipo = diferenca > 0 ? 'entrada' : 'ajuste'
      const qtd = Math.abs(diferenca)
      const saldoApos = saldoAtual + diferenca

      db.prepare(`
        INSERT INTO movimento_estoque (id, produto_id, tipo, quantidade, saldo_apos, origem, operador_id, observacao)
        VALUES (?, ?, ?, ?, ?, 'inventario', ?, 'Ajuste de inventário')
      `).run(crypto.randomUUID(), produto_id, tipo, qtd, saldoApos, operador_id ?? null)

      resultado.push({ produto_id, ajuste: diferenca, saldo_anterior: saldoAtual, saldo_novo: saldoApos })
    }
  })()

  return c.json({ mensagem: `${resultado.length} produto(s) ajustado(s)`, ajustes: resultado })
})
