import { Hono } from 'hono'
import { db, getSaldoProduto } from '../db/index'

export const vendaRoutes = new Hono()

interface ItemInput {
  produto_id: string
  quantidade: number
  desconto?: number
}

interface PagamentoInput {
  forma: string
  valor: number
}

// POST /api/venda — registrar e fechar venda
vendaRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const { itens, forma_pagto, pagamentos, desconto = 0, troco = 0, observacao, operador_id, dispositivo_id } = body

  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    return c.json({ erro: 'itens é obrigatório e não pode estar vazio' }, 400)
  }
  if (!forma_pagto && (!pagamentos || !Array.isArray(pagamentos) || pagamentos.length === 0)) {
    return c.json({ erro: 'forma_pagto ou pagamentos é obrigatório' }, 400)
  }

  try {
  const resultado = db.transaction(() => {
    // Próximo número de venda do dia
    const hoje = new Date().toISOString().slice(0, 10)
    const ultimoNumero = db.query<{ n: number }, [string]>(
      `SELECT COALESCE(MAX(numero), 0) as n FROM venda WHERE criado_em >= ?`
    ).get(`${hoje} 00:00:00`)
    const numero = (ultimoNumero?.n ?? 0) + 1

    const vendaId = crypto.randomUUID()

    // Resolve produtos e calcula total antes de qualquer INSERT
    type ItemResolvido = { produto_id: string; quantidade: number; preco_unit: number; desconto: number; total: number }
    const itensResolvidos: ItemResolvido[] = []
    let totalVenda = 0

    for (const item of itens as ItemInput[]) {
      const produto = db.query<{ preco_venda: number; nome: string }, [string]>(
        'SELECT preco_venda, nome FROM produto WHERE id = ? AND ativo = 1'
      ).get(item.produto_id)

      if (!produto) throw new Error(`Produto ${item.produto_id} não encontrado`)

      const itemDesconto = item.desconto ?? 0
      const total = (produto.preco_venda * item.quantidade) - itemDesconto
      totalVenda += total
      itensResolvidos.push({ produto_id: item.produto_id, quantidade: item.quantidade, preco_unit: produto.preco_venda, desconto: itemDesconto, total })
    }

    // INSERT venda primeiro (FK referenciada pelos itens)
    const totalFinal = totalVenda - desconto

    let trocoFinal = troco as number
    let formaPagtoFinal = forma_pagto as string

    if (pagamentos && Array.isArray(pagamentos) && (pagamentos as PagamentoInput[]).length > 0) {
      const somaPago = (pagamentos as PagamentoInput[]).reduce((s, p) => s + p.valor, 0)
      if (somaPago < totalFinal - 0.005) {
        throw new Error(`Pagamento insuficiente: pago R$ ${somaPago.toFixed(2)}, total R$ ${totalFinal.toFixed(2)}`)
      }
      trocoFinal = Math.max(0, somaPago - totalFinal)
      formaPagtoFinal = (pagamentos as PagamentoInput[]).length === 1
        ? (pagamentos as PagamentoInput[])[0].forma
        : 'multiplo'
    }

    db.prepare(`
      INSERT INTO venda (id, numero, status, forma_pagto, total, desconto, troco, observacao, operador_id, dispositivo_id, pagamentos, fechado_em)
      VALUES (?, ?, 'fechada', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(vendaId, numero, formaPagtoFinal, totalFinal, desconto, trocoFinal, observacao ?? null, operador_id ?? null, dispositivo_id ?? null, pagamentos ? JSON.stringify(pagamentos) : null)

    const insertItem = db.prepare(`
      INSERT INTO item_venda (id, venda_id, produto_id, quantidade, preco_unit, desconto, total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const insertMov = db.prepare(`
      INSERT INTO movimento_estoque (id, produto_id, tipo, quantidade, saldo_apos, origem, origem_id)
      VALUES (?, ?, 'saida', ?, ?, 'venda', ?)
    `)

    // INSERT itens e movimentos de estoque
    for (const it of itensResolvidos) {
      insertItem.run(crypto.randomUUID(), vendaId, it.produto_id, it.quantidade, it.preco_unit, it.desconto, it.total)
      const saldoApos = getSaldoProduto(it.produto_id) - it.quantidade
      insertMov.run(crypto.randomUUID(), it.produto_id, it.quantidade, saldoApos, vendaId)
    }

    return { id: vendaId, numero, total: totalFinal, troco: trocoFinal }
  })()

  return c.json({ ...resultado, mensagem: 'Venda registrada' }, 201)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao registrar venda'
    return c.json({ erro: msg }, 422)
  }
})

// GET /api/venda/dia — vendas de hoje
vendaRoutes.get('/dia', (c) => {
  const hoje = new Date().toISOString().slice(0, 10)
  const vendas = db.query<Record<string, unknown>, [string]>(`
    SELECT v.*, COUNT(i.id) as qtd_itens
    FROM venda v
    LEFT JOIN item_venda i ON i.venda_id = v.id
    WHERE v.criado_em >= ? AND v.status != 'cancelada'
    GROUP BY v.id
    ORDER BY v.criado_em DESC
  `).all(`${hoje} 00:00:00`)
  return c.json(vendas)
})

// GET /api/venda/:id — detalhes da venda
vendaRoutes.get('/:id', (c) => {
  const id = c.req.param('id')
  const venda = db.query<Record<string, unknown>, [string]>('SELECT * FROM venda WHERE id = ?').get(id)
  if (!venda) return c.json({ erro: 'Venda não encontrada' }, 404)

  const itens = db.query<Record<string, unknown>, [string]>(`
    SELECT i.*, p.nome, p.codigo, p.unidade
    FROM item_venda i
    JOIN produto p ON p.id = i.produto_id
    WHERE i.venda_id = ?
  `).all(id)

  return c.json({ ...venda, itens })
})

// POST /api/venda/:id/cancelar — cancelar venda (aceita motivo e autorizador para auditoria)
vendaRoutes.post('/:id/cancelar', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>
  const motivo = (body.motivo as string) || null
  const autorizador = body.autorizador ? JSON.stringify(body.autorizador) : null

  const venda = db.query<{ status: string }, [string]>('SELECT status FROM venda WHERE id = ?').get(id)
  if (!venda) return c.json({ erro: 'Venda não encontrada' }, 404)
  if (venda.status === 'cancelada') return c.json({ erro: 'Venda já está cancelada' }, 409)

  db.transaction(() => {
    // Estornar itens no estoque
    const itens = db.query<{ produto_id: string; quantidade: number }, [string]>(
      'SELECT produto_id, quantidade FROM item_venda WHERE venda_id = ?'
    ).all(id)

    const insertMov = db.prepare(`
      INSERT INTO movimento_estoque (id, produto_id, tipo, quantidade, saldo_apos, origem, origem_id, observacao)
      VALUES (?, ?, 'entrada', ?, ?, 'cancelamento', ?, 'Estorno de cancelamento de venda')
    `)

    for (const item of itens) {
      const saldoApos = getSaldoProduto(item.produto_id) + item.quantidade
      insertMov.run(crypto.randomUUID(), item.produto_id, item.quantidade, saldoApos, id)
    }

    db.prepare(`
      UPDATE venda SET status = 'cancelada', observacao = COALESCE(?, observacao) WHERE id = ?
    `).run(motivo ? `[CANCELADO] ${motivo}${autorizador ? ` | auth:${autorizador}` : ''}` : null, id)
  })()

  return c.json({ mensagem: 'Venda cancelada e estoque estornado' })
})
