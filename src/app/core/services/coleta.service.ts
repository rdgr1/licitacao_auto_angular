import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ColetaResultado } from '../models/dodf.model';
import { ColetaLog, ColetaResumo } from '../models/coleta-log.model';
import { Page } from '../models/edital.model';

@Injectable({ providedIn: 'root' })
export class ColetaService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  dispararColeta(fonte: string, data: Date): Observable<ColetaResultado> {
    const dataStr = data.toISOString().split('T')[0];

    // PNCP usa dataInicial + dataFinal (range); para coleta dia a dia passamos mesmo valor nos dois
    if (fonte === 'PNCP') {
      return this.http.post<ColetaResultado>(
        `${this.apiUrl}/pncp/coleta`,
        null,
        { params: new HttpParams().set('dataInicial', dataStr).set('dataFinal', dataStr) }
      );
    }

    const path = fonte === 'DOU' ? 'dou/coleta' : 'dodf/coleta';
    return this.http.post<ColetaResultado>(
      `${this.apiUrl}/${path}`,
      null,
      { params: new HttpParams().set('data', dataStr) }
    );
  }

  getHistorico(params: { page?: number; size?: number; fonte?: string } = {}): Observable<Page<ColetaLog>> {
    let p = new HttpParams()
      .set('page', params.page ?? 0)
      .set('size', params.size ?? 200);
    if (params.fonte) p = p.set('fonte', params.fonte);
    return this.http.get<Page<ColetaLog>>(`${this.apiUrl}/coleta/historico`, { params: p });
  }

  getResumo(): Observable<ColetaResumo> {
    return this.http.get<ColetaResumo>(`${this.apiUrl}/coleta/historico/resumo`);
  }
}
