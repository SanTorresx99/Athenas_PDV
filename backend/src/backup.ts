import { db } from './db/index'
import { join } from 'path'
import { readdirSync, unlinkSync, existsSync, mkdirSync } from 'fs'

const BACKUP_DIR = join(import.meta.dir, '../../.backups')
const MAX_BACKUPS = 2

function gerarBackup() {
  try {
    if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true })

    const data = new Date().toISOString().slice(0, 10)
    const destino = join(BACKUP_DIR, `athenas_${data}.db`)

    // VACUUM INTO cria uma cópia compacta e consistente do banco
    db.exec(`VACUUM INTO '${destino}'`)
    console.log(`[backup] ✓ ${destino}`)

    // Manter apenas os MAX_BACKUPS arquivos mais recentes
    const arquivos = readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('athenas_') && f.endsWith('.db'))
      .sort()
      .reverse()

    for (const arquivo of arquivos.slice(MAX_BACKUPS)) {
      unlinkSync(join(BACKUP_DIR, arquivo))
      console.log(`[backup] removido: ${arquivo}`)
    }
  } catch (err) {
    console.error('[backup] erro:', err)
  }
}

export function iniciarBackup() {
  // Executa backup ao iniciar (se ainda não existe um para hoje)
  const hoje = new Date().toISOString().slice(0, 10)
  const caminhoHoje = join(BACKUP_DIR, `athenas_${hoje}.db`)
  if (!existsSync(caminhoHoje)) gerarBackup()

  // Agendar backup diário às 03:00
  function agendarProximoBackup() {
    const agora = new Date()
    const amanha = new Date(agora)
    amanha.setDate(amanha.getDate() + 1)
    amanha.setHours(3, 0, 0, 0)
    const ms = amanha.getTime() - agora.getTime()
    setTimeout(() => { gerarBackup(); agendarProximoBackup() }, ms)
    console.log(`[backup] próximo em ${(ms / 3600000).toFixed(1)}h`)
  }

  agendarProximoBackup()
}
