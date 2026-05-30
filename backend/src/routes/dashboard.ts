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
