import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DouKeyword, DouTipoArtigo, DouRegiao, DodfPage } from '../models/dodf.model';

@Injectable({ providedIn: 'root' })
export class DouService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/dou`;

  // ── Keywords ────────────────────────────────────────────────────────────
  getKeywords(page = 0, size = 20): Observable<DodfPage<DouKeyword>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<DodfPage<DouKeyword>>(`${this.base}/keywords`, { params });
  }

  createKeyword(payload: { termo: string; ativo: boolean }): Observable<DouKeyword> {
    return this.http.post<DouKeyword>(`${this.base}/keywords`, payload);
  }

  updateKeyword(uuid: string, payload: { termo: string; ativo: boolean }): Observable<DouKeyword> {
    return this.http.put<DouKeyword>(`${this.base}/keywords/${uuid}`, payload);
  }

  deleteKeyword(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/keywords/${uuid}`);
  }

  // ── Tipos de Artigo ─────────────────────────────────────────────────────
  getTipos(page = 0, size = 20): Observable<DodfPage<DouTipoArtigo>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<DodfPage<DouTipoArtigo>>(`${this.base}/tipos-artigo`, { params });
  }

  createTipo(payload: { valor: string; ativo: boolean }): Observable<DouTipoArtigo> {
    return this.http.post<DouTipoArtigo>(`${this.base}/tipos-artigo`, payload);
  }

  updateTipo(uuid: string, payload: { valor: string; ativo: boolean }): Observable<DouTipoArtigo> {
    return this.http.put<DouTipoArtigo>(`${this.base}/tipos-artigo/${uuid}`, payload);
  }

  deleteTipo(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/tipos-artigo/${uuid}`);
  }

  // ── Regiões ─────────────────────────────────────────────────────────────
  getRegioes(page = 0, size = 20): Observable<DodfPage<DouRegiao>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<DodfPage<DouRegiao>>(`${this.base}/regioes`, { params });
  }

  createRegiao(payload: { termo: string; ativo: boolean }): Observable<DouRegiao> {
    return this.http.post<DouRegiao>(`${this.base}/regioes`, payload);
  }

  updateRegiao(uuid: string, payload: { termo: string; ativo: boolean }): Observable<DouRegiao> {
    return this.http.put<DouRegiao>(`${this.base}/regioes/${uuid}`, payload);
  }

  deleteRegiao(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/regioes/${uuid}`);
  }
}
