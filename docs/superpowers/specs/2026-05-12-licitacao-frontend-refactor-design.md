# Design: Refatoração Frontend — Iteração 1

**Data:** 2026-05-12
**Escopo:** Pipeline com seleção de fontes, limpeza do Dashboard, edição de metadados de Editais. Regras aguarda novo contrato backend.

---

## Contexto

O sistema é uma plataforma de inteligência para licitações. O backend (Spring Boot) já está operacional com scrapers para PNCP e DODF (em implementação). O frontend Angular 18 existente tem dados mockados, botões sem lógica (ex: "Novo Edital" que vai para a lista), e o processamento não permite seleção de fontes.

Esta iteração remove o cruft apresentacional e conecta as features que realmente funcionam ao fluxo real de uso.

---

## Arquitetura

### Backend — endpoints relevantes

| Endpoint | Status | Observação |
|---|---|---|
| `POST /editais/processar` | Existe | Precisa aceitar `{ fontes: string[], dataColeta?: string }` no body |
| `GET /editais/processar/status` | Existe | Polling a cada 3s |
| `GET /editais/leads` | Existe | Retorna leads paginados com `fonteOrigem` |
| `GET /editais` | Existe | Lista com filtros e paginação |
| `GET /editais/id/{id}` | Existe | Detalhe por UUID |
| `GET /editais/stats` | Existe | Estatísticas para o dashboard |
| `PATCH /editais/{id}` | **Não existe — criar** | Edição de `objeto`, `valorEstimado`, `dataAbertura` |

### Fontes disponíveis no MVP

| Fonte | Status no backend | Disponível na UI |
|---|---|---|
| PNCP | Habilitado e funcional | Sim |
| DODF | Em implementação | Sim (quando backend pronto) |
| DOU | Apenas radar agendado (6h dias úteis) | Desabilitado na UI por enquanto |

**Motivação para seleção obrigatória de fonte:** scrapers podem falhar individualmente. O usuário precisa controle explícito sobre quais fontes acionar — nunca disparo automático de todas.

---

## Componentes alterados

### 1. Pipeline (`/pipeline`)

**Painel "Nova Coleta"** — adicionado no topo da página, colapsável (aberto por padrão):

- Checkboxes para cada fonte: DODF, PNCP, DOU (desabilitado)
- Date picker "Data de Coleta" (padrão: hoje, formato `yyyy-MM-dd`)
- Botão "Iniciar Coleta" — desabilitado se nenhuma fonte selecionada
- Ao clicar: chama `POST /editais/processar` com body `{ fontes: string[], dataColeta: string }`
- Painel colapsa automaticamente quando processamento inicia

**Banner de progresso** — aparece durante processamento (migrado do Dashboard):
- Polling `GET /editais/processar/status` a cada 3s
- Mostra scrapers em andamento, contadores processados/erros, barra de progresso
- Ao finalizar: toast de resultado + recarrega board + painel "Nova Coleta" reabre

**Kanban board** (Quente/Morno/Frio) — ajustes:
- Remove botão "Novo Lead" (não existe criação manual)
- Adiciona chip `fonteOrigem` (DODF / PNCP / DOU) em cada card, se presente no `LeadResponse`
- Colunas continuam sendo populadas por score: Quente ≥ 70, Morno 40–69, Frio < 40

**Serviço** — `EditaisService.processar()` passa a aceitar:
```typescript
processar(payload: { fontes: string[]; dataColeta?: string }): Observable<void>
```

---

### 2. Dashboard (`/dashboard`)

Mudanças mínimas — sem redesenho:

- **Saudação:** `"Bom dia, Rafael!"` → `"Bom dia, {{ userName }}!"` onde `userName` vem do `AuthService` (campo `name` no JWT/localStorage)
- **Botão "Novo Edital"** → substituído por botão `"Abrir Pipeline"` com `routerLink="/pipeline"`
- **Botão "Processar"** → passa a navegar para `/pipeline` via `Router.navigate` em vez de disparar o scraper diretamente. O banner de progresso sai do Dashboard.
- **Gráfico de barras mensal** → removido. Dados eram hardcoded e não refletem a realidade. O card pode ser removido ou substituído por um placeholder informativo ("Em breve: histórico mensal").
- **Gráfico donut** → mantido, já usa dados reais via `/editais/stats`

---

### 3. Editais (`/editais` e `/editais/:id`)

**Lista (`EditaisListComponent`):**
- Remove o botão/ação "Novo Edital" (não existe endpoint de criação)
- Adiciona coluna `Fonte` na tabela com chip colorido por `fonteOrigem`
- Ação "Editar" no menu de ações de cada linha → abre `EditalEditDialogComponent`

**Dialog de edição (`EditalEditDialogComponent`)** — novo componente:
- Campos: `objeto` (textarea), `valorEstimado` (number), `dataAbertura` (datepicker)
- Submit: `PATCH /editais/{id}` com apenas os campos alterados
- Após sucesso: fecha dialog + recarrega lista + toast de confirmação

**Detalhe (`EditalDetailsComponent`):**
- Botão "Editar" no header → abre o mesmo `EditalEditDialogComponent`

**Serviço** — novo método em `EditaisService`:
```typescript
patch(id: string, payload: Partial<Pick<EditalResponse, 'objeto' | 'valorEstimado' | 'dataAbertura'>>): Observable<EditalResponse>
```

**Backend — endpoint a criar:**
```
PATCH /editais/{id}
Body: { objeto?: string, valorEstimado?: number, dataAbertura?: string }
Response 200: EditalResponse atualizado
```

---

## Fora de escopo desta iteração

- **Regras:** aguarda refatoração completa do backend (novo padrão de entidade baseado no DODF). Nenhuma alteração na página de Regras ou no modelo `RegraAnalise`.
- **Chat / Impugnação / Notificações:** mantidos como estão, sem alteração.
- **Dashboard redesign:** storytelling e novos KPIs ficam para iteração futura.
- **Histórico de sessões de coleta:** sem endpoint de histórico no backend ainda.
- **DOU manual:** fica desabilitado na UI até o backend suportar trigger manual.

---

## Modelo frontend — alterações

`edital.model.ts`:
- Adicionar `fonteOrigem?: string` ao `LeadResponse` (já existe em `EditalResponse`, faltava em `LeadResponse`)

Nenhuma outra alteração de modelo nesta iteração (Regras aguarda novo contrato).

---

## Fluxo principal de uso

1. Usuário acessa Pipeline
2. Painel "Nova Coleta" está aberto — seleciona DODF e/ou PNCP, escolhe data
3. Clica "Iniciar Coleta" → backend processa, banner de progresso aparece
4. Ao finalizar, board é recarregado com os novos leads classificados por score
5. Usuário pode navegar para Editais para ver todos os editais scrapeados, filtrar por fonte, e editar metadados se necessário
