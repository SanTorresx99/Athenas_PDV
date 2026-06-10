import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { produtoRoutes }   from './routes/produto'
import { vendaRoutes }     from './routes/venda'
import { estoqueRoutes }   from './routes/estoque'
import { comprasRoutes }   from './routes/compras'
import { licencaRoutes }   from './routes/licenca'
import { dashboardRoutes } from './routes/dashboard'
import { caixaRoutes }     from './routes/caixa'
import { clienteRoutes }   from './routes/cliente'
import { kdsRoutes }       from './routes/kds'
import { authMiddleware }  from './middleware/auth'
import { runMigrations }   from './db/migrate'
import { seedIfEmpty }     from './db/seed'
import { iniciarLicenca }  from './license/coins'
import { iniciarBackup }   from './backup'
import { wsBroadcast, wsUpgrade } from './ws'

// ── Startup ──────────────────────────────────────────────────────────────────
runMigrations()
seedIfEmpty()
iniciarLicenca()
iniciarBackup()

// ── App ───────────────────────────────────────────────────────────────────────
const app = new Hono()

app.use('*', logger())
app.use('/api/*', cors({ origin: '*' }))
app.use('/api/*', authMiddleware)

// Health check
app.get('/', (c) => c.json({
  status: 'ok',
  sistema: 'ATHENAS PDV',
  versao: '0.2.0',
  timestamp: new Date().toISOString(),
}))

// WebSocket — upgrade em /ws
app.get('/ws', wsUpgrade)

// Rotas
app.route('/api/produto',   produtoRoutes)
app.route('/api/venda',     vendaRoutes)
app.route('/api/estoque',   estoqueRoutes)
app.route('/api/compras',   comprasRoutes)
app.route('/api/licenca',   licencaRoutes)
app.route('/api/dashboard', dashboardRoutes)
app.route('/api/caixa',     caixaRoutes)
app.route('/api/cliente',   clienteRoutes)
app.route('/api/kds',       kdsRoutes)

// 404
app.notFound((c) => c.json({ erro: 'Rota não encontrada' }, 404))

export { wsBroadcast }

console.log('🏛️  ATHENAS PDV — Backend rodando em http://localhost:3001')

export default { port: 3001, fetch: app.fetch }
