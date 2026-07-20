import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PncpModalidade, PncpUf, PncpKeyword } from '../models/pncp.model';
import { DodfPage } from '../models/dodf.model';

@Injectable({ providedIn: 'root' })
export class PncpService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/pncp`;

  // ── Modalidades  →  /pncp/modalidades ──────────────────────────────────────

  getModalidades(page = 0, size = 20): Observable<DodfPage<PncpModalidade>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<DodfPage<PncpModalidade>>(`${this.base}/modalidades`, { params });
  }

  createModalidade(payload: {
    codigo: number;
    nome: string;
    ativo: boolean;
  }): Observable<PncpModalidade> {
    return this.http.post<PncpModalidade>(`${this.base}/modalidades`, payload);
  }

  updateModalidade(
    uuid: string,
    payload: { codigo: number; nome: string; ativo: boolean },
  ): Observable<PncpModalidade> {
    return this.http.put<PncpModalidade>(`${this.base}/modalidades/${uuid}`, payload);
  }

  deleteModalidade(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/modalidades/${uuid}`);
  }

  // ── UFs  →  /pncp/ufs ──────────────────────────────────────────────────────

  getUfs(page = 0, size = 50): Observable<DodfPage<PncpUf>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<DodfPage<PncpUf>>(`${this.base}/ufs`, { params });
  }

  createUf(payload: { sigla: string; ativo: boolean }): Observable<PncpUf> {
    return this.http.post<PncpUf>(`${this.base}/ufs`, payload);
  }

  updateUf(uuid: string, payload: { sigla: string; ativo: boolean }): Observable<PncpUf> {
    return this.http.put<PncpUf>(`${this.base}/ufs/${uuid}`, payload);
  }

  deleteUf(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/ufs/${uuid}`);
  }

  // ── Keywords  →  /pncp/keywords ─────────────────────────────────────────────
  // Resposta não traz uuid (ver PncpKeyword no model) — só criar/listar por ora.

  getKeywords(page = 0, size = 10): Observable<DodfPage<PncpKeyword>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<DodfPage<PncpKeyword>>(`${this.base}/keywords`, { params });
  }

  createKeyword(payload: { termo: string; ativo: boolean }): Observable<PncpKeyword> {
    return this.http.post<PncpKeyword>(`${this.base}/keywords`, payload);
  }
}
