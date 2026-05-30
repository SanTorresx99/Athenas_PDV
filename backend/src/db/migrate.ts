import { db } from './index'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const MIGRATIONS_DIR = join(import.meta.dir, 'migrations')

export function runMigrations() {
  db.exec(`CREATE TABLE IF NOT EXISTS migration_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nome        TEXT NOT NULL UNIQUE,
    aplicado_em TEXT DEFAULT (datetime('now'))
  )`)

  const aplicadas = new Set(
    db.query<{ nome: string }, []>('SELECT nome FROM migration_log').all().map(r => r.nome)
  )

  const arquivos = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const arquivo of arquivos) {
    if (aplicadas.has(arquivo)) continue

    const sql = readFileSync(join(MIGRATIONS_DIR, arquivo), 'utf-8')
    db.exec(sql)
    db.prepare('INSERT INTO migration_log (nome) VALUES (?)').run(arquivo)
    console.log(`[migrate] ✓ ${arquivo}`)
  }
}
