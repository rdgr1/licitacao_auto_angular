import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificacaoEvent } from '../models/edital.model';

@Injectable({ providedIn: 'root' })
export class NotificacoesService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private _novas = signal(0);
  private _stream$ = new Subject<NotificacaoEvent>();

  novas = this._novas.asReadonly();
  stream$ = this._stream$.asObservable();

  private eventSource: EventSource | null = null;

  getHistorico(): Observable<NotificacaoEvent[]> {
    return this.http.get<NotificacaoEvent[]>(`${this.apiUrl}/notificacoes`);
  }

  startSSE(): void {
    if (this.eventSource) return;
    const url = `${this.apiUrl.replace('/api', '')}/api/notificacoes/stream`;
    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener('NOVO_LEAD', (e: MessageEvent) => {
      try {
        const event: NotificacaoEvent = JSON.parse(e.data);
        this._stream$.next(event);
        this._novas.update(n => n + 1);
      } catch { /* ignore parse errors */ }
    });

    // Silencia erros de conexão (backend offline / reconexão automática do SSE)
    this.eventSource.onerror = () => {
      // EventSource reconecta automaticamente — não precisa de ação
    };
  }

  stopSSE(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }

  clearNovas(): void {
    this._novas.set(0);
  }

  emitirBuscaConcluida(salvos: number, fontes: string[]): void {
    const evento: NotificacaoEvent = {
      tipo: 'BUSCA_CONCLUIDA',
      timestamp: new Date().toISOString(),
      editalId: 0,
      numero: '',
      objeto: `${salvos} lead(s) encontrado(s) em ${fontes.join(', ')}`,
      leadScore: 0,
      categoria: '',
      totalSalvos: salvos,
      totalFontes: fontes.length,
      fontesNomes: fontes,
    };
    this._stream$.next(evento);
    this._novas.update(n => n + 1);
  }
}
