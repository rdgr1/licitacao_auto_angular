import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  MeProfile,
  RefreshResponse,
  UserInfo,
} from '../models/auth.model';

const TOKEN_KEY = 'lf_token';
const REFRESH_KEY = 'lf_refresh_token';
const USER_KEY = 'lf_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _currentUser = signal<UserInfo | null>(this.loadUser());
  private _token = signal<string | null>(this.loadToken());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token() && !!this._currentUser());
  readonly isAdmin = computed(() => this._currentUser()?.role === 'ADMIN');

  readonly userInitials = computed(() => {
    const user = this._currentUser();
    if (!user) return '?';
    return user.name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  private loadToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private loadUser(): UserInfo | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw) as UserInfo;
      return this.normalizeUser(user);
    } catch {
      return null;
    }
  }

  private normalizeUser(user: UserInfo): UserInfo {
    return {
      ...user,
      enabledModules: user.enabledModules ?? ['licitacoes'],
      tourCompleted: user.tourCompleted ?? false,
    };
  }

  login(credentials: LoginRequest): Observable<UserInfo> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => this.persistSession(response)),
      switchMap((response) => {
        if (response.user.role === 'ADMIN') {
          return this.fetchAndMergeProfile();
        }
        return [response.user];
      }),
      catchError((error) => {
        const message = error.error?.message || 'Credenciais inválidas. Verifique e-mail e senha.';
        return throwError(() => new Error(message));
      }),
    );
  }

  refresh(): Observable<RefreshResponse> {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    return this.http
      .post<RefreshResponse>(`${environment.apiUrl}/auth/refresh-token`, { refreshToken })
      .pipe(
        tap((response) => {
          localStorage.setItem(TOKEN_KEY, response.token);
          this._token.set(response.token);
        }),
        catchError(() => {
          this.logout();
          return throwError(() => new Error('Sessão expirada. Faça login novamente.'));
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._token();
  }

  private persistSession(response: AuthResponse): void {
    const user = this.normalizeUser(response.user);
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(REFRESH_KEY, response.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._token.set(response.token);
    this._currentUser.set(user);
  }

  // Atualiza o cache local (signal + localStorage) após um PUT bem-sucedido em /auth/{userId}/update-dados.
  updateCachedProfile(partial: Partial<UserInfo>): void {
    const current = this._currentUser();
    if (!current) return;
    const merged = this.normalizeUser({ ...current, ...partial });
    localStorage.setItem(USER_KEY, JSON.stringify(merged));
    this._currentUser.set(merged);
  }

  private fetchAndMergeProfile(): Observable<UserInfo> {
    return this.http.get<MeProfile>(`${environment.apiUrl}/auth/me`).pipe(
      tap((profile) => {
        const current = this._currentUser()!;
        const merged: UserInfo = this.normalizeUser({
          ...current,
          funcao: profile.funcao,
          imageUrl: profile.imageUrl,
        });
        localStorage.setItem(USER_KEY, JSON.stringify(merged));
        this._currentUser.set(merged);
      }),
      switchMap(() => [this._currentUser()!]),
    );
  }
}
