Reset the ATHENAS database and re-apply seed data.

**Warning:** This deletes all existing data in `backend/athenas.db`.

Steps:
1. Stop any running backend process (check for bun processes)
2. Delete the database file:
   ```powershell
   Remove-Item backend/athenas.db, backend/athenas.db-wal, backend/athenas.db-shm -ErrorAction SilentlyContinue
   ```
3. Start the backend (migrations + seed run automatically on startup):
   ```
   cd backend && bun run dev
   ```
4. Confirm seed by calling `GET /api/produto` — should return the 5 seed products (Cerveja Lata, Long Neck, Vodka, Água Mineral, Refrigerante).

After seeding, also confirm the admin user exists (login: `admin`, senha: `athenas@123`).

Only proceed if the user has confirmed they want to lose existing data.
