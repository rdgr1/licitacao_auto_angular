import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';
import { DodfConfiguracaoComponent } from '../dodf/configuracao/dodf-configuracao.component';
import { DouConfiguracaoComponent } from '../dou/configuracao/dou-configuracao.component';
import { PncpConfiguracaoComponent } from '../pncp/configuracao/pncp-configuracao.component';

type Section = 'perfil' | 'dodf' | 'dou' | 'pncp';

interface NavItem {
  id: Section;
  label: string;
  icon: string;
  group?: string;
}

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, DodfConfiguracaoComponent, DouConfiguracaoComponent, PncpConfiguracaoComponent],
  template: `
    <div class="cfg-shell">

      <!-- ── Sidebar ──────────────────────────────────────────────── -->
      <aside class="cfg-sidebar">
        <div class="cfg-sidebar-header">
          <h1 class="cfg-title">Configurações</h1>
        </div>

        <nav class="cfg-nav">
          @for (item of navItems; track item.id) {
            @if (item.group) {
              <span class="nav-group-label">{{ item.group }}</span>
            }
            <button class="nav-item" [class.active]="active() === item.id"
                    (click)="active.set(item.id)">
              <mat-icon>{{ item.icon }}</mat-icon>
              <span>{{ item.label }}</span>
            </button>
          }
        </nav>
      </aside>

      <!-- ── Conteúdo ─────────────────────────────────────────────── -->
      <main class="cfg-content">

        <!-- Meu Perfil -->
        @if (active() === 'perfil') {
          <div class="cfg-page">
            <div class="cfg-page-header">
              <h2>Meu Perfil</h2>
              <p>Informações da sua conta</p>
            </div>

            <div class="profile-block">
              <div class="profile-avatar">{{ auth.userInitials() }}</div>
              <div>
                <span class="profile-name">{{ auth.currentUser()?.name }}</span>
                <span class="profile-role">{{ auth.currentUser()?.role }}</span>
              </div>
            </div>

            <div class="info-table">
              <div class="info-row">
                <span class="info-label">E-mail</span>
                <span class="info-value">{{ auth.currentUser()?.email }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Função</span>
                <span class="info-value">{{ auth.currentUser()?.role }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Empresa</span>
                <span class="info-value">{{ auth.currentUser()?.company ?? '—' }}</span>
              </div>
            </div>

            <div class="pending-feature">
              <mat-icon>lock_outline</mat-icon>
              <div>
                <strong>Alterar senha e foto de perfil</strong>
                <span>Em desenvolvimento</span>
              </div>
            </div>
          </div>
        }

        <!-- Config DODF -->
        @if (active() === 'dodf') {
          <div class="cfg-page">
            <div class="cfg-page-header">
              <h2>Configuração DODF</h2>
              <p>Keywords e tipos de abertura usados na coleta do Diário Oficial do DF</p>
            </div>
            <app-dodf-configuracao [embedded]="true" />
          </div>
        }

        <!-- Config PNCP -->
        @if (active() === 'pncp') {
          <div class="cfg-page pncp-wrap">
            <div class="cfg-page-header">
              <h2>Configuração PNCP</h2>
              <p>Modalidades e UFs monitoradas no Portal Nacional de Contratações Públicas</p>
            </div>
            <app-pncp-configuracao [embedded]="true" />
          </div>
        }

        <!-- Config DOU -->
        @if (active() === 'dou') {
          <div class="cfg-page">
            <div class="cfg-page-header">
              <h2>Configuração DOU</h2>
              <p>Keywords, tipos de artigo e regiões usadas na coleta do Diário Oficial da União</p>
            </div>
            <app-dou-configuracao [embedded]="true" />
          </div>
        }

      </main>
    </div>
  `,
  styles: [`
    /* ── Shell ── */
    .cfg-shell {
      display: flex; height: 100%; overflow: hidden; background: #F8FAFC;
    }

    /* ── Sidebar ── */
    .cfg-sidebar {
      width: 200px; flex-shrink: 0;
      background: #fff; border-right: 1px solid #E2E8F0;
      display: flex; flex-direction: column; overflow-y: auto;
    }

    .cfg-sidebar-header {
      padding: 20px 16px 12px;
      border-bottom: 1px solid #F1F5F9;
    }

    .cfg-title {
      font-size: 13px; font-weight: 700; color: #0D1526;
      margin: 0; text-transform: uppercase; letter-spacing: 0.06em;
    }

    .cfg-nav {
      padding: 8px; display: flex; flex-direction: column; gap: 1px;
    }

    .nav-group-label {
      display: block; font-size: 10px; font-weight: 700; color: #94A3B8;
      text-transform: uppercase; letter-spacing: 0.07em;
      padding: 12px 8px 4px; margin: 0;
      font-family: var(--font-secondary);
    }

    .nav-item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 10px; border-radius: 7px; border: none;
      background: transparent; color: #64748B;
      font-size: 13px; font-weight: 500; font-family: inherit;
      cursor: pointer; transition: all 130ms; width: 100%; text-align: left;

      mat-icon {
        font-size: 16px; width: 16px; height: 16px; color: #94A3B8;
        flex-shrink: 0; transition: color 130ms;
      }

      &:hover {
        background: #F8FAFC; color: #0D1526;
        mat-icon { color: #475569; }
      }

      &.active {
        background: rgba(17,191,127,0.08); color: #059669; font-weight: 600;
        mat-icon { color: #11BF7F; }
      }
    }

    /* ── Content ── */
    .cfg-content {
      flex: 1; overflow-y: auto;
    }

    .cfg-page {
      max-width: 720px; padding: 28px 32px;
      display: flex; flex-direction: column; gap: 20px;
      @media (max-width: 767px) { padding: 16px; }
    }

    .cfg-page-header {
      h2 { font-size: 18px; font-weight: 700; color: #0D1526; margin: 0 0 3px; letter-spacing: -0.2px; }
      p  { font-size: 12.5px; color: #64748B; margin: 0; }
    }

    /* ── Profile ── */
    .profile-block {
      display: flex; align-items: center; gap: 14px;
      background: #fff; border: 1px solid #E2E8F0; border-radius: 11px; padding: 16px 18px;
    }

    .profile-avatar {
      width: 44px; height: 44px; border-radius: 11px; flex-shrink: 0;
      background: linear-gradient(135deg, #11BF7F, #0DA66E);
      color: #fff; font-size: 16px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }

    .profile-name {
      display: block; font-size: 15px; font-weight: 700; color: #0D1526;
    }
    .profile-role {
      display: block; font-size: 11px; color: #64748B;
      text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1px;
      font-family: var(--font-secondary);
    }

    /* ── Info table ── */
    .info-table {
      background: #fff; border: 1px solid #E2E8F0; border-radius: 11px; overflow: hidden;
    }

    .info-row {
      display: flex; align-items: center; padding: 12px 18px;
      border-bottom: 1px solid #F1F5F9;
      &:last-child { border-bottom: none; }
    }

    .info-label {
      width: 110px; flex-shrink: 0;
      font-size: 11px; font-weight: 700; color: #94A3B8;
      text-transform: uppercase; letter-spacing: 0.06em;
      font-family: var(--font-secondary);
    }

    .info-value {
      font-size: 13.5px; font-weight: 500; color: #1E293B;
    }

    /* ── Pending feature card ── */
    .pending-feature {
      display: flex; align-items: center; gap: 12px;
      background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 11px;
      padding: 14px 18px;

      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #94A3B8; flex-shrink: 0; }
      strong { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 1px; }
      span   { font-size: 11px; color: #94A3B8; font-family: var(--font-secondary); }
    }
  `]
})
export class ConfiguracoesComponent {
  auth = inject(AuthService);
  active = signal<Section>('perfil');

  navItems: NavItem[] = [
    { id: 'perfil', label: 'Meu Perfil',  icon: 'manage_accounts' },
    { id: 'dodf',   label: 'DODF',        icon: 'article',       group: 'Fontes de Coleta' },
    { id: 'dou',    label: 'DOU',         icon: 'library_books' },
    { id: 'pncp',   label: 'PNCP',        icon: 'public' },
  ];
}
