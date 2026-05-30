# Sincronização P2P — ATHENAS PDV

## Modelo de sincronização

O ATHENAS usa um modelo **Hub-and-Spoke** na LAN:

- **Hub (PC Principal):** única fonte da verdade. Detém o SQLite. Expõe API REST.
- **Spokes (módulos secundários):** clientes HTTP que leem e escrevem via API do Hub.
- Módulos secundários **nunca** acessam o SQLite diretamente.

```
[Caixa 2]──────┐
[Caixa 3]──────┤──► Hub (SQLite) ──► [Sync Cloud opcional]
[Estoque]──────┤
[Cozinha]──────┘
```

---

## Descoberta automática na LAN (mDNS)

O Hub anuncia seu serviço via **mDNS** (Multicast DNS, protocolo padrão):

```
Serviço: _athenas._tcp.local
Host:    athenas-hub.local
Porta:   3000
TXT:     version=1, id=<uuid_instalacao>
```

Módulos secundários fazem discovery ao iniciar:
1. Procuram por `_athenas._tcp.local` na rede
2. Ao encontrar, armazenam o IP/host do Hub localmente
3. Se o Hub mudar de IP, o mDNS atualiza automaticamente

> Sem mDNS disponível: IP do Hub pode ser configurado manualmente em **Configurações → Rede**.

---

## Eleição de Hub

Se o PC principal mudar ou for substituído, o sistema elege novo Hub por:
1. Configuração explícita (recomendado): DEV marca qual máquina é o Hub
2. Automático (futuro): máquina com maior uptime na semana assume

---

## Protocolo de comunicação

### Endpoints que módulos secundários consomem

```
GET  /api/produtos          → lista de produtos
GET  /api/estoque           → saldos de estoque
POST /api/venda             → registrar nova venda
GET  /api/venda/:id         → consultar venda
POST /api/venda/:id/cancelar
GET  /api/fila-producao     → cozinha: pedidos pendentes
PUT  /api/fila-producao/:id → cozinha: atualizar status do pedido
```

### WebSocket (atualizações em tempo real)

```
ws://hub:3000/ws

Eventos publicados pelo Hub:
  → nova_venda           → cozinha recebe pedido
  → estoque_critico      → alerta de produto abaixo do mínimo
  → licenca_aviso        → broadcast de aviso de vencimento
  → sync_heartbeat       → keepalive a cada 30s
```

---

## Resolução de conflitos

Como módulos secundários sempre escrevem via API do Hub, conflitos de escrita não ocorrem. O Hub processa uma requisição por vez (SQLite é single-writer por design).

Conflitos possíveis e resolução:

| Situação | Resolução |
|---|---|
| Dois caixas vendem o último item simultaneamente | Transação SQLite + check de saldo antes do INSERT — segundo caixa recebe erro e precisa reconfirmar |
| Hub offline, caixa precisa vender | Modo offline local (dados em fila local, sync ao reconectar) — implementar na Sprint 03 |
| Sync com nuvem conflitante | Timestamp do Hub prevalece sobre a nuvem |

---

## Sync com nuvem (opcional)

Para clientes com VPS ou acesso remoto:

1. Hub envia delta de mudanças a cada X minutos (configurável, padrão: 5 min)
2. Payload: lista de registros alterados desde o último sync (`atualizado_em > ultimo_sync`)
3. Nuvem aplica e confirma
4. Em caso de falha: Hub mantém fila e retenta automaticamente

---

## Modo offline do Hub

Se o Hub perder energia ou reiniciar:
- Módulos secundários detectam timeout na API (após 10s sem resposta)
- Exibem banner "Hub desconectado — operação limitada"
- Caixa: pode continuar em modo offline local (fila de vendas pendentes)
- Estoque e Cozinha: apenas leitura dos dados em cache local

---

## Segurança na LAN

- Comunicação interna é HTTP simples (sem TLS) — rede local é confiável
- Autenticação entre módulos: token de instalação compartilhado (`X-Athenas-Token` header)
- Token gerado na configuração inicial do Hub, distribuído aos módulos secundários via QR Code ou digitação manual
