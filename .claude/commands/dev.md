Start the ATHENAS backend development server.

Run the following in the `backend/` directory:

```
cd backend && bun run dev
```

The server will start on **http://localhost:3001**.

After starting, verify it's healthy:
```
GET http://localhost:3001/
```

Expected response: `{ status: "ok", sistema: "ATHENAS PDV" }`

The frontend mockup is served via Live Server at **http://127.0.0.1:5500/design/mockup/index.html**.

If the user asks you to test an endpoint, use `curl` or PowerShell `Invoke-RestMethod`. Always include the header `x-device-id: dev` in API calls (required by the auth middleware).
