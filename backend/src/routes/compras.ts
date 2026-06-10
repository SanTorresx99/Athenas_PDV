import { Hono } from 'hono'
import { db, getSaldoProduto, recalcularCME } from '../db/index'

export const comprasRoutes = new Hono()

// ── FORNECEDORES ────────────────────────────────────────────────────────────

comprasRoutes.get('/fornecedor', (c) => {
  const fornecedores = db.query<Record<string, unknown>, []>(
    'SELECT * FROM fornecedor WHERE ativo = 1 ORDER BY nome'
  ).all()
  return c.json(fornecedores)
})

comprasRoutes.post('/fornecedor', async (c) => {
  const body = await c.req.json()
  const { nome, cnpj_cpf, telefone, email, endereco, contato } = body

  if (!nome) return c.json({ erro: 'nome é obrigatório' }, 400)

  const id = crypto.randomUUID()
  db.prepare(`
    INSERT INTO fornecedor (id, nome, cnpj_cpf, telefone, email, endereco, contato)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, nome, cnpj_cpf ?? null, telefone ?? null, email ?? null, endereco ?? null, contato ?? null)

  return c.json({ id, mensagem: 'Fornecedor cadastrado' }, 201)
})

comprasRoutes.put('/fornecedor/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { nome, cnpj_cpf, telefone, email, endereco, contato, ativo } = body

  const existe = db.query<{ id: string }, [string]>('SELECT id FROM fornecedor WHERE id = ?').get(id)
  if (!existe) return c.json({ erro: 'Fornecedor não encontrado' }, 404)

  db.prepare(`
    UPDATE fornecedor SET
      nome = COALESCE(?, nome),
      cnpj_cpf = COALESCE(?, cnpj_cpf),
      telefone = COALESCE(?, telefone),
      email = COALESCE(?, email),
      endereco = COALESCE(?, endereco),
      contato = COALESCE(?, contato),
      ativo = COALESCE(?, ativo)
    WHERE id = ?
  `).run(nome ?? null, cnpj_cpf ?? null, telefone ?? null, email ?? null,
         endereco ?? null, contato ?? null, ativo ?? null, id)

  return c.json({ mensagem: 'Fornecedor atualizado' })
})

// ── ORDENS DE COMPRA ─────────────────────────────────────────────────────────

comprasRoutes.get('/ordem', (c) => {
  const status = c.req.query('status')
  const ordens = status
    ? db.query<Record<string, unknown>, [string]>(`
        SELECT o.*, f.nome as fornecedor_nome FROM ordem_compra o
        JOIN fornecedor f ON f.id = o.fornecedor_id
        WHERE o.status = ? ORDER BY o.criado_em DESC
      `).all(status)
    : db.query<Record<string, unknown>, []>(`
        SELECT o.*, f.nome as fornecedor_nome FROM ordem_compra o
        JOIN fornecedor f ON f.id = o.fornecedor_id
        ORDER BY o.criado_em DESC
      `).all()
  return c.json(ordens)
})

comprasRoutes.get('/ordem/:id', (c) => {
  const id = c.req.param('id')
  const ordem = db.query<Record<string, unknown>, [string]>(`
    SELECT o.*, f.nome as fornecedor_nome FROM ordem_compra o
    JOIN fornecedor f ON f.id = o.fornecedor_id WHERE o.id = ?
  `).get(id)
  if (!ordem) return c.json({ erro: 'Ordem não encontrada' }, 404)

  const itens = db.query<Record<string, unknown>, [string]>(`
    SELECT i.*, p.nome, p.codigo, p.unidade FROM item_ordem_compra i
    JOIN produto p ON p.id = i.produto_id WHERE i.ordem_compra_id = ?
  `).all(id)

  return c.json({ ...ordem, itens })
})

comprasRoutes.post('/ordem', async (c) => {
  const body = await c.req.json()
  const { fornecedor_id, itens, previsao_entrega, observacao, operador_id } = body

  if (!fornecedor_id || !itens?.length) {
    return c.json({ erro: 'fornecedor_id e itens são obrigatórios' }, 400)
  }

  const fornecedor = db.query<{ id: string }, [string]>('SELECT id FROM fornecedor WHERE id = ?').get(fornecedor_id)
  if (!fornecedor) return c.json({ erro: 'Fornecedor não encontrado' }, 404)

  const id = crypto.randomUUID()
  const ultimoNumero = db.query<{ n: number }, []>(
    'SELECT COALESCE(MAX(numero), 0) as n FROM ordem_compra'
  ).get()
  const numero = (ultimoNumero?.n ?? 0) + 1

  db.transaction(() => {
    db.prepare(`
      INSERT INTO ordem_compra (id, numero, fornecedor_id, previsao_entrega, observacao, operador_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, numero, fornecedor_id, previsao_entrega ?? null, observacao ?? null, operador_id ?? null)

    let total = 0
    for (const item of itens) {
      const itemTotal = (item.preco_unit ?? 0) * item.quantidade
      total += itemTotal
      db.prepare(`
        INSERT INTO item_ordem_compra (id, ordem_compra_id, produto_id, quantidade, preco_unit, total)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(crypto.randomUUID(), id, item.produto_id, item.quantidade, item.preco_unit ?? null, itemTotal || null)
    }

    db.prepare('UPDATE ordem_compra SET total = ? WHERE id = ?').run(total, id)
  })()

  return c.json({ id, numero, mensagem: 'Ordem criada' }, 201)
})

// POST /api/compras/ordem/:id/receber — registrar recebimento
comprasRoutes.post('/ordem/:id/receber', async (c) => {
  const ordemId = c.req.param('id')
  const body = await c.req.json()
  const { itens, operador_id } = body // itens: [{ item_ordem_compra_id, quantidade_recebida, preco_unit }]

  const ordem = db.query<{ status: string }, [string]>(
    'SELECT status FROM ordem_compra WHERE id = ?'
  ).get(ordemId)
  if (!ordem) return c.json({ erro: 'Ordem não encontrada' }, 404)
  if (ordem.status === 'cancelada') return c.json({ erro: 'Ordem cancelada' }, 409)

  db.transaction(() => {
    const insertMov = db.prepare(`
      INSERT INTO movimento_estoque (id, produto_id, tipo, quantidade, saldo_apos, custo_unitario, origem, origem_id, operador_id)
      VALUES (?, ?, 'entrada', ?, ?, ?, 'compra', ?, ?)
    `)

    for (const item of itens) {
      const itemOrdem = db.query<{ produto_id: string; quantidade: number; preco_unit: number | null }, [string]>(
        'SELECT produto_id, quantidade, preco_unit FROM item_ordem_compra WHERE id = ?'
      ).get(item.item_ordem_compra_id)
      if (!itemOrdem) continue

      const qtdRecebida = item.quantidade_recebida ?? itemOrdem.quantidade
      const custoUnit = item.preco_unit ?? itemOrdem.preco_unit ?? 0

      // Recalcula CME pelo PMP antes de registrar a entrada
      const novoCME = recalcularCME(itemOrdem.produto_id, qtdRecebida, custoUnit)
      const saldoApos = getSaldoProduto(itemOrdem.produto_id) + qtdRecebida

      insertMov.run(crypto.randomUUID(), itemOrdem.produto_id, qtdRecebida, saldoApos, custoUnit, ordemId, operador_id ?? null)

      db.prepare('UPDATE item_ordem_compra SET quantidade_recebida = ?, preco_unit = COALESCE(?, preco_unit) WHERE id = ?')
        .run(qtdRecebida, item.preco_unit ?? null, item.item_ordem_compra_id)

      // Atualiza preco_custo com o custo da entrada mais recente
      db.prepare('UPDATE produto SET preco_custo = ?, custo_medio = ?, atualizado_em = datetime(\'now\') WHERE id = ?')
        .run(custoUnit, novoCME, itemOrdem.produto_id)
    }

    db.prepare(`UPDATE ordem_compra SET status = 'recebida', recebido_em = datetime('now') WHERE id = ?`).run(ordemId)
  })()

  return c.json({ mensagem: 'Recebimento registrado e estoque atualizado' })
})

// POST /api/compras/ordem/:id/cancelar
comprasRoutes.post('/ordem/:id/cancelar', (c) => {
  const id = c.req.param('id')
  const ordem = db.query<{ status: string }, [string]>('SELECT status FROM ordem_compra WHERE id = ?').get(id)
  if (!ordem) return c.json({ erro: 'Ordem não encontrada' }, 404)
  if (ordem.status === 'recebida') return c.json({ erro: 'Ordem já recebida não pode ser cancelada' }, 409)

  db.prepare(`UPDATE ordem_compra SET status = 'cancelada' WHERE id = ?`).run(id)
  return c.json({ mensagem: 'Ordem cancelada' })
})

// GET /api/compras/relatorio — gastos por fornecedor e período (CMP-06)
// Query params: de (YYYY-MM-DD), ate (YYYY-MM-DD), fornecedor_id
comprasRoutes.get('/relatorio', (c) => {
  const de = c.req.query('de') ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const ate = c.req.query('ate') ?? new Date().toISOString().slice(0, 10)
  const fornecedor_id = c.req.query('fornecedor_id')

  const filtroFornecedor = fornecedor_id ? 'AND o.fornecedor_id = ?' : ''
  const params: string[] = fornecedor_id
    ? [`${de} 00:00:00`, `${ate} 23:59:59`, fornecedor_id]
    : [`${de} 00:00:00`, `${ate} 23:59:59`]

  const resumo = db.query<Record<string, unknown>, string[]>(`
    SELECT
      f.id as fornecedor_id, f.nome as fornecedor,
      COUNT(o.id) as qtd_ordens,
      COALESCE(SUM(o.total), 0) as total_gasto,
      MIN(o.criado_em) as primeira_compra,
      MAX(o.criado_em) as ultima_compra
    FROM ordem_compra o
    JOIN fornecedor f ON f.id = o.fornecedor_id
    WHERE o.status = 'recebida'
      AND o.recebido_em BETWEEN ? AND ?
      ${filtroFornecedor}
    GROUP BY f.id
    ORDER BY total_gasto DESC
  `).all(...params)

  const totalGeral = (resumo as any[]).reduce((s: number, r: any) => s + Number(r.total_gasto), 0)

  return c.json({ de, ate, total_geral: totalGeral, fornecedores: resumo })
})

// GET /api/compras/sugestoes — pré-ordens sugeridas para produtos críticos (CMP-07)
comprasRoutes.get('/sugestoes', (c) => {
  const sugestoes = db.query<Record<string, unknown>, []>(`
    SELECT
      p.id, p.codigo, p.nome, p.unidade, p.estoque_min, p.custo_medio,
      COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade ELSE -m.quantidade END), 0) AS saldo,
      (p.estoque_min * 3) AS qtd_sugerida
    FROM produto p
    LEFT JOIN movimento_estoque m ON m.produto_id = p.id
    WHERE p.ativo = 1 AND p.tipo IN ('revenda','variavel')
    GROUP BY p.id
    HAVING saldo <= p.estoque_min AND p.estoque_min > 0
    ORDER BY saldo ASC
  `).all()

  return c.json(sugestoes)
})
