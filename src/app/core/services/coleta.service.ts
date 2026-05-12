import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ColetaResultado } from '../models/dodf.model';

@Injectable({ providedIn: 'root' })
export class ColetaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/dodf`;

  dispararColeta(data: Date): Observable<ColetaResultado> {
    const dataStr = data.toISOString().split('T')[0];
    return this.http.post<ColetaResultado>(
      `${this.base}/coleta`,
      null,
      { params: new HttpParams().set('data', dataStr) }
    );
  }
}
