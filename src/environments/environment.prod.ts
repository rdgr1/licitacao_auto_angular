// ─────────────────────────────────────────────────────────────────
// Frontend servido pelo próprio backend (mesmo processo JVM) — a API
// fica em /api no mesmo host/porta, por isso o apiUrl é relativo.
// ─────────────────────────────────────────────────────────────────
export const environment = {
  production: true,
  apiUrl: '/api',
  apiTimeout: 30000,
  enableDebugLogs: false
};
