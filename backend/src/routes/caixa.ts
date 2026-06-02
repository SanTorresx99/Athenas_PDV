import { Hono } from 'hono'
import { db } from '../db/index'

export const caixaRoutes = new Hono()

// POST /api/caixa/abrir — registra abertura de turno
caixaRoutes.post('/abrir', async (c) => {
  const { operador_nome, operador_codigo, fundo_inicial = 0, dispositivo_id } = await c.req.json()

  if (!operador_nome) return c.json({ erro: 'operador_nome é obrigatório' }, 400)

  const id = crypto.randomUUID()
  db.prepare(`
    INSERT INTO caixa_sessao (id, dispositivo_id, operador_nome, operador_codigo, fundo_inicial, status)
    VALUES (?, ?, ?, ?, ?, 'aberto')
  `).run(id, dispositivo_id ?? null, operador_nome, operador_codigo ?? null, fundo_inicial)

  db.prepare(`
    INSERT INTO audit_log (id, acao, referencia_id, operador_nome, descricao)
    VALUES (?, 'abertura_caixa', ?, ?, ?)
  `).run(crypto.randomUUID(), id, operador_nome, `Caixa aberto com fundo R$ ${Number(fundo_inicial).toFixed(2)}`)

  return c.json({ id, mensagem: 'Caixa aberto' }, 201)
})

// POST /api/caixa/:id/fechar — registra fechamento do turno
caixaRoutes.post('/:id/fechar', async (c) => {
  const id = c.req.param('id')
  const { supervisor_nome, supervisor_codigo, contagem_fisica } = await c.req.json()

  if (!supervisor_nome) return c.json({ erro: 'supervisor_nome é obrigatório' }, 400)

  const sessao = db.query<{ status: string }, [string]>(
    'SELECT status FROM caixa_sessao WHERE id = ?'
  ).get(id)
  if (!sessao) return c.json({ erro: 'Sessão não encontrada' }, 404)
  if (sessao.status === 'fechado') return c.json({ erro: 'Sessão já encerrada' }, 409)

  db.prepare(`
    UPDATE caixa_sessao
    SET fechado_em = datetime('now'), status = 'fechado',
        supervisor_nome = ?, supervisor_codigo = ?, contagem_fisica = ?
    WHERE id = ?
  `).run(supervisor_nome, supervisor_codigo ?? null, contagem_fisica ?? null, id)

  db.prepare(`
    INSERT INTO audit_log (id, acao, referencia_id, operador_nome, supervisor_nome, descricao)
    VALUES (?, 'fechamento_caixa', ?, ?, ?, 'Turno encerrado')
  `).run(crypto.randomUUID(), id, null, supervisor_nome)

  return c.json({ mensagem: 'Caixa fechado' })
})

// POST /api/caixa/:id/sangria — registra retirada de numerário
caixaRoutes.post('/:id/sangria', async (c) => {
  const sessao_id = c.req.param('id')
  const { valor, motivo, supervisor_nome, supervisor_codigo } = await c.req.json()

  if (!valor || Number(valor) <= 0) return c.json({ erro: 'valor inválido' }, 400)
  if (!supervisor_nome) return c.json({ erro: 'supervisor_nome é obrigatório' }, 400)

  const id = crypto.randomUUID()
  db.prepare(`
    INSERT INTO sangria (id, sessao_id, valor, motivo, supervisor_nome, supervisor_codigo)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, sessao_id, valor, motivo ?? null, supervisor_nome, supervisor_codigo ?? null)

  db.prepare(`
    INSERT INTO audit_log (id, acao, referencia_id, supervisor_nome, descricao)
    VALUES (?, 'sangria', ?, ?, ?)
  `).run(crypto.randomUUID(), id, supervisor_nome,
    `Sangria R$ ${Number(valor).toFixed(2)}${motivo ? ` — ${motivo}` : ''}`)

  return c.json({ id, mensagem: 'Sangria registrada' }, 201)
})

// GET /api/caixa/sessao-ativa — retorna sessão em aberto (se houver)
caixaRoutes.get('/sessao-ativa', (c) => {
  const sessao = db.query<Record<string, unknown>, []>(
    `SELECT cs.*,
       (SELECT COALESCE(SUM(s.valor),0) FROM sangria s WHERE s.sessao_id = cs.id) as total_sangrias,
       (SELECT COUNT(*) FROM venda v WHERE v.dispositivo_id = cs.id AND v.status = 'fechada') as total_vendas,
       (SELECT COALESCE(SUM(v.total),0) FROM venda v WHERE v.dispositivo_id = cs.id AND v.status = 'fechada') as total_faturado
     FROM caixa_sessao cs
     WHERE cs.status = 'aberto'
     ORDER BY cs.aberto_em DESC LIMIT 1`
  ).get()

  if (!sessao) return c.json(null)
  return c.json(sessao)
})
