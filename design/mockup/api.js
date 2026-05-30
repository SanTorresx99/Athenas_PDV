// api.js — Utilitário de comunicação com o backend ATHENAS PDV
// Expõe window.api para uso nos componentes React (browser-native, sem build)

const BASE = 'http://localhost:3001';

window.api = {
  get: async (path) => {
    const r = await fetch(BASE + path);
    if (!r.ok) throw new Error(`GET ${path} → ${r.status}`);
    return r.json();
  },
  post: async (path, body) => {
    const r = await fetch(BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.erro || `POST ${path} → ${r.status}`);
    }
    return r.json();
  },
};
