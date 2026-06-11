# LicitaFlow MVP — Licitações: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o módulo de Licitações num produto utilizável com design polido, multi-coleta paralela, configurações de usuário, self-service de perfil e recuperação de senha.

**Architecture:** Angular 17+ standalone components + Angular Material tema customizado. Serviços injetáveis com signals. Sem bibliotecas externas novas além das já presentes. Todas as cores via hex direto do brand system — nunca `--mat-sys-*` tokens fora do tema configurado.

**Tech Stack:** Angular 17, Angular Material 17, TypeScript, RxJS, `Promise.allSettled` para paralelismo de coleta.

**Design spec:** `docs/superpowers/specs/2026-06-11-licitacoes-mvp-design.md`

**Brand tokens:**
```
sidebar:     #0D1526
acento:      #11BF7F
texto:       #0D1526
secundário:  #64748B
border:      #E2E8F0
bg:          #F1F5F9
branco:      #FFFFFF
```

**Rodar app:** `ng serve` na raiz do projeto. URL: `http://localhost:4200`

---

## File Map

### Criar
- `src/app/features/auth/forgot-password/forgot-password.component.ts`
- `src/app/features/auth/reset-password/reset-password.component.ts`
- `src/app/core/services/tour.service.ts`
- `src/app/core/services/tour.service.spec.ts`
- `src/app/core/services/user-preferences.service.ts`
- `src/app/core/models/user-preferences.model.ts`
- `src/app/features/tour/tour-overlay.component.ts`

### Modificar
- `src/app/core/models/auth.model.ts` — `enabledModules`, `tourCompleted`
- `src/app/core/models/edital.model.ts` — `NotificacaoEvent.tipo` como union type
- `src/app/core/services/auth.service.ts` — fallback `enabledModules`
- `src/app/core/services/coleta-andamento.service.ts` — estado por fonte
- `src/app/core/services/coleta-andamento.service.spec.ts` — testes
- `src/app/core/services/notificacoes.service.ts` — método `emitirBuscaConcluida`
- `src/app/features/layout/main-layout/main-layout.component.ts` — filtro por `moduleKey`
- `src/app/features/leads/leads.component.ts` — `Promise.allSettled`, CTA verde
- `src/app/features/leads/leads.component.html` — painel de progresso por fonte
- `src/app/features/leads/leads.component.scss` — CTA `#11BF7F`
- `src/app/features/notificacoes/notificacoes.component.ts` — reescrita Material
- `src/app/features/notificacoes/notificacoes.component.html` — reescrita Material
- `src/app/features/notificacoes/notificacoes.component.scss` — reescrita Material
- `src/app/features/configuracoes/configuracoes.component.ts` — MatTabGroup
- `src/app/features/editais/editais-list/editais-list.component.html` — mat-form-field search
- `src/app/features/editais/editais-list/editais-list.component.scss` — font mínimo 11px
- `src/app/shared/components/empty-state/empty-state.component.ts` — fix tokens
- `src/app/app.component.ts` — TourOverlayComponent
- `src/app/app.routes.ts` — rotas forgot/reset-password

---

## FASE 1 — Foundation: tokens, navegação, paginação

### Task 1: Fix de tokens `--mat-sys-*` e inconsistências de brand

**Files:**
- Modify: `src/app/features/notificacoes/notificacoes.component.scss`
- Modify: `src/app/shared/components/empty-state/empty-state.component.ts`
- Modify: `src/app/features/editais/editais-list/editais-list.component.scss`
- Modify: `src/app/features/leads/leads.component.scss`

- [ ] **Abrir `notificacoes.component.scss`** e substituir todas as ocorrências de `var(--mat-sys-*)` por hex do brand system. Substituições:
  - `var(--mat-sys-primary-container)` → `rgba(17,191,127,0.10)`
  - `var(--mat-sys-on-primary-container)` → `#0DA66E`
  - `var(--mat-sys-surface-variant)` → `#F1F5F9`
  - `var(--mat-sys-on-surface-variant)` → `#64748B`
  - `var(--mat-sys-outline)` → `#E2E8F0`
  - Remover `max-width: 900px` e `margin: 0 auto` — usar padding padrão `24px`

- [ ] **Abrir `empty-state.component.ts`** — o componente usa `--mat-sys-*` no template inline. Substituir:
  ```typescript
  // antes (no template):
  style="color: var(--mat-sys-on-surface-variant)"
  // depois:
  style="color: #64748B"
  ```
  Também reduzir ícone de `96px` para `48px`:
  ```typescript
  // antes:
  style="font-size: 96px; width: 96px; height: 96px"
  // depois:
  style="font-size: 48px; width: 48px; height: 48px; opacity: 0.4"
  ```

- [ ] **Abrir `editais-list.component.scss`** — localizar todas as ocorrências de `font-size` com valores `9.5px` ou `10.5px` e elevar para `11px`:
  ```bash
  grep -n "9\.5px\|10\.5px" src/app/features/editais/editais-list/editais-list.component.scss
  ```
  Substituir cada ocorrência encontrada pelo valor mais próximo acima de `11px`.

- [ ] **Abrir `leads.component.scss`** — localizar `.btn-coletar` (ou equivalente para o CTA de disparo de coleta) que usa `#3B82F6` (azul) e trocar por `#11BF7F`:
  ```bash
  grep -n "3B82F6\|btn-coletar" src/app/features/leads/leads.component.scss
  ```

- [ ] **Verificar no browser** — `ng serve`, navegar para Leads, Editais e Notificações. Confirmar que não há elementos roxos/índigos fora do lugar e que o CTA de coleta está verde.

- [ ] **Commit**
  ```bash
  git add src/app/features/notificacoes/notificacoes.component.scss \
          src/app/shared/components/empty-state/empty-state.component.ts \
          src/app/features/editais/editais-list/editais-list.component.scss \
          src/app/features/leads/leads.component.scss
  git commit -m "fix(design): replace mat-sys tokens with brand hex, fix font sizes and CTA color"
  ```

---

### Task 2: Navegação modular com `enabledModules`

**Files:**
- Modify: `src/app/core/models/auth.model.ts`
- Modify: `src/app/core/services/auth.service.ts`
- Modify: `src/app/features/layout/main-layout/main-layout.component.ts`
- Modify: `src/app/app.routes.ts`

- [ ] **`auth.model.ts`** — adicionar campos ao `UserInfo`:
  ```typescript
  export interface UserInfo {
    uuid: string;
    name: string;
    email: string;
    role: UserRole;
    company?: string;
    funcao?: string;
    imageUrl?: string;
    enabledModules: string[];   // ['licitacoes'] no MVP
    tourCompleted: boolean;
  }
  ```

- [ ] **`auth.service.ts`** — na função `persistSession` (ou onde o `UserInfo` é salvo), adicionar fallback:
  ```typescript
  private normalizeUser(user: UserInfo): UserInfo {
    return {
      ...user,
      enabledModules: user.enabledModules ?? ['licitacoes'],
      tourCompleted: user.tourCompleted ?? false,
    };
  }
  ```
  Chamar `normalizeUser(response.user)` antes de `persistSession`. Aplicar o mesmo em `loadUser()` ao ler do `localStorage`:
  ```typescript
  private loadUser(): UserInfo | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw) as UserInfo;
      return this.normalizeUser(user);
    } catch { return null; }
  }
  ```

- [ ] **`main-layout.component.ts`** — adicionar `moduleKey` à interface `NavSection` e filtrar seções:
  ```typescript
  interface NavSection {
    label: string;
    moduleKey: string;
    items: NavItem[];
  }
  ```
  Atualizar `navSections` com `moduleKey`:
  ```typescript
  navSections: NavSection[] = [
    {
      label: 'Licitações',
      moduleKey: 'licitacoes',
      items: [
        { label: 'Leads',    icon: 'list_alt',     route: '/leads'    },
        { label: 'Pipeline', icon: 'view_kanban',  route: '/pipeline' },
        { label: 'Editais',  icon: 'description',  route: '/editais'  },
      ],
    },
    {
      label: 'Inteligência',
      moduleKey: 'inteligencia',
      items: [
        { label: 'Dashboard',    icon: 'dashboard',  route: '/dashboard'  },
        { label: 'Impugnação',   icon: 'gavel',      route: '/impugnacao' },
        { label: 'Assistente IA',icon: 'smart_toy',  route: '/assistente' },
      ],
    },
    {
      label: 'Cotação',
      moduleKey: 'cotacao',
      items: [
        { label: 'Fornecedores', icon: 'storefront',   route: '/cotacao/fornecedores' },
        { label: 'Itens',        icon: 'inventory_2',  route: '/cotacao/itens'        },
      ],
    },
  ];
  ```
  Adicionar computed para seções visíveis:
  ```typescript
  get visibleSections(): NavSection[] {
    const enabled = this.auth.currentUser()?.enabledModules ?? ['licitacoes'];
    return this.navSections.filter(s => enabled.includes(s.moduleKey));
  }
  ```
  No template, trocar `@for (section of navSections` por `@for (section of visibleSections`.

- [ ] **`app.routes.ts`** — trocar redirect padrão de `dashboard` para `leads`:
  ```typescript
  { path: '', redirectTo: 'leads', pathMatch: 'full' },
  ```

- [ ] **Verificar no browser** — após login, deve ir direto para `/leads`. Sidebar deve mostrar apenas Licitações (Leads, Pipeline, Editais). Confirmar que as rotas de Dashboard/Impugnação ainda existem mas não aparecem no menu.

- [ ] **Commit**
  ```bash
  git add src/app/core/models/auth.model.ts \
          src/app/core/services/auth.service.ts \
          src/app/features/layout/main-layout/main-layout.component.ts \
          src/app/app.routes.ts
  git commit -m "feat(nav): add moduleKey to nav sections, filter by enabledModules, redirect to /leads"
  ```

---

### Task 3: Padronizar paginação com `mat-paginator` no Leads

**Files:**
- Modify: `src/app/features/leads/leads.component.ts`
- Modify: `src/app/features/leads/leads.component.html`
- Modify: `src/app/features/leads/leads.component.scss`

- [ ] **`leads.component.ts`** — adicionar `MatPaginatorModule` nos imports do componente:
  ```typescript
  import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
  // Adicionar MatPaginatorModule ao array imports: []
  ```
  Adicionar handler do evento de paginação:
  ```typescript
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.carregarLeads();
  }
  ```

- [ ] **`leads.component.html`** — localizar `<app-paginator` e substituir pelo `mat-paginator` nativo:
  ```html
  <mat-paginator
    [length]="totalElements()"
    [pageSize]="pageSize()"
    [pageIndex]="currentPage()"
    [pageSizeOptions]="[12, 24, 48]"
    [showFirstLastButtons]="true"
    (page)="onPageChange($event)"
    [style.display]="totalElements() <= pageSize() ? 'none' : ''">
  </mat-paginator>
  ```

- [ ] **`leads.component.scss`** — adicionar override de estilo para manter visual consistente com o resto do app:
  ```scss
  ::ng-deep .mat-mdc-paginator {
    background: transparent;
    color: #64748B;
    font-size: 13px;

    .mat-mdc-paginator-range-label { color: #64748B; }
    .mat-mdc-icon-button { color: #64748B; }
    .mat-mdc-icon-button:disabled { opacity: 0.3; }
  }
  ```

- [ ] **Verificar no browser** — abrir Leads, confirmar que a paginação aparece e funciona. Navegar para página 2 e confirmar que os leads corretos aparecem.

- [ ] **Commit**
  ```bash
  git add src/app/features/leads/leads.component.ts \
          src/app/features/leads/leads.component.html \
          src/app/features/leads/leads.component.scss
  git commit -m "feat(leads): replace custom paginator with mat-paginator"
  ```

---

## FASE 2 — Auth Self-Service

### Task 4: Tela de Recuperação de Senha (`/forgot-password`)

**Files:**
- Create: `src/app/features/auth/forgot-password/forgot-password.component.ts`
- Modify: `src/app/app.routes.ts`

- [ ] **Criar `forgot-password.component.ts`** com o seguinte conteúdo completo:
  ```typescript
  import { Component, inject, signal } from '@angular/core';
  import { RouterLink } from '@angular/router';
  import { FormsModule } from '@angular/forms';
  import { HttpClient } from '@angular/common/http';
  import { MatButtonModule } from '@angular/material/button';
  import { MatFormFieldModule } from '@angular/material/form-field';
  import { MatInputModule } from '@angular/material/input';
  import { MatIconModule } from '@angular/material/icon';
  import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
  import { environment } from '../../../../environments/environment';

  @Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [RouterLink, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatProgressSpinnerModule],
    template: `
      <div class="auth-shell">
        <div class="auth-card">
          <div class="auth-logo">
            <div class="logo-mark"><mat-icon>gavel</mat-icon></div>
            <span class="logo-name">LicitaFlow</span>
          </div>

          @if (!enviado()) {
            <div class="auth-header">
              <h1>Recuperar senha</h1>
              <p>Informe seu e-mail e enviaremos um link de redefinição.</p>
            </div>
            <form class="auth-form" (ngSubmit)="enviar()" #f="ngForm">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>E-mail</mat-label>
                <input matInput type="email" [(ngModel)]="email" name="email" required email autocomplete="email">
                <mat-icon matSuffix>mail_outline</mat-icon>
              </mat-form-field>
              @if (erro()) {
                <div class="auth-error">{{ erro() }}</div>
              }
              <button mat-flat-button class="submit-btn" type="submit" [disabled]="loading() || !f.valid">
                @if (loading()) { <mat-spinner diameter="18" /> }
                @else { Enviar link }
              </button>
            </form>
          } @else {
            <div class="auth-success">
              <mat-icon class="success-icon">mark_email_read</mat-icon>
              <h2>Verifique seu e-mail</h2>
              <p>Se <strong>{{ email }}</strong> estiver cadastrado, você receberá um link em instantes.</p>
            </div>
          }

          <a routerLink="/login" class="back-link">
            <mat-icon>arrow_back</mat-icon> Voltar ao login
          </a>
        </div>
      </div>
    `,
    styles: [`
      .auth-shell {
        min-height: 100vh; display: flex; align-items: center; justify-content: center;
        background: #0D1526; padding: 24px;
      }
      .auth-card {
        background: #fff; border-radius: 16px; padding: 40px 36px;
        width: 100%; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      }
      .auth-logo {
        display: flex; align-items: center; gap: 10px; margin-bottom: 28px;
      }
      .logo-mark {
        width: 36px; height: 36px; background: linear-gradient(135deg, #11BF7F, #0DA66E);
        border-radius: 8px; display: flex; align-items: center; justify-content: center;
        mat-icon { font-size: 20px; width: 20px; height: 20px; color: white; }
      }
      .logo-name { font-size: 16px; font-weight: 800; color: #0D1526; letter-spacing: -0.3px; }
      .auth-header { margin-bottom: 24px; }
      .auth-header h1 { font-size: 22px; font-weight: 700; color: #0D1526; margin: 0 0 6px; }
      .auth-header p { font-size: 14px; color: #64748B; margin: 0; line-height: 1.5; }
      .auth-form { display: flex; flex-direction: column; gap: 12px; }
      .full-width { width: 100%; }
      .submit-btn {
        background: #0D1526; color: white; height: 44px; font-size: 14px; font-weight: 600;
        border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 8px;
      }
      .auth-error {
        background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;
        padding: 10px 14px; font-size: 13px; color: #dc2626;
      }
      .auth-success {
        text-align: center; padding: 16px 0 24px;
        .success-icon { font-size: 48px; width: 48px; height: 48px; color: #11BF7F; margin-bottom: 12px; }
        h2 { font-size: 18px; font-weight: 700; color: #0D1526; margin: 0 0 8px; }
        p { font-size: 14px; color: #64748B; line-height: 1.5; margin: 0; }
      }
      .back-link {
        display: flex; align-items: center; gap: 6px; margin-top: 20px;
        font-size: 13px; color: #64748B; text-decoration: none; justify-content: center;
        &:hover { color: #0D1526; }
        mat-icon { font-size: 16px; width: 16px; height: 16px; }
      }
    `],
  })
  export class ForgotPasswordComponent {
    private http = inject(HttpClient);

    email = '';
    loading = signal(false);
    enviado = signal(false);
    erro = signal('');

    enviar(): void {
      if (!this.email) return;
      this.loading.set(true);
      this.erro.set('');
      this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email: this.email }).subscribe({
        next: () => { this.enviado.set(true); this.loading.set(false); },
        error: () => { this.enviado.set(true); this.loading.set(false); }, // segurança: não revelar se e-mail existe
      });
    }
  }
  ```

- [ ] **`app.routes.ts`** — adicionar as duas rotas públicas antes do guard `authGuard`. Importar `guestGuard`:
  ```typescript
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  },
  ```

- [ ] **`login.component.ts`** — adicionar link "Esqueci minha senha" abaixo do botão de submit. Localizar o botão de login no template e adicionar após ele:
  ```html
  <a routerLink="/forgot-password" class="forgot-link">Esqueci minha senha</a>
  ```
  Adicionar estilo:
  ```scss
  .forgot-link {
    display: block; text-align: center; margin-top: 12px;
    font-size: 13px; color: #64748B; text-decoration: none;
    &:hover { color: #0D1526; }
  }
  ```
  Adicionar `RouterLink` nos imports do `LoginComponent` se ainda não estiver.

- [ ] **Verificar no browser** — navegar para `/forgot-password`, digitar um e-mail, submeter. Confirmar que aparece a mensagem de confirmação independente do resultado. Confirmar que o link "Voltar ao login" funciona.

- [ ] **Commit**
  ```bash
  git add src/app/features/auth/forgot-password/forgot-password.component.ts \
          src/app/app.routes.ts \
          src/app/features/auth/login/login.component.ts
  git commit -m "feat(auth): add forgot-password page and link from login"
  ```

---

### Task 5: Tela de Redefinição de Senha (`/reset-password`)

**Files:**
- Create: `src/app/features/auth/reset-password/reset-password.component.ts`

- [ ] **Criar `reset-password.component.ts`**:
  ```typescript
  import { Component, inject, signal, OnInit } from '@angular/core';
  import { ActivatedRoute, Router, RouterLink } from '@angular/router';
  import { FormsModule } from '@angular/forms';
  import { HttpClient } from '@angular/common/http';
  import { MatButtonModule } from '@angular/material/button';
  import { MatFormFieldModule } from '@angular/material/form-field';
  import { MatInputModule } from '@angular/material/input';
  import { MatIconModule } from '@angular/material/icon';
  import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
  import { MatSnackBar } from '@angular/material/snack-bar';
  import { environment } from '../../../../environments/environment';

  @Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [RouterLink, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatProgressSpinnerModule],
    template: `
      <div class="auth-shell">
        <div class="auth-card">
          <div class="auth-logo">
            <div class="logo-mark"><mat-icon>gavel</mat-icon></div>
            <span class="logo-name">LicitaFlow</span>
          </div>

          @if (tokenInvalido()) {
            <div class="auth-error-state">
              <mat-icon>error_outline</mat-icon>
              <h2>Link inválido ou expirado</h2>
              <p>Solicite um novo link de recuperação.</p>
              <a routerLink="/forgot-password" mat-stroked-button>Solicitar novo link</a>
            </div>
          } @else {
            <div class="auth-header">
              <h1>Nova senha</h1>
              <p>Escolha uma senha com no mínimo 8 caracteres.</p>
            </div>
            <form class="auth-form" (ngSubmit)="redefinir()" #f="ngForm">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nova senha</mat-label>
                <input matInput [type]="showPass() ? 'text' : 'password'"
                       [(ngModel)]="novaSenha" name="novaSenha" required minlength="8">
                <button mat-icon-button matSuffix type="button" (click)="showPass.set(!showPass())">
                  <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirmar nova senha</mat-label>
                <input matInput [type]="showPass() ? 'text' : 'password'"
                       [(ngModel)]="confirmar" name="confirmar" required>
              </mat-form-field>
              @if (erro()) {
                <div class="auth-error">{{ erro() }}</div>
              }
              <button mat-flat-button class="submit-btn" type="submit"
                      [disabled]="loading() || !f.valid || novaSenha !== confirmar">
                @if (loading()) { <mat-spinner diameter="18" /> }
                @else { Redefinir senha }
              </button>
            </form>
          }

          <a routerLink="/login" class="back-link">
            <mat-icon>arrow_back</mat-icon> Voltar ao login
          </a>
        </div>
      </div>
    `,
    styles: [`
      .auth-shell {
        min-height: 100vh; display: flex; align-items: center; justify-content: center;
        background: #0D1526; padding: 24px;
      }
      .auth-card {
        background: #fff; border-radius: 16px; padding: 40px 36px;
        width: 100%; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      }
      .auth-logo {
        display: flex; align-items: center; gap: 10px; margin-bottom: 28px;
      }
      .logo-mark {
        width: 36px; height: 36px; background: linear-gradient(135deg, #11BF7F, #0DA66E);
        border-radius: 8px; display: flex; align-items: center; justify-content: center;
        mat-icon { font-size: 20px; width: 20px; height: 20px; color: white; }
      }
      .logo-name { font-size: 16px; font-weight: 800; color: #0D1526; letter-spacing: -0.3px; }
      .auth-header { margin-bottom: 24px; }
      .auth-header h1 { font-size: 22px; font-weight: 700; color: #0D1526; margin: 0 0 6px; }
      .auth-header p { font-size: 14px; color: #64748B; margin: 0; line-height: 1.5; }
      .auth-form { display: flex; flex-direction: column; gap: 12px; }
      .full-width { width: 100%; }
      .submit-btn {
        background: #0D1526; color: white; height: 44px; font-size: 14px; font-weight: 600;
        border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 8px;
      }
      .auth-error {
        background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;
        padding: 10px 14px; font-size: 13px; color: #dc2626;
      }
      .auth-error-state {
        text-align: center; padding: 16px 0 24px; display: flex; flex-direction: column; align-items: center; gap: 10px;
        mat-icon { font-size: 40px; width: 40px; height: 40px; color: #EF4444; }
        h2 { font-size: 17px; font-weight: 700; color: #0D1526; margin: 0; }
        p { font-size: 13px; color: #64748B; margin: 0; }
      }
      .back-link {
        display: flex; align-items: center; gap: 6px; margin-top: 20px;
        font-size: 13px; color: #64748B; text-decoration: none; justify-content: center;
        &:hover { color: #0D1526; }
        mat-icon { font-size: 16px; width: 16px; height: 16px; }
      }
    `],
  })
  export class ResetPasswordComponent implements OnInit {
    private http = inject(HttpClient);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private snackBar = inject(MatSnackBar);

    novaSenha = '';
    confirmar = '';
    token = '';
    loading = signal(false);
    tokenInvalido = signal(false);
    erro = signal('');
    showPass = signal(false);

    ngOnInit(): void {
      this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
      if (!this.token) this.tokenInvalido.set(true);
    }

    redefinir(): void {
      if (this.novaSenha !== this.confirmar) {
        this.erro.set('As senhas não coincidem.');
        return;
      }
      if (this.novaSenha.length < 8) {
        this.erro.set('A senha deve ter no mínimo 8 caracteres.');
        return;
      }
      this.loading.set(true);
      this.erro.set('');
      this.http.post(`${environment.apiUrl}/auth/reset-password`, { token: this.token, newPassword: this.novaSenha }).subscribe({
        next: () => {
          this.loading.set(false);
          this.snackBar.open('Senha redefinida com sucesso', 'OK', { duration: 4000 });
          this.router.navigate(['/login']);
        },
        error: (e) => {
          this.loading.set(false);
          if (e.status === 400 || e.status === 404) {
            this.tokenInvalido.set(true);
          } else {
            this.erro.set('Erro ao redefinir senha. Tente novamente.');
          }
        },
      });
    }
  }
  ```

- [ ] **Verificar no browser** — navegar para `/reset-password` (sem token): deve mostrar estado de erro. Navegar para `/reset-password?token=teste`: deve mostrar o form. Tentar submeter com senhas diferentes: deve mostrar erro inline.

- [ ] **Commit**
  ```bash
  git add src/app/features/auth/reset-password/reset-password.component.ts
  git commit -m "feat(auth): add reset-password page"
  ```

---

## FASE 3 — Configurações (MatTabGroup)

### Task 6: Models e serviço de preferências do usuário

**Files:**
- Create: `src/app/core/models/user-preferences.model.ts`
- Create: `src/app/core/services/user-preferences.service.ts`

- [ ] **Criar `user-preferences.model.ts`**:
  ```typescript
  export interface UserPreferences {
    notifNovoLead: boolean;
    notifBuscaConcluida: boolean;
    notifScoreMinimo: number;
    buscaFontesDefault: string[];
    buscaModoDataDefault: 'single' | 'range';
    buscaPeriodoDias: number;
  }

  export const DEFAULT_PREFERENCES: UserPreferences = {
    notifNovoLead: true,
    notifBuscaConcluida: true,
    notifScoreMinimo: 40,
    buscaFontesDefault: ['DODF', 'DOU'],
    buscaModoDataDefault: 'single',
    buscaPeriodoDias: 7,
  };
  ```

- [ ] **Criar `user-preferences.service.ts`**:
  ```typescript
  import { Injectable, inject, signal } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { Observable, tap, catchError, of } from 'rxjs';
  import { environment } from '../../../environments/environment';
  import { UserPreferences, DEFAULT_PREFERENCES } from '../models/user-preferences.model';

  const PREFS_KEY = 'lf_user_prefs';

  @Injectable({ providedIn: 'root' })
  export class UserPreferencesService {
    private http = inject(HttpClient);
    private _prefs = signal<UserPreferences>(this.loadLocal());

    readonly prefs = this._prefs.asReadonly();

    private loadLocal(): UserPreferences {
      try {
        const raw = localStorage.getItem(PREFS_KEY);
        return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : { ...DEFAULT_PREFERENCES };
      } catch { return { ...DEFAULT_PREFERENCES }; }
    }

    load(): Observable<UserPreferences> {
      return this.http.get<UserPreferences>(`${environment.apiUrl}/users/me/preferences`).pipe(
        tap(p => { this._prefs.set(p); localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }),
        catchError(() => of(this._prefs())),
      );
    }

    save(prefs: Partial<UserPreferences>): Observable<UserPreferences> {
      const merged = { ...this._prefs(), ...prefs };
      return this.http.patch<UserPreferences>(`${environment.apiUrl}/users/me/preferences`, merged).pipe(
        tap(p => { this._prefs.set(p); localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }),
        catchError(() => { this._prefs.update(p => ({ ...p, ...prefs })); return of(merged); }),
      );
    }
  }
  ```

- [ ] **Commit**
  ```bash
  git add src/app/core/models/user-preferences.model.ts \
          src/app/core/services/user-preferences.service.ts
  git commit -m "feat(prefs): add UserPreferences model and service with local cache"
  ```

---

### Task 7: Configurações reescrita com MatTabGroup

**Files:**
- Modify: `src/app/features/configuracoes/configuracoes.component.ts`

- [ ] **Reescrever `configuracoes.component.ts`** completamente. Este componente é grande — abaixo o conteúdo completo:

  ```typescript
  import { Component, OnInit, inject, signal } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule } from '@angular/forms';
  import { MatTabsModule } from '@angular/material/tabs';
  import { MatButtonModule } from '@angular/material/button';
  import { MatIconModule } from '@angular/material/icon';
  import { MatFormFieldModule } from '@angular/material/form-field';
  import { MatInputModule } from '@angular/material/input';
  import { MatSlideToggleModule } from '@angular/material/slide-toggle';
  import { MatSliderModule } from '@angular/material/slider';
  import { MatChipsModule } from '@angular/material/chips';
  import { MatDividerModule } from '@angular/material/divider';
  import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
  import { MatSnackBar } from '@angular/material/snack-bar';
  import { HttpClient } from '@angular/common/http';
  import { AuthService } from '../../core/services/auth.service';
  import { UserPreferencesService } from '../../core/services/user-preferences.service';
  import { DodfConfiguracaoComponent } from '../dodf/configuracao/dodf-configuracao.component';
  import { DouConfiguracaoComponent } from '../dou/configuracao/dou-configuracao.component';
  import { PncpConfiguracaoComponent } from '../pncp/configuracao/pncp-configuracao.component';
  import { environment } from '../../../environments/environment';
  import { UserPreferences } from '../../core/models/user-preferences.model';

  const FONTES_DISPONIVEIS = ['DODF', 'DOU', 'PNCP'];

  @Component({
    selector: 'app-configuracoes',
    standalone: true,
    imports: [
      CommonModule, FormsModule,
      MatTabsModule, MatButtonModule, MatIconModule,
      MatFormFieldModule, MatInputModule,
      MatSlideToggleModule, MatSliderModule, MatChipsModule,
      MatDividerModule, MatProgressSpinnerModule,
      DodfConfiguracaoComponent, DouConfiguracaoComponent, PncpConfiguracaoComponent,
    ],
    template: `
      <div class="cfg-shell">
        <div class="cfg-header">
          <h1>Configurações</h1>
        </div>

        <mat-tab-group animationDuration="150ms" class="cfg-tabs">

          <!-- TAB: Perfil -->
          <mat-tab label="Perfil">
            <div class="tab-content">

              <!-- Card: Dados pessoais -->
              <div class="cfg-card">
                <div class="card-header">
                  <div class="card-title">Dados pessoais</div>
                  <div class="card-sub">Informações exibidas no sistema</div>
                </div>

                <div class="perfil-avatar-row">
                  <div class="perfil-avatar">{{ auth.userInitials() }}</div>
                  <div class="perfil-avatar-info">
                    <span class="perfil-name">{{ auth.currentUser()?.name }}</span>
                    <span class="perfil-email">{{ auth.currentUser()?.email }}</span>
                    <span class="perfil-role">{{ auth.currentUser()?.role }}</span>
                  </div>
                </div>

                <div class="form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Nome de exibição</mat-label>
                    <input matInput [(ngModel)]="perfilNome" name="nome">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Função / cargo</mat-label>
                    <input matInput [(ngModel)]="perfilFuncao" name="funcao">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Empresa</mat-label>
                    <input matInput [(ngModel)]="perfilEmpresa" name="empresa">
                  </mat-form-field>
                </div>

                <div class="card-actions">
                  <button mat-flat-button class="btn-primary" (click)="salvarPerfil()" [disabled]="salvandoPerfil()">
                    @if (salvandoPerfil()) { <mat-spinner diameter="16" /> }
                    @else { Salvar alterações }
                  </button>
                  <button mat-button class="btn-tour" (click)="reiniciarTour()">
                    <mat-icon>help_outline</mat-icon> Refazer tour
                  </button>
                </div>
              </div>

              <!-- Card: Trocar senha -->
              <div class="cfg-card">
                <div class="card-header">
                  <div class="card-title">Segurança</div>
                  <div class="card-sub">Altere sua senha de acesso</div>
                </div>
                <div class="form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Senha atual</mat-label>
                    <input matInput type="password" [(ngModel)]="senhaAtual" name="senhaAtual">
                    <mat-icon matSuffix>lock_outline</mat-icon>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Nova senha</mat-label>
                    <input matInput type="password" [(ngModel)]="senhaNova" name="senhaNova" minlength="8">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Confirmar nova senha</mat-label>
                    <input matInput type="password" [(ngModel)]="senhaConfirm" name="senhaConfirm">
                  </mat-form-field>
                </div>
                @if (erroSenha()) {
                  <div class="inline-error">{{ erroSenha() }}</div>
                }
                <div class="card-actions">
                  <button mat-flat-button class="btn-primary" (click)="trocarSenha()" [disabled]="salvandoSenha()">
                    @if (salvandoSenha()) { <mat-spinner diameter="16" /> }
                    @else { Alterar senha }
                  </button>
                </div>
              </div>

            </div>
          </mat-tab>

          <!-- TAB: Notificações -->
          <mat-tab label="Notificações">
            <div class="tab-content">
              <div class="cfg-card">
                <div class="card-header">
                  <div class="card-title">Preferências de notificação</div>
                  <div class="card-sub">Configure quando e como receber alertas</div>
                </div>

                <div class="toggle-row">
                  <div class="toggle-info">
                    <span class="toggle-label">Novo lead encontrado</span>
                    <span class="toggle-desc">Alerta quando um lead acima do score mínimo é salvo</span>
                  </div>
                  <mat-slide-toggle color="primary"
                    [(ngModel)]="prefsLocal.notifNovoLead"
                    (change)="salvarPrefs()">
                  </mat-slide-toggle>
                </div>
                <mat-divider></mat-divider>
                <div class="toggle-row">
                  <div class="toggle-info">
                    <span class="toggle-label">Busca concluída</span>
                    <span class="toggle-desc">Resumo ao final de cada coleta de leads</span>
                  </div>
                  <mat-slide-toggle color="primary"
                    [(ngModel)]="prefsLocal.notifBuscaConcluida"
                    (change)="salvarPrefs()">
                  </mat-slide-toggle>
                </div>
                <mat-divider></mat-divider>

                <div class="slider-row">
                  <span class="toggle-label">Score mínimo para notificar</span>
                  <div class="slider-wrap">
                    <mat-slider min="0" max="100" step="5" class="full-slider">
                      <input matSliderThumb [(ngModel)]="prefsLocal.notifScoreMinimo" (change)="salvarPrefs()">
                    </mat-slider>
                    <span class="slider-value">{{ prefsLocal.notifScoreMinimo }}</span>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- TAB: Busca -->
          <mat-tab label="Busca">
            <div class="tab-content">
              <div class="cfg-card">
                <div class="card-header">
                  <div class="card-title">Padrões de busca</div>
                  <div class="card-sub">Valores pré-selecionados ao abrir a tela de Leads</div>
                </div>

                <div class="field-group">
                  <span class="field-label">Fontes padrão</span>
                  <mat-chip-listbox multiple [(ngModel)]="prefsLocal.buscaFontesDefault" (change)="salvarPrefs()">
                    @for (f of fontesDisponiveis; track f) {
                      <mat-chip-option [value]="f">{{ f }}</mat-chip-option>
                    }
                  </mat-chip-listbox>
                </div>

                <mat-divider></mat-divider>

                <div class="field-group">
                  <span class="field-label">Modo de data padrão</span>
                  <div class="radio-group">
                    <label class="radio-opt" [class.selected]="prefsLocal.buscaModoDataDefault === 'single'"
                           (click)="prefsLocal.buscaModoDataDefault = 'single'; salvarPrefs()">
                      <span class="radio-dot"></span> Dia único
                    </label>
                    <label class="radio-opt" [class.selected]="prefsLocal.buscaModoDataDefault === 'range'"
                           (click)="prefsLocal.buscaModoDataDefault = 'range'; salvarPrefs()">
                      <span class="radio-dot"></span> Período
                    </label>
                  </div>
                </div>

                <mat-divider></mat-divider>

                <div class="field-group">
                  <span class="field-label">Período padrão (dias)</span>
                  <div class="slider-wrap">
                    <mat-slider min="1" max="30" step="1" class="full-slider">
                      <input matSliderThumb [(ngModel)]="prefsLocal.buscaPeriodoDias" (change)="salvarPrefs()">
                    </mat-slider>
                    <span class="slider-value">{{ prefsLocal.buscaPeriodoDias }}d</span>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- TAB: Sessões -->
          <mat-tab label="Sessões">
            <div class="tab-content">
              <div class="cfg-card">
                <div class="card-header">
                  <div class="card-title">Sessões ativas</div>
                  <div class="card-sub">Dispositivos com acesso à sua conta</div>
                </div>
                <div class="sessao-item sessao-atual">
                  <mat-icon class="sessao-icon">computer</mat-icon>
                  <div class="sessao-info">
                    <span class="sessao-nome">Este dispositivo</span>
                    <span class="sessao-detalhe">Sessão atual · Ativa agora</span>
                  </div>
                  <span class="sessao-badge">Atual</span>
                </div>
                <div class="pending-feature">
                  <mat-icon>lock_outline</mat-icon>
                  <div>
                    <strong>Gerenciamento de sessões</strong>
                    <span>Em desenvolvimento — disponível em breve</span>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- TAB: DODF -->
          <mat-tab label="DODF">
            <div class="tab-content">
              <div class="cfg-card cfg-card-fonte">
                <div class="card-header">
                  <div class="card-title">Configuração DODF</div>
                  <div class="card-sub">Keywords e tipos de abertura do Diário Oficial do DF</div>
                </div>
                <app-dodf-configuracao [embedded]="true" />
              </div>
            </div>
          </mat-tab>

          <!-- TAB: DOU -->
          <mat-tab label="DOU">
            <div class="tab-content">
              <div class="cfg-card cfg-card-fonte">
                <div class="card-header">
                  <div class="card-title">Configuração DOU</div>
                  <div class="card-sub">Keywords e tipos do Diário Oficial da União</div>
                </div>
                <app-dou-configuracao [embedded]="true" />
              </div>
            </div>
          </mat-tab>

          <!-- TAB: PNCP -->
          <mat-tab label="PNCP">
            <div class="tab-content">
              <div class="cfg-card cfg-card-fonte">
                <div class="card-header">
                  <div class="card-title">Configuração PNCP</div>
                  <div class="card-sub">Modalidades e UFs do Portal Nacional de Contratações</div>
                </div>
                <app-pncp-configuracao [embedded]="true" />
              </div>
            </div>
          </mat-tab>

        </mat-tab-group>
      </div>
    `,
    styles: [`
      .cfg-shell { padding: 24px; max-width: 860px; }
      .cfg-header { margin-bottom: 4px; }
      .cfg-header h1 { font-size: 22px; font-weight: 700; color: #0D1526; margin: 0 0 16px; }

      ::ng-deep .cfg-tabs {
        .mat-mdc-tab-header { border-bottom: 1px solid #E2E8F0; margin-bottom: 0; }
        .mat-mdc-tab .mdc-tab__text-label { font-size: 13px; font-weight: 600; color: #64748B; }
        .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label { color: #0D1526; }
        .mdc-tab-indicator__content--underline { border-color: #11BF7F; }
      }

      .tab-content { padding: 20px 0; display: flex; flex-direction: column; gap: 16px; }

      .cfg-card {
        background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px 24px;
      }
      .cfg-card-fonte { padding: 20px 0; border: none; background: transparent; }

      .card-header { margin-bottom: 16px; }
      .card-title { font-size: 15px; font-weight: 700; color: #0D1526; }
      .card-sub { font-size: 13px; color: #64748B; margin-top: 2px; }

      .perfil-avatar-row {
        display: flex; align-items: center; gap: 14px; margin-bottom: 20px;
        padding-bottom: 16px; border-bottom: 1px solid #F1F5F9;
      }
      .perfil-avatar {
        width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0;
        background: linear-gradient(135deg, #0DA66E, #107357);
        color: #fff; font-size: 16px; font-weight: 700;
        display: flex; align-items: center; justify-content: center;
      }
      .perfil-avatar-info { display: flex; flex-direction: column; gap: 2px; }
      .perfil-name { font-size: 14px; font-weight: 600; color: #0D1526; }
      .perfil-email { font-size: 12px; color: #64748B; }
      .perfil-role {
        font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
        color: #11BF7F;
      }

      .form-grid {
        display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px;
        mat-form-field { width: 100%; }
        @media (max-width: 600px) { grid-template-columns: 1fr; }
      }

      .card-actions {
        display: flex; align-items: center; gap: 10px; margin-top: 16px; flex-wrap: wrap;
      }
      .btn-primary {
        background: #0D1526; color: #fff; font-size: 13px; font-weight: 600;
        border-radius: 8px; height: 38px; display: flex; align-items: center; gap: 6px;
      }
      .btn-tour { font-size: 13px; color: #64748B; }

      .toggle-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 0; gap: 16px;
      }
      .toggle-info { display: flex; flex-direction: column; gap: 2px; }
      .toggle-label { font-size: 14px; font-weight: 600; color: #0D1526; }
      .toggle-desc { font-size: 12px; color: #64748B; }

      .slider-row { padding: 14px 0; }
      .slider-wrap { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
      .full-slider { flex: 1; }
      .slider-value { font-size: 14px; font-weight: 700; color: #0D1526; min-width: 32px; text-align: right; }

      .field-group { padding: 14px 0; }
      .field-label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 10px; }

      .radio-group { display: flex; gap: 12px; }
      .radio-opt {
        display: flex; align-items: center; gap: 6px; cursor: pointer;
        font-size: 13px; color: #64748B; padding: 6px 12px; border-radius: 7px;
        border: 1.5px solid #E2E8F0; transition: all 150ms;
        &.selected { border-color: #11BF7F; color: #0DA66E; background: rgba(17,191,127,0.06); }
      }
      .radio-dot {
        width: 12px; height: 12px; border-radius: 50%; border: 2px solid currentColor;
        .selected & { background: currentColor; }
      }

      .sessao-item {
        display: flex; align-items: center; gap: 12px; padding: 12px 0;
        border-bottom: 1px solid #F1F5F9;
      }
      .sessao-atual { }
      .sessao-icon { color: #64748B; }
      .sessao-info { display: flex; flex-direction: column; flex: 1; }
      .sessao-nome { font-size: 13px; font-weight: 600; color: #0D1526; }
      .sessao-detalhe { font-size: 12px; color: #64748B; }
      .sessao-badge {
        font-size: 10px; font-weight: 700; background: rgba(17,191,127,0.12);
        color: #0DA66E; padding: 2px 8px; border-radius: 5px; text-transform: uppercase;
      }

      .inline-error {
        background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;
        padding: 10px 14px; font-size: 13px; color: #dc2626; margin-top: 8px;
      }

      .pending-feature {
        display: flex; align-items: flex-start; gap: 12px; padding: 14px;
        background: #F8FAFC; border-radius: 8px; margin-top: 12px;
        mat-icon { color: #94A3B8; font-size: 20px; flex-shrink: 0; margin-top: 1px; }
        strong { display: block; font-size: 13px; font-weight: 600; color: #475569; }
        span { font-size: 12px; color: #94A3B8; }
      }
    `],
  })
  export class ConfiguracoesComponent implements OnInit {
    auth = inject(AuthService);
    private http = inject(HttpClient);
    private prefsSvc = inject(UserPreferencesService);
    private snackBar = inject(MatSnackBar);

    fontesDisponiveis = ['DODF', 'DOU', 'PNCP'];

    perfilNome = '';
    perfilFuncao = '';
    perfilEmpresa = '';
    senhaAtual = '';
    senhaNova = '';
    senhaConfirm = '';

    salvandoPerfil = signal(false);
    salvandoSenha = signal(false);
    erroSenha = signal('');
    prefsLocal!: UserPreferences;

    ngOnInit(): void {
      const u = this.auth.currentUser();
      this.perfilNome = u?.name ?? '';
      this.perfilFuncao = u?.funcao ?? '';
      this.perfilEmpresa = u?.company ?? '';
      this.prefsLocal = { ...this.prefsSvc.prefs() };
      this.prefsSvc.load().subscribe();
    }

    salvarPerfil(): void {
      this.salvandoPerfil.set(true);
      this.http.patch(`${environment.apiUrl}/users/me`, {
        name: this.perfilNome,
        funcao: this.perfilFuncao,
        company: this.perfilEmpresa,
      }).subscribe({
        next: () => {
          this.salvandoPerfil.set(false);
          this.snackBar.open('Perfil atualizado', 'OK', { duration: 3000 });
        },
        error: () => {
          this.salvandoPerfil.set(false);
          this.snackBar.open('Erro ao salvar perfil', 'OK', { duration: 3000 });
        },
      });
    }

    trocarSenha(): void {
      this.erroSenha.set('');
      if (!this.senhaAtual) { this.erroSenha.set('Informe sua senha atual.'); return; }
      if (this.senhaNova.length < 8) { this.erroSenha.set('Nova senha deve ter no mínimo 8 caracteres.'); return; }
      if (this.senhaNova !== this.senhaConfirm) { this.erroSenha.set('As senhas não coincidem.'); return; }
      this.salvandoSenha.set(true);
      this.http.patch(`${environment.apiUrl}/users/me/password`, {
        currentPassword: this.senhaAtual,
        newPassword: this.senhaNova,
      }).subscribe({
        next: () => {
          this.salvandoSenha.set(false);
          this.senhaAtual = ''; this.senhaNova = ''; this.senhaConfirm = '';
          this.snackBar.open('Senha alterada com sucesso', 'OK', { duration: 3000 });
        },
        error: (e) => {
          this.salvandoSenha.set(false);
          if (e.status === 400) this.erroSenha.set('Senha atual incorreta.');
          else this.erroSenha.set('Erro ao alterar senha. Tente novamente.');
        },
      });
    }

    salvarPrefs(): void {
      this.prefsSvc.save(this.prefsLocal).subscribe();
    }

    reiniciarTour(): void {
      localStorage.removeItem('lf_tour_done');
      this.http.patch(`${environment.apiUrl}/users/me`, { tourCompleted: false }).subscribe();
      this.snackBar.open('Tour reiniciado — recarregue a página', 'OK', { duration: 4000 });
    }
  }
  ```

- [ ] **Verificar no browser** — abrir `/configuracoes`. Confirmar que os 7 tabs aparecem e são navegáveis. Confirmar que as abas DODF/DOU/PNCP mostram os componentes existentes. Verificar responsividade em viewport estreito.

- [ ] **Commit**
  ```bash
  git add src/app/features/configuracoes/configuracoes.component.ts
  git commit -m "feat(configuracoes): rewrite with MatTabGroup — perfil, notifs, busca, sessoes, fontes"
  ```

---

## FASE 4 — Multi-coleta paralela

### Task 8: Expandir `ColetaAndamentoService` para estado por fonte

**Files:**
- Modify: `src/app/core/services/coleta-andamento.service.ts`
- Create: `src/app/core/services/coleta-andamento.service.spec.ts`

- [ ] **Escrever o teste antes de modificar o serviço.** Criar `coleta-andamento.service.spec.ts`:
  ```typescript
  import { TestBed } from '@angular/core/testing';
  import { ColetaAndamentoService } from './coleta-andamento.service';

  describe('ColetaAndamentoService', () => {
    let svc: ColetaAndamentoService;

    beforeEach(() => {
      TestBed.configureTestingModule({});
      svc = TestBed.inject(ColetaAndamentoService);
    });

    it('deve iniciar com estado vazio', () => {
      expect(svc.ativa()).toBe(false);
      expect(svc.fontes()).toEqual([]);
    });

    it('deve iniciar coleta e criar entradas por fonte', () => {
      svc.iniciarColeta(['DODF', 'DOU']);
      expect(svc.ativa()).toBe(true);
      expect(svc.fontes().length).toBe(2);
      expect(svc.fontes()[0].fonte).toBe('DODF');
      expect(svc.fontes()[0].status).toBe('pending');
    });

    it('deve marcar fonte como running ao avançar etapa', () => {
      svc.iniciarColeta(['DODF']);
      svc.avancarEtapa('DODF', 1, 3, '06/06/26');
      const f = svc.fontes().find(f => f.fonte === 'DODF')!;
      expect(f.status).toBe('running');
      expect(f.stepAtual).toBe(1);
      expect(f.totalSteps).toBe(3);
    });

    it('deve marcar fonte como done ao concluir', () => {
      svc.iniciarColeta(['DODF']);
      svc.concluirFonte('DODF', 12, 47, 150);
      const f = svc.fontes().find(f => f.fonte === 'DODF')!;
      expect(f.status).toBe('done');
      expect(f.salvos).toBe(12);
    });

    it('deve marcar fonte como error', () => {
      svc.iniciarColeta(['DOU']);
      svc.erroFonte('DOU');
      expect(svc.fontes()[0].status).toBe('error');
    });

    it('deve encerrar coleta quando todas as fontes concluírem', () => {
      svc.iniciarColeta(['DODF', 'DOU']);
      svc.concluirFonte('DODF', 5, 20, 100);
      expect(svc.ativa()).toBe(true);
      svc.concluirFonte('DOU', 3, 10, 80);
      expect(svc.ativa()).toBe(false);
    });

    it('deve calcular totalSalvos corretamente', () => {
      svc.iniciarColeta(['DODF', 'DOU']);
      svc.concluirFonte('DODF', 5, 20, 100);
      svc.concluirFonte('DOU', 3, 10, 80);
      expect(svc.totalSalvos()).toBe(8);
    });
  });
  ```

- [ ] **Rodar o teste para confirmar que falha:**
  ```bash
  npx ng test --include="**/coleta-andamento.service.spec.ts" --watch=false
  ```
  Esperado: FAIL (métodos `iniciarColeta`, `fontes`, etc. não existem)

- [ ] **Reescrever `coleta-andamento.service.ts`** com os novos métodos — mantendo os antigos para não quebrar outros componentes:
  ```typescript
  import { Injectable, signal, computed } from '@angular/core';

  export interface FonteAndamento {
    fonte: string;
    status: 'pending' | 'running' | 'done' | 'error';
    stepAtual: number;
    totalSteps: number;
    salvos: number;
    materias: number;
    duracaoMs: number;
    iniciadoEm: number;
  }

  export interface EtapaColeta {
    fonte: string;
    dataDisplay: string;
  }

  export interface ColetaAndamento {
    ativa: boolean;
    etapaAtual: EtapaColeta | null;  // mantido para compatibilidade
    step: number;
    total: number;
    acumulado: { materias: number; salvos: number; duplicados: number };
    iniciadoEm: string | null;
  }

  @Injectable({ providedIn: 'root' })
  export class ColetaAndamentoService {

    // ── Estado legado (mantido para compatibilidade com o topbar pill) ──
    readonly andamento = signal<ColetaAndamento>({
      ativa: false, etapaAtual: null, step: 0, total: 0,
      acumulado: { materias: 0, salvos: 0, duplicados: 0 }, iniciadoEm: null,
    });
    readonly ativa = computed(() => this._fontes().some(f => f.status === 'pending' || f.status === 'running'));

    // ── Estado por fonte (novo) ──
    private _fontes = signal<FonteAndamento[]>([]);
    readonly fontes = this._fontes.asReadonly();
    readonly totalSalvos = computed(() => this._fontes().reduce((n, f) => n + f.salvos, 0));

    iniciarColeta(fontesList: string[]): void {
      const agora = Date.now();
      this._fontes.set(fontesList.map(fonte => ({
        fonte, status: 'pending', stepAtual: 0, totalSteps: 1,
        salvos: 0, materias: 0, duracaoMs: 0, iniciadoEm: agora,
      })));
      this.andamento.update(a => ({ ...a, ativa: true, iniciadoEm: new Date().toISOString() }));
    }

    avancarEtapa(fonte: string, step: number, total: number, dataDisplay: string): void {
      this._fontes.update(fs => fs.map(f =>
        f.fonte === fonte ? { ...f, status: 'running', stepAtual: step, totalSteps: total } : f
      ));
      this.andamento.update(a => ({ ...a, etapaAtual: { fonte, dataDisplay }, step, total }));
    }

    concluirFonte(fonte: string, salvos: number, materias: number, duracaoMs: number): void {
      this._fontes.update(fs => fs.map(f =>
        f.fonte === fonte ? { ...f, status: 'done', salvos, materias, duracaoMs } : f
      ));
      const todasConcluidas = this._fontes().every(f => f.status === 'done' || f.status === 'error');
      if (todasConcluidas) {
        this.andamento.update(a => ({ ...a, ativa: false }));
      }
    }

    erroFonte(fonte: string): void {
      this._fontes.update(fs => fs.map(f =>
        f.fonte === fonte ? { ...f, status: 'error' } : f
      ));
      const todasConcluidas = this._fontes().every(f => f.status === 'done' || f.status === 'error');
      if (todasConcluidas) {
        this.andamento.update(a => ({ ...a, ativa: false }));
      }
    }

    limpar(): void {
      this._fontes.set([]);
      this.andamento.update(a => ({ ...a, ativa: false, etapaAtual: null }));
    }

    // Métodos legados mantidos para compatibilidade
    iniciar(total: number): void {
      this.andamento.set({ ativa: true, etapaAtual: null, step: 0, total, acumulado: { materias: 0, salvos: 0, duplicados: 0 }, iniciadoEm: new Date().toISOString() });
    }
    acumular(materias: number, salvos: number, duplicados: number): void {
      this.andamento.update(a => ({ ...a, acumulado: { materias: a.acumulado.materias + materias, salvos: a.acumulado.salvos + salvos, duplicados: a.acumulado.duplicados + duplicados } }));
    }
    encerrar(): void {
      this.andamento.update(a => ({ ...a, ativa: false, etapaAtual: null }));
    }
  }
  ```

- [ ] **Rodar os testes novamente:**
  ```bash
  npx ng test --include="**/coleta-andamento.service.spec.ts" --watch=false
  ```
  Esperado: todos PASS

- [ ] **Commit**
  ```bash
  git add src/app/core/services/coleta-andamento.service.ts \
          src/app/core/services/coleta-andamento.service.spec.ts
  git commit -m "feat(coleta): expand ColetaAndamentoService with per-source state tracking"
  ```

---

### Task 9: Multi-coleta paralela no `LeadsComponent`

**Files:**
- Modify: `src/app/features/leads/leads.component.ts`
- Modify: `src/app/features/leads/leads.component.html`
- Modify: `src/app/features/leads/leads.component.scss`

- [ ] **`leads.component.ts`** — substituir o método `coletar()` por versão paralela. Localizar o método existente e substituir completamente:
  ```typescript
  async coletar(): Promise<void> {
    if (this.coletaAndamento.ativa()) return;
    const dates = this.buildDateList();
    if (!dates.length) return;

    const collectableFontes = this.selectedFontes()
      .filter(k => FONTES.find(f => f.key === k)?.canCollect);
    if (!collectableFontes.length) return;

    this.coletaResultado.set(null);
    this.coletaAndamento.iniciarColeta(collectableFontes);

    const tarefas = collectableFontes.map(fonte =>
      this.coletarFonte(fonte, dates)
    );

    await Promise.allSettled(tarefas);

    const fontes = this.coletaAndamento.fontes();
    const totalSalvos = fontes.reduce((n, f) => n + f.salvos, 0);
    const totalMaterias = fontes.reduce((n, f) => n + f.materias, 0);

    this.coletaResultado.set({ totalMaterias, salvos: totalSalvos, duplicados: 0, data: '' } as any);

    if (totalSalvos > 0) {
      this.toast.success(`${totalSalvos} lead(s) encontrados em ${collectableFontes.length} fonte(s)`);
      this.carregarLeads();
    } else {
      this.toast.info('Nenhum lead novo encontrado neste período');
    }
  }

  private async coletarFonte(fonte: string, dates: Date[]): Promise<void> {
    const inicio = Date.now();
    let totalSalvos = 0, totalMaterias = 0;

    const datesParaFonte = fonte === 'PNCP' ? [dates[0]] : dates;

    for (let i = 0; i < datesParaFonte.length; i++) {
      this.coletaAndamento.avancarEtapa(fonte, i + 1, datesParaFonte.length, this.formatDate(datesParaFonte[i]));
      try {
        const r = await this.coletaService.dispararColeta(fonte, datesParaFonte[i]).toPromise();
        if (r) {
          totalSalvos   += r.salvos ?? 0;
          totalMaterias += r.totalMaterias ?? 0;
        }
      } catch {
        this.toast.error(`Erro ao coletar ${fonte} em ${this.formatDate(datesParaFonte[i])}`);
      }
    }

    this.coletaAndamento.concluirFonte(fonte, totalSalvos, totalMaterias, Date.now() - inicio);
  }
  ```

- [ ] **`leads.component.html`** — adicionar o painel de progresso inline logo abaixo do form de busca (depois do botão "Disparar Busca"). Localizar o bloco do form de coleta e adicionar após o botão:
  ```html
  <!-- Painel de progresso por fonte -->
  @if (coletaAndamento.fontes().length > 0) {
    <div class="coleta-progress-panel">
      <div class="cpp-header">
        @if (coletaAndamento.ativa()) {
          <span class="cpp-pulse"></span>
          <span class="cpp-title">Buscando em {{ coletaAndamento.fontes().length }} fonte(s)…</span>
        } @else {
          <mat-icon class="cpp-done-icon">check_circle</mat-icon>
          <span class="cpp-title">Busca concluída — {{ coletaAndamento.totalSalvos() }} lead(s) encontrado(s)</span>
        }
      </div>

      @for (f of coletaAndamento.fontes(); track f.fonte) {
        <div class="cpp-fonte" [class]="'cpp-' + f.status">
          <div class="cpp-fonte-header">
            @if (f.status === 'done') {
              <mat-icon class="cpp-status-icon">check_circle</mat-icon>
            } @else if (f.status === 'error') {
              <mat-icon class="cpp-status-icon">error_outline</mat-icon>
            } @else {
              <mat-spinner diameter="16" class="cpp-spinner"></mat-spinner>
            }
            <span class="cpp-fonte-name">{{ f.fonte }}</span>
            <span class="cpp-fonte-step">
              @if (f.status === 'running') { {{ f.stepAtual }}/{{ f.totalSteps }} }
              @else if (f.status === 'done') { {{ f.salvos }} leads · {{ f.materias }} matérias }
              @else if (f.status === 'error') { Erro na coleta }
              @else { Aguardando… }
            </span>
          </div>
          @if (f.status === 'running') {
            <mat-progress-bar mode="indeterminate" class="cpp-bar"></mat-progress-bar>
          } @else if (f.status === 'done') {
            <mat-progress-bar mode="determinate" value="100" class="cpp-bar cpp-bar-done"></mat-progress-bar>
          }
        </div>
      }
    </div>
  }
  ```

  Adicionar `MatProgressBarModule` e `MatProgressSpinnerModule` nos imports do componente se necessário.

- [ ] **`leads.component.scss`** — adicionar estilos do painel de progresso:
  ```scss
  .coleta-progress-panel {
    background: #fff; border: 1px solid #E2E8F0; border-radius: 10px;
    padding: 14px 16px; margin-top: 10px; display: flex; flex-direction: column; gap: 10px;
  }
  .cpp-header {
    display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
  }
  .cpp-pulse {
    width: 8px; height: 8px; border-radius: 50%; background: #11BF7F; flex-shrink: 0;
    animation: coleta-pulse 1.6s ease-in-out infinite;
  }
  .cpp-title { font-size: 13px; font-weight: 600; color: #0D1526; }
  .cpp-done-icon { font-size: 18px; width: 18px; height: 18px; color: #11BF7F; }

  .cpp-fonte {
    border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 12px;
    display: flex; flex-direction: column; gap: 6px;
    transition: border-color 200ms ease;

    &.cpp-running { border-color: #BFDBFE; background: #EFF6FF; }
    &.cpp-done    { border-color: #D1FAE5; background: #F0FDF4; }
    &.cpp-error   { border-color: #FECACA; background: #FEF2F2; }
    &.cpp-pending { opacity: 0.5; }
  }
  .cpp-fonte-header { display: flex; align-items: center; gap: 8px; }
  .cpp-status-icon {
    font-size: 16px; width: 16px; height: 16px; flex-shrink: 0;
    .cpp-done & { color: #10B981; }
    .cpp-error & { color: #EF4444; }
  }
  ::ng-deep .cpp-spinner circle { stroke: #3B82F6 !important; }
  .cpp-fonte-name { font-size: 13px; font-weight: 600; color: #0D1526; flex: 1; }
  .cpp-fonte-step { font-size: 12px; color: #64748B; }
  .cpp-bar { border-radius: 2px; height: 3px; }
  ::ng-deep .cpp-bar .mdc-linear-progress__buffer-bar { background: #E2E8F0; }
  ::ng-deep .cpp-bar .mdc-linear-progress__primary-bar { background: #3B82F6; }
  ::ng-deep .cpp-bar-done .mdc-linear-progress__primary-bar { background: #11BF7F; }
  ```

- [ ] **Verificar no browser** — disparar uma coleta com DODF e DOU selecionados. Confirmar que os dois cards aparecem simultaneamente, cada um com progresso independente. Confirmar que ao concluir aparece o checkmark e os contadores.

- [ ] **Commit**
  ```bash
  git add src/app/features/leads/leads.component.ts \
          src/app/features/leads/leads.component.html \
          src/app/features/leads/leads.component.scss
  git commit -m "feat(leads): parallel multi-source coleta with per-source progress cards"
  ```

---

## FASE 5 — Notificações reescrita

### Task 10: Reescrever `NotificacoesComponent` com Angular Material

**Files:**
- Modify: `src/app/core/models/edital.model.ts`
- Modify: `src/app/core/services/notificacoes.service.ts`
- Modify: `src/app/features/notificacoes/notificacoes.component.ts`
- Modify: `src/app/features/notificacoes/notificacoes.component.html`
- Modify: `src/app/features/notificacoes/notificacoes.component.scss`

- [ ] **`edital.model.ts`** — tornar `tipo` um union type (garantindo retrocompatibilidade com string):
  ```typescript
  export type NotificacaoTipo = 'NOVO_LEAD' | 'BUSCA_CONCLUIDA';

  export interface NotificacaoEvent {
    tipo: NotificacaoTipo | string;  // string para compatibilidade com backend existente
    timestamp: string;
    editalId: number;
    numero: string;
    objeto: string;
    orgao?: string;
    valorEstimado?: number;
    leadScore: number;
    categoria: string;
    urlPncp?: string;
    // campos para BUSCA_CONCLUIDA:
    totalSalvos?: number;
    totalFontes?: number;
    fontesNomes?: string[];
  }
  ```

- [ ] **`notificacoes.service.ts`** — adicionar método `emitirBuscaConcluida`:
  ```typescript
  emitirBuscaConcluida(salvos: number, fontes: string[]): void {
    const evento: NotificacaoEvent = {
      tipo: 'BUSCA_CONCLUIDA',
      timestamp: new Date().toISOString(),
      editalId: 0,
      numero: '',
      objeto: `${salvos} lead(s) encontrado(s) em ${fontes.join(', ')}`,
      leadScore: 0,
      categoria: '',
      totalSalvos: salvos,
      totalFontes: fontes.length,
      fontesNomes: fontes,
    };
    this._stream$.next(evento);
    this._novas.update(n => n + 1);
  }
  ```

- [ ] **`leads.component.ts`** — ao final do método `coletar()`, após calcular `totalSalvos`, chamar:
  ```typescript
  // Injetar NotificacoesService no componente:
  private notifSvc = inject(NotificacoesService);

  // No final de coletar(), antes do toast:
  if (totalSalvos > 0) {
    this.notifSvc.emitirBuscaConcluida(totalSalvos, collectableFontes);
    // ...toast existente
  }
  ```

- [ ] **Reescrever `notificacoes.component.ts`** completamente:
  ```typescript
  import { Component, OnInit, inject, signal, computed } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { RouterLink } from '@angular/router';
  import { MatListModule } from '@angular/material/list';
  import { MatDividerModule } from '@angular/material/divider';
  import { MatChipsModule } from '@angular/material/chips';
  import { MatButtonModule } from '@angular/material/button';
  import { MatIconModule } from '@angular/material/icon';
  import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
  import { MatTooltipModule } from '@angular/material/tooltip';
  import { NotificacoesService } from '../../core/services/notificacoes.service';
  import { ToastService } from '../../core/services/toast.service';
  import { NotificacaoEvent } from '../../core/models/edital.model';

  type FiltroFonte = 'TODOS' | 'NOVO_LEAD' | 'BUSCA_CONCLUIDA';

  @Component({
    selector: 'app-notificacoes',
    standalone: true,
    imports: [CommonModule, RouterLink, MatListModule, MatDividerModule, MatChipsModule,
              MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
    templateUrl: './notificacoes.component.html',
    styleUrl: './notificacoes.component.scss',
  })
  export class NotificacoesComponent implements OnInit {
    private svc = inject(NotificacoesService);
    private toast = inject(ToastService);

    loading = signal(true);
    todas = signal<NotificacaoEvent[]>([]);
    filtro = signal<FiltroFonte>('TODOS');

    filtros: { value: FiltroFonte; label: string }[] = [
      { value: 'TODOS',          label: 'Todas'     },
      { value: 'NOVO_LEAD',      label: 'Leads'     },
      { value: 'BUSCA_CONCLUIDA',label: 'Buscas'    },
    ];

    notificacoes = computed(() => {
      const f = this.filtro();
      const all = this.todas();
      if (f === 'TODOS') return all;
      return all.filter(n => n.tipo === f);
    });

    ngOnInit(): void {
      this.svc.clearNovas();
      this.load();
    }

    load(): void {
      this.loading.set(true);
      this.svc.getHistorico().subscribe({
        next: (n) => { this.todas.set(n ?? []); this.loading.set(false); },
        error: () => { this.toast.error('Erro ao carregar notificações'); this.loading.set(false); },
      });
    }

    marcarTodasLidas(): void {
      this.svc.clearNovas();
      this.toast.success('Notificações marcadas como lidas');
    }

    scoreClass(score: number): string {
      if (score >= 70) return 'hot';
      if (score >= 40) return 'warm';
      return 'cold';
    }

    formatCurrency(v?: number): string {
      if (!v) return '';
      if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
      if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`;
      return `R$ ${v}`;
    }

    formatTime(ts: string): string {
      if (!ts) return '';
      return new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
  }
  ```

- [ ] **Reescrever `notificacoes.component.html`**:
  ```html
  <div class="notif-shell">
    <!-- Header -->
    <div class="notif-header">
      <div>
        <h1>Notificações</h1>
        <p class="notif-sub">{{ notificacoes().length }} notificação(ões)</p>
      </div>
      <button mat-stroked-button (click)="marcarTodasLidas()" class="btn-lidas">
        <mat-icon>done_all</mat-icon> Marcar como lidas
      </button>
    </div>

    <!-- Filtros -->
    <mat-chip-listbox [(ngModel)]="filtro" class="notif-filtros" aria-label="Filtro">
      @for (f of filtros; track f.value) {
        <mat-chip-option [value]="f.value">{{ f.label }}</mat-chip-option>
      }
    </mat-chip-listbox>

    <!-- Loading skeleton -->
    @if (loading()) {
      <div class="notif-list">
        @for (i of [1,2,3,4,5]; track i) {
          <div class="notif-skeleton">
            <div class="sk-chip"></div>
            <div class="sk-lines">
              <div class="sk-line sk-line-lg"></div>
              <div class="sk-line sk-line-sm"></div>
            </div>
          </div>
        }
      </div>
    }

    <!-- Lista -->
    @if (!loading()) {
      @if (notificacoes().length === 0) {
        <div class="notif-empty">
          <mat-icon>notifications_none</mat-icon>
          <span>Nenhuma notificação encontrada</span>
        </div>
      } @else {
        <mat-list class="notif-list">
          @for (n of notificacoes(); track n.editalId + n.timestamp; let last = $last) {
            <mat-list-item class="notif-item" [class.notif-busca]="n.tipo === 'BUSCA_CONCLUIDA'">

              @if (n.tipo === 'BUSCA_CONCLUIDA') {
                <!-- Notificação de busca concluída -->
                <mat-icon matListItemIcon class="busca-icon">search</mat-icon>
                <div matListItemTitle class="notif-titulo">Busca concluída</div>
                <div matListItemLine class="notif-objeto">{{ n.objeto }}</div>
                <div matListItemMeta class="notif-meta">{{ formatTime(n.timestamp) }}</div>
              } @else {
                <!-- Notificação de novo lead -->
                <div matListItemIcon class="score-chip {{ scoreClass(n.leadScore) }}">
                  {{ n.leadScore }}
                </div>
                <div matListItemTitle class="notif-titulo">
                  @if (n.editalId) {
                    <a [routerLink]="['/editais', n.editalId]" class="notif-link">{{ n.numero || 'Lead' }}</a>
                  } @else {
                    {{ n.numero || 'Lead' }}
                  }
                </div>
                <div matListItemLine class="notif-objeto">{{ n.objeto }}</div>
                <div matListItemMeta class="notif-meta">
                  @if (n.categoria) { <span class="notif-cat">{{ n.categoria }}</span> }
                  {{ formatTime(n.timestamp) }}
                </div>
              }

            </mat-list-item>
            @if (!last) { <mat-divider></mat-divider> }
          }
        </mat-list>
      }
    }
  </div>
  ```

  Adicionar `FormsModule` nos imports do componente para o `[(ngModel)]` no chip-listbox.

- [ ] **Reescrever `notificacoes.component.scss`** com hex direto (sem tokens M3):
  ```scss
  .notif-shell {
    padding: 24px;
  }

  .notif-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 16px; gap: 12px; flex-wrap: wrap;
    h1 { font-size: 22px; font-weight: 700; color: #0D1526; margin: 0 0 2px; }
  }
  .notif-sub { font-size: 13px; color: #64748B; margin: 0; }
  .btn-lidas { font-size: 13px; color: #64748B; }

  .notif-filtros {
    display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px;
    ::ng-deep .mat-mdc-chip-option {
      font-size: 12px; font-weight: 600;
      &.mdc-evolution-chip--selected { background: #0D1526; color: #fff; }
    }
  }

  .notif-list {
    background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;
    padding: 0;
  }

  .notif-item {
    height: auto !important; padding: 12px 16px !important;
    &.notif-busca { background: #F8FAFC; }
  }

  .score-chip {
    min-width: 34px; height: 24px; border-radius: 7px;
    font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    background: #F1F5F9; color: #64748B;
    &.hot { background: rgba(17,191,127,0.12); color: #0DA66E; }
    &.warm { background: rgba(245,158,11,0.12); color: #D97706; }
    &.cold { background: #F1F5F9; color: #64748B; }
  }

  .busca-icon { color: #3B82F6; font-size: 20px; width: 20px; height: 20px; }

  .notif-titulo { font-size: 13px; font-weight: 600; color: #0D1526; }
  .notif-link { color: #0D1526; text-decoration: none; &:hover { color: #11BF7F; } }
  .notif-objeto { font-size: 12px; color: #64748B; white-space: normal !important; line-height: 1.4; }
  .notif-meta { font-size: 11px; color: #94A3B8; display: flex; align-items: center; gap: 6px; }
  .notif-cat {
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
    color: #11BF7F;
  }

  .notif-empty {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    padding: 48px 24px; color: #94A3B8; background: #fff; border: 1px solid #E2E8F0;
    border-radius: 12px;
    mat-icon { font-size: 36px; width: 36px; height: 36px; opacity: 0.4; }
    span { font-size: 14px; }
  }

  /* Skeleton */
  .notif-skeleton {
    display: flex; align-items: center; gap: 12px; padding: 12px 16px;
    border-bottom: 1px solid #F1F5F9;
    &:last-child { border-bottom: none; }
  }
  .sk-chip { width: 34px; height: 24px; border-radius: 7px; background: #E2E8F0; flex-shrink: 0; animation: shimmer 1.5s infinite; }
  .sk-lines { flex: 1; display: flex; flex-direction: column; gap: 6px; }
  .sk-line { height: 12px; border-radius: 4px; background: #E2E8F0; animation: shimmer 1.5s infinite; }
  .sk-line-lg { width: 70%; }
  .sk-line-sm { width: 45%; }

  @keyframes shimmer {
    0%,100% { opacity: 1; } 50% { opacity: 0.4; }
  }
  ```

- [ ] **Verificar no browser** — abrir `/notificacoes`. Confirmar que os itens aparecem com cores de brand (verde/âmbar, não roxo), filtros funcionam, skeleton aparece durante o loading.

- [ ] **Commit**
  ```bash
  git add src/app/core/models/edital.model.ts \
          src/app/core/services/notificacoes.service.ts \
          src/app/features/leads/leads.component.ts \
          src/app/features/notificacoes/notificacoes.component.ts \
          src/app/features/notificacoes/notificacoes.component.html \
          src/app/features/notificacoes/notificacoes.component.scss
  git commit -m "feat(notificacoes): rewrite with MatList, brand colors, skeleton, busca_concluida type"
  ```

---

## FASE 6 — Tour interativo

### Task 11: `TourService` e `TourOverlayComponent`

**Files:**
- Create: `src/app/core/services/tour.service.ts`
- Create: `src/app/core/services/tour.service.spec.ts`
- Create: `src/app/features/tour/tour-overlay.component.ts`
- Modify: `src/app/app.component.ts`

- [ ] **Escrever testes do `TourService` antes de implementar:**
  ```typescript
  // tour.service.spec.ts
  import { TestBed } from '@angular/core/testing';
  import { TourService } from './tour.service';

  describe('TourService', () => {
    let svc: TourService;

    beforeEach(() => {
      TestBed.configureTestingModule({});
      svc = TestBed.inject(TourService);
      localStorage.removeItem('lf_tour_done');
    });

    it('deve iniciar com tour inativo', () => {
      expect(svc.ativo()).toBe(false);
    });

    it('deve iniciar o tour e ir para o step 0', () => {
      svc.iniciar();
      expect(svc.ativo()).toBe(true);
      expect(svc.stepAtual()).toBe(0);
    });

    it('deve avançar para o próximo step', () => {
      svc.iniciar();
      svc.proximo();
      expect(svc.stepAtual()).toBe(1);
    });

    it('deve voltar para o step anterior', () => {
      svc.iniciar();
      svc.proximo();
      svc.anterior();
      expect(svc.stepAtual()).toBe(0);
    });

    it('deve encerrar o tour e gravar no localStorage', () => {
      svc.iniciar();
      svc.encerrar();
      expect(svc.ativo()).toBe(false);
      expect(localStorage.getItem('lf_tour_done')).toBe('true');
    });

    it('deve retornar o step atual', () => {
      svc.iniciar();
      expect(svc.step()).toBeDefined();
      expect(svc.step()?.titulo).toBeTruthy();
    });
  });
  ```

- [ ] **Rodar para confirmar falha:**
  ```bash
  npx ng test --include="**/tour.service.spec.ts" --watch=false
  ```
  Esperado: FAIL

- [ ] **Criar `tour.service.ts`**:
  ```typescript
  import { Injectable, signal, computed, inject } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { environment } from '../../../environments/environment';

  export interface TourStep {
    selector: string;
    titulo: string;
    descricao: string;
    posicao: 'top' | 'bottom' | 'right' | 'left';
    rota?: string;
  }

  const STEPS: TourStep[] = [
    {
      selector: '.coleta-panel',
      titulo: 'Disparar uma busca',
      descricao: 'Selecione as fontes (DODF, DOU) e uma data ou período. Clique em "Disparar Busca" para coletar leads automaticamente.',
      posicao: 'right',
      rota: '/leads',
    },
    {
      selector: '.leads-grid',
      titulo: 'Lista de Leads',
      descricao: 'Cada lead é uma oportunidade de licitação identificada automaticamente. Clique num lead para ver detalhes e avaliar se vale a pena.',
      posicao: 'top',
      rota: '/leads',
    },
    {
      selector: '.pipeline-shell',
      titulo: 'Pipeline',
      descricao: 'Acompanhe o ciclo de vida de cada oportunidade — desde a avaliação inicial até o processo licitatório completo.',
      posicao: 'top',
      rota: '/pipeline',
    },
    {
      selector: '.editais-shell',
      titulo: 'Editais',
      descricao: 'Acesse os editais completos das licitações monitoradas. Filtre por órgão, valor e status.',
      posicao: 'top',
      rota: '/editais',
    },
    {
      selector: '.notif-btn',
      titulo: 'Notificações',
      descricao: 'Você é avisado em tempo real quando novos leads são encontrados. O sino mostra quantos há para revisar.',
      posicao: 'bottom',
    },
    {
      selector: '.header-avatar',
      titulo: 'Configurações',
      descricao: 'Clique no seu avatar para acessar configurações, gerenciar fontes de busca e preferências de notificação.',
      posicao: 'bottom',
    },
  ];

  @Injectable({ providedIn: 'root' })
  export class TourService {
    private http = inject(HttpClient);

    private _ativo = signal(false);
    private _step = signal(0);

    readonly ativo = this._ativo.asReadonly();
    readonly stepAtual = this._step.asReadonly();
    readonly step = computed(() => STEPS[this._step()] ?? null);
    readonly totalSteps = STEPS.length;
    readonly ehUltimo = computed(() => this._step() === STEPS.length - 1);
    readonly ehPrimeiro = computed(() => this._step() === 0);

    iniciar(): void {
      this._step.set(0);
      this._ativo.set(true);
    }

    proximo(): void {
      if (this._step() < STEPS.length - 1) {
        this._step.update(s => s + 1);
      } else {
        this.encerrar();
      }
    }

    anterior(): void {
      if (this._step() > 0) this._step.update(s => s - 1);
    }

    encerrar(): void {
      this._ativo.set(false);
      localStorage.setItem('lf_tour_done', 'true');
      this.http.patch(`${environment.apiUrl}/users/me`, { tourCompleted: true }).subscribe({ error: () => {} });
    }

    deveMostrar(tourCompleted: boolean): boolean {
      return !tourCompleted && localStorage.getItem('lf_tour_done') !== 'true';
    }
  }
  ```

- [ ] **Rodar os testes:**
  ```bash
  npx ng test --include="**/tour.service.spec.ts" --watch=false
  ```
  Esperado: todos PASS

- [ ] **Criar `tour-overlay.component.ts`**:
  ```typescript
  import { Component, inject, signal, OnInit, effect } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { Router, NavigationEnd } from '@angular/router';
  import { MatButtonModule } from '@angular/material/button';
  import { MatIconModule } from '@angular/material/icon';
  import { TourService, TourStep } from '../../core/services/tour.service';
  import { filter } from 'rxjs';

  interface TooltipPos { top: string; left: string; }

  @Component({
    selector: 'app-tour-overlay',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule],
    template: `
      @if (tour.ativo()) {
        <div class="tour-backdrop" (click)="tour.encerrar()"></div>

        @if (tooltipPos()) {
          <div class="tour-tooltip" [style.top]="tooltipPos()!.top" [style.left]="tooltipPos()!.left">
            <div class="tour-header">
              <span class="tour-step-count">{{ tour.stepAtual() + 1 }} / {{ tour.totalSteps }}</span>
              <button class="tour-close" (click)="tour.encerrar()" aria-label="Fechar tour">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <div class="tour-titulo">{{ tour.step()?.titulo }}</div>
            <div class="tour-desc">{{ tour.step()?.descricao }}</div>
            <div class="tour-actions">
              @if (!tour.ehPrimeiro()) {
                <button mat-button class="btn-ant" (click)="tour.anterior()">Anterior</button>
              }
              <button mat-flat-button class="btn-prox" (click)="avancar()">
                {{ tour.ehUltimo() ? 'Concluir' : 'Próximo' }}
              </button>
              <button mat-button class="btn-pular" (click)="tour.encerrar()">Pular</button>
            </div>
          </div>
        }
      }
    `,
    styles: [`
      .tour-backdrop {
        position: fixed; inset: 0;
        box-shadow: 0 0 0 9999px rgba(0,0,0,0.55);
        z-index: 1000; pointer-events: all;
      }
      .tour-tooltip {
        position: fixed; z-index: 1001; background: #fff; border-radius: 12px;
        padding: 16px 20px; max-width: 300px; min-width: 260px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        pointer-events: all;
      }
      .tour-header {
        display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
      }
      .tour-step-count { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: .05em; }
      .tour-close {
        background: none; border: none; cursor: pointer; padding: 2px; color: #94A3B8;
        display: flex; &:hover { color: #0D1526; }
        mat-icon { font-size: 16px; width: 16px; height: 16px; }
      }
      .tour-titulo { font-size: 15px; font-weight: 700; color: #0D1526; margin-bottom: 6px; }
      .tour-desc { font-size: 13px; color: #64748B; line-height: 1.5; margin-bottom: 14px; }
      .tour-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
      .btn-prox { background: #0D1526; color: #fff; font-size: 13px; font-weight: 600; border-radius: 7px; }
      .btn-ant { font-size: 13px; color: #64748B; }
      .btn-pular { font-size: 12px; color: #94A3B8; margin-left: auto; }
    `],
  })
  export class TourOverlayComponent implements OnInit {
    readonly tour = inject(TourService);
    private router = inject(Router);
    tooltipPos = signal<TooltipPos | null>(null);

    ngOnInit(): void {
      effect(() => {
        if (this.tour.ativo()) {
          const step = this.tour.step();
          if (step?.rota && !this.router.url.startsWith(step.rota)) {
            this.router.navigate([step.rota]).then(() => setTimeout(() => this.posicionarTooltip(), 300));
          } else {
            setTimeout(() => this.posicionarTooltip(), 150);
          }
        }
      });
    }

    posicionarTooltip(): void {
      const step = this.tour.step();
      if (!step) return;
      const el = document.querySelector(step.selector);
      if (!el) { this.tooltipPos.set({ top: '50%', left: '50%' }); return; }

      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const rect = el.getBoundingClientRect();
      const margin = 12;
      let top: number, left: number;

      switch (step.posicao) {
        case 'bottom': top = rect.bottom + margin; left = rect.left; break;
        case 'top':    top = rect.top - 200 - margin; left = rect.left; break;
        case 'right':  top = rect.top; left = rect.right + margin; break;
        case 'left':   top = rect.top; left = rect.left - 320 - margin; break;
        default:       top = rect.bottom + margin; left = rect.left;
      }

      // Guardar dentro da viewport
      top  = Math.max(10, Math.min(top,  window.innerHeight - 220));
      left = Math.max(10, Math.min(left, window.innerWidth  - 320));

      this.tooltipPos.set({ top: `${top}px`, left: `${left}px` });
    }

    avancar(): void {
      this.tour.proximo();
    }
  }
  ```

- [ ] **`app.component.ts`** — declarar `TourOverlayComponent` e iniciar o tour quando necessário. Localizar o componente raiz e adicionar:
  ```typescript
  import { TourOverlayComponent } from './features/tour/tour-overlay.component';
  import { TourService } from './core/services/tour.service';
  import { AuthService } from './core/services/auth.service';
  import { effect, inject } from '@angular/core';

  // No componente:
  private auth = inject(AuthService);
  private tourSvc = inject(TourService);

  // Adicionar TourOverlayComponent ao array imports: []

  // No construtor ou ngOnInit — usar effect para observar autenticação:
  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user && this.tourSvc.deveMostrar(user.tourCompleted)) {
        setTimeout(() => this.tourSvc.iniciar(), 800);
      }
    });
  }
  ```
  Adicionar `<app-tour-overlay />` no template do `AppComponent`, antes ou depois do `<router-outlet />`.

- [ ] **Verificar no browser** — limpar `localStorage`, fazer login. Após 800ms o tour deve iniciar. Clicar em "Próximo" deve avançar os steps. Clicar em "Pular" deve encerrar. Recarregar a página: tour não deve reaparecer (localStorage tem a flag).

- [ ] **Commit**
  ```bash
  git add src/app/core/services/tour.service.ts \
          src/app/core/services/tour.service.spec.ts \
          src/app/features/tour/tour-overlay.component.ts \
          src/app/app.component.ts
  git commit -m "feat(tour): add TourService and TourOverlayComponent with 6-step interactive tour"
  ```

---

## FASE 7 — Editais: polish final

### Task 12: Converter search box para `mat-form-field` em Editais

**Files:**
- Modify: `src/app/features/editais/editais-list/editais-list.component.html`
- Modify: `src/app/features/editais/editais-list/editais-list.component.ts`
- Modify: `src/app/features/editais/editais-list/editais-list.component.scss`

- [ ] **`editais-list.component.ts`** — adicionar `MatFormFieldModule` e `MatInputModule` nos imports do componente se não estiverem:
  ```typescript
  import { MatFormFieldModule } from '@angular/material/form-field';
  import { MatInputModule } from '@angular/material/input';
  // Adicionar ao array imports: []
  ```

- [ ] **`editais-list.component.html`** — localizar o campo de busca hand-rolled (provavelmente um `<input>` dentro de uma div customizada) e substituir por:
  ```html
  <mat-form-field appearance="outline" class="search-field">
    <mat-label>Buscar editais</mat-label>
    <input matInput [value]="searchText()"
           (input)="onSearchInput($event)"
           placeholder="Número, objeto ou órgão...">
    <mat-icon matPrefix>search</mat-icon>
    @if (searchText()) {
      <button mat-icon-button matSuffix (click)="clearSearch()" aria-label="Limpar">
        <mat-icon>close</mat-icon>
      </button>
    }
  </mat-form-field>
  ```
  Adicionar os dois métodos no componente (substituem o handler existente `onInput`/equivalente):
  ```typescript
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.searchText.set(value);
    this.dataSource.filter = value;
  }
  clearSearch(): void {
    this.searchText.set('');
    this.dataSource.filter = '';
  }
  ```
  **Nota:** `searchText` já existe como `signal('')` no componente. Verificar se `dataSource` é o nome correto do `MatTableDataSource` — ajustar se diferente.

- [ ] **`editais-list.component.scss`** — adicionar estilo para o novo campo:
  ```scss
  .search-field {
    width: 280px;
    ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    @media (max-width: 768px) { width: 100%; }
  }
  ```

- [ ] **Verificar no browser** — abrir `/editais`, confirmar que o campo de busca usa o estilo Material, com ícone de search e botão de limpar.

- [ ] **Commit**
  ```bash
  git add src/app/features/editais/editais-list/editais-list.component.html \
          src/app/features/editais/editais-list/editais-list.component.ts \
          src/app/features/editais/editais-list/editais-list.component.scss
  git commit -m "polish(editais): convert search input to mat-form-field"
  ```

---

## Verificação Final

- [ ] **Rodar todos os testes:**
  ```bash
  npx ng test --watch=false
  ```
  Esperado: todos PASS (ou apenas falhas pré-existentes no `app.spec.ts` default do Angular)

- [ ] **Build de produção:**
  ```bash
  npx ng build --configuration production
  ```
  Esperado: sem erros de compilação TypeScript. Warnings de bundle size são aceitáveis.

- [ ] **Checklist de navegação:**
  - [ ] Login redireciona para `/leads`
  - [ ] Sidebar mostra apenas Licitações (Leads, Pipeline, Editais)
  - [ ] `/forgot-password` acessível sem login
  - [ ] `/reset-password?token=x` acessível sem login
  - [ ] Tour dispara no primeiro login e não repete
  - [ ] Configurações abre com 7 tabs funcionais
  - [ ] Coleta dispara DODF e DOU em paralelo com cards de progresso
  - [ ] Notificações usa cores de brand (verde/âmbar, sem roxo)

- [ ] **Commit final de bump de versão** (se houver `package.json` com versão):
  ```bash
  git add -A
  git commit -m "chore: MVP licitações — polish, parallel coleta, auth self-service, tour"
  ```
