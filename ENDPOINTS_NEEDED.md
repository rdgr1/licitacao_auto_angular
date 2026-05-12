# Endpoints necessários — Backend LicitaFlow

Base URL configurada em `src/environments/environment.ts`:
- **Dev:** `http://localhost:8080/api`
- **Prod:** definir em `environment.prod.ts`

Autenticação: todas as rotas (exceto `/auth/login`) devem aceitar o header:
```
Authorization: Bearer <token>
```

---

## Autenticação

### `POST /auth/login`
Autentica o usuário e retorna token JWT.

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response `200`:**
```json
{
  "token": "string",
  "refreshToken": "string",
  "expiresIn": 86400,
  "user": {
    "id": 1,
    "name": "string",
    "email": "string",
    "role": "ADMIN | MANAGER | ANALYST | VIEWER",
    "company": "string"
  }
}
```

---

## Editais

### `GET /editais`
Lista todos os editais. Query param opcional: `?status=PROCESSADO|PENDENTE|ERRO|...`

**Response `200`:** `EditalResponse[]`

```json
[
  {
    "id": 1,
    "numero": "string",
    "objeto": "string",
    "modalidade": "PREGAO_ELETRONICO | CONCORRENCIA | TOMADA_PRECOS | CONVITE | CONCURSO | LEILAO",
    "valorEstimado": 0.0,
    "dataAbertura": "2024-02-01",
    "orgaoOrigem": "string",
    "status": "PROCESSADO | PENDENTE | ERRO | ANTECIPADO | PROCESSANDO | ARQUIVADO",
    "pdfUrl": "string | null",
    "sourceUrl": "string",
    "errorMessage": "string | null",
    "quantidadeExigencias": 0,
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
]
```

### `GET /editais/id/{id}`
Retorna edital pelo ID.

**Response `200`:** `EditalResponse`

### `GET /editais/{numero}`
Retorna edital pelo número (ex: `PE-007/2024`).

**Response `200`:** `EditalResponse`

### `GET /editais/search?q={query}`
Busca full-text por objeto ou número.

**Response `200`:** `EditalResponse[]`

### `GET /editais/proximos`
Editais com abertura nos próximos dias.

**Response `200`:** `EditalResponse[]`

### `GET /editais/leads`
Editais qualificados como leads (com score). Query params opcionais:
- `?scoreMinimo=70`
- `?categoria=VIGILANCIA`
- `?uf=SP`

**Response `200`:** `LeadResponse[]`

```json
[
  {
    "id": 1,
    "numero": "string",
    "objeto": "string",
    "modalidade": "string",
    "valorEstimado": 0.0,
    "dataAbertura": "string",
    "orgaoOrigem": "string",
    "sourceUrl": "string",
    "leadScore": 85,
    "leadCategoriaPrincipal": "string",
    "leadCategorias": "string",
    "createdAt": "ISO8601"
  }
]
```

### `GET /editais/stats`
Estatísticas gerais do sistema.

**Response `200`:**
```json
{
  "totalEditais": 0,
  "processados": 0,
  "pendentes": 0,
  "erros": 0,
  "valorTotalEstimado": 0.0,
  "ultimaExecucao": "ISO8601 | null",
  "proximaExecucao": "ISO8601 | null"
}
```

### `GET /editais/erros`
Editais com status `ERRO`.

**Response `200`:** `EditalResponse[]`

### `GET /editais/{id}/itens`
Itens (linhas) de um edital específico.

**Response `200`:**
```json
[
  {
    "id": 1,
    "numeroItem": 1,
    "descricao": "string",
    "quantidade": 0,
    "unidadeMedida": "string",
    "valorUnitarioEstimado": 0.0,
    "valorTotal": 0.0
  }
]
```

### `POST /editais/processar`
Dispara scraping/processamento em background.

**Response `200`:**
```json
{
  "running": true,
  "message": "string"
}
```

### `GET /editais/processar/status`
Status do processamento em andamento (usado em polling).

**Response `200`:**
```json
{
  "running": false,
  "success": true,
  "total": 0,
  "processados": 0,
  "erros": 0,
  "mensagensErro": []
}
```

### `POST /editais/{id}/reprocessar`
Reprocessa um edital específico.

**Response `200`:** vazio ou confirmação

### `POST /editais/reclassificar`
Reclassifica todos os editais com as regras atuais.

**Response `200`:** vazio ou confirmação

### `DELETE /editais/{id}`
Remove um edital.

**Response `204`:** sem corpo

---

## Regras de Análise

### `GET /regras`
Lista todas as regras.

**Response `200`:** `RegraAnalise[]`

```json
[
  {
    "id": 1,
    "tipo": "KEYWORD_OBJETO | KEYWORD_ITEM | FAIXA_VALOR | PRAZO_MIN_MAX | MODALIDADE_PERMITIDA | DESCARTE",
    "nome": "string",
    "descricao": "string",
    "valorRegra": "string",
    "peso": 80,
    "categoria": "VIGILANCIA | MAO_DE_OBRA | LIMPEZA | BRIGADA | COPEIRAGEM | null",
    "ativa": true,
    "createdAt": "ISO8601"
  }
]
```

### `GET /regras/ativas`
Somente regras com `ativa = true`.

**Response `200`:** `RegraAnalise[]`

### `GET /regras/tipos`
Enum de tipos disponíveis.

**Response `200`:**
```json
["KEYWORD_OBJETO", "KEYWORD_ITEM", "FAIXA_VALOR", "PRAZO_MIN_MAX", "MODALIDADE_PERMITIDA", "DESCARTE"]
```

### `GET /regras/categorias`
Enum de categorias disponíveis.

**Response `200`:**
```json
["VIGILANCIA", "MAO_DE_OBRA", "LIMPEZA", "BRIGADA", "COPEIRAGEM"]
```

### `GET /regras/{id}`
Retorna uma regra pelo ID.

**Response `200`:** `RegraAnalise`

### `POST /regras`
Cria nova regra.

**Request:** `RegraAnalise` (sem `id` e `createdAt`)

**Response `200`:** `RegraAnalise` (com `id` e `createdAt` gerados)

### `PUT /regras/{id}`
Atualiza regra existente.

**Request:** `RegraAnalise` completo

**Response `200`:** `RegraAnalise` atualizado

### `PATCH /regras/{id}/toggle`
Alterna `ativa` entre `true`/`false`.

**Response `200`:** `RegraAnalise` com novo valor de `ativa`

### `DELETE /regras/{id}`
Remove uma regra.

**Response `204`:** sem corpo

---

## Notificações

### `GET /notificacoes`
Histórico de notificações (leads encontrados, etc).

**Response `200`:** `NotificacaoEvent[]`

```json
[
  {
    "tipo": "NOVO_LEAD",
    "timestamp": "ISO8601",
    "editalId": 1,
    "numero": "string",
    "objeto": "string",
    "orgao": "string",
    "valorEstimado": 0.0,
    "leadScore": 94,
    "categoria": "string",
    "urlPncp": "string | null"
  }
]
```

### `GET /notificacoes/stream` — Server-Sent Events (SSE)
Stream de eventos em tempo real. O frontend conecta via `EventSource`.

O frontend escuta o evento `NOVO_LEAD`:
```
event: NOVO_LEAD
data: { ...NotificacaoEvent }
```

**Implementação esperada no backend:** endpoint SSE padrão, com `Content-Type: text/event-stream`.

> **Obs:** O frontend conecta na URL `{baseUrl_sem_/api}/api/notificacoes/stream`

---

## Chat / IA

### `POST /chat/message`
Envia mensagem ao assistente IA (RAG sobre editais).

**Request:**
```json
{
  "message": "string",
  "conversationId": "string | null"
}
```

**Response `200`:**
```json
{
  "response": "string (markdown suportado)",
  "conversationId": "string",
  "sources": [
    {
      "title": "string",
      "relevance": 0.97
    }
  ]
}
```

---

## Impugnação

### `GET /impugnacao/busca?numero={numero}`
Busca edital pelo número para geração de impugnação.

**Response `200`:**
```json
{
  "id": 7,
  "numero": "PE-007/2024",
  "objeto": "string",
  "orgao": "string",
  "dataAbertura": "ISO8601",
  "valorEstimado": 0.0,
  "modalidade": "string",
  "prazoImpugnacao": "ISO8601"
}
```

### `POST /impugnacao/gerar`
Gera documento de impugnação via IA.

**Request:**
```json
{
  "editalId": 7,
  "numero": "PE-007/2024",
  "motivos": ["string"]
}
```

**Response `200`:**
```json
{
  "texto": "string (texto completo da impugnação)",
  "editalNumero": "string",
  "orgao": "string",
  "prazo": "ISO8601",
  "fundamentos": ["string"],
  "irregularidades": ["string"]
}
```

> **Obs:** Esse endpoint costuma demorar (processamento por IA). O frontend aguarda até ~30s (`apiTimeout`).

---

## Observações gerais

- Erros devem retornar `{ "message": "string" }` no corpo para exibição ao usuário
- `401` → token inválido/expirado (frontend redireciona para login)
- `403` → sem permissão
- `404` → recurso não encontrado
- `500` → erro interno (mensagem genérica exibida ao usuário)
