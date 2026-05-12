import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ChatMessage, ChatRequest, ChatResponse,
  ImpugnacaoRequest, ImpugnacaoResponse, EditalImpugnacao
} from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);

  private _messages = signal<ChatMessage[]>([]);
  private _conversationId = signal<string | null>(null);
  private _loading = signal(false);

  readonly messages = this._messages.asReadonly();
  readonly loading = this._loading.asReadonly();

  sendMessage(content: string): void {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    const loadingMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };

    this._messages.update(msgs => [...msgs, userMsg, loadingMsg]);
    this._loading.set(true);

    const body: ChatRequest = {
      message: content,
      conversationId: this._conversationId() ?? undefined
    };

    this.http.post<ChatResponse>(`${environment.apiUrl}/chat/message`, body).subscribe({
      next: res => {
        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: res.response,
          timestamp: new Date(),
          sources: res.sources
        };
        this._messages.update(msgs => [...msgs.slice(0, -1), aiMsg]);
        this._conversationId.set(res.conversationId);
        this._loading.set(false);
      },
      error: () => {
        const errMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
          timestamp: new Date()
        };
        this._messages.update(msgs => [...msgs.slice(0, -1), errMsg]);
        this._loading.set(false);
      }
    });
  }

  clearConversation(): void {
    this._messages.set([]);
    this._conversationId.set(null);
  }

  buscarEditalParaImpugnacao(numero: string): Observable<EditalImpugnacao> {
    return this.http.get<EditalImpugnacao>(`${environment.apiUrl}/impugnacao/busca`, {
      params: { numero }
    });
  }

  gerarImpugnacao(request: ImpugnacaoRequest): Observable<ImpugnacaoResponse> {
    return this.http.post<ImpugnacaoResponse>(`${environment.apiUrl}/impugnacao/gerar`, request);
  }
}
