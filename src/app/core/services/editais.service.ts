import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { EditalResponse, LeadResponse, EstatisticasDTO, LeadParams, EditalStatus, ItemEdital, ProcessarResult, Page, ApiResponse } from '../models/edital.model';

const extractContent = <T>(res: Page<T> | T[]): T[] =>
  Array.isArray(res) ? res : (res?.content ?? []);

@Injectable({ providedIn: 'root' })
export class EditaisService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/editais`;

  getAll(status?: EditalStatus): Observable<EditalResponse[]> {
    const params = status ? new HttpParams().set('status', status) : {};
    return this.http.get<Page<EditalResponse> | EditalResponse[]>(this.apiUrl, { params }).pipe(
      map(extractContent)
    );
  }

  getById(id: string): Observable<EditalResponse> {
    return this.http.get<EditalResponse>(`${this.apiUrl}/id/${id}`);
  }

  getByNumero(numero: string): Observable<EditalResponse> {
    return this.http.get<EditalResponse>(`${this.apiUrl}/${numero}`);
  }

  search(query: string): Observable<EditalResponse[]> {
    return this.http.get<Page<EditalResponse> | EditalResponse[]>(`${this.apiUrl}/search`, {
      params: new HttpParams().set('q', query)
    }).pipe(map(extractContent));
  }

  getProximos(): Observable<EditalResponse[]> {
    return this.http.get<Page<EditalResponse> | EditalResponse[]>(`${this.apiUrl}/proximos`).pipe(
      map(extractContent)
    );
  }

  getLeads(params: LeadParams): Observable<LeadResponse[]> {
    let httpParams = new HttpParams();
    if (params.scoreMinimo !== undefined) {
      httpParams = httpParams.set('scoreMinimo', params.scoreMinimo);
    }
    if (params.categoria) {
      httpParams = httpParams.set('categoria', params.categoria);
    }
    if (params.uf) {
      httpParams = httpParams.set('uf', params.uf);
    }
    return this.http.get<Page<LeadResponse> | LeadResponse[]>(`${this.apiUrl}/leads`, { params: httpParams }).pipe(
      map(extractContent)
    );
  }

  getStats(): Observable<EstatisticasDTO> {
    return this.http.get<EstatisticasDTO>(`${this.apiUrl}/stats`);
  }

  getErros(): Observable<EditalResponse[]> {
    return this.http.get<Page<EditalResponse> | EditalResponse[]>(`${this.apiUrl}/erros`).pipe(
      map(extractContent)
    );
  }

  processar(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/processar`, {});
  }

  processarStatus(): Observable<ProcessarResult> {
    return this.http.get<ApiResponse<ProcessarResult>>(`${this.apiUrl}/processar/status`).pipe(
      map(res => res.data ?? { running: false })
    );
  }

  getItens(id: string): Observable<ItemEdital[]> {
    return this.http.get<ItemEdital[]>(`${this.apiUrl}/${id}/itens`);
  }

  reprocessar(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/reprocessar`, {});
  }

  reclassificar(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reclassificar`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
