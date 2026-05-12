import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacoesService } from '../../../core/services/notificacoes.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatBadgeModule,
  ],
  template: `
    <div class="app-shell" [class.collapsed]="collapsed()">

      <!-- ── Sidebar ──────────────────────────────────────────────── -->
      <aside class="sidebar" [class.mobile-open]="mobileOpen()">

        <!-- Logo -->
        <div class="sidebar-logo">
          <div class="logo-mark">
            <mat-icon>gavel</mat-icon>
          </div>
          @if (!collapsed()) {
            <span class="logo-name">LicitaFlow</span>
          }
          <button class="collapse-btn hide-mobile"
                  (click)="collapsed.set(!collapsed())"
                  [matTooltip]="collapsed() ? 'Expandir menu' : 'Recolher menu'"
                  matTooltipPosition="right">
            <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="sidebar-nav">
          @for (section of navSections; track section.label) {
            <div class="nav-section">
              @if (!collapsed()) {
                <span class="nav-section-label">{{ section.label }}</span>
              }
              @for (item of section.items; track item.route) {
                <a class="nav-item"
                   [routerLink]="item.route"
                   routerLinkActive="active"
                   (click)="mobileOpen.set(false)"
                   [matTooltip]="collapsed() ? item.label : ''"
                   matTooltipPosition="right">
                  <mat-icon class="nav-icon nav-icon-anim">{{ item.icon }}</mat-icon>
                  @if (!collapsed()) {
                    <span class="nav-label">{{ item.label }}</span>
                    @if (item.badge && item.badge > 0) {
                      <span class="nav-badge badge-enter">{{ item.badge }}</span>
                    }
                  } @else if (item.badge && item.badge > 0) {
                    <span class="nav-badge-dot badge-enter"></span>
                  }
                </a>
              }
            </div>
          }
        </nav>

        <!-- Footer -->
        <div class="sidebar-footer">
          <div class="sidebar-divider"></div>
          <a class="nav-item"
             routerLink="/configuracoes"
             routerLinkActive="active"
             (click)="mobileOpen.set(false)"
             [matTooltip]="collapsed() ? 'Configurações' : ''"
             matTooltipPosition="right">
            <mat-icon class="nav-icon">settings</mat-icon>
            @if (!collapsed()) {
              <span class="nav-label">Configurações</span>
            }
          </a>

          <div class="user-card" [matMenuTriggerFor]="userMenu"
               [matTooltip]="collapsed() ? (auth.currentUser()?.name ?? '') : ''"
               matTooltipPosition="right">
            <div class="user-avatar">{{ auth.userInitials() }}</div>
            @if (!collapsed()) {
              <div class="user-info">
                <span class="user-name">{{ auth.currentUser()?.name }}</span>
                <span class="user-role">{{ auth.currentUser()?.role }}</span>
              </div>
              <mat-icon class="user-chevron">unfold_more</mat-icon>
            }
          </div>
        </div>
      </aside>

      <!-- Mobile overlay -->
      @if (mobileOpen()) {
        <div class="sidebar-overlay" (click)="mobileOpen.set(false)"></div>
      }

      <!-- ── Main area ─────────────────────────────────────────────── -->
      <div class="main-area">

        <!-- Top bar -->
        <header class="topbar">
          <div class="topbar-left">
            <!-- Mobile hamburger -->
            <button class="icon-btn show-mobile" (click)="mobileOpen.set(!mobileOpen())">
              <mat-icon>menu</mat-icon>
            </button>

            <!-- Search -->
            <div class="search-bar hide-mobile">
              <mat-icon class="search-icon">search</mat-icon>
              <input type="text"
                     placeholder="Buscar editais, órgãos, objetos..."
                     class="search-input" />
              <kbd class="search-kbd">⌘K</kbd>
            </div>
          </div>

          <div class="topbar-right">
            <button class="icon-btn hide-mobile"
                    matTooltip="Central de ajuda">
              <mat-icon>help_outline</mat-icon>
            </button>

            <button class="icon-btn notif-btn" matTooltip="Notificações" routerLink="/notificacoes">
              @if (notifSvc.novas() > 0) {
                <span class="radar-ring" style="width:24px;height:24px;top:6px;left:6px;"></span>
                <span class="radar-ring" style="width:24px;height:24px;top:6px;left:6px;"></span>
                <span class="radar-ring" style="width:24px;height:24px;top:6px;left:6px;"></span>
              }
              <mat-icon [matBadge]="notifSvc.novas() > 0 ? notifSvc.novas() : null"
                        matBadgeColor="warn"
                        matBadgeSize="small"
                        aria-hidden="false">notifications_none</mat-icon>
              @if (notifSvc.novas() === 0) {
                <span class="notif-dot"></span>
              }
            </button>

            <div class="header-avatar" [matMenuTriggerFor]="userMenu">
              {{ auth.userInitials() }}
            </div>
          </div>
        </header>

        <!-- Page content -->
        <main class="page-content">
          <router-outlet />
        </main>
      </div>
    </div>

    <!-- User dropdown menu -->
    <mat-menu #userMenu="matMenu" class="user-dropdown">
      <div class="user-menu-header">
        <div class="user-menu-avatar">{{ auth.userInitials() }}</div>
        <div>
          <div class="user-menu-name">{{ auth.currentUser()?.name }}</div>
          <div class="user-menu-email">{{ auth.currentUser()?.email }}</div>
        </div>
      </div>
      <mat-divider></mat-divider>
      <button mat-menu-item>
        <mat-icon>person_outline</mat-icon>
        Meu Perfil
      </button>
      <button mat-menu-item>
        <mat-icon>business</mat-icon>
        Empresa
      </button>
      <button mat-menu-item>
        <mat-icon>credit_card</mat-icon>
        Plano e Faturamento
      </button>
      <mat-divider></mat-divider>
      <button mat-menu-item class="logout-item" (click)="auth.logout()">
        <mat-icon>logout</mat-icon>
        Sair da conta
      </button>
    </mat-menu>
  `,
  styles: [`
    /* ── Shell ──────────────────────────────────────────────────────── */
    .app-shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--content-bg, #F1F5F9);
    }

    /* ── Sidebar ─────────────────────────────────────────────────────── */
    .sidebar {
      width: var(--sidebar-width, 240px);
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--sidebar-bg, #0F172A);
      border-right: 1px solid var(--sidebar-border, rgba(255,255,255,0.06));
      overflow: hidden;
      transition: width 200ms ease;
      position: relative;
      z-index: 50;
    }

    .app-shell.collapsed .sidebar {
      width: var(--sidebar-collapsed, 64px);
    }

    /* Mobile sidebar */
    @media (max-width: 767px) {
      .sidebar {
        position: fixed;
        left: 0; top: 0; bottom: 0;
        transform: translateX(-100%);
        transition: transform 200ms ease;
        width: var(--sidebar-width, 240px) !important;
        z-index: 200;
      }
      .sidebar.mobile-open { transform: translateX(0); }
    }

    .sidebar-overlay {
      display: none;
      @media (max-width: 767px) {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        z-index: 199;
        backdrop-filter: blur(2px);
      }
    }

    /* ── Logo ────────────────────────────────────────────────────────── */
    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 18px 16px;
      border-bottom: 1px solid var(--sidebar-border, rgba(255,255,255,0.06));
      min-height: 65px;
      flex-shrink: 0;
    }

    .logo-mark {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #10B981, #059669);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: white;
      }
    }

    .logo-name {
      font-size: 16px;
      font-weight: 800;
      color: #F8FAFC;
      letter-spacing: -0.3px;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
    }

    .collapse-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      color: var(--sidebar-icon, #64748B);
      display: flex;
      align-items: center;
      transition: all 150ms ease;
      margin-left: auto;
      flex-shrink: 0;

      &:hover {
        background: var(--sidebar-hover-bg, rgba(255,255,255,0.06));
        color: var(--sidebar-text, #94A3B8);
      }

      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    /* ── Navigation ──────────────────────────────────────────────────── */
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 8px 0;

      &::-webkit-scrollbar { width: 0; }
    }

    .nav-section {
      padding: 0 8px;
      margin-bottom: 4px;
    }

    .nav-section-label {
      display: block;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--sidebar-section-label, #475569);
      padding: 12px 10px 4px;
      white-space: nowrap;
      overflow: hidden;
    }

    @keyframes nav-icon-bounce {
      0%, 100% { transform: translateY(0); }
      35%       { transform: translateY(-4px); }
      65%       { transform: translateY(-1px); }
    }
    @keyframes nav-icon-wiggle {
      0%, 100% { transform: rotate(0deg); }
      20%       { transform: rotate(-14deg); }
      45%       { transform: rotate(12deg); }
      65%       { transform: rotate(-7deg); }
      85%       { transform: rotate(4deg); }
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 8px;
      text-decoration: none;
      color: var(--sidebar-text, #94A3B8);
      font-size: 13.5px;
      font-weight: 500;
      transition: all 150ms ease;
      cursor: pointer;
      position: relative;
      margin-bottom: 1px;
      white-space: nowrap;
      overflow: hidden;

      &:hover {
        background: var(--sidebar-hover-bg, rgba(255,255,255,0.04));
        color: var(--sidebar-text-hover, #CBD5E1);

        .nav-icon { color: var(--sidebar-text-hover, #CBD5E1); }
        .nav-icon-anim { animation: nav-icon-bounce 0.55s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
      }

      &.active {
        background: var(--sidebar-active-bg, rgba(16,185,129,0.10));
        color: var(--sidebar-text-active, #F8FAFC);

        .nav-icon { color: var(--sidebar-icon-active, #10B981); }

        &::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 6px;
          bottom: 6px;
          width: 3px;
          background: var(--sidebar-active-line, #10B981);
          border-radius: 0 2px 2px 0;
        }
      }
    }

    .nav-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--sidebar-icon, #64748B);
      transition: color 150ms ease;
      flex-shrink: 0;
    }

    .nav-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nav-badge {
      background: #EF4444;
      color: white;
      font-size: 10px;
      font-weight: 700;
      border-radius: 10px;
      padding: 1px 6px;
      min-width: 18px;
      text-align: center;
      flex-shrink: 0;
    }

    .nav-badge-dot {
      width: 7px;
      height: 7px;
      background: #EF4444;
      border-radius: 50%;
      position: absolute;
      right: 8px;
      top: 8px;
    }

    /* ── Footer ──────────────────────────────────────────────────────── */
    .sidebar-footer {
      flex-shrink: 0;
      padding: 0 8px 12px;
    }

    .sidebar-divider {
      height: 1px;
      background: var(--sidebar-border, rgba(255,255,255,0.06));
      margin: 8px 2px 10px;
    }

    .user-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 150ms ease;
      margin-top: 4px;

      &:hover { background: var(--sidebar-hover-bg, rgba(255,255,255,0.04)); }
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #2563EB, #1D4ED8);
      color: white;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-info {
      flex: 1;
      overflow: hidden;
      min-width: 0;
    }

    .user-name {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #E2E8F0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      display: block;
      font-size: 11px;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }

    .user-chevron {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #475569;
      flex-shrink: 0;
    }

    /* ── Main Area ───────────────────────────────────────────────────── */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      min-width: 0;
    }

    /* ── Top Bar ─────────────────────────────────────────────────────── */
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: var(--header-height, 64px);
      background: var(--header-bg, #FFFFFF);
      border-bottom: 1px solid var(--header-border, #E2E8F0);
      flex-shrink: 0;
      gap: 16px;

      @media (max-width: 767px) { padding: 0 16px; }
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .search-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 6px 12px;
      max-width: 400px;
      width: 100%;
      transition: border-color 150ms;

      &:focus-within {
        border-color: #2563EB;
        background: white;
        box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
      }
    }

    .search-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #94A3B8;
      flex-shrink: 0;
    }

    .search-input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 13.5px;
      color: #0F172A;
      font-family: inherit;
      flex: 1;
      min-width: 0;

      &::placeholder { color: #94A3B8; }
    }

    .search-kbd {
      font-size: 11px;
      color: #94A3B8;
      background: #E2E8F0;
      border-radius: 4px;
      padding: 1px 5px;
      flex-shrink: 0;
      font-family: monospace;
    }

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
      color: #64748B;
      transition: all 150ms ease;
      position: relative;

      &:hover {
        background: #F1F5F9;
        color: #0F172A;
      }

      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }

    .notif-btn { position: relative; overflow: visible; }

    .notif-dot {
      position: absolute;
      top: 7px;
      right: 7px;
      width: 7px;
      height: 7px;
      background: #EF4444;
      border-radius: 50%;
      border: 1.5px solid white;
    }

    .header-avatar {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: linear-gradient(135deg, #2563EB, #1D4ED8);
      color: white;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 150ms ease;

      &:hover {
        transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(37,99,235,0.4);
      }
    }

    /* ── Page Content ────────────────────────────────────────────────── */
    .page-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }

    /* ── Global utilities ────────────────────────────────────────────── */
    .hide-mobile { @media (max-width: 767px) { display: none !important; } }
    .show-mobile { display: none; @media (max-width: 767px) { display: flex !important; } }

    /* ── User dropdown custom ────────────────────────────────────────── */
    ::ng-deep .user-dropdown {
      .mat-mdc-menu-content { padding: 0; }
    }

    .user-menu-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
    }

    .user-menu-avatar {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: linear-gradient(135deg, #2563EB, #1D4ED8);
      color: white;
      font-size: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-menu-name {
      font-size: 14px;
      font-weight: 600;
      color: #0F172A;
    }

    .user-menu-email {
      font-size: 12px;
      color: #94A3B8;
    }

    ::ng-deep .logout-item {
      color: #EF4444 !important;
      mat-icon { color: #EF4444 !important; }
    }
  `],
})
export class MainLayoutComponent implements OnInit {
  auth = inject(AuthService);
  notifSvc = inject(NotificacoesService);

  collapsed = signal(false);
  mobileOpen = signal(false);

  navSections: NavSection[] = [
    {
      label: 'Principal',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
        { label: 'Pipeline', icon: 'view_kanban', route: '/pipeline' },
        { label: 'Leads', icon: 'list_alt', route: '/leads' },
        { label: 'Editais', icon: 'description', route: '/editais', badge: 3 },
        { label: 'Notificações', icon: 'notifications', route: '/notificacoes' },
      ],
    },
    {
      label: 'Ferramentas IA',
      items: [
        { label: 'Impugnação', icon: 'gavel', route: '/impugnacao' },
        { label: 'Assistente IA', icon: 'smart_toy', route: '/assistente' },
      ],
    },
    {
      label: 'Configurações',
      items: [
        { label: 'Regras de Análise', icon: 'rule', route: '/regras' },
        { label: 'Config. DODF', icon: 'article', route: '/dodf/configuracao' },
        { label: 'Relatórios', icon: 'bar_chart', route: '/relatorios' },
      ],
    },
  ];

  ngOnInit(): void {
    this.notifSvc.startSSE();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    // ⌘K or Ctrl+K to focus search
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      const input = document.querySelector<HTMLInputElement>('.search-input');
      input?.focus();
    }
  }
}
