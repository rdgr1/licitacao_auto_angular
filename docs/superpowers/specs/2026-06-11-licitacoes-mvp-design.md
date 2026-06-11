# LicitaFlow — MVP Licitações: Design Spec

**Data:** 2026-06-11
**Escopo:** Finalizar o módulo de Licitações como produto utilizável (MVP 1)
**Fora de escopo:** Inteligência, Cotação, super admin panel, backend de auditoria completo

---

## 1. Design Direction

**Taste-skill dials:** `DESIGN_VARIANCE: 5 · MOTION_INTENSITY: 4 · VISUAL_DENSITY: 6`

**Design system:** Angular Material com tema customizado. Nenhum outro sistema.

**Brand tokens (hex direto — não usar `--mat-sys-*` fora do tema):**
- Sidebar: `#0D1526`
- Acento primário: `#11BF7F`
- Texto principal: `#0D1526`
- Texto secundário: `#64748B`
- Border: `#E2E8F0`
- Background: `#F1F5F9`
- White: `#FFFFFF`

**Regras de design:**
- Sem gradientes em texto, neon glow, borders brutalistas
- Fonte system-stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`) — nenhuma fonte nova
- Tamanho mínimo de texto: `11px` (acessibilidade)
- Micro-animações: `150ms ease` para transições de estado, `MatRipple` natural nos botões
- Layout: full-width com `padding: 24px` em todas as páginas — sem `max-width` centralizado
- Responsivo: breakpoint único em `768px`

---

## 2. Navegação — Módulos configuráveis

### Problema
O `navSections` em `MainLayoutComponent` está hardcoded. Não há mecanismo para ocultar seções por usuário.

### Solução

**Frontend: `NavSection` ganha `moduleKey`**
```typescript
interface NavSection {
  label: string;
  moduleKey: string; // 'licitacoes' | 'inteligencia' | 'cotacao'
  items: NavItem[];
}
```

**Frontend: `UserInfo` ganha campos novos**
```typescript
interface UserInfo {
  // ...campos existentes...
  enabledModules: string[];   // ['licitacoes'] no MVP
  tourCompleted: boolean;     // false no primeiro login
}
```

**Frontend: filtro no layout**
```typescript
get visibleSections(): NavSection[] {
  const enabled = this.auth.currentUser()?.enabledModules ?? ['licitacoes'];
  return this.navSections.filter(s => enabled.includes(s.moduleKey));
}
```

**MVP:** no `AuthService`, após login, se o backend não retornar `enabledModules`, fazer fallback para `['licitacoes']`. Quando o backend retornar o campo, funciona sem mudança de frontend.

**Redirect padrão:** `/dashboard` → `/leads`

**Configurações:** Removida do `navSections`. Acessível apenas via menu do avatar (já existe).

### Backend necessário
- `UserInfo` DTO: adicionar `enabledModules: List<String>` e `tourCompleted: boolean`
- `PATCH /users/me`: endpoint para salvar preferências e `tourCompleted`

---

## 3. Multi-coleta paralela (Leads)

### Problema
O método `coletar()` executa fontes sequencialmente com `await` em loop. Sem progresso individual por fonte. Pill do topbar é a única UI de andamento — longe do contexto.

### Solução

**`ColetaAndamentoService` — expansão do estado por fonte**
```typescript
interface FonteAndamento {
  fonte: string;
  status: 'pending' | 'running' | 'done' | 'error';
  stepAtual: number;
  totalSteps: number;
  salvos: number;
  materias: number;
  erros: number;
  duracaoMs: number;
}

interface ColetaAndamento {
  // campos existentes mantidos para compatibilidade
  ativa: boolean;
  fontes: FonteAndamento[];    // novo
  iniciadoEm: string | null;
}
```

Novos métodos: `iniciarFonte(fonte, total)`, `atualizarFonte(fonte, step)`, `concluirFonte(fonte, salvos, materias)`, `erroFonte(fonte)`.

**`leads.component.ts` — execução paralela**

`coletar()` separado em dois loops paralelos via `Promise.allSettled()`:
- DODF e DOU são disparados ao mesmo tempo
- Cada fonte atualiza seu próprio `FonteAndamento` independentemente
- PNCP permanece com `canCollect: false` (chip desabilitado "em breve")

**UI: painel de progresso inline (abaixo do form de busca)**

Aparece assim que `coletar()` é chamado. Para cada fonte:
- Status `running`: `MatProgressBar` mode `indeterminate` + chip azul/verde animado
- Status `done`: `MatProgressBar` mode `determinate` value `100` + checkmark + contadores (salvos, matérias)
- Status `error`: ícone de erro + mensagem

Linha de resumo no rodapé do painel: tempo decorrido + total de leads.

**Notificação de conclusão:** ao encerrar a coleta, `NotificacoesService.emitirBuscaConcluida(resumo)` é chamado. Aparece no popup do sino como item do tipo `busca_concluida`.

**Topbar pill:** mantida para visibilidade global, mas simplificada. Ao clicar, rola para o painel de progresso na tela de Leads (se o usuário navegou pra outro lugar, leva de volta via router).

---

## 4. Notificações — Reescrita completa

### Problema
`notificacoes.component` usa `--mat-sys-*` tokens (cor Material padrão — roxo/índigo), layout `max-width: 900px` centralizado diferente de todas as outras páginas, sem skeleton, sem filtro, sem Material list.

### Solução — reescrita usando Material

**`NotificacoesComponent` — nova estrutura:**
- Layout full-width, `padding: 24px`, sem max-width centralizado
- Header com título + badge de contagem + botão "Marcar todas como lidas" (`mat-stroked-button`)
- Filtro por fonte: `MatChipListbox` com chips DODF / DOU / PNCP / Busca
- Lista: `MatList` com `mat-list-item` por notificação + `MatDivider`

**Tipos de notificação (model):**
```typescript
type NotificacaoTipo = 'lead_encontrado' | 'busca_concluida';

interface NotificacaoEvent {
  // campos existentes mantidos
  tipo: NotificacaoTipo;  // novo campo
  leadScore?: number;
  // para busca_concluida:
  totalSalvos?: number;
  totalFontes?: number;
}
```

**Cores por score (hex direto, sem tokens M3):**
- score >= 70: `background: rgba(17,191,127,0.12)` / `color: #0DA66E` (hot)
- score 40-69: `background: rgba(245,158,11,0.12)` / `color: #D97706` (warm)
- score < 40: `background: #F1F5F9` / `color: #64748B` (cold)

**Skeleton loading:** 5 `MatListItem` com `@keyframes shimmer` enquanto carrega.

**Popup do sino (no `MainLayoutComponent`):** mantido como está, adiciona link clicável no item para `/editais/:id`.

---

## 5. Tour Interativo

### Implementação

**`TourService`** — serviço singleton:
```typescript
interface TourStep {
  selector: string;       // ex: '.busca-panel'
  titulo: string;
  descricao: string;
  posicao: 'top' | 'bottom' | 'right' | 'left';
}
```

Steps (em ordem):
1. Painel de busca (Leads) — "Aqui você dispara coletas nas fontes oficiais"
2. Lista de leads — "Cada lead é uma oportunidade identificada automaticamente"
3. Pipeline (`/pipeline`) — "Acompanhe o ciclo de vida de cada oportunidade"
4. Editais (`/editais`) — "Acesse os editais completos das licitações monitoradas"
5. Sino de notificações — "Você é avisado em tempo real quando novos leads chegam"
6. Avatar/Configurações — "Configure suas fontes e preferências aqui"

**Overlay:** `div` fixed cobrindo a tela com `box-shadow: 0 0 0 9999px rgba(0,0,0,0.5)`. O elemento alvo ganha `position: relative; z-index: acima do overlay`. Tooltip posicionado via `getBoundingClientRect()`.

**`TourOverlayComponent`** — standalone, declarado no `AppComponent` para ficar acima de tudo.

**Controle de estado:**
- `TourOverlayComponent` é declarado no `AppComponent` (acima do router-outlet, sempre disponível)
- `AppComponent.ngOnInit()` observa `auth.isAuthenticated` + `!auth.currentUser()?.tourCompleted` — quando ambos verdadeiros, inicia o tour após 800ms (deixa a página carregar)
- Ao concluir ou pular: chama `PATCH /users/me` com `{ tourCompleted: true }`, atualiza o signal local do `AuthService` e grava `localStorage.setItem('lf_tour_done', 'true')` como cache
- Se o `PATCH` falhar, o `localStorage` garante que o tour não re-exibe na mesma sessão
- Botão "Refazer tour" em Configurações > Perfil limpa o `localStorage`, chama `PATCH /users/me` com `{ tourCompleted: false }` e reinicia o serviço

---

## 6. Configurações — Reescrita com MatTabGroup

### Estrutura

`ConfiguracoesComponent` reescrito com `MatTabGroup` no topo. Sem sidebar interna.

**Tabs:**
| Tab | Conteúdo |
|-----|----------|
| Perfil | Avatar, nome, função, empresa, trocar senha |
| Notificações | Toggles por tipo (`MatSlideToggle`), slider de score mínimo (`MatSlider`) |
| Busca | Fontes padrão (`MatChipListbox`), modo de data padrão, período em dias |
| Sessões | Lista de dispositivos ativos, botão revogar (UI completa; ação efetiva quando backend suportar) |
| DODF | `DodfConfiguracaoComponent` embutido (existente) |
| DOU | `DouConfiguracaoComponent` embutido (existente) |
| PNCP | `PncpConfiguracaoComponent` embutido (existente) |

**`UserPreferences` — novo model frontend:**
```typescript
interface UserPreferences {
  notifNovoLead: boolean;
  notifBuscaConcluida: boolean;
  notifScoreMinimo: number;       // 0-100
  buscaFontesDefault: string[];   // ['DODF', 'DOU']
  buscaModoDataDefault: 'single' | 'range';
  buscaPeriodoDias: number;       // 7
}
```

Salvo via `PATCH /users/me/preferences`.

**Base para super admin (futuro):** a rota `/configuracoes` aceita um query param `?userId=<uuid>` que só ADMIN pode usar. Quando presente, carrega as prefs daquele usuário com um banner "Visualizando como: [nome]" e registra cada alteração no audit log do backend.

---

## 7. Polimento de componentes existentes

### Correções obrigatórias

| Componente | Problema | Correção |
|---|---|---|
| `notificacoes` | `--mat-sys-*` tokens fora do tema | Substituir por hex do brand system |
| `notificacoes` | `max-width: 900px; margin: 0 auto` | Remover; usar full-width como demais páginas |
| `shared/empty-state` | `--mat-sys-*` tokens | Substituir por hex direto |
| `shared/stats-card` | `--mat-sys-*` tokens + órfão | Corrigir tokens; adicionar ao Editais se couber |
| `leads` `.btn-coletar` | `#3B82F6` azul no CTA | Trocar por `#11BF7F` verde de marca |
| `editais-list` | Fontes `9.5px` / `10.5px` | Elevar para `11px` mínimo |
| `editais-list` | Search box hand-rolled | Converter para `mat-form-field` + `matInput` |

### Padronização de paginação

**Decisão:** adotar `mat-paginator` nativo em todos os lugares e remover `PaginatorComponent` custom.
- `leads.component`: trocar `<app-paginator>` por `<mat-paginator>` + override de estilo para manter visual atual
- `shared/paginator`: manter o arquivo mas parar de usar; deletar após confirmar que `mat-paginator` funciona corretamente no Leads

### Componentes órfãos

- `shared/stats-card`: avaliar aproveitamento no Dashboard futuro; se não usado no MVP, marcar como `// TODO: usar no módulo Inteligência`
- `shared/empty-state`: corrigir tokens e usar em todas as páginas que têm empty state inline (eliminar duplicação)

---

## 8. Backend — Mudanças necessárias (resumo)

| Endpoint | Mudança | Quando |
|---|---|---|
| `GET /auth/me` ou login | Retornar `enabledModules`, `tourCompleted` | MVP |
| `PATCH /users/me` | Aceitar `tourCompleted: boolean` | MVP (tour) |
| `PATCH /users/me/preferences` | Salvar `UserPreferences` | MVP (configurações) |
| `GET /users/me/preferences` | Retornar preferências salvas | MVP (configurações) |
| `GET /users/me/sessions` | Listar sessões ativas | Pós-MVP |
| `DELETE /users/me/sessions/:id` | Revogar sessão | Pós-MVP |
| Qualquer escrita | `audit_log` table | Pós-MVP (super admin) |

---

## 9. Ordem de implementação sugerida

1. **Token fix + polimento** — corrigir `--mat-sys-*` em todos os componentes, ajustar fontes e cores inconsistentes (sem risco, máximo impacto visual imediato)
2. **Navegação modular** — `moduleKey` + `enabledModules` + redirect para `/leads`
3. **Configurações reescrita** — `MatTabGroup` + tabs de perfil/notificações/busca/sessões
4. **Multi-coleta paralela** — expandir `ColetaAndamentoService` + refatorar `coletar()`
5. **Notificações reescrita** — `MatList` + filtros + skeleton + tipo `busca_concluida`
6. **Tour interativo** — `TourService` + `TourOverlayComponent`
7. **Padronização de paginação** — `mat-paginator` no Leads
