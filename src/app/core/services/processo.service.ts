import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProcessoLicitatorio, EditalArquivo, AtualizarStatusProcessoRequest, StatusProcesso } from '../models/processo.model';
import { Page } from '../models/edital.model';

@Injectable({ providedIn: 'root' })
export class ProcessoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/processos`;
  private editaisBase = `${environment.apiUrl}/editais-arquivo`;

  listar(filtros: { status?: StatusProcesso; page?: number; size?: number } = {}): Observable<Page<ProcessoLicitatorio>> {
    let params = new HttpParams()
      .set('page', filtros.page ?? 0)
      .set('size', filtros.size ?? 500);
    if (filtros.status) params = params.set('status', filtros.status);
    return this.http.get<Page<ProcessoLicitatorio>>(this.base, { params });
  }

  obter(uuid: string): Observable<ProcessoLicitatorio> {
    return this.http.get<ProcessoLicitatorio>(`${this.base}/${uuid}`);
  }

  atualizarStatus(uuid: string, status: StatusProcesso): Observable<ProcessoLicitatorio> {
    const req: AtualizarStatusProcessoRequest = { status };
    return this.http.patch<ProcessoLicitatorio>(`${this.base}/${uuid}/status`, req);
  }

  listarEditais(processoUuid: string): Observable<EditalArquivo[]> {
    return this.http.get<EditalArquivo[]>(`${this.base}/${processoUuid}/editais`);
  }

  downloadUrl(editalUuid: string): string {
    return `${this.editaisBase}/${editalUuid}/download`;
  }
}
