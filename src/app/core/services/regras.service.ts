import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RegraAnalise, TipoRegra, CategoriaLead } from '../models/edital.model';

@Injectable({ providedIn: 'root' })
export class RegrasService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/regras`;

  getAll(): Observable<RegraAnalise[]> {
    return this.http.get<RegraAnalise[]>(this.baseUrl);
  }

  getAtivas(): Observable<RegraAnalise[]> {
    return this.http.get<RegraAnalise[]>(`${this.baseUrl}/ativas`);
  }

  getTipos(): Observable<TipoRegra[]> {
    return this.http.get<TipoRegra[]>(`${this.baseUrl}/tipos`);
  }

  getCategorias(): Observable<CategoriaLead[]> {
    return this.http.get<CategoriaLead[]>(`${this.baseUrl}/categorias`);
  }

  getById(id: number): Observable<RegraAnalise> {
    return this.http.get<RegraAnalise>(`${this.baseUrl}/${id}`);
  }

  create(regra: Partial<RegraAnalise>): Observable<RegraAnalise> {
    return this.http.post<RegraAnalise>(this.baseUrl, regra);
  }

  update(id: number, regra: Partial<RegraAnalise>): Observable<RegraAnalise> {
    return this.http.put<RegraAnalise>(`${this.baseUrl}/${id}`, regra);
  }

  toggle(id: number): Observable<RegraAnalise> {
    return this.http.patch<RegraAnalise>(`${this.baseUrl}/${id}/toggle`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
