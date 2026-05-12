import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Lead, LeadStatus, AtualizarStatusRequest } from '../models/lead.model';
import { Page } from '../models/edital.model';

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
    return this.http.get<Page<Lead>>(this.base, { params });
  }

  obter(uuid: string): Observable<Lead> {
    return this.http.get<Lead>(`${this.base}/${uuid}`);
  }

  atualizarStatus(uuid: string, req: AtualizarStatusRequest): Observable<Lead> {
    return this.http.patch<Lead>(`${this.base}/${uuid}/status`, req);
  }
}
