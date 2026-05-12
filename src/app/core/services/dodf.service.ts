import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ColetaResultado, DodfKeyword, DodfTipoAbertura, DodfPage } from '../models/dodf.model';

@Injectable({ providedIn: 'root' })
export class DodfService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/dodf`;

  // ── Coleta ──────────────────────────────────────────────────────────
  coletar(data: string): Observable<ColetaResultado> {
    return this.http.post<ColetaResultado>(
      `${this.base}/coleta`,
      null,
      { params: new HttpParams().set('data', data) }
    );
  }

  // ── Keywords ────────────────────────────────────────────────────────
  getKeywords(page = 0, size = 10): Observable<DodfPage<DodfKeyword>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<DodfPage<DodfKeyword>>(`${this.base}/keywords`, { params });
  }

  createKeyword(payload: { termo: string; ativo: boolean }): Observable<DodfKeyword> {
    return this.http.post<DodfKeyword>(`${this.base}/keywords`, payload);
  }

  updateKeyword(uuid: string, payload: { termo: string; ativo: boolean }): Observable<DodfKeyword> {
    return this.http.put<DodfKeyword>(`${this.base}/keywords/${uuid}`, payload);
  }

  deleteKeyword(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/keywords/${uuid}`);
  }

  // ── Tipos de Abertura ───────────────────────────────────────────────
  getTipos(page = 0, size = 10): Observable<DodfPage<DodfTipoAbertura>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<DodfPage<DodfTipoAbertura>>(`${this.base}/tipos-abertura`, { params });
  }

  createTipo(payload: { valor: string; ativo: boolean }): Observable<DodfTipoAbertura> {
    return this.http.post<DodfTipoAbertura>(`${this.base}/tipos-abertura`, payload);
  }

  updateTipo(uuid: string, payload: { valor: string; ativo: boolean }): Observable<DodfTipoAbertura> {
    return this.http.put<DodfTipoAbertura>(`${this.base}/tipos-abertura/${uuid}`, payload);
  }

  deleteTipo(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/tipos-abertura/${uuid}`);
  }
}
