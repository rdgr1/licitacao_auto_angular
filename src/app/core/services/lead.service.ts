import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Lead, LeadStatus, AtualizarStatusRequest } from '../models/lead.model';
import { Page, EditalResponse } from '../models/edital.model';

const toPage = <T>(res: Page<T> | T[]): Page<T> =>
  Array.isArray(res)
    ? { content: res, totalElements: res.length, totalPages: 1, size: res.length, number: 0, first: true, last: true, empty: res.length === 0 }
    : res;

@Injectable({ providedIn: 'root' })
export class LeadService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/leads`;

  listar(filtros: { status?: LeadStatus; fonte?: string; page?: number; size?: number } = {}): Observable<Page<Lead>> {
    let params = new HttpParams()
      .set('page', filtros.page ?? 0)
      .set('size', filtros.size ?? 20);
    if (filtros.status) params = params.set('status', filtros.status);
    if (filtros.fonte) params = params.set('fonte', filtros.fonte);
    return this.http.get<Page<Lead> | Lead[]>(this.base, { params }).pipe(map(toPage));
  }

  obter(uuid: string): Observable<Lead> {
    return this.http.get<Lead>(`${this.base}/${uuid}`);
  }

  atualizarStatus(uuid: string, req: AtualizarStatusRequest): Observable<Lead> {
    return this.http.patch<Lead>(`${this.base}/${uuid}/status`, req);
  }

  // Vincula o lead ao melhor edital encontrado no PNCP (idempotente)
  buscarEdital(uuid: string): Observable<EditalResponse> {
    return this.http.post<EditalResponse>(`${this.base}/${uuid}/buscar-edital`, {});
  }
}
