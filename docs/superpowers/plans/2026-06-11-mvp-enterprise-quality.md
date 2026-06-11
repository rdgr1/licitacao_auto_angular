# LicitaFlow MVP — Enterprise Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevar as três telas do MVP (Leads, Pipeline, Editais) a nível enterprise: robustez, design system aplicado, animações com propósito, acessibilidade WCAG 2.1 AA.

**Architecture:** Angular 21 standalone + Material 21 + CDK. Sem novas bibliotecas. Tokens CSS já existem em `styles.scss` — tarefa é aplicá-los nos componentes. Fase por fase, commit por fase. Não alterar `src/app/core/services` nem `core/models` exceto o interceptor.

**Tech Stack:** Angular 21, Angular Material 21, Angular CDK, SCSS, Angular Animations, Title service.

**Design token reference (já definidos em `src/styles.scss`):**
```
--brand-primary: #11BF7F      --text-primary: #0F172A
--brand-primary-hover: #0DA66E --text-secondary: #475569
--card-bg: #FFFFFF             --text-muted: #94A3B8
--card-border: #E2E8F0         --border: #E2E8F0
--card-shadow: 0 1px 3px...    --content-bg: #F1F5F9
--spacing-xs: 4px   --spacing-sm: 8px   --spacing-md: 16px
--spacing-lg: 24px  --spacing-xl: 32px  --spacing-2xl: 48px
--radius-sm: 6px    --radius-md: 8px    --radius-lg: 12px
--radius-xl: 16px   --transition: 150ms ease
--score-hot: #EF4444  --score-warm: #F59E0B  --score-cold: #3B82F6
--status-processado: #11BF7F  --status-pendente: #F59E0B  --status-erro: #EF4444
Global classes: .status-chip(.processado|.pendente|.erro), .score-badge(.hot|.warm|.cold)
```

---

## FASE 1 — Escopo MVP e configuração (Task 1-2)

---

### Task 1: `environment.prod.ts` + fonte tokens adicionais

**Files:**
- Modify: `src/environments/environment.prod.ts`
- Modify: `src/styles.scss`

- [ ] **Documentar `environment.prod.ts`**:
  ```typescript
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
  ```

- [ ] **Adicionar tokens de fonte e leads por fonte em `styles.scss`** (após `--color-info`):
  ```scss
  // Fontes de coleta
  --fonte-dodf-bg:    rgba(99,102,241,0.10);
  --fonte-dodf-color: #4F46E5;
  --fonte-dou-bg:     rgba(59,130,246,0.10);
  --fonte-dou-color:  #2563EB;
  --fonte-pncp-bg:    rgba(245,158,11,0.10);
  --fonte-pncp-color: #D97706;

  // Lead status (além dos já existentes)
  --lead-novo-bg:      rgba(59,130,246,0.10);
  --lead-novo-color:   #1E40AF;
  --lead-qual-bg:      rgba(17,191,127,0.10);
  --lead-qual-color:   #065F46;
  --lead-desc-bg:      #F1F5F9;
  --lead-desc-color:   #64748B;

  // Skeleton
  --skeleton-base:  #E2E8F0;
  --skeleton-shine: #F8FAFC;
  ```

- [ ] **Adicionar `@keyframes skeleton-shimmer` em `styles.scss`** (logo após os tokens):
  ```scss
  @keyframes skeleton-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }

  .skeleton {
    background: linear-gradient(90deg,
      var(--skeleton-base) 25%,
      var(--skeleton-shine) 50%,
      var(--skeleton-base) 75%);
    background-size: 800px 100%;
    animation: skeleton-shimmer 1.4s ease-in-out infinite;
    border-radius: var(--radius-md);
  }

  @media (prefers-reduced-motion: reduce) {
    .skeleton { animation: none; background: var(--skeleton-base); }
  }
  ```

- [ ] **Commit:**
  ```bash
  git add src/environments/environment.prod.ts src/styles.scss
  git commit -m "chore(fase1): documentar env.prod e adicionar tokens de fonte/skeleton"
  ```

---

### Task 2: Nav MVP + `returnUrl` no authGuard + Title service

**Files:**
- Modify: `src/app/core/guards/auth.guard.ts`
- Modify: `src/app/app.component.ts` (ou `src/app/app.ts`)

- [ ] **Ler `src/app/core/guards/auth.guard.ts`** — o guard atual redireciona para `/login` sem preservar a URL desejada. Substituir o `authGuard`:
  ```typescript
  import { inject } from '@angular/core';
  import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
  import { AuthService } from '../services/auth.service';

  export const authGuard: CanActivateFn = (
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.isAuthenticated()) return true;
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  };

  export const guestGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isAuthenticated()) return true;
    return router.createUrlTree(['/']);
  };
  ```

- [ ] **Ler `src/app/features/auth/login/login.component.ts`** e adicionar redirect pós-login para `returnUrl`. Encontrar o método `login()` ou equivalente e após sucesso:
  ```typescript
  // No topo do componente, inject ActivatedRoute e Router se não existirem
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // No callback de sucesso do login:
  const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/leads';
  this.router.navigateByUrl(returnUrl);
  ```

- [ ] **Title service — configurar títulos dinâmicos por rota.** Ler `src/app/app.routes.ts` e adicionar `data: { title: '...' }` nas rotas das 3 telas:
  ```typescript
  // Nas rotas de leads, pipeline, editais, editais/:id:
  { path: 'leads',    data: { title: 'Leads — LicitaFlow' },    loadComponent: ... },
  { path: 'pipeline', data: { title: 'Pipeline — LicitaFlow' }, loadComponent: ... },
  { path: 'editais',  data: { title: 'Editais — LicitaFlow' },  loadComponent: ... },
  { path: 'editais/:id', data: { title: 'Edital — LicitaFlow' }, loadComponent: ... },
  { path: 'login',    data: { title: 'Entrar — LicitaFlow' },   loadComponent: ... },
  ```

- [ ] **Ler `src/app/app.component.ts`** (ou `src/app/app.ts`) e adicionar Title service listener:
  ```typescript
  import { Component, inject, OnInit } from '@angular/core';
  import { RouterOutlet } from '@angular/router';
  import { Title } from '@angular/platform-browser';
  import { Router, NavigationEnd } from '@angular/router';
  import { filter, map } from 'rxjs';
  // ... outros imports existentes ...

  // No construtor ou ngOnInit, após os imports existentes:
  private titleService = inject(Title);
  private router = inject(Router);

  // Adicionar no construtor (após código existente):
  this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    map(() => {
      let route = this.router.routerState.root;
      while (route.firstChild) route = route.firstChild;
      return route.snapshot.data?.['title'] ?? 'LicitaFlow';
    })
  ).subscribe(title => this.titleService.setTitle(title));
  ```

- [ ] **Verificar build:** `npx ng build --configuration production 2>&1 | tail -5`

- [ ] **Commit:**
  ```bash
  git add src/app/core/guards/auth.guard.ts \
          src/app/features/auth/login/login.component.ts \
          src/app/app.routes.ts \
          src/app/app.component.ts
  git commit -m "feat(fase1): returnUrl no authGuard, título dinâmico por rota"
  ```

---

## FASE 2 — Robustez: interceptor + estados loading/vazio/erro (Task 3-5)

---

### Task 3: HTTP error interceptor — logout no 401

**Files:**
- Modify: `src/app/core/interceptors/http-error.interceptor.ts`

- [ ] **Substituir o conteúdo completo do interceptor:**
  ```typescript
  import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
  import { inject } from '@angular/core';
  import { Router } from '@angular/router';
  import { catchError, throwError } from 'rxjs';
  import { NotificationService } from '../services/notification.service';
  import { AuthService } from '../services/auth.service';

  const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh-token'];

  export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
    const notificationService = inject(NotificationService);
    const authService = inject(AuthService);
    const router = inject(Router);

    return next(req).pipe(
      catchError((error) => {
        const isAuthEndpoint = AUTH_ENDPOINTS.some(e => req.url.includes(e));

        if (error.status === 401 && !isAuthEndpoint) {
          authService.logout();
          router.navigate(['/login'], {
            queryParams: { returnUrl: router.url, reason: 'session_expired' }
          });
          return throwError(() => error);
        }

        let errorMessage = 'Ocorreu um erro inesperado.';
        if (error.error?.message)       errorMessage = error.error.message;
        else if (error.status === 0)    errorMessage = 'Sem conexão com o servidor.';
        else if (error.status === 401)  errorMessage = 'Credenciais inválidas.';
        else if (error.status === 403)  errorMessage = 'Acesso negado.';
        else if (error.status === 404)  errorMessage = 'Recurso não encontrado.';
        else if (error.status >= 500)   errorMessage = 'Erro no servidor. Tente novamente mais tarde.';

        notificationService.error(errorMessage);
        return throwError(() => error);
      })
    );
  };
  ```

- [ ] **`ng build` sem erros:** `npx ng build --configuration production 2>&1 | tail -5`

- [ ] **Remover link "Esqueci minha senha" do login para o demo** (endpoints de reset não existem no backend ainda — tela morta em demo é pior que ausência). Ler `src/app/features/auth/login/login.component.ts` e no template remover ou comentar o `<a routerLink="/forgot-password">Esqueci minha senha</a>`:
  ```html
  <!-- MVP: comentado até backend implementar forgot-password -->
  <!-- <a routerLink="/forgot-password" class="forgot-link">Esqueci minha senha</a> -->
  ```

- [ ] **Commit:**
  ```bash
  git add src/app/core/interceptors/http-error.interceptor.ts \
          src/app/features/auth/login/login.component.ts
  git commit -m "fix(fase2): interceptor 401 faz logout+redirect; remove link forgot-password do demo"
  ```

---

### Task 4: Estados loading/vazio/erro na tela de Leads

**Files:**
- Modify: `src/app/features/leads/leads.component.html`
- Modify: `src/app/features/leads/leads.component.scss`

- [ ] **Ler `leads.component.html`** inteiro para entender a estrutura atual do template.

- [ ] **Ler `leads.component.ts`** e verificar se existe sinal `apiError`. Se não existir, adicionar:
  ```typescript
  // Já existe: loading = signal(true); apiError = signal(false);
  // Se apiError não existir, adicionar na declaração de signals:
  apiError = signal(false);
  // Em carregarLeads(), no error callback:
  error: () => { this.loading.set(false); this.apiError.set(true); }
  // No success callback, garantir:
  next: (...) => { this.loading.set(false); this.apiError.set(false); ... }
  ```

- [ ] **Localizar no HTML o bloco de lista de leads** (provavelmente após os filtros). Envolver com skeleton + empty + erro.

  Adicionar **antes** do bloco principal de leads (após o bloco de filtros/status):
  ```html
  <!-- Estado: carregando -->
  @if (loading()) {
    <div class="leads-skeleton" aria-label="Carregando leads..." role="status">
      @for (i of [1,2,3,4,5,6]; track i) {
        <div class="lsk-card">
          <div class="lsk-row">
            <div class="skeleton lsk-badge"></div>
            <div class="skeleton lsk-date"></div>
          </div>
          <div class="skeleton lsk-title"></div>
          <div class="skeleton lsk-org"></div>
          <div class="lsk-footer">
            <div class="skeleton lsk-chip"></div>
            <div class="skeleton lsk-score"></div>
          </div>
        </div>
      }
    </div>
  }

  <!-- Estado: erro -->
  @if (!loading() && apiError()) {
    <div class="leads-error-state" role="alert">
      <mat-icon aria-hidden="true">cloud_off</mat-icon>
      <h2>Não foi possível carregar os leads</h2>
      <p>Verifique a conexão com o servidor e tente novamente.</p>
      <button mat-flat-button (click)="carregarLeads()">
        <mat-icon>refresh</mat-icon> Tentar novamente
      </button>
    </div>
  }

  <!-- Estado: vazio (sem resultados) -->
  @if (!loading() && !apiError() && filteredLeads().length === 0) {
    <div class="leads-empty-state">
      <mat-icon aria-hidden="true">inbox</mat-icon>
      @if (selectedStatus()) {
        <h2>Nenhum lead com este status</h2>
        <p>Tente outro filtro ou aguarde novas coletas.</p>
        <button mat-stroked-button (click)="selectedStatus.set(null); selectedTabIdx.set(0)">
          <mat-icon>filter_list_off</mat-icon> Limpar filtros
        </button>
      } @else {
        <h2>Nenhum lead encontrado</h2>
        <p>Dispare uma busca nas fontes DODF, DOU ou PNCP para começar.</p>
      }
    </div>
  }
  ```

  Garantir que o `@for` da lista de leads esteja dentro de um bloco `@if (!loading() && !apiError() && filteredLeads().length > 0)`.

- [ ] **Adicionar estilos em `leads.component.scss`**:
  ```scss
  // ── Skeleton ──────────────────────────────────────────────────────────────────
  .leads-skeleton {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-md);
    padding: var(--spacing-md) 0;
  }
  .lsk-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-md);
    display: flex; flex-direction: column; gap: var(--spacing-sm);
  }
  .lsk-row  { display: flex; gap: var(--spacing-sm); }
  .lsk-badge  { width: 48px;  height: 20px; }
  .lsk-date   { width: 80px;  height: 20px; margin-left: auto; }
  .lsk-title  { width: 100%;  height: 16px; }
  .lsk-org    { width: 60%;   height: 14px; }
  .lsk-footer { display: flex; gap: var(--spacing-sm); margin-top: var(--spacing-xs); }
  .lsk-chip   { width: 64px;  height: 22px; }
  .lsk-score  { width: 40px;  height: 22px; margin-left: auto; }

  // ── Empty / Error states ──────────────────────────────────────────────────────
  .leads-error-state,
  .leads-empty-state {
    display: flex; flex-direction: column; align-items: center; gap: var(--spacing-md);
    padding: var(--spacing-2xl) var(--spacing-lg); text-align: center;

    mat-icon { font-size: 48px; width: 48px; height: 48px; color: var(--text-muted); opacity: 0.5; }
    h2 { font-size: 17px; font-weight: 700; color: var(--text-primary); margin: 0; }
    p  { font-size: 14px; color: var(--text-secondary); margin: 0; max-width: 380px; line-height: 1.5; }
  }
  .leads-error-state mat-icon { color: var(--status-erro); opacity: 0.7; }
  ```

- [ ] **Commit:**
  ```bash
  git add src/app/features/leads/leads.component.html \
          src/app/features/leads/leads.component.scss \
          src/app/features/leads/leads.component.ts
  git commit -m "feat(fase2): estados skeleton/vazio/erro na tela de Leads"
  ```

---

### Task 5: Estados loading/vazio/erro no Pipeline e Editais

**Files:**
- Modify: `src/app/features/pipeline/pipeline.component.html`
- Modify: `src/app/features/pipeline/pipeline.component.scss`
- Modify: `src/app/features/editais/editais-list/editais-list.component.html`
- Modify: `src/app/features/editais/editais-list/editais-list.component.scss`
- Modify: `src/app/features/editais/edital-details/edital-details.component.html`

**Pipeline:**

- [ ] **Ler `pipeline.component.html`** — identificar onde ficam os estados de loading (`loadingQual` / `loadingProc`) e colunas vazias.

- [ ] **Localizar o bloco `@if (loadingQual())` existente e substituir o spinner por skeleton de colunas**:
  ```html
  <!-- Substitua o estado de loading existente por: -->
  @if (loadingQual()) {
    <div class="pipeline-skeleton" aria-label="Carregando pipeline..." role="status">
      @for (col of [1,2,3,4,5]; track col) {
        <div class="psk-col">
          <div class="skeleton psk-header"></div>
          @for (card of [1,2,3]; track card) {
            <div class="psk-card">
              <div class="lsk-row">
                <div class="skeleton lsk-badge"></div>
                <div class="skeleton lsk-date"></div>
              </div>
              <div class="skeleton lsk-title"></div>
              <div class="skeleton lsk-org"></div>
            </div>
          }
        </div>
      }
    </div>
  }
  ```

- [ ] **Adicionar estilos em `pipeline.component.scss`**:
  ```scss
  .pipeline-skeleton {
    display: flex; gap: var(--spacing-md); overflow-x: auto; padding: var(--spacing-md) 0; flex: 1;
  }
  .psk-col {
    min-width: 260px; display: flex; flex-direction: column; gap: var(--spacing-sm); flex-shrink: 0;
  }
  .psk-header { height: 36px; width: 100%; border-radius: var(--radius-md); }
  .psk-card {
    background: var(--card-bg); border: 1px solid var(--border);
    border-radius: var(--radius-lg); padding: var(--spacing-md);
    display: flex; flex-direction: column; gap: var(--spacing-sm);
  }
  ```

**Editais (lista):**

- [ ] **Ler `editais-list.component.html`** e `editais-list.component.ts` — verificar sinal de loading e se há estado de erro.

- [ ] **Adicionar `apiError = signal(false)` em `editais-list.component.ts`** se não existir, e populá-lo no error handler do carregamento principal.

- [ ] **No HTML da lista de editais, envolver a tabela com os três estados:**
  ```html
  @if (loading()) {
    <div class="editais-skeleton" aria-label="Carregando editais..." role="status">
      @for (i of [1,2,3,4,5,6,7,8]; track i) {
        <div class="esk-row">
          <div class="skeleton esk-num"></div>
          <div class="skeleton esk-obj"></div>
          <div class="skeleton esk-org"></div>
          <div class="skeleton esk-badge"></div>
          <div class="skeleton esk-val"></div>
        </div>
      }
    </div>
  }
  @if (!loading() && apiError()) {
    <div class="editais-error-state" role="alert">
      <mat-icon aria-hidden="true">cloud_off</mat-icon>
      <p>Não foi possível carregar os editais.</p>
      <button mat-flat-button (click)="carregarEditais()">
        <mat-icon>refresh</mat-icon> Tentar novamente
      </button>
    </div>
  }
  ```

- [ ] **Adicionar estilos em `editais-list.component.scss`**:
  ```scss
  .editais-skeleton {
    display: flex; flex-direction: column; gap: 1px;
    border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden;
  }
  .esk-row {
    display: grid; grid-template-columns: 140px 1fr 200px 100px 100px;
    gap: var(--spacing-md); padding: 12px 16px; background: var(--card-bg);
    border-bottom: 1px solid var(--border);
    &:last-child { border-bottom: none; }
  }
  .esk-num   { height: 14px; width: 120px; }
  .esk-obj   { height: 14px; }
  .esk-org   { height: 14px; width: 160px; }
  .esk-badge { height: 20px; width: 80px; }
  .esk-val   { height: 14px; width: 80px; }

  .editais-error-state {
    display: flex; flex-direction: column; align-items: center; gap: var(--spacing-md);
    padding: var(--spacing-2xl); text-align: center;
    mat-icon { font-size: 40px; width: 40px; height: 40px; color: var(--text-muted); }
    p { font-size: 14px; color: var(--text-secondary); margin: 0; }
  }
  ```

**Editais (detalhe) — o `SectionState` já existe, verificar template:**

- [ ] **Ler `edital-details.component.html`** e confirmar que cada seção colapsável exibe loading/error/empty quando `section.state` muda. Se algum estado não tiver UI, adicionar:
  ```html
  <!-- Dentro de cada seção, após o bloco de conteúdo real: -->
  @case ('loading') {
    <div class="section-skeleton" role="status" aria-label="Carregando...">
      @for (i of [1,2,3]; track i) {
        <div class="skeleton" style="height:40px;width:100%;margin-bottom:8px;border-radius:var(--radius-md)"></div>
      }
    </div>
  }
  @case ('error') {
    <div class="section-error" role="alert">
      <mat-icon aria-hidden="true">error_outline</mat-icon>
      <span>Erro ao carregar. <button class="link-btn" (click)="reloadSection()">Tentar novamente</button></span>
    </div>
  }
  @case ('empty') {
    <div class="section-empty">
      <mat-icon aria-hidden="true">inbox</mat-icon>
      <span>Nenhum item encontrado.</span>
    </div>
  }
  ```

- [ ] **Build:** `npx ng build --configuration production 2>&1 | tail -5`

- [ ] **Commit:**
  ```bash
  git add src/app/features/pipeline/ \
          src/app/features/editais/
  git commit -m "feat(fase2): estados skeleton/vazio/erro em Pipeline e Editais"
  ```

---

## FASE 3 — Design system aplicado nos componentes (Task 6-8)

---

### Task 6: Tokens em `leads.component.scss` + badge de fonte + score chip

**Files:**
- Modify: `src/app/features/leads/leads.component.scss`
- Modify: `src/app/features/leads/leads.component.html`

- [ ] **Abrir `leads.component.scss`** e substituir as principais ocorrências de hex hardcoded:

  Usar `grep -n "#" src/app/features/leads/leads.component.scss | head -40` para listar, depois:

  | Hardcoded | Token |
  |---|---|
  | `#0D1526` ou `#0F172A` | `var(--text-primary)` |
  | `#475569` ou `#64748B` | `var(--text-secondary)` |
  | `#94A3B8` | `var(--text-muted)` |
  | `#E2E8F0` ou `#EEF2F7` | `var(--border)` |
  | `#F1F5F9` | `var(--content-bg)` |
  | `#FFFFFF` | `var(--card-bg)` |
  | `#11BF7F` | `var(--brand-primary)` |
  | `#0DA66E` | `var(--brand-primary-hover)` |
  | `#EF4444` | `var(--status-erro)` |
  | `#F59E0B` | `var(--status-pendente)` |
  | `#3B82F6` | `var(--color-info)` |

- [ ] **No HTML, substituir os badges de fonte inline por classes de token.** Encontrar onde aparecem `DODF`, `DOU`, `PNCP` como badges e trocar para:
  ```html
  <!-- Antes: <span class="fonte-badge fonte-dodf">DODF</span> -->
  <!-- Depois (ou confirmar que já usa estas classes): -->
  <span class="fonte-tag fonte-tag-{{ lead.fonte?.toLowerCase() }}" aria-label="Fonte {{ lead.fonte }}">
    {{ lead.fonte }}
  </span>
  ```

- [ ] **Adicionar `.fonte-tag` em `leads.component.scss`** (se não existir com esse padrão):
  ```scss
  .fonte-tag {
    display: inline-flex; align-items: center;
    padding: 2px 8px; border-radius: var(--radius-full);
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.06em; white-space: nowrap;
    &.fonte-tag-dodf { background: var(--fonte-dodf-bg); color: var(--fonte-dodf-color); }
    &.fonte-tag-dou  { background: var(--fonte-dou-bg);  color: var(--fonte-dou-color);  }
    &.fonte-tag-pncp { background: var(--fonte-pncp-bg); color: var(--fonte-pncp-color); }
  }
  ```

- [ ] **Verificar/aplicar `.score-badge` global** no card de lead: confirmar que o score usa a classe global `.score-badge.hot|.warm|.cold` do `styles.scss`. Se estiver usando `[style.background]` ou hex inline, substituir por:
  ```html
  <span class="score-badge {{ lead.leadScore >= 70 ? 'hot' : lead.leadScore >= 40 ? 'warm' : 'cold' }}"
        aria-label="Score {{ lead.leadScore }}">
    {{ lead.leadScore }}
  </span>
  ```

- [ ] **Persistir filtro de status na sessão.** Ler `leads.component.ts` para ver como `selectedStatus` é definido. Adicionar persistência em `sessionStorage` para que o filtro sobreviva a navegação mas não a fechar a aba:
  ```typescript
  // Nas declarações de signals (alterar selectedStatus para ler/salvar sessionStorage):
  selectedStatus = signal<LeadStatus | null>(
    (sessionStorage.getItem('leads_filter_status') as LeadStatus | null) ?? null
  );
  selectedTabIdx = signal(
    parseInt(sessionStorage.getItem('leads_filter_tab') ?? '0', 10)
  );

  // Criar método auxiliar chamado sempre que o filtro mudar:
  setStatusFilter(status: LeadStatus | null, tabIdx: number): void {
    this.selectedStatus.set(status);
    this.selectedTabIdx.set(tabIdx);
    if (status) sessionStorage.setItem('leads_filter_status', status);
    else sessionStorage.removeItem('leads_filter_status');
    sessionStorage.setItem('leads_filter_tab', String(tabIdx));
    this.carregarLeads();
  }
  ```
  No template, substituir os click handlers dos tabs de status para chamar `setStatusFilter(tab.value, i)` em vez de atribuir diretamente.

- [ ] **Commit:**
  ```bash
  git add src/app/features/leads/
  git commit -m "refactor(fase3): tokens em Leads, fonte-tag, score-badge, filtro persistente"
  ```

---

### Task 7: Tokens em `pipeline.component.scss` + kanban column colors

**Files:**
- Modify: `src/app/features/pipeline/pipeline.component.scss`

- [ ] **Abrir `pipeline.component.scss`** e aplicar a mesma substituição de hex → tokens da Task 6.

- [ ] **Definir as cores de coluna como CSS custom properties inline no TS** (já existe com `--cc`). Verificar se o `pipeline.component.ts` define as cores das colunas. Se estiver hardcoded no SCSS, mover para variáveis no TS como CSS properties e usar no template via `[style.--cc]`. Confirmar que as cores estão alinhadas com os tokens:
  ```typescript
  // Nas definições de coluna do componente:
  // qualColumns e procColumns — garantir que as cores usam os valores dos tokens:
  // NOVO → var(--color-info) / #3B82F6
  // APROVAÇÃO → #8B5CF6
  // ESTUDO → var(--status-pendente) / #F59E0B
  // QUALIFICADO / SEGUNDA → var(--brand-primary) / #11BF7F
  // DESCARTADO → var(--text-muted) / #94A3B8
  ```

- [ ] **Adicionar `focus-visible` nos cards do kanban** para suporte a teclado (preparação para Fase 5):
  ```scss
  .kcard {
    // adicionar dentro do seletor existente:
    &:focus-visible {
      outline: 2px solid var(--brand-primary);
      outline-offset: 2px;
    }
  }
  ```

- [ ] **Commit:**
  ```bash
  git add src/app/features/pipeline/pipeline.component.scss
  git commit -m "refactor(fase3): tokens em Pipeline, focus-visible nos cards"
  ```

---

### Task 8: Tokens em `editais-list.component.scss` e `edital-details.component.scss`

**Files:**
- Modify: `src/app/features/editais/editais-list/editais-list.component.scss`
- Modify: `src/app/features/editais/edital-details/edital-details.component.scss`

- [ ] **Aplicar substituição de hex → tokens em `editais-list.component.scss`** (mesma abordagem das tasks anteriores).

- [ ] **Verificar as stat cards** — atualmente usam `.stat-green`, `.stat-slate`, `.stat-red`, `.stat-blue`. Garantir que as cores usam tokens:
  ```scss
  .stat-card {
    &.stat-green { border-left-color: var(--brand-primary); }
    &.stat-slate { border-left-color: #6366F1; }
    &.stat-red   { border-left-color: var(--status-erro); }
    &.stat-blue  { border-left-color: var(--color-info); }
  }
  ```

- [ ] **Aplicar substituição de hex → tokens em `edital-details.component.scss`**.

- [ ] **Adicionar estilos para `section-empty` e `section-error`** se não existirem:
  ```scss
  .section-empty,
  .section-error {
    display: flex; align-items: center; gap: var(--spacing-sm);
    padding: var(--spacing-lg); color: var(--text-muted); font-size: 13px;
    mat-icon { font-size: 18px; width: 18px; height: 18px; }
  }
  .section-error { color: var(--status-erro); }
  .link-btn {
    background: none; border: none; cursor: pointer; color: var(--brand-primary);
    font-size: inherit; padding: 0; text-decoration: underline;
  }
  ```

- [ ] **Build + testes:** 
  ```bash
  npx ng build --configuration production 2>&1 | tail -5
  npx ng test --watch=false 2>&1 | tail -5
  ```

- [ ] **Commit:**
  ```bash
  git add src/app/features/editais/
  git commit -m "refactor(fase3): tokens em Editais-list e Edital-details"
  ```

---

## FASE 4 — Animações com propósito (Task 9-10)

---

### Task 9: Angular Animations — rota + stagger de lista

**Files:**
- Modify: `src/app/app.config.ts`
- Create: `src/app/shared/animations/app-animations.ts`
- Modify: `src/app/features/leads/leads.component.ts`
- Modify: `src/app/features/leads/leads.component.html`

- [ ] **Verificar se `provideAnimationsAsync()` está no `app.config.ts`**. Se sim, ok. Se usar `BrowserAnimationsModule`, manter como está.

- [ ] **Criar `src/app/shared/animations/app-animations.ts`**:
  ```typescript
  import {
    trigger, transition, style, animate, query,
    stagger, animateChild, group
  } from '@angular/animations';

  const EASING = 'cubic-bezier(0.2, 0, 0, 1)';
  const DURATION_SHORT = '150ms';
  const DURATION_MED = '250ms';

  export const fadeSlideIn = trigger('fadeSlideIn', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(8px)' }),
      animate(`${DURATION_MED} ${EASING}`, style({ opacity: 1, transform: 'translateY(0)' })),
    ]),
    transition(':leave', [
      animate(`${DURATION_SHORT} ${EASING}`, style({ opacity: 0 })),
    ]),
  ]);

  export const listStagger = trigger('listStagger', [
    transition('* => *', [
      query(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        stagger('30ms', [
          animate(`${DURATION_MED} ${EASING}`, style({ opacity: 1, transform: 'translateY(0)' })),
        ]),
      ], { optional: true }),
    ]),
  ]);

  export const expandCollapse = trigger('expandCollapse', [
    transition(':enter', [
      style({ height: '0', overflow: 'hidden', opacity: 0 }),
      animate(`${DURATION_MED} ${EASING}`, style({ height: '*', opacity: 1 })),
    ]),
    transition(':leave', [
      style({ overflow: 'hidden' }),
      animate(`${DURATION_SHORT} ${EASING}`, style({ height: '0', opacity: 0 })),
    ]),
  ]);

  export const routeFade = trigger('routeFade', [
    transition('* <=> *', [
      query(':enter', [
        style({ opacity: 0, transform: 'translateY(4px)' }),
        animate(`${DURATION_MED} ${EASING}`, style({ opacity: 1, transform: 'translateY(0)' })),
      ], { optional: true }),
    ]),
  ]);
  ```

- [ ] **Aplicar `listStagger` no `@for` de leads** no `leads.component.ts`:
  ```typescript
  // Adicionar ao array imports do componente:
  import { listStagger, fadeSlideIn } from '../../shared/animations/app-animations';
  // Adicionar ao decorador @Component:
  animations: [listStagger, fadeSlideIn],
  ```
  No HTML, no container dos cards:
  ```html
  <!-- No div/container que envolve o @for de lead cards: -->
  <div class="leads-grid" [@listStagger]="filteredLeads().length" ...>
    @for (lead of filteredLeads(); track lead.uuid) {
      <div ... [@fadeSlideIn]>
        ...
      </div>
    }
  </div>
  ```

- [ ] **Aplicar `expandCollapse` nas seções do edital-details.** Ler o template de `edital-details.component.html` e encontrar onde as seções são expandidas. Adicionar ao `edital-details.component.ts`:
  ```typescript
  import { expandCollapse } from '../../../shared/animations/app-animations';
  // animations: [expandCollapse]
  ```
  No HTML, envolver o conteúdo colapsável de cada seção:
  ```html
  @if (itensSection().open) {
    <div [@expandCollapse] class="section-content">
      <!-- conteúdo existente -->
    </div>
  }
  ```

- [ ] **`prefers-reduced-motion`** — já existe em `styles.scss` como `@media (prefers-reduced-motion: reduce)`. Adicionar ao final:
  ```scss
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

- [ ] **Commit:**
  ```bash
  git add src/app/shared/animations/app-animations.ts \
          src/app/features/leads/ \
          src/app/features/editais/edital-details/ \
          src/styles.scss
  git commit -m "feat(fase4): animações listStagger, fadeSlideIn, expandCollapse"
  ```

---

### Task 10: Micro-interações nos cards do Pipeline + route transition

**Files:**
- Modify: `src/app/features/layout/main-layout/main-layout.component.ts`
- Modify: `src/app/features/pipeline/pipeline.component.ts`
- Modify: `src/app/features/pipeline/pipeline.component.scss`

- [ ] **Route transition no `main-layout`:** Ler `main-layout.component.ts` e localizar `<router-outlet>`. Adicionar animação de entrada no `<main>`:
  ```typescript
  // Adicionar ao main-layout.component.ts:
  import { routeFade } from '../../../shared/animations/app-animations';
  // animations: [routeFade]
  ```
  No template, envolver `<router-outlet>` ou o `<main>`:
  ```html
  <!-- No <main class="page-content"> ou equivalente: -->
  <main class="page-content" [@routeFade]="outlet.isActivated ? outlet.activatedRoute : ''">
    <router-outlet #outlet="outlet"></router-outlet>
  </main>
  ```

- [ ] **Micro-interações nos kards do Pipeline** — adicionar CSS transition em `pipeline.component.scss`:
  ```scss
  .kcard {
    // Dentro do seletor existente, adicionar:
    transition: transform var(--transition), box-shadow var(--transition);
    cursor: pointer;
    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--card-shadow-hover);
    }
    &:active { transform: translateY(0); }
  }
  ```

- [ ] **Feedback de drag no CDK** — o CDK já aplica classes CSS durante drag. Adicionar em `pipeline.component.scss`:
  ```scss
  .cdk-drag-preview {
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    transform: rotate(1.5deg);
    opacity: 0.95;
  }
  .cdk-drag-placeholder {
    opacity: 0;
    border: 2px dashed var(--brand-primary);
    border-radius: var(--radius-lg);
    background: var(--brand-primary-light);
  }
  .cdk-drop-list-dragging .kcard:not(.cdk-drag-placeholder) {
    transition: transform 250ms cubic-bezier(0,0,0.2,1);
  }
  ```

- [ ] **Build:**
  ```bash
  npx ng build --configuration production 2>&1 | tail -5
  ```

- [ ] **Commit:**
  ```bash
  git add src/app/features/layout/main-layout/ \
          src/app/features/pipeline/
  git commit -m "feat(fase4): route transition, micro-interações kanban e drag-drop"
  ```

---

## FASE 5 — Acessibilidade WCAG 2.1 AA (Task 11-12)

---

### Task 11: ARIA landmarks, headings e acessibilidade básica

**Files:**
- Modify: `src/app/features/leads/leads.component.html`
- Modify: `src/app/features/pipeline/pipeline.component.html`
- Modify: `src/app/features/editais/editais-list/editais-list.component.html`
- Modify: `src/app/features/editais/edital-details/edital-details.component.html`

- [ ] **Leads — garantir H1 único e hierarquia:**
  Ler o template. Confirmar que existe exatamente um `<h1>` com o título da página (ex: `<h1>Leads</h1>`). Se o título for um `<div>`, trocar por `<h1>`. Confirmar que sub-seções usam `<h2>`/`<h3>` sem pular nível.

- [ ] **Leads — tabela/lista com roles:**
  Se a lista de leads usar `<div>` ao invés de `<table>`, garantir roles ARIA:
  ```html
  <div class="leads-grid" role="list" aria-label="Lista de leads">
    @for (lead of filteredLeads(); track lead.uuid) {
      <div class="kcard" role="listitem">
        ...
      </div>
    }
  </div>
  ```
  Se usar `<table>`, confirmar `<caption>` ou `aria-label` na tabela.

- [ ] **Leads — filtros de status com `role="tablist"`:**
  Localizar os botões de filtro por status (tabs). Adicionar:
  ```html
  <div role="tablist" aria-label="Filtrar leads por status">
    @for (tab of statusTabs; track tab.value) {
      <button role="tab"
              [attr.aria-selected]="selectedStatus() === tab.value"
              [attr.aria-controls]="'leads-panel'"
              ...>
        {{ tab.label }}
      </button>
    }
  </div>
  <div id="leads-panel" role="tabpanel">
    <!-- lista de leads -->
  </div>
  ```

- [ ] **Pipeline — alternativa de teclado ao drag-and-drop:**
  Em cada card do kanban, adicionar menu de ações "Mover para..." acessível por teclado. Ler `pipeline.component.ts` para verificar os nomes das colunas e o método de mover lead entre colunas (provavelmente `dropQual`).

  Adicionar ao template de cada card dentro do `@for` de `col.leads`:
  ```html
  <div class="kcard"
       role="button"
       tabindex="0"
       [attr.aria-label]="'Lead: ' + lead.titulo + '. Coluna: ' + col.label"
       (keydown.enter)="openLeadDetalhe(lead)"
       (keydown.space)="openLeadDetalhe(lead)"
       (keydown.m)="openMoveMenu(lead, $event)">
    <!-- conteúdo existente -->
    <button class="kcard-move-btn"
            mat-icon-button
            [matMenuTriggerFor]="moveMenu"
            aria-label="Mover lead para outra coluna"
            (click)="$event.stopPropagation()">
      <mat-icon>more_vert</mat-icon>
    </button>
    <mat-menu #moveMenu="matMenu">
      @for (destCol of qualColumns; track destCol.id) {
        @if (destCol.id !== col.id) {
          <button mat-menu-item (click)="moveLeadTo(lead, destCol.id)">
            Mover para {{ destCol.label }}
          </button>
        }
      }
    </mat-menu>
  </div>
  ```

  Adicionar `moveLeadTo(lead, colId)` no `pipeline.component.ts` — que chama o mesmo método de atualização de status que o drag-drop usa:
  ```typescript
  moveLeadTo(lead: Lead, colId: string): void {
    const col = this.qualColumns.find(c => c.id === colId);
    if (!col) return;
    const fakeEvent = { previousContainer: { data: [] }, container: { data: col.leads }, previousIndex: 0, currentIndex: 0, item: { data: lead } } as any;
    this.dropQual(fakeEvent);
  }
  ```

- [ ] **`aria-live` no Pipeline para anunciar mudanças de coluna:**
  Adicionar uma região `aria-live` que anuncia movimentos:
  ```html
  <!-- No template do pipeline, fora das colunas: -->
  <div class="sr-only" aria-live="polite" aria-atomic="true">{{ moveAnnouncement() }}</div>
  ```
  No `pipeline.component.ts`:
  ```typescript
  moveAnnouncement = signal('');

  // Em dropQual(), após mover o lead:
  this.moveAnnouncement.set(`${lead.titulo} movido para ${novaColuna.label}`);
  setTimeout(() => this.moveAnnouncement.set(''), 3000);
  ```

- [ ] **Editais list — tabela com `aria-sort`:**
  Na tabela de editais, verificar se existe ordenação. Se sim, adicionar `[attr.aria-sort]` nos cabeçalhos ordenáveis:
  ```html
  <th mat-header-cell *matHeaderCellDef mat-sort-header
      [attr.aria-sort]="sort.direction === 'asc' ? 'ascending' : sort.direction === 'desc' ? 'descending' : 'none'">
    Número
  </th>
  ```

- [ ] **Ícones decorativos com `aria-hidden="true"`** nas três telas:
  Todos os `<mat-icon>` puramente decorativos devem ter `aria-hidden="true"`. Buscar e adicionar:
  ```bash
  grep -n "<mat-icon>" src/app/features/leads/leads.component.html | head -20
  ```
  Para ícones decorativos, adicionar `aria-hidden="true"`. Para funcionais, confirmar que têm `aria-label`.

- [ ] **Commit:**
  ```bash
  git add src/app/features/leads/ \
          src/app/features/pipeline/ \
          src/app/features/editais/
  git commit -m "feat(fase5): ARIA landmarks, headings, alternativa teclado no kanban"
  ```

---

### Task 12: Focus management + `.sr-only` + `focus-visible`

**Files:**
- Modify: `src/styles.scss`
- Modify: `src/app/features/pipeline/pipeline.component.scss`

- [ ] **Adicionar `.sr-only` em `styles.scss`** (se não existir):
  ```scss
  .sr-only {
    position: absolute; width: 1px; height: 1px; padding: 0;
    margin: -1px; overflow: hidden; clip: rect(0,0,0,0);
    white-space: nowrap; border: 0;
  }
  ```

- [ ] **`focus-visible` global em `styles.scss`** — garantir que o outline apareça para navegação por teclado mas não por mouse. Adicionar/confirmar:
  ```scss
  :focus { outline: none; }
  :focus-visible {
    outline: 2px solid var(--brand-primary);
    outline-offset: 2px;
    border-radius: 2px;
  }
  ```

- [ ] **Verificar o botão de fechar dialog** (`lead-detalhe-dialog`, `confirm-dialog`): confirmar que ao fechar um dialog, o foco volta ao elemento que o abriu. O Angular CDK Dialog faz isso automaticamente — verificar se os dialogs estão usando `MatDialog.open()` e não innerHTML/CSS hidden.

  No `leads.component.ts`, após `dialog.open(...)`:
  ```typescript
  const trigger = document.activeElement as HTMLElement;
  const ref = this.dialog.open(LeadDetalheDialogComponent, ...);
  ref.afterClosed().subscribe(() => {
    // O CDK já restaura o foco automaticamente se configurado corretamente
    // Garantir que o dialog não usa cdkTrapFocusAutoCapture = false
  });
  ```

- [ ] **Confirmar `cdkTrapFocus` nos dialogs customizados** — ler `lead-detalhe-dialog.component.ts`. Se for um `mat-dialog-content`, o trap já funciona. Se for um panel customizado, adicionar `cdkTrapFocus` no elemento raiz.

- [ ] **Build final + testes:**
  ```bash
  npx ng build --configuration production 2>&1 | tail -10
  npx ng test --watch=false 2>&1 | tail -5
  ```

- [ ] **Commit:**
  ```bash
  git add src/styles.scss src/app/features/
  git commit -m "feat(fase5): focus-visible, sr-only, foco em dialogs"
  ```

---

## FASE 6 — Verificação final (Task 13)

---

### Task 13: Checklist de verificação e resumo final

**Files:** Nenhum — verificação manual.

- [ ] **Build de produção limpo:**
  ```bash
  npx ng build --configuration production 2>&1 | grep -E "ERROR|WARNING|✓|Bundle"
  ```
  Esperado: sem novos erros, apenas warnings de bundle size pré-existentes.

- [ ] **Testes:**
  ```bash
  npx ng test --watch=false 2>&1 | tail -8
  ```
  Esperado: todos PASS.

- [ ] **Checklist funcional (iniciar `ng serve` e percorrer manualmente):**
  - [ ] Login → redireciona para `/leads` (título "Leads — LicitaFlow")
  - [ ] URL protegida sem login → redirect para `/login?returnUrl=/pipeline`
  - [ ] Backend parado → skeleton aparece, depois estado de erro com "Tentar novamente"
  - [ ] Leads: filtros funcionam, abrir detalhe via click e via Enter, fechar retorna foco
  - [ ] Pipeline: mover card por mouse (drag-drop), mover por teclado (menu "Mover para...")
  - [ ] Pipeline: `aria-live` anuncia "X movido para Y"
  - [ ] Editais: busca funciona, abrir detalhe, seções expandem/colapsam com animação
  - [ ] Editais: seção sem dados mostra "Nenhum item encontrado"
  - [ ] Logout → redirect para `/login`
  - [ ] Tab navigation nas três telas: ordem lógica, `focus-visible` visível

- [ ] **Checklist de acessibilidade (DevTools → Accessibility tree):**
  - [ ] Cada página tem exatamente 1 `<h1>` visível
  - [ ] Hierarquia de headings sem pulos (h1 → h2, não h1 → h3)
  - [ ] Todos os ícones decorativos têm `aria-hidden="true"`
  - [ ] Dialogs com `role="dialog"` e `aria-labelledby` (Material já provê)
  - [ ] Status chips têm texto legível, não apenas cor

- [ ] **Commit final:**
  ```bash
  git add -A
  git commit -m "chore(fase6): verificação final, checklist completo"
  git push
  ```

- [ ] **Relatório final:** listar todos os arquivos modificados por fase e o que ficou pendente para iteração seguinte.

---

## Pendências conhecidas (fora do escopo MVP, registrar apenas)

- `forgot-password` / `reset-password`: endpoints backend ainda não existem. **Remover link "Esqueci minha senha" na tela de login para o demo** até o backend estar pronto (evitar tela morta na demo).
- Dark mode: base existe no Material theme mas não foi implementado — não introduzir agora.
- Testes unitários de acessibilidade automatizados (ex: axe-core) — backlog.
- Storybook de componentes — backlog.
