import { Hono } from 'hono'
import { db } from '../db/index'

export const kdsRoutes = new Hono()

// GET /api/kds/fila — fila de produção (pendentes + em produção)
kdsRoutes.get('/fila', (c) => {
  const status = c.req.query('status') // opcional; padrão: pendente,em_producao
  const filtros = status ? [status] : ['pendente', 'em_producao']
  const placeholders = filtros.map(() => '?').join(',')

  const pedidos = db.query<Record<string, unknown>, string[]>(`
    SELECT
      p.id, p.venda_id, p.status, p.observacao,
      p.criado_em, p.iniciado_em, p.pronto_em,
      v.numero as venda_numero,
      CAST((julianday('now') - julianday(p.criado_em)) * 1440 AS INTEGER) as minutos_aguardando
    FROM pedido_producao p
    JOIN venda v ON v.id = p.venda_id
    WHERE p.status IN (${placeholders})
    ORDER BY p.criado_em ASC
  `).all(...filtros)

  // Carregar itens de cada pedido
  const pedidosComItens = pedidos.map((pedido: any) => {
    const itens = db.query<Record<string, unknown>, [string]>(`
      SELECT ipp.*, pr.nome, pr.codigo, pr.tempo_preparo_min
      FROM item_pedido_producao ipp
      JOIN produto pr ON pr.id = ipp.produto_id
      WHERE ipp.pedido_producao_id = ?
    `).all(pedido.id as string)
    return { ...pedido, itens }
  })

  return c.json(pedidosComItens)
})

// GET /api/kds/historico — pedidos prontos/entregues recentes
kdsRoutes.get('/historico', (c) => {
  const limite = Math.min(Number(c.req.query('limite') ?? 20), 100)
  const pedidos = db.query<Record<string, unknown>, []>(`
    SELECT p.*, v.numero as venda_numero
    FROM pedido_producao p
    JOIN venda v ON v.id = p.venda_id
    WHERE p.status IN ('pronto', 'entregue')
    ORDER BY p.criado_em DESC
    LIMIT ${limite}
  `).all()
  return c.json(pedidos)
})

// PUT /api/kds/:id/iniciar
kdsRoutes.put('/:id/iniciar', (c) => {
  const id = c.req.param('id')
  const pedido = db.query<{ status: string }, [string]>('SELECT status FROM pedido_producao WHERE id = ?').get(id)
  if (!pedido) return c.json({ erro: 'Pedido não encontrado' }, 404)
  if (pedido.status !== 'pendente') return c.json({ erro: `Status atual: ${pedido.status}` }, 409)

  db.prepare(`UPDATE pedido_producao SET status = 'em_producao', iniciado_em = datetime('now') WHERE id = ?`).run(id)
  return c.json({ mensagem: 'Produção iniciada' })
})

// PUT /api/kds/:id/pronto
kdsRoutes.put('/:id/pronto', (c) => {
  const id = c.req.param('id')
  const pedido = db.query<{ status: string }, [string]>('SELECT status FROM pedido_producao WHERE id = ?').get(id)
  if (!pedido) return c.json({ erro: 'Pedido não encontrado' }, 404)
  if (pedido.status !== 'em_producao') return c.json({ erro: `Status atual: ${pedido.status}` }, 409)

  db.prepare(`UPDATE pedido_producao SET status = 'pronto', pronto_em = datetime('now') WHERE id = ?`).run(id)
  return c.json({ mensagem: 'Pedido pronto' })
})

// PUT /api/kds/:id/entregar
kdsRoutes.put('/:id/entregar', (c) => {
  const id = c.req.param('id')
  db.prepare(`UPDATE pedido_producao SET status = 'entregue', entregue_em = datetime('now') WHERE id = ?`).run(id)
  return c.json({ mensagem: 'Pedido entregue' })
})

// PUT /api/kds/:id/cancelar
kdsRoutes.put('/:id/cancelar', (c) => {
  const id = c.req.param('id')
  const pedido = db.query<{ status: string }, [string]>('SELECT status FROM pedido_producao WHERE id = ?').get(id)
  if (!pedido) return c.json({ erro: 'Pedido não encontrado' }, 404)
  if (pedido.status === 'entregue') return c.json({ erro: 'Pedido já entregue' }, 409)

  db.prepare(`UPDATE pedido_producao SET status = 'cancelado' WHERE id = ?`).run(id)
  return c.json({ mensagem: 'Pedido cancelado' })
})
