# ATHENAS PDV — Sistema de Licenciamento e AthenCoins

Este documento descreve as regras de licenciamento, consumo de créditos (AthenCoins), alertas de expiração e o fluxo de renovação offline via Token HMAC.

---

## 1. Modelo de Cobrança por Módulos (AthenCoins)

O ATHENAS PDV utiliza um sistema de pontuação chamado AthenCoins para calcular o valor da licença de acordo com a infraestrutura e recursos ativados pelo cliente:

| Componente Ativado | Custo em AthenCoins |
|---|---|
| **PC Principal (Hub)** | 100 coins / mês |
| **Módulo Caixa Adicional** (PC secundário na LAN) | 50 coins / mês |
| **Módulo Estoque Adicional** (PC secundário na LAN) | 50 coins / mês |
| **Módulo Cozinha/KDS Adicional** (PC secundário na LAN) | 50 coins / mês |

---

## 2. Thresholds e Alertas de Expiração

O sistema monitora a quantidade de dias de licença restantes a partir da data de ativação ou da última renovação, decrementando 1 dia a cada 24 horas no startup do servidor Hub.

A interface exibe alertas conforme a proximidade da expiração:

| Dias Restantes | Ação e Banner na Interface |
|---|---|
| **14 dias** | Banner informativo azul (discreto) no rodapé. |
| **7 dias** | Banner de alerta amarelo persistente em todos os terminais do sistema. |
| **3 dias** | Alerta vermelho em destaque + janela modal impeditiva ao iniciar o sistema (exige confirmação de leitura). |
| **0 dias** | Entrada automática no **Modo Suspenso**. |

### Comportamento do Modo Suspenso:
* **Operações de Escrita (Bloqueadas):** Novas vendas, entradas ou saídas de estoque, ordens de compra e edições de cadastros são completamente desativadas.
* **Operações de Leitura (Permitidas):** Consulta a relatórios, exportação de dados (CSV/PDF) e visualização do histórico de vendas permanecem liberados para que o cliente não perca o acesso às suas informações históricas.

---

## 3. Renovação Offline via Token HMAC

Como o sistema opera com filosofia *local-first* e muitas vezes sem acesso estável à internet, o desenvolvedor/implementador pode renovar as licenças de forma totalmente offline utilizando tokens assinados.

```
┌────────────────────────┐          ┌────────────────────────┐
│ Painel Central do Dev  │          │   Instalação Cliente   │
│  (Online - Gerador)    │          │    (Offline - Hub)     │
└───────────┬────────────┘          └───────────┬────────────┘
            │                                   │
      Informa ID + Dias                         │
            │                                   │
      Gera Token assinado                       │
            │                                   │
      Envia p/ Cliente ────────────────────────►│  Aplica Token
            │                                   │  (Valida HMAC)
            ▼                                   ▼
[ ATHENAS-b64(payload)-hmac ]            Soma dias se ok
                                         Grava hash do token
```

### Estrutura do Token:
O token é composto por três partes separadas por hífens:
$$\text{Token} = \text{ATHENAS} - \{\text{Base64url(Payload)}\} - \{\text{HMAC\_8chars}\}$$

* **Payload (JSON em Base64):** Contém informações como o ID da instalação, a quantidade de dias adicionais concedidos e a data limite para aplicação do token.
* **HMAC_8chars:** Uma assinatura de segurança de 8 caracteres gerada usando o algoritmo HMAC-SHA256, garantindo que o token não foi alterado pelo cliente.

### Validação no Hub:
1. O backend lê o token informado no painel de licenças.
2. Descompacta o payload e confere se o ID da instalação confere com o ID local.
3. Recalcula a assinatura HMAC localmente utilizando a chave secreta de licenciamento.
4. Verifica se a data limite para aplicação do token não expirou (máximo de 30 dias após a geração).
5. Consulta se o `token_hash` já foi utilizado (gravado no banco) para impedir a aplicação múltipla do mesmo token.
6. Se todas as validações forem bem-sucedidas, o número de dias restantes é adicionado à licença ativa do cliente e o hash do token é inutilizado.
