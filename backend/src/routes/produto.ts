import { Hono } from 'hono'
import { db, getCMEProduto, getSaldoProduto } from '../db/index'

export const produtoRoutes = new Hono()

interface Produto {
  id: string; codigo: string; nome: string; descricao: string | null
  unidade: string; preco_venda: number; preco_custo: number | null
  custo_medio: number; tipo: string; categoria: string | null
  estoque_min: number; ativo: number; requer_producao: number
  tempo_preparo_min: number | null; rendimento_qtd: number | null; rendimento_un: string | null
  qtd_embalagem: number | null; criado_em: string; atualizado_em: string | null
}

// GET /api/produto — lista todos os produtos ativos
produtoRoutes.get('/', (c) => {
  const categoria = c.req.query('categoria')
  const tipo = c.req.query('tipo')
  const ativo = c.req.query('ativo') ?? '1'

  let sql = 'SELECT * FROM produto WHERE ativo = ?'
  const params: unknown[] = [ativo]
  if (categoria) { sql += ' AND categoria = ?'; params.push(categoria) }
  if (tipo)      { sql += ' AND tipo = ?';      params.push(tipo) }
  sql += ' ORDER BY nome'

  return c.json(db.query<Produto, unknown[]>(sql).all(...params))
})

// GET /api/produto/busca?q= — busca por nome, código ou código alias
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

// GET /api/produto/:id — detalhe com ficha técnica e recursos
produtoRoutes.get('/:id', (c) => {
  const produto = db.query<Produto, [string]>('SELECT * FROM produto WHERE id = ?').get(c.req.param('id'))
  if (!produto) return c.json({ erro: 'Produto não encontrado' }, 404)

  const ficha = produto.tipo === 'fabricado'
    ? db.query<Record<string, unknown>, [string]>(
        'SELECT ft.*, p.nome as insumo_produto_nome FROM ficha_tecnica ft LEFT JOIN produto p ON p.id = ft.insumo_id WHERE ft.produto_id = ? ORDER BY ft.ordem'
      ).all(produto.id)
    : []

  const recursos = produto.tipo === 'servico'
    ? db.query<Record<string, unknown>, [string]>(
        'SELECT * FROM recurso_servico WHERE produto_id = ? ORDER BY tipo, nome'
      ).all(produto.id)
    : []

  const saldo = getSaldoProduto(produto.id)
  return c.json({ ...produto, saldo, ficha, recursos })
})

// GET /api/produto/:id/custo — CME, CMV estimado, margem, histórico de custo (PRD-09)
produtoRoutes.get('/:id/custo', (c) => {
  const id = c.req.param('id')
  const produto = db.query<{ preco_venda: number; custo_medio: number; tipo: string }, [string]>(
    'SELECT preco_venda, custo_medio, tipo FROM produto WHERE id = ?'
  ).get(id)
  if (!produto) return c.json({ erro: 'Produto não encontrado' }, 404)

  const cme = produto.custo_medio ?? 0
  const pv = produto.preco_venda
  const margem = pv > 0 ? ((pv - cme) / pv) * 100 : 0
  const markup = cme > 0 ? (pv / cme - 1) * 100 : 0

  // CMV estimado de fabricado = soma dos insumos × CME de cada insumo
  let cmvFabricado: number | null = null
  if (produto.tipo === 'fabricado') {
    const itens = db.query<{ insumo_id: string | null; quantidade: number; custo_unitario: number }, [string]>(
      'SELECT insumo_id, quantidade, custo_unitario FROM ficha_tecnica WHERE produto_id = ?'
    ).all(id)
    cmvFabricado = itens.reduce((s, it) => {
      const cmeInsumo = it.insumo_id ? getCMEProduto(it.insumo_id) : it.custo_unitario
      return s + cmeInsumo * it.quantidade
    }, 0)
  }

  const historicoCusto = db.query<Record<string, unknown>, [string]>(`
    SELECT criado_em, custo_unitario, quantidade, tipo, origem
    FROM movimento_estoque
    WHERE produto_id = ? AND tipo = 'entrada' AND custo_unitario IS NOT NULL
    ORDER BY criado_em DESC LIMIT 20
  `).all(id)

  return c.json({
    custo_medio: cme,
    preco_venda: pv,
    margem_bruta: margem,
    markup,
    lucro_unitario: pv - cme,
    cmv_fabricado: cmvFabricado,
    historico_custo: historicoCusto,
  })
})

// POST /api/produto — cadastrar produto
produtoRoutes.post('/', async (c) => {
  const body = await c.req.json()
  const {
    codigo, nome, unidade = 'UN', preco_venda, preco_custo, categoria,
    estoque_min = 0, descricao, tipo = 'revenda', requer_producao = 0,
    tempo_preparo_min, rendimento_qtd, rendimento_un, qtd_embalagem,
  } = body

  if (!codigo || !nome || preco_venda == null) {
    return c.json({ erro: 'codigo, nome e preco_venda são obrigatórios' }, 400)
  }

  const existente = db.query<{ id: string }, [string]>('SELECT id FROM produto WHERE codigo = ?').get(codigo)
  if (existente) return c.json({ erro: 'Código já cadastrado' }, 409)

  const id = crypto.randomUUID()
  db.prepare(`
    INSERT INTO produto (id, codigo, nome, descricao, unidade, preco_venda, preco_custo, categoria,
                         estoque_min, tipo, requer_producao, tempo_preparo_min, rendimento_qtd, rendimento_un, qtd_embalagem)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, codigo, nome, descricao ?? null, unidade, preco_venda, preco_custo ?? null,
        categoria ?? null, estoque_min, tipo, requer_producao ? 1 : 0,
        tempo_preparo_min ?? null, rendimento_qtd ?? null, rendimento_un ?? null, qtd_embalagem ?? null)

  return c.json({ id, mensagem: 'Produto cadastrado' }, 201)
})

// PUT /api/produto/:id — editar produto
produtoRoutes.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const {
    nome, descricao, unidade, preco_venda, preco_custo, categoria,
    estoque_min, ativo, tipo, requer_producao, tempo_preparo_min,
    rendimento_qtd, rendimento_un, qtd_embalagem,
  } = body

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
      tipo = COALESCE(?, tipo),
      requer_producao = COALESCE(?, requer_producao),
      tempo_preparo_min = COALESCE(?, tempo_preparo_min),
      rendimento_qtd = COALESCE(?, rendimento_qtd),
      rendimento_un = COALESCE(?, rendimento_un),
      qtd_embalagem = COALESCE(?, qtd_embalagem),
      atualizado_em = datetime('now')
    WHERE id = ?
  `).run(
    nome ?? null, descricao ?? null, unidade ?? null, preco_venda ?? null,
    preco_custo ?? null, categoria ?? null, estoque_min ?? null, ativo ?? null,
    tipo ?? null, requer_producao != null ? (requer_producao ? 1 : 0) : null,
    tempo_preparo_min ?? null, rendimento_qtd ?? null, rendimento_un ?? null,
    qtd_embalagem ?? null, id,
  )

  return c.json({ mensagem: 'Produto atualizado' })
})

// POST /api/produto/:id/ficha — salvar ficha técnica (BOM) do fabricado (PRD-10)
produtoRoutes.post('/:id/ficha', async (c) => {
  const produto_id = c.req.param('id')
  const body = await c.req.json()
  const { itens } = body // [{ insumo_id?, insumo_nome, quantidade, unidade, observacao }]

  if (!Array.isArray(itens)) return c.json({ erro: 'itens é obrigatório' }, 400)

  const produto = db.query<{ tipo: string }, [string]>('SELECT tipo FROM produto WHERE id = ?').get(produto_id)
  if (!produto) return c.json({ erro: 'Produto não encontrado' }, 404)
  if (produto.tipo !== 'fabricado') return c.json({ erro: 'Produto não é do tipo fabricado' }, 422)

  db.transaction(() => {
    db.prepare('DELETE FROM ficha_tecnica WHERE produto_id = ?').run(produto_id)
    for (let i = 0; i < itens.length; i++) {
      const it = itens[i]
      const custoUnit = it.insumo_id ? getCMEProduto(it.insumo_id) : (it.custo_unitario ?? 0)
      db.prepare(`
        INSERT INTO ficha_tecnica (id, produto_id, insumo_id, insumo_nome, quantidade, unidade, custo_unitario, ordem, observacao)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(crypto.randomUUID(), produto_id, it.insumo_id ?? null, it.insumo_nome,
             it.quantidade, it.unidade ?? 'UN', custoUnit, i, it.observacao ?? null)
    }
  })()

  const custoTotal = itens.reduce((s: number, it: any) => {
    const cme = it.insumo_id ? getCMEProduto(it.insumo_id) : (it.custo_unitario ?? 0)
    return s + cme * it.quantidade
  }, 0)

  return c.json({ mensagem: 'Ficha técnica salva', custo_total: custoTotal })
})

// POST /api/produto/:id/recurso — adicionar recurso ao serviço (PRD-11)
produtoRoutes.post('/:id/recurso', async (c) => {
  const produto_id = c.req.param('id')
  const body = await c.req.json()
  const { tipo = 'material', nome, insumo_id, quantidade = 1, unidade = 'UN', obrigatorio = 1, observacao } = body

  if (!nome) return c.json({ erro: 'nome é obrigatório' }, 400)

  const produto = db.query<{ tipo: string }, [string]>('SELECT tipo FROM produto WHERE id = ?').get(produto_id)
  if (!produto) return c.json({ erro: 'Produto não encontrado' }, 404)
  if (produto.tipo !== 'servico') return c.json({ erro: 'Produto não é do tipo servico' }, 422)

  const id = crypto.randomUUID()
  db.prepare(`
    INSERT INTO recurso_servico (id, produto_id, tipo, nome, insumo_id, quantidade, unidade, obrigatorio, observacao)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, produto_id, tipo, nome, insumo_id ?? null, quantidade, unidade, obrigatorio ? 1 : 0, observacao ?? null)

  return c.json({ id, mensagem: 'Recurso adicionado' }, 201)
})

// DELETE /api/produto/:id/recurso/:rid
produtoRoutes.delete('/:id/recurso/:rid', (c) => {
  db.prepare('DELETE FROM recurso_servico WHERE id = ? AND produto_id = ?')
    .run(c.req.param('rid'), c.req.param('id'))
  return c.json({ mensagem: 'Recurso removido' })
})
