import { Database } from 'bun:sqlite'
import { join } from 'path'

const DB_PATH = join(import.meta.dir, '../../athenas.db')

export const db = new Database(DB_PATH, { create: true })

db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')
db.exec('PRAGMA synchronous = NORMAL')
db.exec('PRAGMA busy_timeout = 5000')

try { db.exec('ALTER TABLE venda ADD COLUMN pagamentos TEXT') } catch (_) {}

export function getSaldoProduto(produto_id: string): number {
  const row = db.query<{ saldo: number }, string>(
    `SELECT COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN quantidade ELSE -quantidade END), 0) AS saldo
     FROM movimento_estoque WHERE produto_id = ?`
  ).get(produto_id)
  return row?.saldo ?? 0
}

export function getCMEProduto(produto_id: string): number {
  const row = db.query<{ custo_medio: number }, string>(
    'SELECT COALESCE(custo_medio, 0) AS custo_medio FROM produto WHERE id = ?'
  ).get(produto_id)
  return row?.custo_medio ?? 0
}

// Recalcula o CME pelo método PMP e persiste em produto.custo_medio
// Deve ser chamado DENTRO de uma transação, após confirmar o saldo atual
export function recalcularCME(produto_id: string, qtdEntrada: number, custoEntrada: number): number {
  const saldoAtual = getSaldoProduto(produto_id)
  const cmeAtual = getCMEProduto(produto_id)
  const cmeNovo = saldoAtual <= 0
    ? custoEntrada
    : (saldoAtual * cmeAtual + qtdEntrada * custoEntrada) / (saldoAtual + qtdEntrada)
  db.prepare('UPDATE produto SET custo_medio = ?, atualizado_em = datetime(\'now\') WHERE id = ?')
    .run(cmeNovo, produto_id)
  return cmeNovo
}
