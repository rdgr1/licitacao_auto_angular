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
      error: () => { this.enviado.set(true); this.loading.set(false); }, // security: don't reveal if email exists
    });
  }
}
