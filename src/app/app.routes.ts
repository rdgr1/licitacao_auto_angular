import { Routes } from '@angular/router';
import { MainLayoutComponent } from './features/layout/main-layout/main-layout.component';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public: Login
  {
    path: 'login',
    title: 'Entrar — LicitaFlow',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },

  // Public: Forgot password
  {
    path: 'forgot-password',
    title: 'Esqueci minha senha — LicitaFlow',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },

  // Public: Reset password
  {
    path: 'reset-password',
    title: 'Redefinir senha — LicitaFlow',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
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
        title: 'Dashboard — LicitaFlow',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'pipeline',
        title: 'Pipeline — LicitaFlow',
        loadComponent: () =>
          import('./features/pipeline/pipeline.component').then((m) => m.PipelineComponent),
      },
      {
        path: 'editais',
        title: 'Editais — LicitaFlow',
        loadComponent: () =>
          import('./features/editais/editais-list/editais-list.component').then(
            (m) => m.EditaisListComponent,
          ),
      },
      {
        path: 'editais/:id',
        title: 'Edital — LicitaFlow',
        loadComponent: () =>
          import('./features/editais/edital-details/edital-details.component').then(
            (m) => m.EditalDetailsComponent,
          ),
      },
      {
        path: 'impugnacao',
        title: 'Impugnação — LicitaFlow',
        loadComponent: () =>
          import('./features/impugnacao/impugnacao.component').then((m) => m.ImpugnacaoComponent),
      },
      {
        path: 'assistente',
        title: 'Assistente IA — LicitaFlow',
        loadComponent: () => import('./features/chat/chat.component').then((m) => m.ChatComponent),
      },
      {
        path: 'configuracoes',
        title: 'Configurações — LicitaFlow',
        loadComponent: () =>
          import('./features/configuracoes/configuracoes.component').then(
            (m) => m.ConfiguracoesComponent,
          ),
      },
      // compatibilidade com rota antiga
      {
        path: 'dodf/configuracao',
        redirectTo: 'configuracoes',
        pathMatch: 'full',
      },
      {
        path: 'leads',
        title: 'Leads — LicitaFlow',
        loadComponent: () =>
          import('./features/leads/leads.component').then((m) => m.LeadsComponent),
      },
      // Cotação domain
      {
        path: 'cotacao/fornecedores',
        title: 'Fornecedores — LicitaFlow',
        loadComponent: () =>
          import('./features/cotacao/fornecedores/fornecedores.component').then(
            (m) => m.FornecedoresComponent,
          ),
      },
      {
        path: 'cotacao/itens',
        title: 'Itens — LicitaFlow',
        loadComponent: () =>
          import('./features/cotacao/itens/itens.component').then((m) => m.ItensComponent),
      },
      // Placeholder routes
      {
        path: 'perfil',
        title: 'Perfil — LicitaFlow',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'configuracoes',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: '' },
];
