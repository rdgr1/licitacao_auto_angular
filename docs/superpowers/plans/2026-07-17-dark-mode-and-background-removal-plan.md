# Dark Mode + Background Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the animated `<app-bg-layer>` from the 4 authenticated screens (leads, pipeline, editais-list, edital-details), and add a manual dark-mode toggle (persisted) that correctly re-themes both the app's custom CSS variables and Angular Material's own M3 system tokens.

**Architecture:** A `ThemeService` (signal-based) toggles a `data-theme` attribute on `<html>` and persists the choice to `localStorage`, defaulting to `prefers-color-scheme` on first visit. `styles.scss` gets a `:root[data-theme="dark"]` block that overrides the existing semantic variables (`--card-bg`, `--text-primary`, `--border`, etc., already used everywhere via `var(--name, #fallback)`) **and** a `html[data-theme="dark"]` block overriding the Material M3 system tokens (`--mat-sys-surface`, `--mat-sys-on-surface`, `--mat-sys-background`, `--mat-sys-outline`, etc.) that `styles.scss` already sets globally today — without this second block, Material components (menus, dialogs, paginator, form fields) would stay light while custom cards turn dark. The permanently-dark sidebar (`--sidebar-*` vars) is intentionally left untouched — it already looks the same in both themes. `main-layout.component.ts` has a handful of raw hex colors (no `var()`) on light-surface popups (topbar icon buttons, notification popup, user dropdown menu) that need converting so they respond to the theme switch too.

**Tech Stack:** Angular 21 standalone components / signals, SCSS custom properties, Angular Material 21 (M3 theming), Vitest.

## Global Constraints

- Toggle is manual with persistence (`localStorage`), defaulting to the OS preference (`prefers-color-scheme`) only when no saved preference exists — confirmed with the user.
- The login screen (`features/auth/login/login.component.ts`) keeps its `<app-bg-layer>` — only the 4 **authenticated** screens lose it.
- The sidebar (`main-layout` `.sidebar`) is permanently dark by design in both themes — do not add dark overrides for `--sidebar-*` variables; leave them exactly as they are.
- Do not invent new color variables where an existing one already matches — reuse `--content-bg`, `--text-secondary`, etc. where the hex value lines up with what's already defined.

---

### Task 1: Remove `<app-bg-layer>` from the 4 authenticated screens

**Files:**
- Modify: `licitacao_auto_angular/src/app/features/leads/leads.component.ts` and `leads.component.html:1-2`
- Modify: `licitacao_auto_angular/src/app/features/pipeline/pipeline.component.ts` and `pipeline.component.html:1-2`
- Modify: `licitacao_auto_angular/src/app/features/editais/editais-list/editais-list.component.ts` and its `.html`
- Modify: `licitacao_auto_angular/src/app/features/editais/edital-details/edital-details.component.ts` and its `.html`

**Interfaces:** None — pure removal, no new interface surface.

- [ ] **Step 1: Remove from `leads`**

In `leads.component.ts`, delete the line:
```typescript
import { BackgroundLayerComponent } from '../../shared/components/background-layer/background-layer.component';
```
and remove `BackgroundLayerComponent` from the `imports: [...]` array.

In `leads.component.html`, delete line 2:
```html
  <app-bg-layer variant="aurora" [opacity]="0.4"></app-bg-layer>
```

- [ ] **Step 2: Remove from `pipeline`**

In `pipeline.component.ts`, delete the line:
```typescript
import { BackgroundLayerComponent } from '../../shared/components/background-layer/background-layer.component';
```
and remove `BackgroundLayerComponent` from the `imports: [...]` array.

In `pipeline.component.html`, delete line 2:
```html
  <app-bg-layer variant="aurora" [opacity]="0.15"></app-bg-layer>
```

- [ ] **Step 3: Remove from `editais-list`**

In `editais-list.component.ts`, delete the `BackgroundLayerComponent` import line and remove it from the component's `imports: [...]` array. In `editais-list.component.html`, delete the `<app-bg-layer ...>` line (same pattern as leads/pipeline — a single self-closing tag near the top of the template).

- [ ] **Step 4: Remove from `edital-details`**

In `edital-details.component.ts`, delete the `BackgroundLayerComponent` import line and remove it from the component's `imports: [...]` array. In `edital-details.component.html`, delete the `<app-bg-layer ...>` line.

- [ ] **Step 5: Manual verification**

Run: `cd /Users/rrxx/rdPersonal/Trabalho/licitacao_auto_angular && npm start`
Visit `/leads`, `/pipeline`, `/editais`, and an edital detail page — confirm no animated background renders and no console errors about an unknown `app-bg-layer` element (which would indicate a leftover import mismatch). Visit `/login` (logout first) — confirm its background is unchanged.

- [ ] **Step 6: Commit**

```bash
cd /Users/rrxx/rdPersonal/Trabalho/licitacao_auto_angular
git add src/app/features/leads/leads.component.ts src/app/features/leads/leads.component.html \
        src/app/features/pipeline/pipeline.component.ts src/app/features/pipeline/pipeline.component.html \
        src/app/features/editais/editais-list/editais-list.component.ts src/app/features/editais/editais-list/editais-list.component.html \
        src/app/features/editais/edital-details/edital-details.component.ts src/app/features/editais/edital-details/edital-details.component.html
git commit -m "fix: remove background animado das telas autenticadas (mantido no login)"
```

---

### Task 2: `ThemeService` (novo)

**Files:**
- Create: `licitacao_auto_angular/src/app/core/services/theme.service.ts`
- Test: `licitacao_auto_angular/src/app/core/services/theme.service.spec.ts` (new)

**Interfaces:**
- Produces: `ThemeService.theme: Signal<'light' | 'dark'>`, `ThemeService.toggle(): void`. Root-provided (`@Injectable({ providedIn: 'root' })`).

- [ ] **Step 1: Write the failing test**

Create `theme.service.spec.ts`:
```typescript
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const storageKey = 'licitaflow_theme';

  beforeEach(() => {
    localStorage.removeItem(storageKey);
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
  });

  it('usa o tema salvo no localStorage quando presente', () => {
    localStorage.setItem(storageKey, 'dark');
    const svc = TestBed.inject(ThemeService);
    expect(svc.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('cai para light quando não há preferência salva nem matchMedia dark', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
    const svc = TestBed.inject(ThemeService);
    expect(svc.theme()).toBe('light');
  });

  it('toggle alterna o tema e persiste', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
    const svc = TestBed.inject(ThemeService);
    svc.toggle();
    expect(svc.theme()).toBe('dark');
    expect(localStorage.getItem(storageKey)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    svc.toggle();
    expect(svc.theme()).toBe('light');
    expect(localStorage.getItem(storageKey)).toBe('light');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/rrxx/rdPersonal/Trabalho/licitacao_auto_angular && npx ng test --include='**/theme.service.spec.ts' --watch=false`
Expected: FAIL — `./theme.service` does not exist yet.

- [ ] **Step 3: Implement the service**

Create `theme.service.ts`:
```typescript
import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'licitaflow_theme';
  readonly theme = signal<Theme>(this.readInitial());

  constructor() {
    effect(() => {
      const value = this.theme();
      document.documentElement.setAttribute('data-theme', value);
      localStorage.setItem(this.storageKey, value);
    });
  }

  toggle(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private readInitial(): Theme {
    const saved = localStorage.getItem(this.storageKey);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/rrxx/rdPersonal/Trabalho/licitacao_auto_angular && npx ng test --include='**/theme.service.spec.ts' --watch=false`
Expected: PASS, 3 tests passed.

- [ ] **Step 5: Commit**

```bash
cd /Users/rrxx/rdPersonal/Trabalho/licitacao_auto_angular
git add src/app/core/services/theme.service.ts src/app/core/services/theme.service.spec.ts
git commit -m "feat: adiciona ThemeService para alternar modo claro/escuro"
```

---

### Task 3: Variáveis CSS escuras + tokens M3 do Material

**Files:**
- Modify: `licitacao_auto_angular/src/styles.scss`

**Interfaces:** None — pure CSS, consumed automatically by every component already using `var(--name, #fallback)`.

- [ ] **Step 1: Add the dark override for the app's semantic variables**

In `styles.scss`, immediately after the closing `}` of the existing `:root { ... }` block (the one starting at line 17 and ending at line 135, right before the `// ── Override Material tonal palette ──` comment at line 137), insert:
```scss
// ── Dark mode — overrides das variáveis semânticas ────────────────────────────
// Sidebar (--sidebar-*) fica de fora de propósito: já é escura nos dois temas.
:root[data-theme='dark'] {
  --header-bg:     #151B2B;
  --header-border: #263248;
  --content-bg:    #0C1322;

  --card-bg:           #151B2B;
  --card-border:       #263248;
  --card-shadow:       0 1px 3px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.25);
  --card-shadow-hover: 0 8px 24px rgba(0,0,0,0.45);

  --text-primary:   #E8EEF7;
  --text-secondary: #A9B7CC;
  --text-muted:     #6B7A93;

  --border:       #263248;
  --border-focus: #3B82F6;

  --skeleton-base:  #1D2740;
  --skeleton-shine: #26314C;

  --lead-desc-bg:      #1D2740;
  --lead-desc-color:   #8A99B3;
}
```

- [ ] **Step 2: Add the dark override for Material's M3 system tokens**

In `styles.scss`, immediately after the closing `}` of the `html { ... }` block that starts at line 139 (`// ── Override Material tonal palette ──`) and ends at line 188, insert:
```scss
// ── Dark mode — overrides dos tokens M3 do Material ───────────────────────────
// Cores de marca (primary/tertiary/switch/button) ficam iguais nos dois temas —
// só as superfícies neutras (fundo/texto/outline) mudam.
html[data-theme='dark'] {
  --mat-sys-surface:                   #151B2B;
  --mat-sys-on-surface:                #E8EEF7;
  --mat-sys-surface-variant:           #1D2740;
  --mat-sys-on-surface-variant:        #A9B7CC;
  --mat-sys-surface-container-lowest:  #0C1322;
  --mat-sys-surface-container-low:     #151B2B;
  --mat-sys-surface-container:         #1D2740;
  --mat-sys-surface-container-high:    #263248;
  --mat-sys-surface-container-highest: #324063;
  --mat-sys-background:                #0C1322;
  --mat-sys-on-background:             #E8EEF7;
  --mat-sys-outline:                   #263248;
  --mat-sys-outline-variant:           #324063;
}
```

- [ ] **Step 3: Manual verification**

Run: `cd /Users/rrxx/rdPersonal/Trabalho/licitacao_auto_angular && npm start`
In the browser console, run `document.documentElement.setAttribute('data-theme', 'dark')` and confirm: page backgrounds, cards, and text flip to dark; open a `mat-menu` (e.g. the user avatar dropdown) and a `mat-paginator` (e.g. on `/leads`) and confirm they also render with dark surfaces, not stuck light. Run `document.documentElement.removeAttribute('data-theme')` to go back to light and confirm everything reverts.

- [ ] **Step 4: Commit**

```bash
cd /Users/rrxx/rdPersonal/Trabalho/licitacao_auto_angular
git add src/styles.scss
git commit -m "feat: adiciona variaveis CSS e tokens M3 para modo escuro"
```

---

### Task 4: Toggle no topbar + conversão dos hex crus do `main-layout`

**Files:**
- Modify: `licitacao_auto_angular/src/app/features/layout/main-layout/main-layout.component.ts`

**Interfaces:**
- Consumes: `ThemeService.theme: Signal<'light'|'dark'>`, `ThemeService.toggle(): void` (Task 2).

- [ ] **Step 1: Inject `ThemeService` and add the toggle button**

In `main-layout.component.ts`, add the import near the other service imports:
```typescript
import { ThemeService } from '../../../core/services/theme.service';
```
Add the field next to the other injected services (near `auth = inject(AuthService);`):
```typescript
  theme = inject(ThemeService);
```
In the template, add the toggle button in `topbar-right`, right before the existing "Central de ajuda" button:
```html
            <button
              class="icon-btn"
              (click)="theme.toggle()"
              [matTooltip]="theme.theme() === 'dark' ? 'Modo claro' : 'Modo escuro'"
            >
              <mat-icon>{{ theme.theme() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>

            <button class="icon-btn hide-mobile" matTooltip="Central de ajuda">
              <mat-icon>help_outline</mat-icon>
            </button>
```

- [ ] **Step 2: Convert the topbar icon-button colors to theme variables**

Replace the `.icon-btn` block (lines 722-746):
```scss
      .icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
        transition: all 150ms ease;
        position: relative;

        &:hover {
          background: #f1f5f9;
          color: #0d1526;
        }

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
```
with:
```scss
      .icon-btn {
        background: none;
        border: none;
        cursor: pointer;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
        transition: all 150ms ease;
        position: relative;

        &:hover {
          background: var(--content-bg);
          color: var(--text-primary);
        }

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
```

- [ ] **Step 3: Convert the notification-dot border and popup colors**

Replace line 761 (`border: 1.5px solid white;` inside `.notif-dot`) with:
```scss
        border: 1.5px solid var(--header-bg);
```

Replace `.user-menu-name`/`.user-menu-email` (lines 834-843):
```scss
      .user-menu-name {
        font-size: 14px;
        font-weight: 600;
        color: #0d1526;
      }

      .user-menu-email {
        font-size: 12px;
        color: #94a3b8;
      }
```
with:
```scss
      .user-menu-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
      }

      .user-menu-email {
        font-size: 12px;
        color: var(--text-muted);
      }
```

Replace `.notif-popup-header`/`.notif-popup-title`/`.notif-clear-btn mat-icon` (lines 879-900):
```scss
      .notif-popup-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px 8px;
        border-bottom: 1px solid #e2e8f0;
      }

      .notif-popup-title {
        font-size: 14px;
        font-weight: 700;
        color: #0d1526;
      }

      .notif-clear-btn {
        width: 28px;
        height: 28px;
        mat-icon {
          font-size: 18px;
          color: #64748b;
        }
      }
```
with:
```scss
      .notif-popup-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px 8px;
        border-bottom: 1px solid var(--border);
      }

      .notif-popup-title {
        font-size: 14px;
        font-weight: 700;
        color: var(--text-primary);
      }

      .notif-clear-btn {
        width: 28px;
        height: 28px;
        mat-icon {
          font-size: 18px;
          color: var(--text-muted);
        }
      }
```

Replace the scrollbar thumb inside `.notif-popup-list` (line 914):
```scss
        &::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }
```
with:
```scss
        &::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 4px;
        }
```

Replace `.notif-popup-empty` color (line 925):
```scss
        color: #94a3b8;
```
with:
```scss
        color: var(--text-muted);
```
(only the line inside `.notif-popup-empty`, not any other `#94a3b8` occurrence.)

Replace `.notif-popup-item` border/hover (lines 941, 948):
```scss
        border-bottom: 1px solid #f1f5f9;
```
with:
```scss
        border-bottom: 1px solid var(--content-bg);
```
and:
```scss
        &:hover {
          background: #f8fafc;
        }
```
with:
```scss
        &:hover {
          background: var(--content-bg);
        }
```

Replace `.notif-score-chip` background/color (lines 956-957):
```scss
        background: #e2e8f0;
        color: #475569;
```
with:
```scss
        background: var(--content-bg);
        color: var(--text-secondary);
```

Replace `.notif-popup-numero` color (line 986):
```scss
        color: #0d1526;
```
with:
```scss
        color: var(--text-primary);
```

Replace `.notif-popup-objeto` color (line 994):
```scss
        color: #475569;
```
with:
```scss
        color: var(--text-secondary);
```

Leave untouched (intentional — brand accents and decorative gradients that already work on both themes): the sidebar block (lines ~279-630), `.coleta-pill*`, `.header-avatar`/`.user-avatar`/`.user-menu-avatar` gradients, `.logout-item` red, `.user-menu-items button:hover` green, `.notif-popup-cat` green.

- [ ] **Step 4: Manual verification**

Run: `cd /Users/rrxx/rdPersonal/Trabalho/licitacao_auto_angular && npm start`
Click the new sun/moon icon in the topbar. Expected: theme flips immediately; the notification bell popup and the user avatar dropdown menu both render with dark surfaces and legible text (no dark-gray-on-dark-gray or white-on-white); reload the page — theme choice persists; open a fresh incognito window — theme follows the OS preference.

- [ ] **Step 5: Commit**

```bash
cd /Users/rrxx/rdPersonal/Trabalho/licitacao_auto_angular
git add src/app/features/layout/main-layout/main-layout.component.ts
git commit -m "feat: adiciona toggle de modo escuro no topbar e converte cores fixas do main-layout"
```

---

## Self-Review

**Spec coverage:** Task 1 covers spec §2 (remoção do background). Task 2 covers spec §3.1 (`ThemeService`). Task 3 covers spec §3.2, **expanded**: reading `styles.scss` in full showed a third relevant block — the Material M3 system-token `html { --mat-sys-*, --mdc-* }` override (lines 139-188) — not just the `:root { ... }` semantic block the spec called out. Without dark-overriding `--mat-sys-surface`/`--mat-sys-background`/`--mat-sys-outline` etc., every Material component (menus, dialogs, paginator, form fields) would stay visually light while custom cards turned dark — an inconsistent half-dark UI. Task 3 Step 2 covers this. Task 4 covers spec §3.3 (hex sweep) and §3.4 (toggle button) — the sweep in this plan is scoped precisely to the light-surface elements identified by reading the file (topbar icon buttons, notification popup, user dropdown menu); the permanently-dark sidebar block and brand/decorative colors are explicitly left alone with a one-line rationale, rather than converted wholesale, since they don't need to change between themes.

**Placeholder scan:** no TBD/TODO; every step has complete, runnable code including exact before/after snippets for every hex value touched.

**Type consistency:** `ThemeService.theme`/`toggle()` names and signature are identical between Task 2 (definition) and Task 4 (consumption in `main-layout.component.ts`). The `data-theme` attribute name and its two values (`'light'`/`'dark'`) are consistent across `ThemeService` (Task 2) and both `styles.scss` selectors (Task 3).
