import { Hono } from 'hono'
import { getLicencaStatus, aplicarToken } from '../license/coins'

export const licencaRoutes = new Hono()

// GET /api/licenca/status — status atual da licença (público)
licencaRoutes.get('/status', (c) => {
  const licenca = getLicencaStatus()
  if (!licenca) return c.json({ modo: 'sem_licenca', dias_restantes: 0 })

  const { dias_restantes, modo, coins_disponiveis, notificou_7dias } = licenca
  const alerta = dias_restantes <= 7 ? (dias_restantes <= 3 ? 'critico' : 'aviso') : null

  return c.json({ dias_restantes, modo, coins_disponiveis, alerta, notificou_7dias })
})

// POST /api/licenca/token — aplicar token de renovação
licencaRoutes.post('/token', async (c) => {
  const body = await c.req.json()
  const { token } = body

  if (!token || typeof token !== 'string') {
    return c.json({ ok: false, mensagem: 'Token é obrigatório' }, 400)
  }

  const resultado = aplicarToken(token.trim())
  const status = resultado.ok ? 200 : 400

  return c.json(resultado, status)
})
