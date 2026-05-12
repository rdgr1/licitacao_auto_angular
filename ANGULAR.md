# Módulo 4 — Front Angular

> Spec para implementar em contexto separado.
> Backend 100% pronto: todos os endpoints documentados na Postman collection.

---

## Stack

- Angular 17+ (standalone components)
- Angular Material ou TailwindCSS
- Consome API REST em `http://localhost:8080`
- SSE em `GET /api/notificacoes/stream` para notificações em tempo real

---

## Telas

### 1. Dashboard de licitações (`/`)

**Endpoint principal:** `GET /api/editais/leads?scoreMinimo=30&categoria=&uf=`

**Cards por edital com:**
- Badge colorido de categoria (VIGILÂNCIA, LIMPEZA, COPEIRAGEM, MÃO DE OBRA, BRIGADA)
- Badge especial **"ANTECIPADO"** quando `fonteOrigem = DODF | DOU` e `status = ANTECIPADO`
- `leadScore` — barra de progresso visual (0-100)
- `viabilidadeScore` — ícone/indicador (🔴 < 40, 🟡 40-70, 🟢 > 70)
- `viabilidadeRazao` — tooltip ou texto colapsável
- `valorEstimado` formatado em BRL
- `dataAbertura` — countdown se < 7 dias
- Botão "Ver itens" → abre modal com `GET /api/editais/{id}/itens`

**Filtros no topo:**
- Score mínimo (slider 0-100)
- Categoria (multi-select)
- Fonte (PNCP, DODF, DOU)
- Status (ANTECIPADO, PENDENTE, PROCESSADO)

**Ordenação:** Score desc (padrão) | Valor desc | Data abertura asc

**SSE:** badge de notificação no topo ("3 novos"); ao clicar, atualiza feed.
- Endpoint: `GET /api/notificacoes/stream`
- Evento: `data: { tipo, editalId, numero, objeto, leadScore, categoria }`

---

### 2. Detalhe do edital (`/editais/:id`)

- Dados completos do edital
- Lista de itens (`GET /api/editais/{id}/itens`) em tabela
- Lista de exigências extraídas pela IA
- Score breakdown (keyword score + viabilidade IA)

---

### 3. Regras de análise (`/regras`)

**Endpoint:** `GET /api/regras` / `POST /api/regras` / `PUT /api/regras/{id}` / etc.

**Tabela editável** com:
- Nome da regra
- Tipo (KEYWORD_OBJETO, KEYWORD_ITEM, FAIXA_VALOR, PRAZO_MIN_MAX, MODALIDADE_PERMITIDA, DESCARTE)
- Valor (texto livre — ex: `"vigilancia,seguranca"` ou `"100000-20000000"`)
- Peso (número)
- Categoria (select: VIGILANCIA, LIMPEZA, ...)
- Ativa (toggle) — `PATCH /api/regras/{id}/toggle`

**Ações por linha:** Editar | Toggle | Deletar

**Botão "Nova regra"** abre modal com formulário validado.

Após salvar regra: botão **"Reclassificar tudo"** → `POST /api/editais/reclassificar`

---

### 4. Histórico de notificações (`/notificacoes`)

- `GET /api/notificacoes` — lista das últimas 100
- Tipo, timestamp, edital, score

---

## Endpoints consumidos pelo front (resumo)

| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/api/editais/leads` | Dashboard principal |
| GET | `/api/editais/{id}/itens` | Modal de itens |
| GET | `/api/editais` | Lista completa |
| GET | `/api/editais/stats` | Header stats |
| POST | `/api/editais/processar` | Trigger manual |
| POST | `/api/editais/reclassificar` | Após mudar regras |
| GET | `/api/notificacoes/stream` | SSE |
| GET | `/api/notificacoes` | Histórico |
| GET | `/api/regras` | Lista regras |
| GET | `/api/regras/tipos` | Enum para select |
| GET | `/api/regras/categorias` | Enum para select |
| POST | `/api/regras` | Criar regra |
| PUT | `/api/regras/{id}` | Editar regra |
| PATCH | `/api/regras/{id}/toggle` | Ativar/desativar |
| DELETE | `/api/regras/{id}` | Deletar |

---

## Modelos de resposta relevantes

### LeadResponse (GET /api/editais/leads)
```json
{
  "id": 1,
  "numero": "PE 001/2024",
  "objeto": "Serviços de vigilância patrimonial",
  "modalidade": "PREGAO_ELETRONICO",
  "valorEstimado": 1200000.00,
  "dataAbertura": "2024-03-15T10:00:00",
  "orgaoOrigem": "Tribunal Regional do Trabalho 10ª Região",
  "sourceUrl": "https://pncp.gov.br/app/editais/...",
  "leadScore": 70,
  "leadCategoriaPrincipal": "VIGILANCIA",
  "leadCategorias": "VIGILANCIA, MAO_DE_OBRA",
  "viabilidadeScore": 82,
  "viabilidadeRazao": "Edital compatível com o perfil da empresa. Atestado técnico padrão exigido.",
  "fonteOrigem": "PNCP",
  "status": "PROCESSADO",
  "createdAt": "2024-03-01T08:30:00"
}
```

### ItemResponse (GET /api/editais/{id}/itens)
```json
[
  {
    "id": 10,
    "numeroItem": 1,
    "descricao": "Vigilância armada diurna — posto 12h",
    "quantidade": 5.0,
    "unidadeMedida": "POSTO",
    "valorUnitarioEstimado": 8500.00,
    "valorTotal": 42500.00
  }
]
```

### NotificacaoEvent (SSE stream)
```json
{
  "tipo": "NOVO_LEAD",
  "timestamp": "2024-03-01T08:30:00",
  "editalId": 1,
  "numero": "PE 001/2024",
  "objeto": "Serviços de vigilância",
  "leadScore": 70,
  "categoria": "VIGILANCIA"
}
```

---

## Observações de implementação

- CORS já configurado no backend (`ResolverConfig.java`)
- Webhook de saída configurável em `application.yml` → `notificacoes.webhook.*`
- SSE: usar `EventSourceService` do Angular ou `EventSource` nativo
- Badge ANTECIPADO: `status === 'ANTECIPADO'` OU `fonteOrigem` em `['DODF', 'DOU']`
- Viabilidade: exibir apenas se `viabilidadeScore != null`
