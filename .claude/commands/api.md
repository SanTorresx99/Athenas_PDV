Test an ATHENAS API endpoint. Usage: /api <method> <path> [json-body]

Examples:
- `/api GET /api/produto`
- `/api POST /api/venda {"itens":[...],"pagamentos":[{"forma":"pix","valor":10}]}`
- `/api POST /api/estoque/entrada {"produto_id":"...","quantidade":10}`

Always include the header `x-device-id: dev` (required by auth middleware).

Base URL: `http://localhost:3001`

Run the request using PowerShell `Invoke-RestMethod` and show:
- HTTP status code
- Response body (formatted JSON)
- If it's a POST that mutates data, also run a follow-up GET to confirm the change persisted

If $ARGUMENTS is provided, parse it as `<METHOD> <PATH> [BODY]` and run that specific call. Otherwise, show the full list of available endpoints from `modules/PDV.md`, `modules/ESTOQUE.md`, and `SPEC.md`.
