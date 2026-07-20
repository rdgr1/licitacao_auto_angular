import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Lead, LeadStatus, AtualizarStatusRequest } from '../models/lead.model';
import { Page } from '../models/edital.model';
import { BuscaEdital } from '../models/busca-edital.model';
import { ColetaPncpLeadStatus } from '../models/coleta-pncp-lead.model';

const toPage = <T>(res: Page<T> | T[]): Page<T> =>
  Array.isArray(res)
    ? {
        content: res,
        totalElements: res.length,
        totalPages: 1,
        size: res.length,
        number: 0,
        first: true,
        last: true,
        empty: res.length === 0,
      }
    : res;

@Injectable({ providedIn: 'root' })
export class LeadService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/leads`;

  listar(
    filtros: {
      status?: LeadStatus;
      fonte?: string;
      scoreMin?: number;
      page?: number;
      size?: number;
    } = {},
  ): Observable<Page<Lead>> {
    let params = new HttpParams().set('page', filtros.page ?? 0).set('size', filtros.size ?? 20);
    if (filtros.status) params = params.set('status', filtros.status);
    if (filtros.fonte) params = params.set('fonte', filtros.fonte);
    if (filtros.scoreMin != null) params = params.set('scoreMin', filtros.scoreMin);
    return this.http.get<Page<Lead> | Lead[]>(this.base, { params }).pipe(map(toPage));
  }

  obter(uuid: string): Observable<Lead> {
    return this.http.get<Lead>(`${this.base}/${uuid}`);
  }

  atualizarStatus(uuid: string, req: AtualizarStatusRequest): Observable<Lead> {
    return this.http.patch<Lead>(`${this.base}/${uuid}/status`, req);
  }

  // Dispara a busca assíncrona do edital no PNCP (202 Accepted — conclui via statusBuscaEdital)
  buscarEdital(uuid: string): Observable<BuscaEdital> {
    return this.http.post<BuscaEdital>(`${this.base}/${uuid}/buscar-edital`, {});
  }

  statusBuscaEdital(uuid: string): Observable<BuscaEdital> {
    return this.http.get<BuscaEdital>(`${this.base}/${uuid}/buscar-edital/status`);
  }

  // Dispara a coleta PNCP assíncrona na janela de 30 dias a partir da data do lead (202 Accepted — conclui via statusColetaPncp)
  coletarPncp(uuid: string): Observable<ColetaPncpLeadStatus> {
    return this.http.post<ColetaPncpLeadStatus>(`${this.base}/${uuid}/coletar-pncp`, {});
  }

  statusColetaPncp(uuid: string): Observable<ColetaPncpLeadStatus> {
    return this.http.get<ColetaPncpLeadStatus>(`${this.base}/${uuid}/coletar-pncp/status`);
  }
}
