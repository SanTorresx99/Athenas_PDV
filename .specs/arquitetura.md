# ATHENAS PDV — Arquitetura do Sistema e Topologia

Este documento descreve a topologia de rede, a infraestrutura local-first, o gerenciamento do banco de dados e a política de backups do ATHENAS PDV.

---

## 1. Topologia Local-First (LAN)

O ATHENAS PDV é projetado para operar sem necessidade de conexão constante com a internet. Ele utiliza uma arquitetura Hub-Satelite (PC Principal e Caixas Secundários) rodando na mesma rede local (LAN).

```
                 [ Rede Local (LAN) ]
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
  ┌───────────────┐               ┌───────────────┐
  │ PC Principal  │               │ PC Secundário │
  │    (Hub)      │               │    (Caixa)    │
  │               │               │               │
  │ ┌───────────┐ │               │ ┌───────────┐ │
  │ │ React App │ │               │ │ React App │ │
  │ └─────┬─────┘ │               │ └─────┬─────┘ │
  │       │       │               │       │       │
  │ ┌─────▼─────┐ │  HTTP/WS      │       │       │
  │ │ Hono/Bun  │◄├───────────────┼───────┘       │
  │ └─────┬─────┘ │  (Porta 3001) │               │
  │       │       │               │               │
  │ ┌─────▼─────┐ │               │               │
  │ │ SQLite DB │ │               │               │
  │ └───────────┘ │               │               │
  └───────────────┘               └───────────────┘
```

### Regras de Conexão e Descoberta:
* **Hub (Servidor Principal):** Roda na porta `3001` exposta na rede local. Controla o banco de dados SQLite principal.
* **Caixas Secundários (Satélites):** Rodam a interface React em navegadores locais que apontam para a API do Hub na LAN.
* **Descoberta via mDNS (Sprint 02):** O Hub fará o broadcast do serviço `_athenas._tcp.local` para que caixas secundários encontrem o IP do Hub automaticamente sem digitação manual.

---

## 2. Banco de Dados e Concorrência

O banco de dados é o **SQLite (WAL Mode)** executado de forma nativa pelo runtime do Bun (`bun:sqlite`).

* **Single Writer, Multiple Readers:** O SQLite permite leituras simultâneas rápidas. As operações de escrita na API do Hub são enfileiradas ou transacionadas para evitar concorrência direta e locks (`SQLITE_BUSY`).
* **Conexão:** Módulos secundários **nunca** acessam o banco de dados diretamente; toda e qualquer modificação de dados ou leitura deve passar pelas rotas HTTP expostas no Hub.

---

## 3. Política de Backup e Rotação Híbrida (Físico + Dump SQL)

Para garantir a integridade dos dados, facilidade de recuperação e facilidade de migração/testes, o sistema implementa uma abordagem híbrida de backup com limpeza automática:

* **Mapeamento de Backups:**
  1. **Backup Físico (`.db`):** Gerado de forma consistente com o comando `VACUUM INTO 'caminho/do/backup.db'` no SQLite.
  2. **Backup Lógico (Dump SQL em `.sql` ou `.txt`):** Exportação de toda a estrutura de tabelas (`DDL`) e dados (`DML` com comandos `INSERT`) em formato de script SQL texto.
* **Frequência:** Diário, acionado no fechamento de caixa ou término do expediente.
* **Destino:** Ambos os arquivos são salvos na pasta raiz `.backups/` com a identificação da data (`athenas_backup_YYYY-MM-DD.db` e `athenas_dump_YYYY-MM-DD.sql`).
* **Política de Retenção Estrita:**
  * O sistema manterá na pasta apenas as **2 versões mais recentes** dos backups físicos (`.db`) e os **2 arquivos mais recentes** de scripts SQL (`.sql`/`.txt`).
  * Backups físicos e lógicos anteriores a essas duas últimas versões serão automaticamente excluídos pelo backend após o término do novo ciclo de backup.
* **Finalidade do Dump SQL:** Esse script de texto facilita a migração rápida de dados para outros ambientes, importação em outros motores de banco de dados (PostgreSQL, MySQL) ou para ser usado como base de dados inicial em pipelines de testes automatizados.
* **Restauração:**
  * **Restauração Física:** Substituir o arquivo `backend/athenas.db` por um dos backups físicos com o servidor inativo.
  * **Restauração via Dump:** Executar o script SQL em um banco de dados SQLite novo/limpo.



---

## 4. Frontend Browser-Native (Sem Build)

O frontend é construído em React 18 e estilizado com variáveis CSS puras, carregado diretamente no navegador do cliente sem a necessidade de ferramentas de compilação complexas (Vite, Webpack, etc.).

* **Distribuição:** A pasta `design/mockup/` contém o `index.html` e os scripts associados.
* **Carregamento:** As bibliotecas são carregadas diretamente do navegador, priorizando velocidade e independência de build.
