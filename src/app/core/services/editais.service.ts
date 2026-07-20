import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EditalResponse,
  LeadResponse,
  EstatisticasDTO,
  LeadParams,
  EditalStatus,
  ItemEdital,
  ArquivoEdital,
  ContratoEdital,
  AtaRegistroPreco,
  HistoricoEdital,
  Page,
  EstadoClassificacaoEdital,
} from '../models/edital.model';
import { Lead } from '../models/lead.model';

@Injectable({ providedIn: 'root' })
export class EditaisService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/editais`;

  // ── Endpoints disponíveis no backend ────────────────────────────────────

  getAll(
    opts: { page?: number; size?: number; status?: EditalStatus } = {},
  ): Observable<Page<EditalResponse>> {
    let params = new HttpParams().set('page', opts.page ?? 0).set('size', opts.size ?? 25);
    if (opts.status) params = params.set('status', opts.status);
    return this.http.get<Page<EditalResponse>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<EditalResponse> {
    return this.http.get<EditalResponse>(`${this.apiUrl}/id/${id}`);
  }

  getByNumero(numero: string): Observable<EditalResponse> {
    return this.http.get<EditalResponse>(`${this.apiUrl}/${numero}`);
  }

  getProximos(opts: { page?: number; size?: number } = {}): Observable<Page<EditalResponse>> {
    const params = new HttpParams().set('page', opts.page ?? 0).set('size', opts.size ?? 20);
    return this.http.get<Page<EditalResponse>>(`${this.apiUrl}/proximos`, { params });
  }

  getLeads(
    params: LeadParams,
    opts: { page?: number; size?: number } = {},
  ): Observable<Page<LeadResponse>> {
    let httpParams = new HttpParams().set('page', opts.page ?? 0).set('size', opts.size ?? 20);
    if (params.scoreMinimo !== undefined)
      httpParams = httpParams.set('scoreMinimo', params.scoreMinimo);
    if (params.categoria) httpParams = httpParams.set('categoria', params.categoria);
    if (params.uf) httpParams = httpParams.set('uf', params.uf);
    return this.http.get<Page<LeadResponse>>(`${this.apiUrl}/leads`, { params: httpParams });
  }

  getStats(): Observable<EstatisticasDTO> {
    return this.http.get<EstatisticasDTO>(`${this.apiUrl}/stats`);
  }

  getErros(opts: { page?: number; size?: number } = {}): Observable<Page<EditalResponse>> {
    const params = new HttpParams().set('page', opts.page ?? 0).set('size', opts.size ?? 20);
    return this.http.get<Page<EditalResponse>>(`${this.apiUrl}/erros`, { params });
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

  search(q: string, opts: { page?: number; size?: number } = {}): Observable<Page<EditalResponse>> {
    const params = new HttpParams()
      .set('q', q)
      .set('page', opts.page ?? 0)
      .set('size', opts.size ?? 20);
    return this.http.get<Page<EditalResponse>>(`${this.apiUrl}/search`, { params });
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

  // Auditoria do filtro de keyword da coleta PNCP — revisão manual de INTERESSE/REJEITADO.
  getClassificacoes(
    estado: EstadoClassificacaoEdital,
    opts: { page?: number; size?: number } = {},
  ): Observable<Page<EditalResponse>> {
    const params = new HttpParams()
      .set('estado', estado)
      .set('page', opts.page ?? 0)
      .set('size', opts.size ?? 20);
    return this.http.get<Page<EditalResponse>>(`${this.apiUrl}/classificacoes`, { params });
  }

  // Promove um edital (tipicamente REJEITADO) para Lead — 409 se já tiver lead vinculado.
  promover(id: string, body: { revisadoPor: string; observacao?: string }): Observable<Lead> {
    return this.http.post<Lead>(`${this.apiUrl}/${id}/promover`, body);
  }
}
