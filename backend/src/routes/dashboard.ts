import { Hono } from 'hono'
import { db } from '../db/index'

export const dashboardRoutes = new Hono()

// GET /api/dashboard — KPIs do dia atual
dashboardRoutes.get('/', (c) => {
  const hoje = new Date().toISOString().slice(0, 10)
  const inicio = `${hoje} 00:00:00`

  // Faturamento e vendas do dia
  const resumo = db.query<{ faturamento: number; qtd_vendas: number; ticket_medio: number }, [string]>(`
    SELECT
      COALESCE(SUM(total), 0)   AS faturamento,
      COUNT(*)                   AS qtd_vendas,
      COALESCE(AVG(total), 0)   AS ticket_medio
    FROM venda
    WHERE criado_em >= ? AND status = 'fechada'
  `).get(inicio)

  // Produtos críticos
  const criticos = db.query<Record<string, unknown>, []>(`
    SELECT
      p.id, p.nome, p.estoque_min,
      COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade ELSE -m.quantidade END), 0) AS saldo
    FROM produto p
    LEFT JOIN movimento_estoque m ON m.produto_id = p.id
    WHERE p.ativo = 1
    GROUP BY p.id
    HAVING saldo <= p.estoque_min
    ORDER BY saldo ASC
    LIMIT 10
  `).all()

  // Últimas 5 vendas do dia
  const ultimas_vendas = db.query<Record<string, unknown>, [string]>(`
    SELECT id, numero, total, forma_pagto, criado_em
    FROM venda
    WHERE criado_em >= ? AND status = 'fechada'
    ORDER BY criado_em DESC
    LIMIT 5
  `).all(inicio)

  // Vendas por hora (distribuição do dia)
  const por_hora = db.query<{ hora: string; total: number; qtd: number }, [string]>(`
    SELECT
      strftime('%H', criado_em) AS hora,
      SUM(total) AS total,
      COUNT(*) AS qtd
    FROM venda
    WHERE criado_em >= ? AND status = 'fechada'
    GROUP BY hora
    ORDER BY hora
  `).all(inicio)

  // Produtos mais vendidos hoje
  const mais_vendidos = db.query<Record<string, unknown>, [string]>(`
    SELECT
      p.nome, p.unidade,
      SUM(i.quantidade) AS qtd_vendida,
      SUM(i.total) AS receita
    FROM item_venda i
    JOIN produto p ON p.id = i.produto_id
    JOIN venda v ON v.id = i.venda_id
    WHERE v.criado_em >= ? AND v.status = 'fechada'
    GROUP BY p.id
    ORDER BY qtd_vendida DESC
    LIMIT 5
  `).all(inicio)

  return c.json({
    data: hoje,
    resumo,
    criticos,
    ultimas_vendas,
    por_hora,
    mais_vendidos,
  })
})

// GET /api/dashboard/relatorio — top produtos por período (DSH-05)
// Query: de (YYYY-MM-DD), ate (YYYY-MM-DD), limite
dashboardRoutes.get('/relatorio', (c) => {
  const de  = c.req.query('de')  ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const ate = c.req.query('ate') ?? new Date().toISOString().slice(0, 10)
  const limite = Math.min(Number(c.req.query('limite') ?? 20), 100)

  const topProdutos = db.query<Record<string, unknown>, [string, string]>(`
    SELECT
      p.id, p.codigo, p.nome, p.unidade, p.categoria, p.custo_medio,
      SUM(i.quantidade)                                                   AS qtd_vendida,
      SUM(i.total)                                                        AS receita,
      SUM(i.total) - SUM(i.quantidade * COALESCE(i.custo_unitario, 0))   AS lucro_bruto,
      CASE WHEN SUM(i.total) > 0
        THEN ((SUM(i.total) - SUM(i.quantidade * COALESCE(i.custo_unitario, 0))) / SUM(i.total)) * 100
        ELSE 0
      END AS margem_media
    FROM item_venda i
    JOIN produto p ON p.id = i.produto_id
    JOIN venda v   ON v.id = i.venda_id
    WHERE v.criado_em BETWEEN ? AND ?
      AND v.status = 'fechada'
    GROUP BY p.id
    ORDER BY receita DESC
    LIMIT ${limite}
  `).all(`${de} 00:00:00`, `${ate} 23:59:59`)

  const porHora = db.query<Record<string, unknown>, [string, string]>(`
    SELECT
      strftime('%H', v.criado_em) AS hora,
      COUNT(*) AS qtd_vendas,
      SUM(v.total) AS faturamento
    FROM venda v
    WHERE v.criado_em BETWEEN ? AND ?
      AND v.status = 'fechada'
    GROUP BY hora ORDER BY hora
  `).all(`${de} 00:00:00`, `${ate} 23:59:59`)

  const resumoPeriodo = db.query<{ faturamento: number; qtd_vendas: number; ticket_medio: number }, [string, string]>(`
    SELECT
      COALESCE(SUM(total), 0) AS faturamento,
      COUNT(*) AS qtd_vendas,
      COALESCE(AVG(total), 0) AS ticket_medio
    FROM venda
    WHERE criado_em BETWEEN ? AND ? AND status = 'fechada'
  `).get(`${de} 00:00:00`, `${ate} 23:59:59`)

  return c.json({ de, ate, resumo: resumoPeriodo, top_produtos: topProdutos, por_hora: porHora })
})

// GET /api/dashboard/export/csv — export CSV do relatório (DSH-06)
dashboardRoutes.get('/export/csv', (c) => {
  const de  = c.req.query('de')  ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const ate = c.req.query('ate') ?? new Date().toISOString().slice(0, 10)
  const tipo = c.req.query('tipo') ?? 'top_produtos' // top_produtos | vendas

  let csv = ''

  if (tipo === 'top_produtos') {
    const rows = db.query<Record<string, unknown>, [string, string]>(`
      SELECT p.codigo, p.nome, p.categoria,
        SUM(i.quantidade) AS qtd_vendida,
        SUM(i.total) AS receita
      FROM item_venda i
      JOIN produto p ON p.id = i.produto_id
      JOIN venda v   ON v.id = i.venda_id
      WHERE v.criado_em BETWEEN ? AND ? AND v.status = 'fechada'
      GROUP BY p.id ORDER BY receita DESC
    `).all(`${de} 00:00:00`, `${ate} 23:59:59`)

    csv = 'Codigo,Nome,Categoria,Qtd Vendida,Receita\n'
    csv += (rows as any[]).map(r =>
      `${r.codigo},"${r.nome}","${r.categoria ?? ''}",${r.qtd_vendida},${Number(r.receita).toFixed(2)}`
    ).join('\n')
  } else {
    const rows = db.query<Record<string, unknown>, [string, string]>(`
      SELECT numero, total, desconto, troco, forma_pagto, status, criado_em
      FROM venda
      WHERE criado_em BETWEEN ? AND ? AND status = 'fechada'
      ORDER BY criado_em
    `).all(`${de} 00:00:00`, `${ate} 23:59:59`)

    csv = 'Numero,Total,Desconto,Troco,Forma Pagto,Status,Data\n'
    csv += (rows as any[]).map(r =>
      `${r.numero},${Number(r.total).toFixed(2)},${Number(r.desconto).toFixed(2)},${Number(r.troco).toFixed(2)},${r.forma_pagto},${r.status},${r.criado_em}`
    ).join('\n')
  }

  c.header('Content-Type', 'text/csv; charset=utf-8')
  c.header('Content-Disposition', `attachment; filename="athenas_${tipo}_${de}_${ate}.csv"`)
  return c.body(csv)
})
