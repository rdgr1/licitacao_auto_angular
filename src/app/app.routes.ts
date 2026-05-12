import { Routes } from '@angular/router';
import { MainLayoutComponent } from './features/layout/main-layout/main-layout.component';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public: Login
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },

  // Protected: App shell
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'pipeline',
        loadComponent: () =>
          import('./features/pipeline/pipeline.component').then(m => m.PipelineComponent),
      },
      {
        path: 'editais',
        loadComponent: () =>
          import('./features/editais/editais-list/editais-list.component').then(m => m.EditaisListComponent),
      },
      {
        path: 'editais/:id',
        loadComponent: () =>
          import('./features/editais/edital-details/edital-details.component').then(m => m.EditalDetailsComponent),
      },
      {
        path: 'impugnacao',
        loadComponent: () =>
          import('./features/impugnacao/impugnacao.component').then(m => m.ImpugnacaoComponent),
      },
      {
        path: 'assistente',
        loadComponent: () =>
          import('./features/chat/chat.component').then(m => m.ChatComponent),
      },
      {
        path: 'regras',
        loadComponent: () =>
          import('./features/regras/regras.component').then(m => m.RegrasComponent),
      },
      {
        path: 'dodf/configuracao',
        loadComponent: () =>
          import('./features/dodf/configuracao/dodf-configuracao.component').then(m => m.DodfConfiguracaoComponent),
      },
      {
        path: 'leads',
        loadComponent: () =>
          import('./features/leads/leads.component').then(m => m.LeadsComponent),
      },
      {
        path: 'notificacoes',
        loadComponent: () =>
          import('./features/notificacoes/notificacoes.component').then(m => m.NotificacoesComponent),
      },
      // Placeholder routes
      {
        path: 'relatorios',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'configuracoes',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: '' },
];
