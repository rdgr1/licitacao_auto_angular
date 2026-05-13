import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ColetaResultado } from '../models/dodf.model';

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
}
