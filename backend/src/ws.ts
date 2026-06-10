import type { Context } from 'hono'

// Conjunto de conexões WebSocket ativas
const clients = new Set<WebSocket>()

// Broadcast de evento para todos os clientes conectados
export function wsBroadcast(evento: string, dados: unknown) {
  const msg = JSON.stringify({ evento, dados, ts: new Date().toISOString() })
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg)
    else clients.delete(ws)
  }
}

// Handler para upgrade da conexão HTTP → WebSocket
// Registrado em GET /ws no index.ts
export function wsUpgrade(c: Context) {
  const upgrade = c.req.header('upgrade')
  if (upgrade?.toLowerCase() !== 'websocket') {
    return c.json({ erro: 'WebSocket upgrade necessário' }, 426)
  }

  const { response, socket } = (c.env as any).upgradeWebSocket?.() ?? {}
  if (!socket) return c.json({ erro: 'Upgrade não suportado neste ambiente' }, 500)

  socket.onopen = () => { clients.add(socket); console.log(`[ws] cliente conectado — total: ${clients.size}`) }
  socket.onclose = () => { clients.delete(socket); console.log(`[ws] cliente desconectado — total: ${clients.size}`) }
  socket.onerror = () => clients.delete(socket)

  return response
}

// Tipos de eventos padronizados
export const WS_EVENTOS = {
  NOVA_VENDA:      'nova_venda',
  ESTOQUE_CRITICO: 'estoque_critico',
  NOVO_PEDIDO_KDS: 'novo_pedido_kds',
  PEDIDO_PRONTO:   'pedido_pronto',
  CANCELAMENTO:    'cancelamento_venda',
} as const
