import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notificacao, Page } from '../models/edital.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificacoesService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = environment.apiUrl;

  private _novas = signal(0);

  novas = this._novas.asReadonly();

  private eventSource: EventSource | null = null;

  /** Histórico persistido (TB_NOTIFICACAO) — não confundir com o legado em memória de /notificacoes. */
  getHistorico(): Observable<Page<Notificacao>> {
    const params = new HttpParams().set('size', '10').set('sort', 'createdAt,desc');
    return this.http.get<Page<Notificacao>>(`${this.apiUrl}/notificacoes/lista`, { params });
  }

  carregarNaoLidas(): void {
    this.http
      .get<{ naoLidas: number }>(`${this.apiUrl}/notificacoes/nao-lidas/count`, {
        params: this.destinatarioParams(),
      })
      .subscribe({
        next: (r) => this._novas.set(r.naoLidas ?? 0),
        error: () => {},
      });
  }

  marcarTodasComoLidas(): Observable<{ atualizadas: number }> {
    return this.http
      .patch<{ atualizadas: number }>(`${this.apiUrl}/notificacoes/lidas`, null, {
        params: this.destinatarioParams(),
      })
      .pipe(tap(() => this._novas.set(0)));
  }

  private destinatarioParams(): HttpParams {
    const email = this.auth.currentUser()?.email;
    return email ? new HttpParams().set('destinatario', email) : new HttpParams();
  }

  startSSE(): void {
    if (this.eventSource) return;
    const token = this.auth.getToken();
    const base = this.apiUrl.replace('/api', '');
    const url = token
      ? `${base}/api/notificacoes/stream?token=${encodeURIComponent(token)}`
      : `${base}/api/notificacoes/stream`;
    this.eventSource = new EventSource(url);

    const onEvento = (e: MessageEvent) => {
      try {
        JSON.parse(e.data);
        this._novas.update((n) => n + 1);
      } catch {}
    };
    this.eventSource.addEventListener('NOVO_LEAD', onEvento);
    this.eventSource.addEventListener('ACAO_PIPELINE', onEvento);
    this.eventSource.onerror = () => {};
  }

  stopSSE(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }

  clearNovas(): void {
    this.marcarTodasComoLidas().subscribe({ error: () => {} });
  }
}
