import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BuscaPrefsDto,
  NotificaoPrefsDto,
  DEFAULT_BUSCA_PREFS,
  DEFAULT_NOTIFICACAO_PREFS,
} from '../models/user-preferences.model';

const BUSCA_KEY = 'lf_busca_prefs';
const NOTIFICACAO_KEY = 'lf_notificacao_prefs';

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/auth/me`;

  private _busca = signal<BuscaPrefsDto>(this.loadLocal(BUSCA_KEY, DEFAULT_BUSCA_PREFS));
  private _notificacao = signal<NotificaoPrefsDto>(
    this.loadLocal(NOTIFICACAO_KEY, DEFAULT_NOTIFICACAO_PREFS),
  );

  readonly busca = this._busca.asReadonly();
  readonly notificacao = this._notificacao.asReadonly();

  private loadLocal<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
    } catch {
      return { ...fallback };
    }
  }

  loadBusca(): Observable<BuscaPrefsDto> {
    return this.http.get<BuscaPrefsDto>(`${this.base}/busca-prefs`).pipe(
      tap((p) => {
        this._busca.set(p);
        localStorage.setItem(BUSCA_KEY, JSON.stringify(p));
      }),
      catchError(() => of(this._busca())),
    );
  }

  // PUT é substituição completa — os 3 campos são obrigatórios, não é patch parcial.
  saveBusca(prefs: BuscaPrefsDto): Observable<BuscaPrefsDto> {
    return this.http.put<BuscaPrefsDto>(`${this.base}/busca-prefs`, prefs).pipe(
      tap((p) => {
        this._busca.set(p);
        localStorage.setItem(BUSCA_KEY, JSON.stringify(p));
      }),
      catchError(() => {
        this._busca.set(prefs);
        return of(prefs);
      }),
    );
  }

  loadNotificacao(): Observable<NotificaoPrefsDto> {
    return this.http.get<NotificaoPrefsDto>(`${this.base}/notificacao-prefs`).pipe(
      tap((p) => {
        this._notificacao.set(p);
        localStorage.setItem(NOTIFICACAO_KEY, JSON.stringify(p));
      }),
      catchError(() => of(this._notificacao())),
    );
  }

  saveNotificacao(prefs: NotificaoPrefsDto): Observable<NotificaoPrefsDto> {
    return this.http.put<NotificaoPrefsDto>(`${this.base}/notificacao-prefs`, prefs).pipe(
      tap((p) => {
        this._notificacao.set(p);
        localStorage.setItem(NOTIFICACAO_KEY, JSON.stringify(p));
      }),
      catchError(() => {
        this._notificacao.set(prefs);
        return of(prefs);
      }),
    );
  }
}
