# 🔌 Guia de Integração com Backend API

## Visão Geral

Este guia explica como conectar a aplicação Angular com seu backend real, substituindo os dados mock.

---

## 1️⃣ Desativar Mock (se ativado)

Abra `src/app/core/interceptors/mock.interceptor.ts` e altere:

```typescript
// ANTES:
export const USE_MOCK_DATA = true;

// DEPOIS:
export const USE_MOCK_DATA = false;
```

---

## 2️⃣ Configurar URL da API

Edite `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',  // ← Altere aqui
  apiTimeout: 30000,
  enableDebugLogs: true
};
```

E `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://sua-api.com/api',  // ← URL de produção
  apiTimeout: 30000,
  enableDebugLogs: false
};
```

---

## 3️⃣ Endpoints Esperados

Seu backend deve implementar os seguintes endpoints:

### 📋 Listar Todos os Editais
```
GET /api/editais
Content-Type: application/json

Response (200):
[
  {
    "id": 1,
    "numero": "2024/001",
    "objeto": "Descrição do objeto",
    "modalidade": "PREGAO_ELETRONICO",
    "valorEstimado": 50000.00,
    "dataAbertura": "2024-02-01",
    "orgaoOrigem": "Prefeitura Municipal",
    "status": "PROCESSADO",
    "pdfUrl": "https://...",
    "sourceUrl": "https://...",
    "createdAt": "2024-02-01T10:00:00Z",
    "updatedAt": "2024-02-01T11:00:00Z",
    "quantidadeExigencias": 5
  }
]
```

### 📊 Buscar Edital por ID
```
GET /api/editais/id/:id
Content-Type: application/json

Example: GET /api/editais/id/1

Response (200): EditalResponse (igual acima)
Response (404): { "message": "Edital não encontrado" }
```

### 📊 Buscar Edital por Número
```
GET /api/editais/:numero
Content-Type: application/json

Example: GET /api/editais/2024/001

Response (200): EditalResponse
Response (404): { "message": "Edital não encontrado" }
```

### 🔍 Buscar Editais
```
GET /api/editais/search?q=termo

Response (200): EditalResponse[]
Response (400): { "message": "Query vazia" }
```

### 📈 Estatísticas
```
GET /api/editais/stats
Content-Type: application/json

Response (200):
{
  "total": 100,
  "processados": 80,
  "pendentes": 15,
  "erros": 5,
  "valorTotal": 5000000.00,
  "ultimaExecucao": "2024-02-12T15:30:00Z",
  "proximaExecucao": "2024-02-13T08:00:00Z"
}
```

### 🔥 Listar Leads (com Scoring)
```
GET /api/editais/leads?scoreMinimo=0&categoria=&uf=

Query Parameters (opcional):
- scoreMinimo: number (0-100)
- categoria: string
- uf: string

Response (200):
[
  {
    "id": 1,
    "numero": "2024/001",
    "objeto": "Descrição",
    "modalidade": "PREGAO_ELETRONICO",
    "valorEstimado": 50000.00,
    "dataAbertura": "2024-02-01",
    "orgaoOrigem": "Prefeitura",
    "sourceUrl": "https://...",
    "leadScore": 85,
    "leadCategoriaPrincipal": "Limpeza",
    "leadCategorias": "Limpeza, Higiene",
    "createdAt": "2024-02-01T10:00:00Z"
  }
]
```

### ❌ Listar Editais com Erro
```
GET /api/editais/erros
Content-Type: application/json

Response (200): EditalResponse[]
```

### ⏭️ Listar Próximos Editais
```
GET /api/editais/proximos
Content-Type: application/json

Response (200): EditalResponse[]
```

### 🔄 Processar Editais
```
POST /api/editais/processar
Content-Type: application/json
Body: {}

Response (200): void
Response (400): { "message": "Erro ao processar" }
```

### 🔄 Reprocessar Edital Específico
```
POST /api/editais/:id/reprocessar
Content-Type: application/json
Body: {}

Example: POST /api/editais/1/reprocessar

Response (200): void
Response (404): { "message": "Edital não encontrado" }
```

### 🏷️ Reclassificar Editais
```
POST /api/editais/reclassificar
Content-Type: application/json
Body: {}

Response (200): void
Response (400): { "message": "Erro ao reclassificar" }
```

### 🗑️ Excluir Edital
```
DELETE /api/editais/:id
Content-Type: application/json

Example: DELETE /api/editais/1

Response (200): void
Response (404): { "message": "Edital não encontrado" }
```

---

## 4️⃣ Modelos de Dados

### EditalStatus (enum)
```typescript
enum EditalStatus {
  PROCESSADO = 'PROCESSADO',
  PENDENTE = 'PENDENTE',
  ERRO = 'ERRO'
}
```

### Modalidade (enum)
```typescript
enum Modalidade {
  PREGAO_ELETRONICO = 'PREGAO_ELETRONICO',
  CONCORRENCIA = 'CONCORRENCIA',
  TOMADA_PRECOS = 'TOMADA_PRECOS',
  CONVITE = 'CONVITE',
  CONCURSO = 'CONCURSO',
  LEILAO = 'LEILAO'
}
```

### EditalResponse (interface)
```typescript
interface EditalResponse {
  id: number;
  numero: string;
  objeto: string;
  modalidade: Modalidade;
  valorEstimado: number;
  dataAbertura: string;         // "YYYY-MM-DD"
  orgaoOrigem: string;
  status: EditalStatus;
  errorMessage?: string;
  pdfUrl?: string;
  sourceUrl: string;
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
  quantidadeExigencias: number;
}
```

### LeadResponse (interface)
```typescript
interface LeadResponse {
  id: number;
  numero: string;
  objeto: string;
  modalidade: string;
  valorEstimado: number;
  dataAbertura: string;
  orgaoOrigem: string;
  sourceUrl: string;
  leadScore: number;            // 0-100
  leadCategoriaPrincipal: string;
  leadCategorias: string;
  createdAt: string;
}
```

### EstatisticasDTO (interface)
```typescript
interface EstatisticasDTO {
  total: number;
  processados: number;
  pendentes: number;
  erros: number;
  valorTotal: number;
  ultimaExecucao?: string;      // ISO 8601
  proximaExecucao?: string;     // ISO 8601
}
```

---

## 5️⃣ Exemplos de Requisição (cURL)

### Listar todos os editais
```bash
curl -X GET "http://localhost:8080/api/editais" \
  -H "Content-Type: application/json"
```

### Buscar edital por ID
```bash
curl -X GET "http://localhost:8080/api/editais/id/1" \
  -H "Content-Type: application/json"
```

### Buscar leads
```bash
curl -X GET "http://localhost:8080/api/editais/leads?scoreMinimo=50" \
  -H "Content-Type: application/json"
```

### Processar editais
```bash
curl -X POST "http://localhost:8080/api/editais/processar" \
  -H "Content-Type: application/json" \
  -d "{}"
```

### Excluir edital
```bash
curl -X DELETE "http://localhost:8080/api/editais/1" \
  -H "Content-Type: application/json"
```

---

## 6️⃣ Tratamento de Erros

A aplicação automaticamente trata os seguintes erros via `http-error.interceptor.ts`:

### Códigos de Status

| Código | Mensagem Exibida | Ação |
|--------|-----------------|------|
| 0 | Erro de conexão. Verifique sua internet. | Retry |
| 401 | Não autorizado. Faça login novamente. | Redirecionar para login |
| 403 | Acesso negado. | Mostrar erro |
| 404 | Recurso não encontrado. | Voltar |
| 500+ | Erro no servidor. Tente novamente mais tarde. | Retry |
| Outro | Mensagem do servidor (se houver) | Mostrar |

---

## 7️⃣ CORS (Cross-Origin)

Se seu frontend e backend estão em domínios diferentes, configure CORS no backend:

```
Access-Control-Allow-Origin: http://localhost:4200
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

---

## 8️⃣ Autenticação (Futuro)

Para adicionar autenticação JWT no futuro:

1. Criar `auth.service.ts`
2. Criar `auth.interceptor.ts` para adicionar token
3. Criar guard para rotas protegidas
4. Armazenar token em `localStorage` ou `sessionStorage`

Exemplo:
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next(req);
};
```

---

## 9️⃣ Debugging e Logs

Para ativar logs de debug:

Edite `src/app/core/services/editais.service.ts` e adicione:

```typescript
getAll(): Observable<EditalResponse[]> {
  console.log('🔄 Carregando editais...');
  return this.http.get<EditalResponse[]>(this.apiUrl).pipe(
    tap(data => console.log('✅ Editais carregados:', data)),
    catchError(err => {
      console.error('❌ Erro ao carregar editais:', err);
      throw err;
    })
  );
}
```

---

## 🔟 Checklist de Integração

- [ ] URL da API configurada em `environment.ts`
- [ ] Backend rodando e acessível
- [ ] CORS configurado no backend
- [ ] Mock interceptor desativado
- [ ] Testou GET /api/editais
- [ ] Testou GET /api/editais/stats
- [ ] Testou GET /api/editais/leads
- [ ] Testou POST /api/editais/processar
- [ ] Testou DELETE /api/editais/:id
- [ ] Erros sendo exibidos corretamente
- [ ] Notificações funcionando

---

## ⚙️ Configurações Adicionais

### Timeout de Requisições
Edite `environment.ts`:
```typescript
apiTimeout: 30000  // milissegundos (30 segundos)
```

### Debug Logs
Edite `environment.ts`:
```typescript
enableDebugLogs: true  // production: false
```

### Headers Customizados
Adicione em novo interceptor:
```typescript
export const customHeadersInterceptor: HttpInterceptorFn = (req, next) => {
  const modified = req.clone({
    setHeaders: {
      'X-Custom-Header': 'value',
      'User-Agent': 'LicitacaoCRM/1.0'
    }
  });
  return next(modified);
};
```

---

## 🧪 Teste de Integração

Após configurar, teste assim:

1. Abra DevTools (F12)
2. Vá para aba "Network"
3. Recarregue a página
4. Você deve ver requisições para:
   - `GET /api/editais`
   - `GET /api/editais/stats`
   - `GET /api/editais/leads`

5. Clique em cada uma e verifique:
   - Status: 200 OK
   - Response tem os dados esperados
   - Headers corretos

---

## 📞 Troubleshooting

### Erro: "ERR_CONNECTION_REFUSED"
- Backend não está rodando
- URL incorreta em `environment.ts`
- Verifique firewall/proxy

### Erro: "CORS policy"
- Configurar CORS no backend
- Adicionar headers corretos

### Erro: "JSON parsing error"
- Backend retornando formato incorreto
- Verifique Content-Type: application/json

### Dados não aparecem
- Verificar Network tab (F12)
- Verificar status das requisições
- Consultar console (F12) para erros

---

## 📚 Documentação Relacionada

- [QUICK_START.md](./QUICK_START.md) - Começar rápido
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testes completos
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Resumo da implementação

---

**Próximo passo:** Implemente seus endpoints no backend seguindo este guia!
