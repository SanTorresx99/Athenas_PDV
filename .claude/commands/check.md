Health-check the ATHENAS backend — verify all key endpoints are responding correctly.

Run each check in sequence and report status (✓ OK / ✗ FAIL):

```powershell
$h = @{ 'x-device-id' = 'dev' }
Invoke-RestMethod -Uri "http://localhost:3001/" -Headers $h
Invoke-RestMethod -Uri "http://localhost:3001/api/produto" -Headers $h
Invoke-RestMethod -Uri "http://localhost:3001/api/estoque" -Headers $h
Invoke-RestMethod -Uri "http://localhost:3001/api/dashboard" -Headers $h
Invoke-RestMethod -Uri "http://localhost:3001/api/venda/dia" -Headers $h
Invoke-RestMethod -Uri "http://localhost:3001/api/compras/fornecedor" -Headers $h
Invoke-RestMethod -Uri "http://localhost:3001/api/licenca" -Headers $h
```

For each endpoint, show: HTTP status, response time (approximate), and a one-line summary of the data returned (e.g., "5 produtos", "faturamento: R$ 0,00").

If any endpoint returns an error, show the full error body and suggest a fix.
