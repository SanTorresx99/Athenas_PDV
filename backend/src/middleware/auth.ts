import type { Context, Next } from 'hono'
import { db } from '../db/index'

// Rotas públicas — não exigem token de instalação
const ROTAS_PUBLICAS = ['/', '/api/licenca/status']

export async function authMiddleware(c: Context, next: Next) {
  if (ROTAS_PUBLICAS.includes(c.req.path)) {
    return next()
  }

  const licenca = db.query<{ modo: string }, []>(
    'SELECT modo FROM licenca WHERE id = ?'
  ).get('principal')

  // Se não há licença configurada ainda, permite acesso (primeiro setup)
  if (!licenca) return next()

  // Modo suspenso: apenas rotas de leitura e licença são permitidas
  if (licenca.modo === 'suspenso') {
    const isLeitura = c.req.method === 'GET' || c.req.path.startsWith('/api/licenca')
    if (!isLeitura) {
      return c.json({ erro: 'Sistema suspenso. Renove a licença para continuar operando.' }, 403)
    }
  }

  return next()
}
