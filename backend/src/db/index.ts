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
