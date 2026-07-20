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
import { EditaisClassificacoesComponent } from '../editais/classificacoes/editais-classificacoes.component';
import { environment } from '../../../environments/environment';
import { BuscaPrefsDto, NotificaoPrefsDto } from '../../core/models/user-preferences.model';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    DodfConfiguracaoComponent,
    DouConfiguracaoComponent,
    PncpConfiguracaoComponent,
    EditaisClassificacoesComponent,
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
                  <input matInput [(ngModel)]="perfilNome" name="nome" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Função / cargo</mat-label>
                  <input matInput [(ngModel)]="perfilFuncao" name="funcao" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Empresa</mat-label>
                  <input matInput [(ngModel)]="perfilEmpresa" name="empresa" />
                </mat-form-field>
              </div>

              <div class="card-actions">
                <button
                  mat-flat-button
                  class="btn-primary"
                  (click)="salvarPerfil()"
                  [disabled]="salvandoPerfil()"
                >
                  @if (salvandoPerfil()) {
                    <mat-spinner diameter="16" />
                  } @else {
                    Salvar alterações
                  }
                </button>
                <button mat-button class="btn-tour" (click)="reiniciarTour()">
                  <mat-icon>help_outline</mat-icon> Refazer tour
                </button>
              </div>
            </div>

            <div class="cfg-card">
              <div class="card-header">
                <div class="card-title">Segurança</div>
                <div class="card-sub">Altere sua senha de acesso</div>
              </div>
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Senha atual</mat-label>
                  <input matInput type="password" [(ngModel)]="senhaAtual" name="senhaAtual" />
                  <mat-icon matSuffix>lock_outline</mat-icon>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Nova senha</mat-label>
                  <input
                    matInput
                    type="password"
                    [(ngModel)]="senhaNova"
                    name="senhaNova"
                    minlength="8"
                  />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Confirmar nova senha</mat-label>
                  <input matInput type="password" [(ngModel)]="senhaConfirm" name="senhaConfirm" />
                </mat-form-field>
              </div>
              @if (erroSenha()) {
                <div class="inline-error">{{ erroSenha() }}</div>
              }
              <div class="card-actions">
                <button
                  mat-flat-button
                  class="btn-primary"
                  (click)="trocarSenha()"
                  [disabled]="salvandoSenha()"
                >
                  @if (salvandoSenha()) {
                    <mat-spinner diameter="16" />
                  } @else {
                    Alterar senha
                  }
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
                  <span class="toggle-desc"
                    >Alerta quando um lead acima do score mínimo é salvo</span
                  >
                </div>
                <mat-slide-toggle
                  color="primary"
                  [(ngModel)]="notificacaoPrefs.novoLead"
                  (change)="salvarNotificacaoPrefs()"
                >
                </mat-slide-toggle>
              </div>
              <mat-divider></mat-divider>
              <div class="toggle-row">
                <div class="toggle-info">
                  <span class="toggle-label">Busca concluída</span>
                  <span class="toggle-desc">
                    Resumo ao final de cada coleta de leads
                    <em class="not-wired"
                      >— ainda não dispara notificação (em construção no backend)</em
                    >
                  </span>
                </div>
                <mat-slide-toggle
                  color="primary"
                  [(ngModel)]="notificacaoPrefs.buscaConcluida"
                  (change)="salvarNotificacaoPrefs()"
                >
                </mat-slide-toggle>
              </div>
              <mat-divider></mat-divider>

              <div class="slider-row">
                <span class="toggle-label">Score mínimo para notificar</span>
                <div class="slider-wrap">
                  <mat-slider min="0" max="100" step="5" class="full-slider">
                    <input
                      matSliderThumb
                      [(ngModel)]="notificacaoPrefs.score"
                      (change)="salvarNotificacaoPrefs()"
                    />
                  </mat-slider>
                  <span class="slider-value">{{ notificacaoPrefs.score }}</span>
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

              <p class="not-wired-banner">
                Estas preferências ainda não são lidas por nenhum fluxo de coleta — são só salvas
                por ora (em construção no backend).
              </p>

              <div class="field-group">
                <span class="field-label">Fontes padrão</span>
                <mat-chip-listbox
                  multiple
                  [(ngModel)]="buscaPrefs.fontesPadrao"
                  (change)="salvarBuscaPrefs()"
                >
                  @for (f of fontesDisponiveis; track f) {
                    <mat-chip-option [value]="f">{{ f }}</mat-chip-option>
                  }
                </mat-chip-listbox>
              </div>

              <mat-divider></mat-divider>

              <div class="field-group">
                <span class="field-label">Modo de data padrão</span>
                <div class="radio-group">
                  <label
                    class="radio-opt"
                    [class.selected]="buscaPrefs.dataBuscaPadrao === 'DIA_UNICO'"
                    (click)="buscaPrefs.dataBuscaPadrao = 'DIA_UNICO'; salvarBuscaPrefs()"
                  >
                    <span class="radio-dot"></span> Dia único
                  </label>
                  <label
                    class="radio-opt"
                    [class.selected]="buscaPrefs.dataBuscaPadrao === 'PERIODO'"
                    (click)="buscaPrefs.dataBuscaPadrao = 'PERIODO'; salvarBuscaPrefs()"
                  >
                    <span class="radio-dot"></span> Período
                  </label>
                </div>
              </div>

              <mat-divider></mat-divider>

              <div class="field-group">
                <span class="field-label">Período padrão (dias)</span>
                <div class="slider-wrap">
                  <mat-slider min="1" max="30" step="1" class="full-slider">
                    <input
                      matSliderThumb
                      [(ngModel)]="buscaPrefs.periodoDias"
                      (change)="salvarBuscaPrefs()"
                    />
                  </mat-slider>
                  <span class="slider-value">{{ buscaPrefs.periodoDias }}d</span>
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
              <div class="sessao-item">
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

        <!-- TAB: Auditoria de Classificação (admin) -->
        @if (auth.isAdmin()) {
          <mat-tab label="Auditoria">
            <div class="tab-content">
              <div class="cfg-card cfg-card-fonte">
                <div class="card-header">
                  <div class="card-title">Auditoria de Classificação</div>
                  <div class="card-sub">
                    Revisão manual de editais PNCP descartados pelo filtro de keyword
                  </div>
                </div>
                <app-editais-classificacoes [embedded]="true" />
              </div>
            </div>
          </mat-tab>
        }
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .cfg-shell {
        padding: 30px;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-content: center;
        max-width: 1000px;
      }
      .cfg-header {
        margin-bottom: 4px;
      }
      .cfg-header h1 {
        font-size: 22px;
        font-weight: 700;
        color: var(--text-primary, #0d1526);
        margin: 0 0 16px;
      }

      ::ng-deep .cfg-tabs {
        .mat-mdc-tab-header {
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 0;
        }
        .mat-mdc-tab .mdc-tab__text-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted, #64748b);
        }
        .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label {
          color: var(--text-primary, #0d1526);
        }
        .mdc-tab-indicator__content--underline {
          border-color: #11bf7f;
        }
      }

      .tab-content {
        padding: 20px 0;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .cfg-card {
        background: var(--card-bg, #fff);
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px 24px;
      }
      .cfg-card-fonte {
        padding: 20px 0;
        border: none;
        background: transparent;
      }

      .card-header {
        margin-bottom: 16px;
      }
      .card-title {
        font-size: 15px;
        font-weight: 700;
        color: var(--text-primary, #0d1526);
      }
      .card-sub {
        font-size: 13px;
        color: var(--text-muted, #64748b);
        margin-top: 2px;
      }

      .perfil-avatar-row {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid #f1f5f9;
      }
      .perfil-avatar {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        flex-shrink: 0;
        background: linear-gradient(135deg, #0da66e, #107357);
        color: #fff;
        font-size: 16px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .perfil-avatar-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .perfil-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary, #0d1526);
      }
      .perfil-email {
        font-size: 12px;
        color: var(--text-muted, #64748b);
      }
      .perfil-role {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #11bf7f;
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px 16px;
        mat-form-field {
          width: 100%;
        }
        @media (max-width: 600px) {
          grid-template-columns: 1fr;
        }
      }

      .card-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 16px;
        flex-wrap: wrap;
      }
      .btn-primary {
        background: #0d1526;
        color: #fff;
        font-size: 13px;
        font-weight: 600;
        border-radius: 8px;
        height: 38px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .btn-tour {
        font-size: 13px;
        color: var(--text-muted, #64748b);
      }

      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 0;
        gap: 16px;
      }
      .toggle-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .toggle-label {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary, #0d1526);
      }
      .toggle-desc {
        font-size: 12px;
        color: var(--text-muted, #64748b);
      }

      .slider-row {
        padding: 14px 0;
      }
      .slider-wrap {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 8px;
      }
      .full-slider {
        flex: 1;
      }
      .slider-value {
        font-size: 14px;
        font-weight: 700;
        color: var(--text-primary, #0d1526);
        min-width: 32px;
        text-align: right;
      }

      .field-group {
        padding: 14px 0;
      }
      .field-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: var(--text-secondary, #475569);
        margin-bottom: 10px;
      }

      .radio-group {
        display: flex;
        gap: 12px;
      }
      .radio-opt {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        font-size: 13px;
        color: var(--text-muted, #64748b);
        padding: 6px 12px;
        border-radius: 7px;
        border: 1.5px solid #e2e8f0;
        transition: all 150ms;
        &.selected {
          border-color: #11bf7f;
          color: #0da66e;
          background: rgba(17, 191, 127, 0.06);
        }
      }
      .radio-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid currentColor;
        .selected & {
          background: currentColor;
        }
      }

      .sessao-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid #f1f5f9;
      }
      .sessao-icon {
        color: var(--text-muted, #64748b);
      }
      .sessao-info {
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      .sessao-nome {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary, #0d1526);
      }
      .sessao-detalhe {
        font-size: 12px;
        color: var(--text-muted, #64748b);
      }
      .sessao-badge {
        font-size: 10px;
        font-weight: 700;
        background: rgba(17, 191, 127, 0.12);
        color: #0da66e;
        padding: 2px 8px;
        border-radius: 5px;
        text-transform: uppercase;
      }

      .not-wired {
        display: block;
        font-style: normal;
        font-size: 11px;
        color: #b45309;
        margin-top: 2px;
      }
      .not-wired-banner {
        font-size: 12px;
        color: #b45309;
        background: #fffbeb;
        border: 1px solid #fde68a;
        border-radius: 8px;
        padding: 8px 12px;
        margin: 0 0 4px;
      }

      .inline-error {
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        padding: 10px 14px;
        font-size: 13px;
        color: #dc2626;
        margin-top: 8px;
      }

      .pending-feature {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px;
        background: var(--content-bg, #f8fafc);
        border-radius: 8px;
        margin-top: 12px;
        mat-icon {
          color: var(--text-muted, #94a3b8);
          font-size: 20px;
          flex-shrink: 0;
          margin-top: 1px;
        }
        strong {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary, #475569);
        }
        span {
          font-size: 12px;
          color: var(--text-muted, #94a3b8);
        }
      }
    `,
  ],
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
  buscaPrefs!: BuscaPrefsDto;
  notificacaoPrefs!: NotificaoPrefsDto;

  ngOnInit(): void {
    const u = this.auth.currentUser();
    this.perfilNome = u?.name ?? '';
    this.perfilFuncao = u?.funcao ?? '';
    this.perfilEmpresa = u?.company ?? '';
    this.buscaPrefs = { ...this.prefsSvc.busca() };
    this.notificacaoPrefs = { ...this.prefsSvc.notificacao() };
    this.prefsSvc.loadBusca().subscribe((p) => (this.buscaPrefs = { ...p }));
    this.prefsSvc.loadNotificacao().subscribe((p) => (this.notificacaoPrefs = { ...p }));
  }

  salvarPerfil(): void {
    const userId = this.auth.currentUser()?.uuid;
    if (!userId) return;
    this.salvandoPerfil.set(true);
    this.http
      .put(`${environment.apiUrl}/auth/${userId}/update-dados`, {
        // Backend faz .isBlank() sem checar null primeiro (NPE -> 500) — nunca mandar null aqui.
        username: this.perfilNome ?? '',
        funcao: this.perfilFuncao ?? '',
        empresa: this.perfilEmpresa ?? '',
      })
      .subscribe({
        next: () => {
          this.salvandoPerfil.set(false);
          this.auth.updateCachedProfile({
            name: this.perfilNome,
            funcao: this.perfilFuncao,
            company: this.perfilEmpresa,
          });
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
    if (!this.senhaAtual) {
      this.erroSenha.set('Informe sua senha atual.');
      return;
    }
    if (this.senhaNova.length < 8) {
      this.erroSenha.set('Nova senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (this.senhaNova !== this.senhaConfirm) {
      this.erroSenha.set('As senhas não coincidem.');
      return;
    }
    const userId = this.auth.currentUser()?.uuid;
    if (!userId) return;
    this.salvandoSenha.set(true);
    this.http
      .put(`${environment.apiUrl}/auth/${userId}/update-password`, {
        password: this.senhaNova,
        oldpassword: this.senhaAtual,
      })
      .subscribe({
        next: () => {
          this.salvandoSenha.set(false);
          this.senhaAtual = '';
          this.senhaNova = '';
          this.senhaConfirm = '';
          this.snackBar.open('Senha alterada com sucesso', 'OK', { duration: 3000 });
        },
        error: (e) => {
          this.salvandoSenha.set(false);
          if (e.status === 400) this.erroSenha.set('Senha atual incorreta.');
          else this.erroSenha.set('Erro ao alterar senha. Tente novamente.');
        },
      });
  }

  salvarBuscaPrefs(): void {
    this.prefsSvc.saveBusca(this.buscaPrefs).subscribe();
  }

  salvarNotificacaoPrefs(): void {
    this.prefsSvc.saveNotificacao(this.notificacaoPrefs).subscribe();
  }

  reiniciarTour(): void {
    // Não existe campo tourCompleted em nenhum DTO real do backend — o reset é 100% local.
    localStorage.removeItem('lf_tour_done');
    this.snackBar.open('Tour reiniciado — recarregue a página', 'OK', { duration: 4000 });
  }
}
