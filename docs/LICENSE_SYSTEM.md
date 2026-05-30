# Sistema de Licença — AthenCoins

## Modelo de créditos

| Configuração | AthenCoins | Descrição |
|---|---|---|
| PC Principal (Hub) | 100 | Acesso completo — todos módulos unificados |
| Módulo Caixa (PC secundário) | 50 | Apenas frente de caixa |
| Módulo Estoque (PC secundário) | 50 | Apenas gestão de estoque |
| Módulo Cozinha/Fabricação (PC secundário) | 50 | Apenas fila de produção |

> Módulos secundários dependem do Hub ativo. Sem Hub rodando, módulos secundários ficam em modo leitura apenas.

---

## Ciclo de vida da licença

```
Implementação (DEV)
  → 7 dias trial (DEV configura via token)
  → Cliente usa o sistema
  → 7 dias antes do vencimento → banner de notificação
  → Vencimento → modo suspenso (somente consulta, sem novas vendas)
  → Renovação → sistema reativa normalmente
```

---

## Fluxo de renovação — Online (PIX)

1. Operador acessa **Configurações → Licença → Renovar**
2. Sistema gera QR Code PIX com `txid` único vinculado ao ID da instalação
3. Cliente paga pelo celular
4. Gateway PIX envia webhook para servidor ATHENAS Central (cloud do DEV)
5. ATHENAS Central valida pagamento e gera token de renovação
6. Token é aplicado automaticamente via sync (se cliente tiver internet) ou exibido para o DEV copiar e aplicar manualmente

---

## Fluxo de renovação — Offline (Token DEV)

1. DEV acessa **Painel ATHENAS Central** (web privado do implementador)
2. Informa: ID da instalação + quantidade de meses (ou dias para trial)
3. Sistema gera token: `HMAC-SHA256(id_instalacao + dias + timestamp, chave_secreta_dev)`
4. DEV passa o token ao cliente (WhatsApp, presencialmente, etc.)
5. Cliente acessa **Configurações → Licença → Aplicar Token**
6. Sistema valida o HMAC e soma os dias ao contador

---

## Estrutura local da licença (`licenca` table)

```
coins_disponiveis  → quantos AthenCoins a instalação possui
dias_restantes     → dias de uso restantes (decrementado diariamente)
modo               → trial | ativo | suspenso
token_hash         → SHA256 do último token aplicado (evita reuso)
ultimo_check       → data do último decremento de dias
notificou_7dias    → flag para não repetir a notificação
```

---

## Notificações de vencimento

| Dias restantes | Ação |
|---|---|
| 30 | Nenhuma |
| 14 | Banner discreto no topo (info) |
| 7 | Banner amarelo persistente em todos os módulos |
| 3 | Banner vermelho + modal ao abrir o sistema |
| 0 | Modo suspenso — apenas consultas, sem novas vendas |

---

## Modo suspenso

- Leitura de dados: permitida
- Novas vendas: bloqueadas
- Edição de estoque: bloqueada
- Relatórios: permitidos
- Exportação de dados: permitida (cliente não perde dados)

---

## Segurança do token

- Token usa HMAC-SHA256 com chave secreta do DEV (não embutida no cliente)
- Hash do token aplicado é salvo localmente — reuso do mesmo token é rejeitado
- Token tem validade de 30 dias para ser aplicado (após geração)
- Formato: `ATHENAS-{base64url(payload)}-{hmac_truncado_8chars}`

---

## Tabela de preços sugerida (referência DEV)

| Pacote | Valor | AthenCoins | Vigência |
|---|---|---|---|
| Implementação | R$ 800,00 | 100 | 7 dias trial incluídos |
| Mensalidade Hub | R$ X/mês | — | 30 dias por mês pago |
| Módulo adicional | R$ Y/mês | 50 por módulo | 30 dias |
| Plano anual | R$ Z | — | 365 dias (desconto) |

> Valores a definir pelo implementador por região e perfil de cliente.
