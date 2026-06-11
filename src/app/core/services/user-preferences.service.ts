import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserPreferences, DEFAULT_PREFERENCES } from '../models/user-preferences.model';

const PREFS_KEY = 'lf_user_prefs';

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private http = inject(HttpClient);
  private _prefs = signal<UserPreferences>(this.loadLocal());

  readonly prefs = this._prefs.asReadonly();

  private loadLocal(): UserPreferences {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : { ...DEFAULT_PREFERENCES };
    } catch { return { ...DEFAULT_PREFERENCES }; }
  }

  load(): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(`${environment.apiUrl}/users/me/preferences`).pipe(
      tap(p => { this._prefs.set(p); localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }),
      catchError(() => of(this._prefs())),
    );
  }

  save(prefs: Partial<UserPreferences>): Observable<UserPreferences> {
    const merged = { ...this._prefs(), ...prefs };
    return this.http.patch<UserPreferences>(`${environment.apiUrl}/users/me/preferences`, merged).pipe(
      tap(p => { this._prefs.set(p); localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }),
      catchError(() => { this._prefs.update(p => ({ ...p, ...prefs })); return of(merged); }),
    );
  }
}
