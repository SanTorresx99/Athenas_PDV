import { Hono } from 'hono'
import { db } from '../db/index'

export const clienteRoutes = new Hono()

// GET /api/cliente — lista clientes ativos
clienteRoutes.get('/', (c) => {
  const q = c.req.query('q')
  if (q) {
    const clientes = db.query<Record<string, unknown>, [string, string]>(
      `SELECT * FROM cliente WHERE ativo = 1 AND (nome LIKE ? OR cpf_cnpj LIKE ?) ORDER BY nome LIMIT 20`
    ).all(`%${q}%`, `%${q}%`)
    return c.json(clientes)
  }
  return c.json(db.query<Record<string, unknown>, []>('SELECT * FROM cliente WHERE ativo = 1 ORDER BY nome').all())
})

// GET /api/cliente/:id — detalhe + saldo devedor
clienteRoutes.get('/:id', (c) => {
  const id = c.req.param('id')
  const cliente = db.query<Record<string, unknown>, [string]>('SELECT * FROM cliente WHERE id = ?').get(id)
  if (!cliente) return c.json({ erro: 'Cliente não encontrado' }, 404)

  const saldo = db.query<{ saldo: number }, [string]>(`
    SELECT COALESCE(SUM(CASE WHEN tipo = 'compra' THEN valor ELSE -valor END), 0) AS saldo
    FROM conta_corrente WHERE cliente_id = ?
  `).get(id)

  const historico = db.query<Record<string, unknown>, [string]>(`
    SELECT cc.*, v.numero as venda_numero, v.total as venda_total
    FROM conta_corrente cc
    LEFT JOIN venda v ON v.id = cc.venda_id
    WHERE cc.cliente_id = ?
    ORDER BY cc.criado_em DESC LIMIT 50
  `).all(id)

  return c.json({ ...cliente, saldo_devedor: saldo?.saldo ?? 0, historico })
})

// POST /api/cliente — cadastrar cliente
clienteRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const { nome, cpf_cnpj, telefone, email, endereco, limite_fiado = 0 } = body

  if (!nome) return c.json({ erro: 'nome é obrigatório' }, 400)

  if (cpf_cnpj) {
    const existente = db.query<{ id: string }, [string]>('SELECT id FROM cliente WHERE cpf_cnpj = ?').get(cpf_cnpj)
    if (existente) return c.json({ erro: 'CPF/CNPJ já cadastrado' }, 409)
  }

  const id = crypto.randomUUID()
  db.prepare(`
    INSERT INTO cliente (id, nome, cpf_cnpj, telefone, email, endereco, limite_fiado)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, nome, cpf_cnpj ?? null, telefone ?? null, email ?? null, endereco ?? null, limite_fiado)

  return c.json({ id, mensagem: 'Cliente cadastrado' }, 201)
})

// PUT /api/cliente/:id — editar cliente
clienteRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { nome, cpf_cnpj, telefone, email, endereco, limite_fiado, ativo } = body

  const existe = db.query<{ id: string }, [string]>('SELECT id FROM cliente WHERE id = ?').get(id)
  if (!existe) return c.json({ erro: 'Cliente não encontrado' }, 404)

  db.prepare(`
    UPDATE cliente SET
      nome = COALESCE(?, nome),
      cpf_cnpj = COALESCE(?, cpf_cnpj),
      telefone = COALESCE(?, telefone),
      email = COALESCE(?, email),
      endereco = COALESCE(?, endereco),
      limite_fiado = COALESCE(?, limite_fiado),
      ativo = COALESCE(?, ativo)
    WHERE id = ?
  `).run(nome ?? null, cpf_cnpj ?? null, telefone ?? null, email ?? null,
         endereco ?? null, limite_fiado ?? null, ativo ?? null, id)

  return c.json({ mensagem: 'Cliente atualizado' })
})

// POST /api/cliente/:id/pagar — registrar pagamento de fiado (CLI-03)
clienteRoutes.post('/:id/pagar', async (c) => {
  const cliente_id = c.req.param('id')
  const body = await c.req.json()
  const { valor, observacao } = body

  if (!valor || Number(valor) <= 0) return c.json({ erro: 'valor inválido' }, 400)

  const cliente = db.query<{ id: string; nome: string }, [string]>(
    'SELECT id, nome FROM cliente WHERE id = ? AND ativo = 1'
  ).get(cliente_id)
  if (!cliente) return c.json({ erro: 'Cliente não encontrado' }, 404)

  const saldoAntes = db.query<{ saldo: number }, [string]>(`
    SELECT COALESCE(SUM(CASE WHEN tipo = 'compra' THEN valor ELSE -valor END), 0) AS saldo
    FROM conta_corrente WHERE cliente_id = ?
  `).get(cliente_id)?.saldo ?? 0

  const id = crypto.randomUUID()
  db.prepare(`
    INSERT INTO conta_corrente (id, cliente_id, tipo, valor, observacao)
    VALUES (?, ?, 'pagamento', ?, ?)
  `).run(id, cliente_id, Number(valor), observacao ?? null)

  const saldoDepois = saldoAntes - Number(valor)

  return c.json({
    id,
    mensagem: 'Pagamento registrado',
    cliente: cliente.nome,
    saldo_anterior: saldoAntes,
    saldo_atual: saldoDepois,
  }, 201)
})
