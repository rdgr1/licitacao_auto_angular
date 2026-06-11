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

  // Public: Forgot password
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },

  // Public: Reset password
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  },

  // Protected: App shell
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'leads',
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
        path: 'configuracoes',
        loadComponent: () =>
          import('./features/configuracoes/configuracoes.component').then(m => m.ConfiguracoesComponent),
      },
      // compatibilidade com rota antiga
      {
        path: 'dodf/configuracao',
        redirectTo: 'configuracoes',
        pathMatch: 'full',
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
      // Cotação domain
      {
        path: 'cotacao/fornecedores',
        loadComponent: () =>
          import('./features/cotacao/fornecedores/fornecedores.component').then(m => m.FornecedoresComponent),
      },
      {
        path: 'cotacao/itens',
        loadComponent: () =>
          import('./features/cotacao/itens/itens.component').then(m => m.ItensComponent),
      },
      // Placeholder routes
      {
        path: 'perfil',
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
