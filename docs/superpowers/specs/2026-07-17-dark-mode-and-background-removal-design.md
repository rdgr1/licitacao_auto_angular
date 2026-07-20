# Remover Background Animado da Área Logada + Modo Escuro: Design Spec

**Data:** 2026-07-17
**Escopo:** Remover o `<app-bg-layer>` (background animado) das telas autenticadas; introduzir modo escuro com toggle manual (persistido), reaproveitando o sistema de variáveis CSS já centralizado em `styles.scss`.
**Fora de escopo:** Indicadores visuais de leads (spec separada, `2026-07-17-lead-visual-indicators-design.md`); remover o background do login (fica como está); dark mode em gráficos/telas com cor fixa não coberta nesta spec (ver seção 6).
**Repo afetado:** `licitacao_auto_angular` (frontend apenas).

---

## 1. Problema

`BackgroundLayerComponent` (`shared/components/background-layer/`) é importado individualmente em 4 telas autenticadas — `leads`, `pipeline`, `editais-list`, `edital-details` — cada uma renderizando `<app-bg-layer variant="..." [opacity]="...">`. O usuário quer isso removido da área logada (o login mantém o próprio background).

Hoje não existe nenhuma infraestrutura de tema: `styles.scss` define um único `@include mat.theme(...)` (Material 3, paleta `spring-green`) e um bloco `:root { ... }` com ~50 variáveis CSS semânticas (`--sidebar-bg`, `--card-bg`, `--text-primary`, etc., linhas 1-190), todas fixas em tons claros. A maioria dos componentes já consome essas variáveis via `var(--nome, #fallback)`, mas alguns lugares (ex: `main-layout.component.ts`, estilos inline) usam hex direto sem passar pela variável.

---

## 2. Remoção do background animado

Remover import + tag `<app-bg-layer ...>` de:
- `features/leads/leads.component.ts` + `leads.component.html:2`
- `features/pipeline/pipeline.component.ts` + `pipeline.component.html:2`
- `features/editais/editais-list/editais-list.component.ts` + `.html`
- `features/editais/edital-details/edital-details.component.ts` + `.html`

`features/auth/login/login.component.ts` mantém o uso — não é "área logada".

Se, depois da remoção, nenhum outro componente autenticado usar `BackgroundLayerComponent`, o componente em si continua existindo (usado pelo login) — não é removido do projeto.

---

## 3. Modo escuro

### 3.1 `ThemeService` (novo — `core/services/theme.service.ts`)

```typescript
export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'licitaflow_theme';
  theme = signal<Theme>(this.readInitial());

  constructor() {
    effect(() => {
      document.documentElement.setAttribute('data-theme', this.theme());
      localStorage.setItem(this.storageKey, this.theme());
    });
  }

  toggle(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private readInitial(): Theme {
    const saved = localStorage.getItem(this.storageKey) as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
```
Instanciado (via `inject()`) uma vez em `AppComponent` ou `MainLayoutComponent` pra garantir que o `effect()` rode desde o boot — mas a leitura do `localStorage`/`matchMedia` já acontece no construtor, então o atributo é aplicado no primeiro tick independente de quem injeta primeiro.

### 3.2 Variáveis CSS escuras (`styles.scss`)

Duplicar o bloco `:root { ... }` (linhas 17-190) como `:root[data-theme="dark"] { ... }`, com os mesmos nomes de variável e valores escuros equivalentes (ex: `--card-bg: #151B2B`, `--text-primary: #E8EEF7`, `--content-bg: #0C1322`, `--border: #263248`, etc.). Como o restante do app já lê essas variáveis via `var(--nome, #fallback)`, o override cascateia sem tocar nos componentes — o fallback hex só se aplica quando a variável não está definida, e ela sempre estará (light ou dark).

`@include mat.theme(...)` ganha uma segunda chamada dentro do seletor `[data-theme="dark"]`, trocando só a claridade do esquema de cor (Material 3 M3 suporta isso via a mesma paleta com `color-scheme: dark` — não precisa de paleta nova, só o esquema).

### 3.3 Varredura de hex direto

`main-layout.component.ts` tem estilos inline com hex cru sem `var()` (ex: `.user-menu-name { color: #0d1526; }`, `.notif-popup-title { color: #0d1526; }`, várias outras nos estilos inline do componente). Esses precisam ser convertidos para `var(--text-primary)` etc. antes do dark mode funcionar corretamente ali — é o único arquivo com esse padrão identificado até agora; outros componentes já usam `var()` consistentemente. Durante a implementação, rodar uma busca (`grep -rn "#[0-9a-fA-F]\{3,6\}" --include=*.ts --include=*.scss`) pra confirmar se há outros pontos fora do main-layout.

### 3.4 Toggle no topbar

Botão novo em `main-layout.component.ts`, `topbar-right` (ao lado de ajuda/notificações/logout):
```html
<button class="icon-btn" (click)="theme.toggle()" [matTooltip]="theme.theme() === 'dark' ? 'Modo claro' : 'Modo escuro'">
  <mat-icon aria-hidden="true">{{ theme.theme() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
</button>
```

---

## 4. Fluxo de dados

1. App carrega → `ThemeService` lê `localStorage` (ou `prefers-color-scheme` na primeira visita) → aplica `data-theme` no `<html>` antes do primeiro paint relevante.
2. Usuário clica no botão do topbar → `theme.toggle()` → signal muda → `effect()` atualiza o atributo e persiste no `localStorage`.
3. CSS já reage via cascata de variáveis — nenhum componente observa o `ThemeService` diretamente, exceto o próprio botão (pra trocar o ícone/tooltip).

---

## 5. Testes

- Unitário `ThemeService`: `toggle()` alterna e persiste; leitura inicial respeita `localStorage` quando presente, cai pro `matchMedia` quando ausente.
- Manual: alternar tema em `leads`, `pipeline`, `editais`, `dashboard`, `configuracoes`, dialogs (fornecedor, item, lead-detalhe) — conferir contraste e que nenhum texto fica ilegível (ex: texto escuro em fundo escuro por causa de hex cru esquecido).
- Manual: reload da página mantém o tema escolhido; sessão nova em navegador limpo segue o SO.
- Manual: confirmar que `leads`, `pipeline`, `editais-list`, `edital-details` não renderizam mais o background animado; `login` continua com o dele.

---

## 6. Fora de escopo / follow-ups

- Gráficos ou visualizações com cor fixa (nenhum identificado no momento desta spec, mas se surgir durante a implementação, ajustar pontualmente).
- Migrar o restante do app para eliminar hex cru remanescente além do `main-layout` (se a varredura da seção 3.3 encontrar mais, tratar caso a caso durante a implementação, não é um redesign completo).
- Preferência de tema por usuário salva no backend (hoje fica só no `localStorage` do navegador).
