import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { EditalResponse, LeadResponse, EstatisticasDTO, LeadParams, EditalStatus, ItemEdital, ArquivoEdital, ContratoEdital, AtaRegistroPreco, HistoricoEdital, Page } from '../models/edital.model';

const extractContent = <T>(res: Page<T> | T[]): T[] =>
  Array.isArray(res) ? res : (res?.content ?? []);

@Injectable({ providedIn: 'root' })
export class EditaisService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/editais`;

  // ── Endpoints disponíveis no backend ────────────────────────────────────

  getAll(opts: { page?: number; size?: number; status?: EditalStatus } = {}): Observable<Page<EditalResponse>> {
    let params = new HttpParams()
      .set('page', opts.page ?? 0)
      .set('size', opts.size ?? 25);
    if (opts.status) params = params.set('status', opts.status);
    return this.http.get<Page<EditalResponse>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<EditalResponse> {
    return this.http.get<EditalResponse>(`${this.apiUrl}/id/${id}`);
  }

  getByNumero(numero: string): Observable<EditalResponse> {
    return this.http.get<EditalResponse>(`${this.apiUrl}/${numero}`);
  }

  getProximos(): Observable<EditalResponse[]> {
    return this.http.get<Page<EditalResponse> | EditalResponse[]>(`${this.apiUrl}/proximos`).pipe(
      map(extractContent)
    );
  }

  getLeads(params: LeadParams): Observable<LeadResponse[]> {
    let httpParams = new HttpParams();
    if (params.scoreMinimo !== undefined) httpParams = httpParams.set('scoreMinimo', params.scoreMinimo);
    if (params.categoria) httpParams = httpParams.set('categoria', params.categoria);
    if (params.uf) httpParams = httpParams.set('uf', params.uf);
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

  getItens(id: string): Observable<ItemEdital[]> {
    return this.http.get<ItemEdital[]>(`${this.apiUrl}/${id}/itens`);
  }

  sincronizarItens(id: string): Observable<ItemEdital[]> {
    return this.http.post<ItemEdital[]>(`${this.apiUrl}/${id}/sincronizar-itens`, {});
  }

  getArquivos(id: string): Observable<ArquivoEdital[]> {
    return this.http.get<ArquivoEdital[]>(`${this.apiUrl}/${id}/arquivos`);
  }

  getContratos(id: string): Observable<ContratoEdital[]> {
    return this.http.get<ContratoEdital[]>(`${this.apiUrl}/${id}/contratos`);
  }

  getAtas(id: string): Observable<AtaRegistroPreco[]> {
    return this.http.get<AtaRegistroPreco[]>(`${this.apiUrl}/${id}/atas`);
  }

  getHistorico(id: string): Observable<HistoricoEdital[]> {
    return this.http.get<HistoricoEdital[]>(`${this.apiUrl}/${id}/historico`);
  }

  search(q: string): Observable<EditalResponse[]> {
    return this.http.get<Page<EditalResponse> | EditalResponse[]>(`${this.apiUrl}/search`, {
      params: new HttpParams().set('q', q)
    }).pipe(map(extractContent));
  }

  processar(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/processar`, {});
  }

  processarStatus(): Observable<{ running: boolean; message?: string }> {
    return this.http.get<{ running: boolean; message?: string }>(`${this.apiUrl}/processar/status`);
  }

  reprocessar(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/reprocessar`, {});
  }

  reclassificar(): Observable<{ count: number }> {
    return this.http.post<{ count: number }>(`${this.apiUrl}/reclassificar`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
