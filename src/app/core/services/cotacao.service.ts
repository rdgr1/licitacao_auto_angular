import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Fornecedor, CatalogoItem } from '../models/cotacao.model';
import { Page } from '../models/edital.model';

@Injectable({ providedIn: 'root' })
export class CotacaoService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ── Fornecedores  →  GET/POST/PUT/DELETE /fornecedores ──────────────────

  listarFornecedores(p: { page?: number; size?: number } = {}): Observable<Page<Fornecedor>> {
    const params = new HttpParams().set('page', p.page ?? 0).set('size', p.size ?? 50);
    return this.http.get<Page<Fornecedor>>(`${this.apiUrl}/fornecedores`, { params });
  }

  criarFornecedor(data: Fornecedor): Observable<Fornecedor> {
    return this.http.post<Fornecedor>(`${this.apiUrl}/fornecedores`, data);
  }

  atualizarFornecedor(id: string, data: Fornecedor): Observable<Fornecedor> {
    return this.http.put<Fornecedor>(`${this.apiUrl}/fornecedores/${id}`, data);
  }

  deletarFornecedor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/fornecedores/${id}`);
  }

  // ── Catálogo de Itens  →  GET/POST/PUT/DELETE /cotacao/catalogo ─────────

  listarItens(p: { page?: number; size?: number } = {}): Observable<Page<CatalogoItem>> {
    const params = new HttpParams().set('page', p.page ?? 0).set('size', p.size ?? 100);
    return this.http.get<Page<CatalogoItem>>(`${this.apiUrl}/cotacao/catalogo`, { params });
  }

  criarItem(data: CatalogoItem): Observable<CatalogoItem> {
    return this.http.post<CatalogoItem>(`${this.apiUrl}/cotacao/catalogo`, data);
  }

  atualizarItem(id: string, data: CatalogoItem): Observable<CatalogoItem> {
    return this.http.put<CatalogoItem>(`${this.apiUrl}/cotacao/catalogo/${id}`, data);
  }

  deletarItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cotacao/catalogo/${id}`);
  }
}
