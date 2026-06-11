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
