import { db } from './index'

export function seedIfEmpty() {
  const count = db.query<{ n: number }, []>('SELECT COUNT(*) as n FROM produto').get()
  if (count && count.n > 0) return

  console.log('[seed] Populando banco com dados iniciais...')

  // Usuário admin
  const adminId = crypto.randomUUID()
  db.prepare(`
    INSERT INTO usuario (id, nome, login, senha_hash, perfil)
    VALUES (?, 'Administrador', 'admin', ?, 'admin')
  `).run(adminId, Bun.password.hashSync('athenas@123'))

  // Dispositivo Hub
  db.prepare(`
    INSERT INTO dispositivo (id, nome, tipo, ativo)
    VALUES (?, 'PC Principal', 'hub', 1)
  `).run(crypto.randomUUID())

  // Licença trial (7 dias)
  db.prepare(`
    INSERT OR IGNORE INTO licenca (id, coins_disponiveis, dias_restantes, modo)
    VALUES ('principal', 100, 7, 'trial')
  `).run()

  // Fornecedor de exemplo
  const fornecedorId = crypto.randomUUID()
  db.prepare(`
    INSERT INTO fornecedor (id, nome, telefone, contato)
    VALUES (?, 'Distribuidora Central', '(11) 99999-0000', 'João')
  `).run(fornecedorId)

  // Produtos — distribuidora/adega
  const produtos = [
    { codigo: '7891234567890', nome: 'Cerveja Lata 350ml',     unidade: 'UN', preco_venda: 4.50,  preco_custo: 2.80,  categoria: 'Cervejas',   estoque_min: 24 },
    { codigo: '7891234567891', nome: 'Cerveja Long Neck 600ml', unidade: 'UN', preco_venda: 7.00,  preco_custo: 4.20,  categoria: 'Cervejas',   estoque_min: 12 },
    { codigo: '7891234567892', nome: 'Vodka 1L',                unidade: 'UN', preco_venda: 35.00, preco_custo: 22.00, categoria: 'Destilados', estoque_min: 6  },
    { codigo: '7891234567893', nome: 'Cachaça 1L',              unidade: 'UN', preco_venda: 18.00, preco_custo: 10.00, categoria: 'Destilados', estoque_min: 6  },
    { codigo: '7891234567894', nome: 'Whisky 1L',               unidade: 'UN', preco_venda: 85.00, preco_custo: 55.00, categoria: 'Destilados', estoque_min: 3  },
    { codigo: '7891234567895', nome: 'Água Mineral 500ml',      unidade: 'UN', preco_venda: 2.00,  preco_custo: 0.90,  categoria: 'Águas',      estoque_min: 48 },
    { codigo: '7891234567896', nome: 'Refrigerante Cola 2L',    unidade: 'UN', preco_venda: 7.50,  preco_custo: 4.50,  categoria: 'Refrigerantes', estoque_min: 12 },
    { codigo: '7891234567897', nome: 'Refrigerante Cola 350ml', unidade: 'UN', preco_venda: 3.50,  preco_custo: 1.80,  categoria: 'Refrigerantes', estoque_min: 24 },
    { codigo: '7891234567898', nome: 'Suco Caixinha 200ml',     unidade: 'UN', preco_venda: 3.00,  preco_custo: 1.50,  categoria: 'Sucos',      estoque_min: 24 },
    { codigo: '7891234567899', nome: 'Vinho Tinto 750ml',       unidade: 'UN', preco_venda: 28.00, preco_custo: 16.00, categoria: 'Vinhos',     estoque_min: 6  },
    { codigo: '7891234567900', nome: 'Energético 250ml',        unidade: 'UN', preco_venda: 8.00,  preco_custo: 4.50,  categoria: 'Energéticos', estoque_min: 12 },
    { codigo: '7891234567901', nome: 'Amendoim 100g',           unidade: 'UN', preco_venda: 5.00,  preco_custo: 2.50,  categoria: 'Snacks',     estoque_min: 20 },
  ]

  const insertProduto = db.prepare(`
    INSERT INTO produto (id, codigo, nome, unidade, preco_venda, preco_custo, categoria, estoque_min)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertMovimento = db.prepare(`
    INSERT INTO movimento_estoque (id, produto_id, tipo, quantidade, saldo_apos, origem, observacao)
    VALUES (?, ?, 'entrada', ?, ?, 'seed', 'Estoque inicial')
  `)

  const estoqueInicial: Record<string, number> = {
    'Cerveja Lata 350ml': 72, 'Cerveja Long Neck 600ml': 36, 'Vodka 1L': 12,
    'Cachaça 1L': 18, 'Whisky 1L': 6, 'Água Mineral 500ml': 120,
    'Refrigerante Cola 2L': 24, 'Refrigerante Cola 350ml': 48, 'Suco Caixinha 200ml': 48,
    'Vinho Tinto 750ml': 12, 'Energético 250ml': 36, 'Amendoim 100g': 60,
  }

  const seedTx = db.transaction(() => {
    for (const p of produtos) {
      const id = crypto.randomUUID()
      insertProduto.run(id, p.codigo, p.nome, p.unidade, p.preco_venda, p.preco_custo, p.categoria, p.estoque_min)
      const qtd = estoqueInicial[p.nome] ?? 10
      insertMovimento.run(crypto.randomUUID(), id, qtd, qtd)
    }
  })
  seedTx()

  console.log('[seed] ✓ Banco populado com', produtos.length, 'produtos')
  console.log('[seed] ✓ Login padrão: admin / athenas@123')
}
