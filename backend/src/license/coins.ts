import { db } from '../db/index'

interface Licenca {
  id: string
  coins_disponiveis: number
  dias_restantes: number
  modo: string
  token_hash: string | null
  ultimo_check: string
  notificou_7dias: number
}

export function iniciarLicenca() {
  const licenca = db.query<Licenca, []>('SELECT * FROM licenca WHERE id = ?').get('principal')

  if (!licenca) {
    db.prepare(`
      INSERT INTO licenca (id, coins_disponiveis, dias_restantes, modo)
      VALUES ('principal', 100, 7, 'trial')
    `).run()
    console.log('[licenca] Trial de 7 dias iniciado')
    return
  }

  decrementarDiaSePreciso(licenca)
  logStatusLicenca(licenca)
}

function decrementarDiaSePreciso(licenca: Licenca) {
  const hoje = new Date().toISOString().slice(0, 10)
  const ultimoCheck = licenca.ultimo_check.slice(0, 10)

  if (hoje === ultimoCheck) return

  const diasPassados = Math.floor(
    (new Date(hoje).getTime() - new Date(ultimoCheck).getTime()) / 86_400_000
  )

  const novosDias = Math.max(0, licenca.dias_restantes - diasPassados)
  const novoModo = novosDias === 0 ? 'suspenso' : licenca.modo === 'suspenso' ? 'suspenso' : licenca.modo

  db.prepare(`
    UPDATE licenca SET dias_restantes = ?, modo = ?, ultimo_check = datetime('now') WHERE id = 'principal'
  `).run(novosDias, novoModo)

  if (novosDias <= 7 && !licenca.notificou_7dias) {
    db.prepare(`UPDATE licenca SET notificou_7dias = 1 WHERE id = 'principal'`).run()
  }
}

function logStatusLicenca(licenca: Licenca) {
  const { dias_restantes, modo } = licenca
  if (modo === 'suspenso') {
    console.warn('[licenca] ⚠️  Sistema SUSPENSO — renove a licença')
  } else if (dias_restantes <= 3) {
    console.warn(`[licenca] ⚠️  ${dias_restantes} dias restantes`)
  } else if (dias_restantes <= 7) {
    console.log(`[licenca] ℹ️  ${dias_restantes} dias restantes`)
  } else {
    console.log(`[licenca] ✓ ${dias_restantes} dias restantes (${modo})`)
  }
}

export function aplicarToken(token: string): { ok: boolean; mensagem: string } {
  // Formato: ATHENAS-{base64url_payload}-{hmac_8chars}
  const partes = token.toUpperCase().split('-')
  if (partes.length !== 3 || partes[0] !== 'ATHENAS') {
    return { ok: false, mensagem: 'Token inválido' }
  }

  try {
    const payload = JSON.parse(atob(partes[1].replace(/_/g, '/').replace(/-/g, '+')))
    const { dias, expira } = payload

    if (new Date(expira) < new Date()) {
      return { ok: false, mensagem: 'Token expirado' }
    }

    // Verificar reuso
    const tokenHash = computarHash(token)
    const licenca = db.query<Licenca, []>('SELECT * FROM licenca WHERE id = ?').get('principal')
    if (licenca?.token_hash === tokenHash) {
      return { ok: false, mensagem: 'Token já utilizado' }
    }

    const novosDias = (licenca?.dias_restantes ?? 0) + dias
    db.prepare(`
      UPDATE licenca
      SET dias_restantes = ?, modo = 'ativo', token_hash = ?, notificou_7dias = 0,
          ultimo_check = datetime('now')
      WHERE id = 'principal'
    `).run(novosDias, tokenHash)

    return { ok: true, mensagem: `Licença renovada: +${dias} dias (total: ${novosDias} dias)` }
  } catch {
    return { ok: false, mensagem: 'Token corrompido ou inválido' }
  }
}

function computarHash(input: string): string {
  // Hashing simples para reuso — em produção usar HMAC-SHA256
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (Math.imul(31, hash) + input.charCodeAt(i)) | 0
  }
  return hash.toString(16)
}

export function getLicencaStatus() {
  return db.query<Licenca, []>('SELECT * FROM licenca WHERE id = ?').get('principal')
}
