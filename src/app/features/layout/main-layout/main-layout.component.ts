import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { routeFade } from '../../../shared/animations/app-animations';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacoesService } from '../../../core/services/notificacoes.service';
import { ColetaAndamentoService } from '../../../core/services/coleta-andamento.service';
import { NotificacaoEvent } from '../../../core/models/edital.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

interface NavSection {
  label: string;
  moduleKey: string;
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
  animations: [routeFade],
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
          @for (section of visibleSections(); track section.label) {
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

          </div>

          <div class="topbar-right">

            <!-- Indicador de coleta em andamento -->
            @if (coletaAndamento.ativa()) {
              <div class="coleta-pill" [routerLink]="['/leads']" matTooltip="Ver andamento da coleta">
                <span class="coleta-pill-dot"></span>
                <span class="coleta-pill-text">
                  Coletando {{ coletaAndamento.andamento().etapaAtual?.fonte ?? '' }}
                </span>
                @if (coletaAndamento.andamento().total > 1) {
                  <span class="coleta-pill-step">
                    {{ coletaAndamento.andamento().step }}/{{ coletaAndamento.andamento().total }}
                  </span>
                }
              </div>
            }

            <button class="icon-btn hide-mobile"
                    matTooltip="Central de ajuda">
              <mat-icon>help_outline</mat-icon>
            </button>

            <button class="icon-btn notif-btn" matTooltip="Notificações"
                    [matMenuTriggerFor]="notifMenu" (click)="openNotifMenu()">
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
        <main class="page-content" [@routeFade]="outlet.isActivated ? outlet.activatedRoute : ''">
          <router-outlet #outlet="outlet" />
        </main>
      </div>
    </div>

    <!-- Notification popup -->
    <mat-menu #notifMenu="matMenu" class="notif-popup" xPosition="before">
      <div class="notif-popup-header" (click)="$event.stopPropagation()">
        <span class="notif-popup-title">Notificações</span>
        @if (notifSvc.novas() > 0) {
          <button mat-icon-button class="notif-clear-btn"
                  (click)="notifSvc.clearNovas(); $event.stopPropagation()">
            <mat-icon>done_all</mat-icon>
          </button>
        }
      </div>
      <div class="notif-popup-list" (click)="$event.stopPropagation()">
        @if (notifHistorico().length === 0) {
          <div class="notif-popup-empty">
            <mat-icon>notifications_none</mat-icon>
            <span>Sem notificações recentes</span>
          </div>
        }
        @for (n of notifHistorico(); track n.editalId) {
          <div class="notif-popup-item">
            <div class="notif-score-chip" [class.hot]="(n.leadScore ?? 0) >= 70" [class.warm]="(n.leadScore ?? 0) >= 40 && (n.leadScore ?? 0) < 70">
              {{ n.leadScore ?? '–' }}
            </div>
            <div class="notif-popup-info">
              <span class="notif-popup-numero">{{ n.numero }}</span>
              <span class="notif-popup-objeto">{{ n.objeto }}</span>
              @if (n.categoria) {
                <span class="notif-popup-cat">{{ n.categoria }}</span>
              }
            </div>
          </div>
        }
      </div>
    </mat-menu>

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
      <button mat-menu-item [routerLink]="['/configuracoes']">
        <mat-icon>person_outline</mat-icon>
        Meu Perfil
      </button>
      <button mat-menu-item [routerLink]="['/configuracoes']">
        <mat-icon>settings</mat-icon>
        Configurações
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
      background: var(--sidebar-bg, #0D1526);
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
      background: linear-gradient(135deg, #11BF7F, #0DA66E);
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

        .nav-icon { color: var(--sidebar-icon-active, #11BF7F); }

        &::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 6px;
          bottom: 6px;
          width: 3px;
          background: var(--sidebar-active-line, #11BF7F);
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
      background: linear-gradient(135deg, #0DA66E, #107357);
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

    /* ── Coleta ao vivo pill ───────────────────────────────────────────── */
    @keyframes coleta-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(17,191,127,0.5); }
      50%       { box-shadow: 0 0 0 5px rgba(17,191,127,0); }
    }
    .coleta-pill {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 5px 12px 5px 9px; border-radius: 20px;
      background: rgba(17,191,127,0.10); border: 1.5px solid rgba(17,191,127,0.3);
      cursor: pointer; transition: background 150ms;
      &:hover { background: rgba(17,191,127,0.18); }
    }
    .coleta-pill-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #11BF7F; flex-shrink: 0;
      animation: coleta-pulse 1.6s ease-in-out infinite;
    }
    .coleta-pill-text {
      font-size: 12px; font-weight: 600; color: #0DA66E; white-space: nowrap;
    }
    .coleta-pill-step {
      font-size: 11px; font-weight: 700; color: #094; background: rgba(17,191,127,0.15);
      border-radius: 8px; padding: 1px 6px; white-space: nowrap;
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
        color: #0D1526;
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
      background: linear-gradient(135deg, #0DA66E, #107357);
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
      background: linear-gradient(135deg, #0DA66E, #107357);
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
      color: #0D1526;
    }

    .user-menu-email {
      font-size: 12px;
      color: #94A3B8;
    }

    ::ng-deep .logout-item {
      color: #EF4444 !important;
      mat-icon { color: #EF4444 !important; }
    }

    /* ── Notification popup ──────────────────────────────────────────── */
    ::ng-deep .notif-popup {
      .mat-mdc-menu-content { padding: 0; }
      min-width: 340px !important;
      max-width: 360px !important;
    }

    .notif-popup-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px 8px;
      border-bottom: 1px solid #E2E8F0;
    }

    .notif-popup-title {
      font-size: 14px;
      font-weight: 700;
      color: #0D1526;
    }

    .notif-clear-btn {
      width: 28px;
      height: 28px;
      mat-icon { font-size: 18px; color: #64748B; }
    }

    .notif-popup-list {
      max-height: 360px;
      overflow-y: auto;
      padding: 4px 0;

      &::-webkit-scrollbar { width: 4px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }
    }

    .notif-popup-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 24px 16px;
      color: #94A3B8;
      font-size: 13px;

      mat-icon { font-size: 28px; width: 28px; height: 28px; opacity: 0.5; }
    }

    .notif-popup-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 16px;
      border-bottom: 1px solid #F1F5F9;
      cursor: default;

      &:last-child { border-bottom: none; }
      &:hover { background: #F8FAFC; }
    }

    .notif-score-chip {
      min-width: 34px;
      height: 22px;
      border-radius: 6px;
      background: #E2E8F0;
      color: #475569;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;

      &.hot { background: rgba(16,185,129,0.15); color: #0DA66E; }
      &.warm { background: rgba(245,158,11,0.15); color: #D97706; }
    }

    .notif-popup-info {
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0;
    }

    .notif-popup-numero {
      font-size: 12px;
      font-weight: 600;
      color: #0D1526;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .notif-popup-objeto {
      font-size: 12px;
      color: #475569;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
    }

    .notif-popup-cat {
      font-size: 10px;
      font-weight: 600;
      color: #11BF7F;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 2px;
    }
  `],
})
export class MainLayoutComponent implements OnInit {
  auth = inject(AuthService);
  notifSvc = inject(NotificacoesService);
  readonly coletaAndamento = inject(ColetaAndamentoService);

  collapsed = signal(false);
  mobileOpen = signal(false);
  notifHistorico = signal<NotificacaoEvent[]>([]);

  navSections: NavSection[] = [
    {
      label: 'Licitações',
      moduleKey: 'licitacoes',
      items: [
        { label: 'Leads', icon: 'list_alt', route: '/leads' },
        { label: 'Pipeline', icon: 'view_kanban', route: '/pipeline' },
        { label: 'Editais', icon: 'description', route: '/editais' },
      ],
    },
    {
      label: 'Inteligência',
      moduleKey: 'inteligencia',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
        { label: 'Impugnação', icon: 'gavel', route: '/impugnacao' },
        { label: 'Assistente IA', icon: 'smart_toy', route: '/assistente' },
      ],
    },
    {
      label: 'Cotação',
      moduleKey: 'cotacao',
      items: [
        { label: 'Fornecedores', icon: 'storefront', route: '/cotacao/fornecedores' },
        { label: 'Itens', icon: 'inventory_2', route: '/cotacao/itens' },
      ],
    },
  ];

  readonly visibleSections = computed(() => {
    const enabled = this.auth.currentUser()?.enabledModules ?? ['licitacoes'];
    return this.navSections.filter(s => enabled.includes(s.moduleKey));
  });

  ngOnInit(): void {
    this.notifSvc.startSSE();
  }

  openNotifMenu(): void {
    this.notifSvc.clearNovas();
    this.notifSvc.getHistorico().subscribe({
      next: (n) => this.notifHistorico.set((n ?? []).slice(0, 10)),
      error: () => {}
    });
  }

}
