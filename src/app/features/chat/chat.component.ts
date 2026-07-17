import { Component, inject, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { ChatService } from '../../core/services/chat.service';
import { ChatMessage } from '../../core/models/chat.model';

const QUICK_PROMPTS = [
  'Quais são os editais com maior score esta semana?',
  'Resuma as principais exigências técnicas dos editais pendentes',
  'Há licitações na área de TI acima de R$ 500k?',
  'Quais órgãos publicaram mais editais este mês?',
  'Analise o risco dos editais em aberto',
];

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    DatePipe,
  ],
  template: `
    <div class="chat-page">

      <!-- ── Header ──────────────────────────────────────────────────── -->
      <header class="chat-header">
        <div class="header-left">
          <div class="ai-avatar">
            <mat-icon>smart_toy</mat-icon>
          </div>
          <div>
            <h1 class="header-title">Assistente LicitaFlow</h1>
            <div class="header-status">
              <span class="status-dot"></span>
              <span>Alimentado com seus editais via RAG</span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          @if (chatSvc.messages().length > 0) {
            <button mat-stroked-button class="clear-btn" (click)="clearChat()">
              <mat-icon>restart_alt</mat-icon>
              Nova conversa
            </button>
          }
        </div>
      </header>

      <!-- ── Messages ─────────────────────────────────────────────────── -->
      <div class="messages-area" #messagesEl>
        @if (chatSvc.messages().length === 0) {
          <!-- Empty state -->
          <div class="empty-state">
            <div class="empty-icon">
              <mat-icon>psychology</mat-icon>
            </div>
            <h2>Olá! Como posso ajudar?</h2>
            <p>Tenho acesso completo a todos os editais, leads e histórico da plataforma. Pergunte qualquer coisa.</p>

            <div class="quick-prompts">
              @for (prompt of quickPrompts; track prompt) {
                <button class="prompt-chip" (click)="sendQuick(prompt)">
                  {{ prompt }}
                </button>
              }
            </div>
          </div>
        }

        @for (msg of chatSvc.messages(); track msg.id) {
          <div class="message-row" [class.user]="msg.role === 'user'">
            @if (msg.role === 'assistant') {
              <div class="msg-avatar ai">
                <mat-icon>smart_toy</mat-icon>
              </div>
            }

            <div class="message-bubble" [class.loading]="msg.isLoading">
              @if (msg.isLoading) {
                <div class="typing-dots">
                  <span></span><span></span><span></span>
                </div>
              } @else {
                <div class="msg-content" [innerHTML]="formatMessage(msg.content)"></div>

                @if (msg.sources && msg.sources.length > 0) {
                  <div class="msg-sources">
                    <span class="sources-label">Fontes consultadas:</span>
                    <div class="sources-list">
                      @for (src of msg.sources; track src.title) {
                        <span class="source-chip">
                          <mat-icon>description</mat-icon>
                          {{ src.title }}
                          @if (src.relevance) {
                            <span class="relevance">{{ (src.relevance * 100).toFixed(0) }}%</span>
                          }
                        </span>
                      }
                    </div>
                  </div>
                }

                <span class="msg-time">{{ msg.timestamp | date:'HH:mm' }}</span>
              }
            </div>

            @if (msg.role === 'user') {
              <div class="msg-avatar user">U</div>
            }
          </div>
        }
      </div>

      <!-- ── Input ─────────────────────────────────────────────────────── -->
      <div class="input-area">
        <div class="input-wrapper">
          <textarea
            class="chat-input"
            [formControl]="inputCtrl"
            placeholder="Pergunte sobre editais, leads, impugnações..."
            rows="1"
            (keydown.enter)="onEnter($event)"
            (input)="autoResize($event)"
          ></textarea>

          <div class="input-actions">
            <button class="send-btn"
                    (click)="send()"
                    [disabled]="!inputCtrl.value?.trim() || chatSvc.loading()"
                    matTooltip="Enviar (Enter)">
              @if (chatSvc.loading()) {
                <mat-spinner diameter="18"></mat-spinner>
              } @else {
                <mat-icon>send</mat-icon>
              }
            </button>
          </div>
        </div>
        <p class="input-hint">
          <mat-icon>info_outline</mat-icon>
          O assistente acessa apenas dados internos da plataforma — editais, leads e histórico.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .chat-page {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-height: calc(100vh - 64px);
      background: var(--content-bg, #F8FAFC);
      font-family: 'Inter Tight', sans-serif;
    }

    /* ── Header ──────────────────────────────────────────────────────── */
    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 28px;
      background: white;
      border-bottom: 1px solid #E2E8F0;
      flex-shrink: 0;

      @media (max-width: 600px) { padding: 14px 16px; }
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .ai-avatar {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, #0DA66E, #107357);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        color: white;
      }
    }

    .header-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary, #0D1526);
      margin: 0 0 3px;
    }

    .header-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-muted, #64748B);
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #11BF7F;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .clear-btn {
      border-color: #E2E8F0 !important;
      color: var(--text-muted, #64748B) !important;
      border-radius: 8px !important;
      font-size: 13px !important;
      gap: 6px;

      &:hover { background: var(--content-bg, #F1F5F9) !important; color: var(--text-primary, #0D1526) !important; }

      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    /* ── Messages ────────────────────────────────────────────────────── */
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      scroll-behavior: smooth;

      @media (max-width: 600px) { padding: 16px; }
    }

    /* ── Empty State ─────────────────────────────────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 48px 24px;
      margin: auto;
      max-width: 520px;

      h2 {
        font-size: 22px;
        font-weight: 700;
        color: var(--text-primary, #0D1526);
        margin: 16px 0 8px;
      }

      p {
        font-size: 14px;
        color: var(--text-muted, #64748B);
        line-height: 1.6;
        margin-bottom: 28px;
      }
    }

    .empty-icon {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      background: linear-gradient(135deg, rgba(17,191,127,0.06), #DBEAFE);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #0DA66E;
      }
    }

    .quick-prompts {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
    }

    .prompt-chip {
      background: white;
      border: 1px solid #E2E8F0;
      border-radius: 20px;
      padding: 8px 16px;
      font-size: 13px;
      color: var(--text-secondary, #475569);
      cursor: pointer;
      transition: all 150ms ease;
      font-family: inherit;

      &:hover {
        border-color: #0DA66E;
        color: #0DA66E;
        background: rgba(17,191,127,0.06);
        transform: translateY(-1px);
      }
    }

    /* ── Message rows ────────────────────────────────────────────────── */
    .message-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;

      &.user {
        flex-direction: row-reverse;

        .message-bubble {
          background: #0DA66E;
          color: white;
          border-radius: 16px 4px 16px 16px;

          .msg-time { color: rgba(255,255,255,0.6); }
        }
      }
    }

    .msg-avatar {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 13px;
      font-weight: 700;

      &.ai {
        background: linear-gradient(135deg, rgba(17,191,127,0.06), #DBEAFE);
        mat-icon { font-size: 18px; width: 18px; height: 18px; color: #0DA66E; }
      }

      &.user {
        background: linear-gradient(135deg, #0DA66E, #107357);
        color: white;
      }
    }

    .message-bubble {
      background: white;
      border: 1px solid #E2E8F0;
      border-radius: 4px 16px 16px 16px;
      padding: 12px 16px;
      max-width: min(640px, 80%);
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      position: relative;

      &.loading { padding: 14px 20px; }
    }

    .msg-content {
      font-size: 14px;
      line-height: 1.65;
      color: inherit;
      white-space: pre-wrap;
      word-break: break-word;

      ::ng-deep strong { font-weight: 700; }
    }

    .msg-time {
      display: block;
      font-size: 11px;
      color: var(--text-muted, #94A3B8);
      margin-top: 6px;
      text-align: right;
    }

    /* ── Sources ─────────────────────────────────────────────────────── */
    .msg-sources {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #F1F5F9;
    }

    .sources-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted, #94A3B8);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 6px;
    }

    .sources-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .source-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--content-bg, #F8FAFC);
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 11.5px;
      color: var(--text-secondary, #475569);

      mat-icon { font-size: 13px; width: 13px; height: 13px; color: #11BF7F; }
    }

    .relevance {
      background: rgba(17,191,127,0.08);
      color: #0DA66E;
      border-radius: 4px;
      padding: 1px 4px;
      font-weight: 700;
    }

    /* ── Typing dots ─────────────────────────────────────────────────── */
    .typing-dots {
      display: flex;
      gap: 5px;
      align-items: center;
      height: 20px;

      span {
        width: 7px;
        height: 7px;
        background: #94A3B8;
        border-radius: 50%;
        animation: bounce 1.2s infinite;

        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }

    @keyframes bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
      40% { transform: translateY(-6px); opacity: 1; }
    }

    /* ── Input ───────────────────────────────────────────────────────── */
    .input-area {
      flex-shrink: 0;
      padding: 16px 28px 20px;
      background: white;
      border-top: 1px solid #E2E8F0;

      @media (max-width: 600px) { padding: 12px 16px 16px; }
    }

    .input-wrapper {
      display: flex;
      gap: 10px;
      align-items: flex-end;
      background: var(--content-bg, #F8FAFC);
      border: 1.5px solid #E2E8F0;
      border-radius: 12px;
      padding: 8px 8px 8px 16px;
      transition: border-color 150ms, box-shadow 150ms;

      &:focus-within {
        border-color: #0DA66E;
        box-shadow: 0 0 0 3px rgba(37,99,235,0.08);
        background: white;
      }
    }

    .chat-input {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 14px;
      font-family: inherit;
      color: var(--text-primary, #0D1526);
      resize: none;
      line-height: 1.5;
      max-height: 140px;
      overflow-y: auto;

      &::placeholder { color: var(--text-muted, #94A3B8); }
    }

    .input-actions {
      display: flex;
      align-items: flex-end;
    }

    .send-btn {
      width: 38px;
      height: 38px;
      border: none;
      border-radius: 8px;
      background: #0DA66E;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 150ms ease;
      flex-shrink: 0;

      &:hover:not(:disabled) {
        background: #107357;
        transform: scale(1.05);
      }

      &:disabled {
        background: #CBD5E1;
        cursor: not-allowed;
        transform: none;
      }

      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      mat-spinner { margin: 0; }
    }

    .input-hint {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11.5px;
      color: var(--text-muted, #94A3B8);
      margin: 8px 0 0;

      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }
  `],
})
export class ChatComponent implements AfterViewChecked {
  chatSvc = inject(ChatService);

  @ViewChild('messagesEl') messagesEl!: ElementRef<HTMLDivElement>;

  inputCtrl = new FormControl('');
  quickPrompts = QUICK_PROMPTS;

  private shouldScroll = false;

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  send(): void {
    const content = this.inputCtrl.value?.trim();
    if (!content || this.chatSvc.loading()) return;
    this.inputCtrl.setValue('');
    this.shouldScroll = true;
    this.chatSvc.sendMessage(content);
    // reset textarea height
    const ta = document.querySelector<HTMLTextAreaElement>('.chat-input');
    if (ta) { ta.style.height = 'auto'; }
  }

  sendQuick(prompt: string): void {
    this.inputCtrl.setValue(prompt);
    this.send();
  }

  onEnter(event: Event): void {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) {
      ke.preventDefault();
      this.send();
    }
  }

  autoResize(event: Event): void {
    const ta = event.target as HTMLTextAreaElement;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  }

  clearChat(): void {
    this.chatSvc.clearConversation();
  }

  formatMessage(content: string): string {
    // Basic markdown bold
    return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  private scrollToBottom(): void {
    const el = this.messagesEl?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
