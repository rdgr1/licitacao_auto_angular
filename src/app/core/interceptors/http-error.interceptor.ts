import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh-token'];

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      const isAuthEndpoint = AUTH_ENDPOINTS.some(e => req.url.includes(e));

      if (error.status === 401 && !isAuthEndpoint) {
        authService.logout();
        router.navigate(['/login'], {
          queryParams: { returnUrl: router.url, reason: 'session_expired' }
        });
        return throwError(() => error);
      }

      let errorMessage = 'Ocorreu um erro inesperado.';
      if (error.error?.message)       errorMessage = error.error.message;
      else if (error.status === 0)    errorMessage = 'Sem conexão com o servidor.';
      else if (error.status === 401)  errorMessage = 'Credenciais inválidas.';
      else if (error.status === 403)  errorMessage = 'Acesso negado.';
      else if (error.status === 404)  errorMessage = 'Recurso não encontrado.';
      else if (error.status >= 500)   errorMessage = 'Erro no servidor. Tente novamente mais tarde.';

      notificationService.error(errorMessage);
      return throwError(() => error);
    })
  );
};
