// ─────────────────────────────────────────────────────────────────
// DEPLOY INTERNO: altere apiUrl para o endereço do servidor backend
// Exemplo: 'http://192.168.1.100:8083/licitaflow/api'
//          'https://licitaflow.brasfort.com.br/api'
// ─────────────────────────────────────────────────────────────────
export const environment = {
  production: true,
  apiUrl: 'http://SEU_SERVIDOR:8083/licitaflow/api',
  apiTimeout: 30000,
  enableDebugLogs: false
};
