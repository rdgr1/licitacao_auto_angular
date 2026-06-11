import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { BackgroundLayerComponent } from '../../../shared/components/background-layer/background-layer.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    BackgroundLayerComponent,
  ],
  template: `
    <div class="auth-shell">
      <app-bg-layer variant="network"></app-bg-layer>

      <!-- ── Left panel ──────────────────────────────────────────────── -->
      <aside class="auth-brand">
        <div class="brand-inner">
          <div class="brand-logo">
            <div class="logo-icon">
              <mat-icon>gavel</mat-icon>
            </div>
            <span class="logo-text">LicitaFlow</span>
          </div>

          <div class="brand-headline">
            <h1>Inteligência artificial<br>a serviço das licitações</h1>
            <p>Automatize a coleta, classifique editais e impugne irregularidades com IA de ponta.</p>
          </div>

          <ul class="brand-features">
            <li>
              <span class="feat-icon"><mat-icon>auto_awesome</mat-icon></span>
              <div>
                <strong>Classificação automática</strong>
                <span>IA analisa e pontua cada edital por relevância</span>
              </div>
            </li>
            <li>
              <span class="feat-icon"><mat-icon>view_kanban</mat-icon></span>
              <div>
                <strong>Pipeline estilo CRM</strong>
                <span>Gerencie leads de licitação como oportunidades</span>
              </div>
            </li>
            <li>
              <span class="feat-icon"><mat-icon>smart_toy</mat-icon></span>
              <div>
                <strong>Assistente RAG</strong>
                <span>Pergunte qualquer coisa sobre os seus editais</span>
              </div>
            </li>
            <li>
              <span class="feat-icon"><mat-icon>gavel</mat-icon></span>
              <div>
                <strong>Motor de Impugnação</strong>
                <span>Gere petições fundamentadas em segundos</span>
              </div>
            </li>
          </ul>

        </div>

        <!-- Decorative grid -->
        <div class="brand-grid" aria-hidden="true"></div>
        <!-- Glow -->
        <div class="brand-glow" aria-hidden="true"></div>
        <!-- Animated blobs -->
        <div class="login-blob-1" aria-hidden="true"></div>
        <div class="login-blob-2" aria-hidden="true"></div>
        <div class="login-blob-3" aria-hidden="true"></div>
      </aside>

      <!-- ── Right panel ─────────────────────────────────────────────── -->
      <main class="auth-form-panel">
        <div class="form-inner animate-fade-up">
          <!-- Mobile logo -->
          <div class="mobile-logo">
            <div class="logo-icon sm"><mat-icon>gavel</mat-icon></div>
            <span>LicitaFlow</span>
          </div>

          <div class="form-header">
            <h2>Bem-vindo de volta</h2>
            <p>Entre com suas credenciais para acessar o painel</p>
          </div>

          @if (errorMsg()) {
            <div class="error-banner" role="alert">
              <mat-icon>error_outline</mat-icon>
              <span>{{ errorMsg() }}</span>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form" novalidate>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>E-mail corporativo</mat-label>
              <mat-icon matPrefix>mail_outline</mat-icon>
              <input matInput type="email" formControlName="email"
                     placeholder="voce@empresa.com.br"
                     autocomplete="email" />
              @if (form.controls.email.touched && form.controls.email.errors?.['required']) {
                <mat-error>E-mail é obrigatório</mat-error>
              }
              @if (form.controls.email.touched && form.controls.email.errors?.['email']) {
                <mat-error>Informe um e-mail válido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Senha</mat-label>
              <mat-icon matPrefix>lock_outline</mat-icon>
              <input matInput
                     [type]="showPass() ? 'text' : 'password'"
                     formControlName="password"
                     placeholder="••••••••"
                     autocomplete="current-password" />
              <button mat-icon-button matSuffix type="button"
                      (click)="showPass.set(!showPass())"
                      [attr.aria-label]="showPass() ? 'Ocultar senha' : 'Mostrar senha'">
                <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.controls.password.touched && form.controls.password.errors?.['required']) {
                <mat-error>Senha é obrigatória</mat-error>
              }
            </mat-form-field>

            <div class="form-row">
              <mat-checkbox formControlName="rememberMe" color="primary">
                Lembrar por 30 dias
              </mat-checkbox>
              <!-- MVP: endpoint não existe ainda no backend -->
              <!-- <a routerLink="/forgot-password" class="forgot-link">Esqueci minha senha</a> -->
            </div>

            <button mat-flat-button type="submit"
                    class="submit-btn"
                    [disabled]="loading()">
              @if (loading()) {
                <mat-spinner diameter="20" color="accent"></mat-spinner>
                <span>Autenticando...</span>
              } @else {
                <ng-container>
                  <span>Entrar na plataforma</span>
                  <mat-icon>arrow_forward</mat-icon>
                </ng-container>
              }
            </button>

          </form>

          <p class="form-footer">
            Não tem acesso? <a href="#" (click)="$event.preventDefault()">Solicitar demonstração</a>
          </p>
        </div>
      </main>

      <p class="login-tagline">Monitoramento inteligente de licitações públicas</p>
    </div>
  `,
  styles: [`
    /* ── Shell ──────────────────────────────────────────────────────── */
    .auth-shell {
      display: flex;
      min-height: 100vh;
      background: var(--lf-bg, #0D1526);
      font-family: 'Inter Tight', sans-serif;
      position: relative;
    }

    .login-tagline {
      position: relative;
      z-index: 1;
      font-size: 13px;
      color: rgba(139, 155, 180, 0.7);
      margin-top: 16px;
      text-align: center;
      letter-spacing: 0.02em;
      align-self: flex-end;
      padding-bottom: 20px;
      width: 55%; /* aligns with the right panel */
      margin-left: auto;
    }

    /* ── Left panel ─────────────────────────────────────────────────── */
    .auth-brand {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 45%;
      flex-shrink: 0;
      background: linear-gradient(155deg, #0D1526 0%, #1E293B 60%, #0F2A1A 100%);
      overflow: hidden;

      @media (max-width: 900px) { display: none; }
    }

    .brand-inner {
      position: relative;
      z-index: 2;
      padding: 48px 52px;
      width: 100%;
      max-width: 520px;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 52px;
    }

    .logo-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #11BF7F, #0DA66E);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        color: white;
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      &.sm {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        mat-icon { font-size: 18px; width: 18px; height: 18px; }
      }
    }

    .logo-text {
      font-size: 22px;
      font-weight: 800;
      color: #F8FAFC;
      letter-spacing: -0.4px;
    }

    .brand-headline {
      margin-bottom: 44px;

      h1 {
        font-size: 32px;
        font-weight: 800;
        color: #F8FAFC;
        line-height: 1.25;
        letter-spacing: -0.5px;
        margin-bottom: 14px;
      }

      p {
        font-size: 15px;
        color: #94A3B8;
        line-height: 1.6;
      }
    }

    .brand-features {
      list-style: none;
      margin: 0 0 48px;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 20px;

      li {
        display: flex;
        align-items: flex-start;
        gap: 14px;
      }

      .feat-icon {
        width: 36px;
        height: 36px;
        background: rgba(16,185,129,0.12);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: #11BF7F;
        }
      }

      strong {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: #E2E8F0;
        margin-bottom: 2px;
      }

      span {
        font-size: 13px;
        color: #64748B;
        line-height: 1.4;
      }
    }

    .trust-badges {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;

      span {
        font-size: 12px;
        color: #475569;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 6px;
        padding: 5px 12px;
        font-weight: 500;
      }
    }

    /* Decorative elements */
    .brand-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 32px 32px;
      pointer-events: none;
    }

    .brand-glow {
      position: absolute;
      bottom: -80px;
      right: -80px;
      width: 320px;
      height: 320px;
      background: radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%);
      pointer-events: none;
    }

    /* ── Right panel ────────────────────────────────────────────────── */
    .auth-form-panel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      padding: 32px;
      position: relative;
      z-index: 1;

      @media (max-width: 480px) { padding: 24px 20px; align-items: flex-start; padding-top: 48px; }
    }

    .form-inner {
      width: 100%;
      max-width: 400px;
      background: rgba(16, 26, 46, 0.60) !important;
      border: 1px solid var(--lf-line, rgba(255,255,255,0.08)) !important;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      box-shadow: 0 18px 50px rgba(3, 8, 20, 0.45) !important;
      border-radius: 18px;
      padding: 36px 32px;
      position: relative;
      z-index: 1;
    }

    .mobile-logo {
      display: none;
      align-items: center;
      gap: 10px;
      margin-bottom: 32px;
      font-size: 18px;
      font-weight: 700;
      color: #e8eef7;

      @media (max-width: 900px) { display: flex; }
    }

    .form-header {
      margin-bottom: 28px;

      h2 {
        font-size: 26px;
        font-weight: 800;
        color: #e8eef7 !important;
        letter-spacing: -0.4px;
        margin-bottom: 6px;
      }

      p {
        font-size: 14px;
        color: #8b9bb4 !important;
      }
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 20px;
      font-size: 13px;
      color: #B91C1C;

      mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .full-width { width: 100%; }

      /* tighten up Material outline fields */
      ::ng-deep .mat-mdc-form-field {
        .mat-mdc-text-field-wrapper {
          border-radius: 8px !important;
        }
      }
    }

    .form-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 4px 0 20px;
    }

    .forgot-link {
      font-size: 13px;
      color: #0DA66E;
      text-decoration: none;
      font-weight: 500;
      &:hover { text-decoration: underline; }
    }

    .submit-btn {
      width: 100%;
      height: 48px;
      border-radius: 8px !important;
      font-size: 15px;
      font-weight: 600;
      background: linear-gradient(135deg, #0DA66E, #107357) !important;
      color: white !important;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 200ms ease;
      letter-spacing: 0.01em;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #107357, #1E40AF) !important;
        box-shadow: 0 4px 14px rgba(37,99,235,0.35);
        transform: translateY(-1px);
      }

      &:disabled {
        background: #94A3B8 !important;
        cursor: not-allowed;
      }

      mat-icon { font-size: 20px; width: 20px; height: 20px; }
      mat-spinner { margin: 0; }
    }

    .form-footer {
      text-align: center;
      margin-top: 24px;
      font-size: 13px;
      color: #8b9bb4;

      a {
        color: #11BF7F;
        text-decoration: none;
        font-weight: 600;
        &:hover { text-decoration: underline; }
      }
    }

    /* Material checkbox label color in dark context */
    ::ng-deep .form-inner .mdc-label {
      color: #8b9bb4 !important;
    }
    /* Material input label + text color in dark glassmorphism */
    ::ng-deep .form-inner .mat-mdc-form-field .mdc-floating-label {
      color: rgba(139, 155, 180, 0.75) !important;
    }
    ::ng-deep .form-inner .mat-mdc-form-field input.mat-mdc-input-element {
      color: #e8eef7 !important;
    }
    /* Input outline borders */
    ::ng-deep .form-inner .mdc-notched-outline__leading,
    ::ng-deep .form-inner .mdc-notched-outline__notch,
    ::ng-deep .form-inner .mdc-notched-outline__trailing {
      border-color: rgba(141, 166, 200, 0.3) !important;
    }
    ::ng-deep .form-inner .mat-mdc-form-field:hover .mdc-notched-outline__leading,
    ::ng-deep .form-inner .mat-mdc-form-field:hover .mdc-notched-outline__notch,
    ::ng-deep .form-inner .mat-mdc-form-field:hover .mdc-notched-outline__trailing {
      border-color: rgba(141, 166, 200, 0.55) !important;
    }
    ::ng-deep .form-inner .mat-mdc-form-field.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .form-inner .mat-mdc-form-field.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .form-inner .mat-mdc-form-field.mat-focused .mdc-notched-outline__trailing {
      border-color: var(--brand-primary, #11BF7F) !important;
    }
    /* Prefix icons in dark bg */
    ::ng-deep .form-inner .mat-mdc-form-field mat-icon[matPrefix] {
      color: rgba(139, 155, 180, 0.6) !important;
    }
    /* Suffix icon button */
    ::ng-deep .form-inner .mat-mdc-icon-button mat-icon {
      color: rgba(139, 155, 180, 0.6) !important;
    }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  loading = signal(false);
  errorMsg = signal<string | null>(null);
  showPass = signal(false);

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMsg.set(null);

    const { email, password } = this.form.value;
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.loading.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/leads';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err: Error) => {
        this.errorMsg.set(err.message);
        this.loading.set(false);
      },
    });
  }
}
