# Paginação Server-Side — Design Spec

**Data:** 2026-06-09  
**Status:** Aprovado

---

## Problema

O backend já suporta paginação Spring (`Page<T>` com `page`/`size`) em todos os recursos exceto coleta findAll. O frontend não estava usando essa capacidade:

- **Editais** (`/editais`): `getAll()` carrega todos os registros, `MatPaginator` pagina localmente.
- **Leads** (`/leads`): sinais de paginação existem no código mas os controles ficam ocultos porque `@if (totalPages() > 1)` esconde quando há poucos dados — o usuário nunca vê a paginação.
- **Outros recursos**: sem paginação implementada.

Resultado: listas quebram layout com muitos registros e o desempenho degrada com volume.

---

## Solução

### 1. `SharedPaginatorComponent`

**Caminho:** `src/app/shared/components/paginator/paginator.component.ts`

Componente standalone reutilizável com:

| Input/Output | Tipo | Descrição |
|---|---|---|
| `page` | `number` (input, 0-indexed) | Página atual |
| `totalPages` | `number` (input) | Total de páginas |
| `totalElements` | `number` (input, opcional) | Total de registros |
| `pageSize` | `number` (input, opcional) | Registros por página |
| `pageChange` | `EventEmitter<number>` (output) | Emite nova página ao navegar |

**Comportamento:**
- Visível sempre que `totalPages >= 1` (mesmo "Página 1 de 1" com info de total).
- Botão ← desabilitado na página 0; botão → desabilitado na última página.
- Texto central: `Página X de Y · Z registros` (omite "Z registros" se `totalElements` não fornecido).
- Visual alinhado ao design system existente (mesmos tokens de cor/tipografia dos botões `.page-btn` já no leads.component.scss).

---

### 2. `EditaisService.getAll()` — paginação server-side

**Assinatura nova:**
```typescript
getAll(params?: { page?: number; size?: number; status?: EditalStatus }): Observable<Page<EditalResponse>>
```

- Passa `page` e `size` como `HttpParams`.
- Retorna `Page<EditalResponse>` (remove o `extractContent` pipe).
- Default: `page=0`, `size=25`.

---

### 3. `EditaisListComponent` — migração para server-side

**Mudanças:**
- Remover `MatTableDataSource.paginator` (binding ao `MatPaginator`).
- Adicionar sinais: `currentPage = signal(0)`, `totalElements = signal(0)`, `totalPages = signal(0)`.
- `loadEditais()` passa `page`/`size` ao serviço e popula os sinais.
- Evento `(page)` do `MatPaginator` ou `(pageChange)` do `app-paginator` chama `loadEditais()` com nova página.
- Filtro de status passa a ser query param no backend (não mais client-side `filterPredicate`).
- Busca por texto mantida client-side sobre a página atual (ou migrada para backend se endpoint suportar `q=`).
- Contador de totais (`totalEditais`, `totalProcessados`, etc.) usa os dados retornados pelo backend na página; os badges de status no filtro mostram count da página (ou chamada separada ao `/stats`).

---

### 4. `LeadsComponent` — substituir controles manuais

**Mudanças:**
- Remover o bloco `@if (totalPages() > 1) { <div class="pagination"> ... }` do template.
- Inserir `<app-paginator>` no lugar, passando `[page]`, `[totalPages]`, `[totalElements]`, `[pageSize]` e `(pageChange)="onPageChange($event)"`.
- Extrair `onPageChange(p: number)` no componente que atualiza `currentPage` e chama `carregarLeads()`.
- Resultado: paginação sempre visível quando há dados, mesmo com 1 página.

---

## Arquitetura

```
SharedPaginatorComponent
  ← usado por EditaisListComponent (server-side via MatPaginator substituído)
  ← usado por LeadsComponent (substitui controles manuais)
  ← disponível para futuras listas (processos, cotação, etc.)
```

---

## Fora do escopo

- Migração de processos (carregados com `size=500` no pipeline) — pipeline é kanban, não lista.
- Busca full-text server-side nos editais (endpoint `search?q=` já existe, mas a migração do filtro de texto é separada).
- Testes automatizados (projeto não tem suite de testes configurada).

---

## Critérios de aceitação

1. `app-paginator` renderiza em editais e leads com visual consistente.
2. Navegar entre páginas nos editais chama o backend (verificável no Network).
3. Controles de paginação nos leads ficam visíveis mesmo com 1 página de dados.
4. Filtro de status nos editais continua funcionando (agora como query param).
5. Nenhuma regressão visual nas duas telas.
