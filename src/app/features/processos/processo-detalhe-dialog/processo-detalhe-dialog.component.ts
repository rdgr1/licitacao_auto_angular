import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { ProcessoService } from '../../../core/services/processo.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  ProcessoLicitatorio,
  EditalArquivo,
  StatusProcesso,
} from '../../../core/models/processo.model';

const STATUS_META: Record<
  StatusProcesso,
  { label: string; bg: string; color: string; dot: string; icon: string }
> = {
  ELABORANDO_PROPOSTA: {
    label: 'Elaborando Proposta',
    bg: '#EFF6FF',
    color: '#1E40AF',
    dot: '#3B82F6',
    icon: 'edit_document',
  },
  DOCUMENTACAO: {
    label: 'Documentação',
    bg: '#F5F3FF',
    color: '#5B21B6',
    dot: '#8B5CF6',
    icon: 'folder_open',
  },
  AGUARDANDO_ABERTURA: {
    label: 'Aguard. Abertura',
    bg: '#FFFBEB',
    color: '#92400E',
    dot: '#F59E0B',
    icon: 'schedule',
  },
  EM_DISPUTA: {
    label: 'Em Disputa',
    bg: '#FEF2F2',
    color: '#991B1B',
    dot: '#EF4444',
    icon: 'gavel',
  },
  NEGOCIACAO: {
    label: 'Negociação',
    bg: '#FFF7ED',
    color: '#9A3412',
    dot: '#F97316',
    icon: 'handshake',
  },
  GANHO: { label: 'Ganho', bg: '#F0FDF4', color: '#166534', dot: '#10B981', icon: 'emoji_events' },
  PERDIDO: {
    label: 'Perdido',
    bg: '#F8FAFC',
    color: '#64748B',
    dot: '#94A3B8',
    icon: 'sentiment_dissatisfied',
  },
};

const NEXT_STATUS: Partial<Record<StatusProcesso, StatusProcesso>> = {
  ELABORANDO_PROPOSTA: 'DOCUMENTACAO',
  DOCUMENTACAO: 'AGUARDANDO_ABERTURA',
  AGUARDANDO_ABERTURA: 'EM_DISPUTA',
  EM_DISPUTA: 'NEGOCIACAO',
};

const ORG_COLORS = [
  '#E91E63',
  '#9C27B0',
  '#673AB7',
  '#3F51B5',
  '#2196F3',
  '#0097A7',
  '#00897B',
  '#43A047',
  '#FB8C00',
  '#E53935',
];

@Component({
  selector: 'app-processo-detalhe-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <div
      class="pd-shell"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="'pd-title-' + processo.uuid"
    >
      <!-- ── Header ─────────────────────────────────────────────────── -->
      <header class="pd-header">
        <div class="pd-header-top">
          <div class="pd-badges" role="group" aria-label="Classificações do processo">
            <span
              class="fonte-badge fonte-{{ processo.fonte.toLowerCase() }}"
              [attr.aria-label]="'Fonte: ' + processo.fonte"
            >
              {{ processo.fonte }}
            </span>
          </div>
          <div class="pd-header-right">
            <span
              class="status-pill"
              [style.background]="statusMeta.bg"
              [style.color]="statusMeta.color"
              role="status"
              [attr.aria-label]="'Status atual: ' + statusMeta.label"
            >
              <span class="sdot" [style.background]="statusMeta.dot" aria-hidden="true"></span>
              {{ statusMeta.label }}
            </span>
            <button class="close-btn" mat-dialog-close aria-label="Fechar dialog">
              <mat-icon aria-hidden="true">close</mat-icon>
            </button>
          </div>
        </div>
        <h2 class="pd-title" [id]="'pd-title-' + processo.uuid">
          {{ normalizeCase(processo.titulo) }}
        </h2>
      </header>

      <!-- ── Info bar ────────────────────────────────────────────────── -->
      <div class="pd-infobar" role="region" aria-label="Metadados do processo">
        <div class="info-item">
          <span class="org-avatar" [style.background]="orgColor(processo.orgao)" aria-hidden="true">
            {{ orgInitial(processo.orgao) }}
          </span>
          <div>
            <span class="info-k">Órgão</span>
            <span class="info-v">{{ processo.orgao }}</span>
          </div>
        </div>
        <div class="infobar-sep" aria-hidden="true"></div>
        <div class="info-item">
          <mat-icon class="info-icon" aria-hidden="true">calendar_today</mat-icon>
          <div>
            <span class="info-k">Criado em</span>
            <span class="info-v">{{ formatDate(processo.criadoEm) }}</span>
          </div>
        </div>
        @if (processo.responsavel) {
          <div class="infobar-sep" aria-hidden="true"></div>
          <div class="info-item">
            <mat-icon class="info-icon" aria-hidden="true">person</mat-icon>
            <div>
              <span class="info-k">Responsável</span>
              <span class="info-v">{{ processo.responsavel }}</span>
            </div>
          </div>
        }
      </div>

      <!-- ── Editais ─────────────────────────────────────────────────── -->
      <section class="pd-section" aria-labelledby="pd-editais-heading">
        <h3 class="section-heading" id="pd-editais-heading">
          <mat-icon aria-hidden="true">description</mat-icon>Editais
        </h3>

        @if (loadingEditais()) {
          <div class="section-loading" role="status" aria-live="polite" aria-busy="true">
            <mat-spinner diameter="14" />
            <span>Buscando editais...</span>
          </div>
        } @else if (editais().length === 0) {
          <div class="empty-card" role="status" aria-live="polite">
            <mat-icon aria-hidden="true">cloud_download</mat-icon>
            <div>
              <span>Nenhum edital disponível ainda.</span>
              <small>O download pode estar em andamento.</small>
            </div>
          </div>
        } @else {
          <ul class="editais-list" aria-label="Editais anexados ao processo">
            @for (edital of editais(); track edital.uuid) {
              <li class="edital-row">
                <div class="edital-info">
                  <mat-icon class="pdf-icon" aria-hidden="true">picture_as_pdf</mat-icon>
                  <div>
                    <span class="edital-name">Edital v{{ edital.versao }}</span>
                    @if (edital.tamanhoBytes) {
                      <span class="edital-size">{{ formatBytes(edital.tamanhoBytes) }}</span>
                    }
                    @if (edital.pendenteDownload) {
                      <span class="pending-badge" role="status">Download pendente</span>
                    }
                  </div>
                </div>
                <div
                  class="edital-actions"
                  role="group"
                  [attr.aria-label]="'Links do edital versão ' + edital.versao"
                >
                  @if (edital.urlOrigem) {
                    <a
                      mat-icon-button
                      [href]="edital.urlOrigem"
                      target="_blank"
                      rel="noopener noreferrer"
                      [attr.aria-label]="
                        'Abrir edital v' + edital.versao + ' na fonte original (nova aba)'
                      "
                    >
                      <mat-icon aria-hidden="true">open_in_new</mat-icon>
                    </a>
                  }
                  @if (edital.storagePath && !edital.pendenteDownload) {
                    <a
                      mat-icon-button
                      [href]="downloadUrl(edital.uuid)"
                      target="_blank"
                      [attr.aria-label]="'Baixar PDF do edital v' + edital.versao"
                    >
                      <mat-icon aria-hidden="true">download</mat-icon>
                    </a>
                  }
                </div>
              </li>
            }
          </ul>
        }
      </section>

      <!-- ── Ações rápidas ───────────────────────────────────────────── -->
      <section class="pd-section" aria-labelledby="pd-acoes-heading">
        <h3 class="section-heading" id="pd-acoes-heading">
          <mat-icon aria-hidden="true">bolt</mat-icon>Ações Rápidas
        </h3>
        <div class="quick-actions" role="group" aria-label="Ações disponíveis para este processo">
          <button
            class="qa-btn qa-impugnar"
            type="button"
            (click)="irParaImpugnacao()"
            aria-label="Abrir motor de impugnação — análise e geração de petição com IA"
          >
            <mat-icon aria-hidden="true">gavel</mat-icon>
            <span class="qa-label">Impugnar</span>
            <span class="qa-sub">Motor de IA</span>
          </button>
          <button
            class="qa-btn qa-cotacao"
            type="button"
            (click)="irParaCotacao()"
            aria-label="Abrir cotação — gerenciar itens e preços"
          >
            <mat-icon aria-hidden="true">request_quote</mat-icon>
            <span class="qa-label">Cotação</span>
            <span class="qa-sub">Itens e preços</span>
          </button>
        </div>
      </section>

      <!-- ── Footer / Status actions ────────────────────────────────── -->
      <footer class="pd-actions">
        <button mat-button mat-dialog-close class="act-close" aria-label="Fechar sem alterações">
          Fechar
        </button>

        <div class="act-right" role="group" aria-label="Atualizar status do processo">
          @if (nextStatusMeta) {
            <button
              class="act-btn act-next"
              type="button"
              (click)="advanceStatus()"
              [disabled]="salvando"
              [attr.aria-label]="
                'Avançar para ' + nextStatusMeta.label + (salvando ? ' — aguarde' : '')
              "
            >
              @if (savingStatus() === nextStatusKey) {
                <span class="saving-dot" aria-hidden="true"></span>
              } @else {
                <mat-icon aria-hidden="true">{{ nextStatusMeta.icon }}</mat-icon>
              }
              {{ nextStatusMeta.label }}
            </button>
          }

          @if (canWin) {
            <button
              class="act-btn act-win"
              type="button"
              (click)="atualizarStatus('GANHO')"
              [disabled]="salvando"
              aria-label="Marcar processo como ganho"
            >
              @if (savingStatus() === 'GANHO') {
                <span class="saving-dot" aria-hidden="true"></span>
              } @else {
                <mat-icon aria-hidden="true">emoji_events</mat-icon>
              }
              Ganho
            </button>
          }

          @if (canLose) {
            <button
              class="act-btn act-lose"
              type="button"
              (click)="atualizarStatus('PERDIDO')"
              [disabled]="salvando"
              aria-label="Marcar processo como perdido"
            >
              @if (savingStatus() === 'PERDIDO') {
                <span class="saving-dot" aria-hidden="true"></span>
              } @else {
                <mat-icon aria-hidden="true">sentiment_dissatisfied</mat-icon>
              }
            </button>
          }
          @if (processo.status === 'PERDIDO') {
            <button
              class="act-btn act-lose act-lose-on"
              type="button"
              (click)="atualizarStatus('NEGOCIACAO')"
              [disabled]="salvando"
              aria-label="Processo marcado como perdido — clique para reabrir em Negociação"
              matTooltip="Reabrir processo"
            >
              @if (savingStatus() === 'NEGOCIACAO') {
                <span class="saving-dot" aria-hidden="true"></span>
              } @else {
                <mat-icon aria-hidden="true">sentiment_dissatisfied</mat-icon>
              }
              Perdido
            </button>
          }

          @if (processo.status === 'GANHO') {
            <div class="act-done act-won" role="status" aria-live="polite">
              <mat-icon aria-hidden="true">emoji_events</mat-icon>Ganho
            </div>
          }
        </div>
      </footer>
    </div>
  `,
  styles: [
    `
      /* ── Shell ────────────────────────────────────────────────────────── */
      .pd-shell {
        display: flex;
        flex-direction: column;
        width: 100%;
        background: var(--card-bg, #fff);
        border-radius: 16px;
        overflow: hidden;
      }

      /* ── Header ───────────────────────────────────────────────────────── */
      .pd-header {
        padding: 1.25rem 1.375rem 1rem;
        border-bottom: 1px solid #f1f5f9;
      }
      .pd-header-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.625rem;
        margin-bottom: 0.75rem;
      }
      .pd-badges {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        flex-wrap: wrap;
      }
      .fonte-badge {
        font-size: 9px;
        font-weight: 800;
        border-radius: 4px;
        padding: 2px 7px;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        &.fonte-dodf {
          background: #fffbeb;
          color: #92400e;
          border: 1px solid #fde68a;
        }
        &.fonte-pncp {
          background: #f5f3ff;
          color: #5b21b6;
          border: 1px solid #ddd6fe;
        }
        &.fonte-dou {
          background: #eff6ff;
          color: #1e40af;
          border: 1px solid #bfdbfe;
        }
      }
      .pd-header-right {
        display: flex;
        align-items: center;
        gap: 0.375rem;
      }
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.3125rem;
        border-radius: 1.25rem;
        font-size: 11px;
        font-weight: 600;
        padding: 0.1875rem 0.625rem;
      }
      .sdot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .close-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 0;
        transition: background 140ms;
        flex-shrink: 0;
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          line-height: 18px;
          color: var(--text-muted, #94a3b8);
        }
        &:hover {
          background: rgba(0, 0, 0, 0.06);
        }
        &:focus-visible {
          outline: 2px solid #11bf7f;
          outline-offset: 2px;
        }
      }
      .pd-title {
        font-size: 15px;
        font-weight: 700;
        color: var(--text-primary, #0f172a);
        margin: 0;
        line-height: 1.5;
      }

      /* ── Info bar ─────────────────────────────────────────────────────── */
      .pd-infobar {
        display: flex;
        align-items: stretch;
        background: var(--content-bg, #f8fafc);
        border-bottom: 1px solid #f1f5f9;
        flex-wrap: wrap;
      }
      .info-item {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.75rem 1.125rem;
      }
      .infobar-sep {
        width: 1px;
        background: #e8edf5;
        flex-shrink: 0;
        margin: 0.5rem 0;
      }
      .org-avatar {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        color: #fff;
        flex-shrink: 0;
        font-size: 12px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .info-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--text-muted, #94a3b8);
        flex-shrink: 0;
      }
      .info-k {
        display: block;
        font-size: 9.5px;
        font-weight: 700;
        color: var(--text-muted, #94a3b8);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-bottom: 1px;
        font-family: var(--font-secondary);
      }
      .info-v {
        display: block;
        font-size: 12.5px;
        font-weight: 500;
        color: var(--text-primary, #1e293b);
      }

      /* ── Sections ─────────────────────────────────────────────────────── */
      .pd-section {
        border-top: 1px solid #f1f5f9;
        padding: 0.875rem 1.375rem;
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
      }
      .section-heading {
        display: flex;
        align-items: center;
        gap: 0.3125rem;
        font-size: 11px;
        font-weight: 700;
        color: var(--text-secondary, #475569);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin: 0;
        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
          color: #11bf7f;
        }
      }
      .section-loading {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12.5px;
        color: var(--text-muted, #64748b);
      }
      .empty-card {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        background: var(--content-bg, #f8fafc);
        border: 1px dashed #cbd5e1;
        border-radius: 10px;
        font-size: 13px;
        color: var(--text-muted, #64748b);
        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: var(--text-muted, #cbd5e1);
          flex-shrink: 0;
        }
        div {
          flex: 1;
          span,
          small {
            display: block;
          }
          small {
            font-size: 11px;
            color: var(--text-muted, #94a3b8);
            font-family: var(--font-secondary);
          }
        }
      }

      /* ── Editais list ─────────────────────────────────────────────────── */
      .editais-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-height: 12.5rem;
        overflow-y: auto;
        &::-webkit-scrollbar {
          width: 4px;
        }
        &::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }
      }
      .edital-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.625rem 0.875rem;
        background: var(--content-bg, #f8fafc);
        border: 1px solid #e2e8f0;
        border-left: 3px solid #11bf7f;
        border-radius: 0.625rem;
      }
      .edital-info {
        display: flex;
        align-items: center;
        gap: 0.625rem;
      }
      .pdf-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        color: #ef4444;
      }
      .edital-name {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary, #1e293b);
      }
      .edital-size {
        display: block;
        font-size: 11px;
        color: var(--text-muted, #94a3b8);
        font-family: var(--font-secondary);
      }
      .pending-badge {
        display: inline-block;
        margin-top: 2px;
        font-size: 10px;
        font-weight: 600;
        background: #fef3c7;
        color: #92400e;
        border-radius: 4px;
        padding: 1px 6px;
      }
      .edital-actions {
        display: flex;
        gap: 2px;
      }

      /* ── Quick actions ────────────────────────────────────────────────── */
      .quick-actions {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
      }
      .qa-btn {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.125rem;
        padding: 0.75rem 0.875rem;
        border-radius: 0.625rem;
        border: 1.5px solid #e2e8f0;
        background: var(--content-bg, #f8fafc);
        cursor: pointer;
        transition: all 140ms;
        font-family: inherit;
        text-align: left;
        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          margin-bottom: 4px;
        }
        &:hover {
          border-color: var(--text-muted, #cbd5e1);
          background: var(--content-bg, #f1f5f9);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
        }
        &:focus-visible {
          outline: 2px solid #11bf7f;
          outline-offset: 2px;
        }
      }
      .qa-label {
        font-size: 13px;
        font-weight: 700;
        color: var(--text-primary, #1e293b);
        line-height: 1.2;
      }
      .qa-sub {
        font-size: 10.5px;
        font-weight: 500;
        color: var(--text-muted, #94a3b8);
        font-family: var(--font-secondary);
      }
      .qa-impugnar {
        mat-icon {
          color: #ef4444;
        }
        &:hover {
          border-color: #fca5a5;
          background: #fff1f2;
          .qa-label {
            color: #991b1b;
          }
        }
      }
      .qa-cotacao {
        mat-icon {
          color: #3b82f6;
        }
        &:hover {
          border-color: #bfdbfe;
          background: #eff6ff;
          .qa-label {
            color: #1e40af;
          }
        }
      }

      /* ── Footer ───────────────────────────────────────────────────────── */
      .pd-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.625rem;
        padding: 0.875rem 1.125rem;
        border-top: 1px solid #f1f5f9;
        background: var(--content-bg, #fafbfc);
      }
      .act-close {
        color: var(--text-muted, #64748b);
        font-size: 13px;
      }
      .act-right {
        display: flex;
        align-items: center;
        gap: 0.375rem;
      }
      .act-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.3125rem;
        padding: 0.4375rem 0.875rem;
        border-radius: 0.5rem;
        border: 1.5px solid transparent;
        font-size: 12.5px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: all 130ms;
        mat-icon {
          font-size: 15px;
          width: 15px;
          height: 15px;
        }
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        &:focus-visible {
          outline: 2px solid #11bf7f;
          outline-offset: 2px;
        }

        &.act-next {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #1e40af;
          .saving-dot {
            --spin-track: rgba(30, 64, 175, 0.2);
            --spin-color: #1e40af;
          }
          &:hover:not(:disabled) {
            background: #dbeafe;
          }
        }
        &.act-win {
          background: #11bf7f;
          border-color: #11bf7f;
          color: #fff;
          box-shadow: 0 2px 8px rgba(17, 191, 127, 0.25);
          &:hover:not(:disabled) {
            background: #0da66e;
          }
        }
        &.act-lose {
          background: transparent;
          border-color: #e2e8f0;
          color: var(--text-muted, #94a3b8);
          padding: 0.4375rem 0.625rem;
          .saving-dot {
            --spin-track: rgba(148, 163, 184, 0.3);
            --spin-color: var(--text-muted, #94a3b8);
          }
          &:hover:not(:disabled) {
            background: #fee2e2;
            border-color: #fca5a5;
            color: #ef4444;
          }
          &.act-lose-on {
            background: #fef2f2;
            border-color: #fca5a5;
            color: #ef4444;
            padding: 0.4375rem 0.875rem;
            .saving-dot {
              --spin-track: rgba(239, 68, 68, 0.2);
              --spin-color: #ef4444;
            }
            &:hover:not(:disabled) {
              background: var(--content-bg, #f8fafc);
              border-color: #e2e8f0;
              color: var(--text-muted, #94a3b8);
            }
          }
        }
      }
      .saving-dot {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        flex-shrink: 0;
        border: 2px solid var(--spin-track, rgba(255, 255, 255, 0.4));
        border-top-color: var(--spin-color, #fff);
        animation: spin 0.7s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .saving-dot {
          animation: none;
          opacity: 0.6;
        }
        .qa-btn,
        .act-btn,
        .close-btn {
          transition: none;
        }
      }
      .act-done {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 12.5px;
        font-weight: 600;
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
        &.act-won {
          color: #11bf7f;
        }
        &.act-lost {
          color: var(--text-muted, #94a3b8);
        }
      }
    `,
  ],
})
export class ProcessoDetalheDialogComponent implements OnInit {
  private svc = inject(ProcessoService);
  private toast = inject(ToastService);
  private router = inject(Router);

  loadingEditais = signal(true);
  editais = signal<EditalArquivo[]>([]);
  savingStatus = signal<StatusProcesso | null>(null);

  get salvando(): boolean {
    return this.savingStatus() !== null;
  }

  constructor(
    public dialogRef: MatDialogRef<ProcessoDetalheDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public processo: ProcessoLicitatorio,
  ) {}

  ngOnInit(): void {
    this.svc.listarEditais(this.processo.uuid).subscribe({
      next: (e) => {
        this.editais.set(e ?? []);
        this.loadingEditais.set(false);
      },
      error: () => this.loadingEditais.set(false),
    });
  }

  get statusMeta() {
    return STATUS_META[this.processo.status] ?? STATUS_META['ELABORANDO_PROPOSTA'];
  }
  get nextStatusKey(): StatusProcesso | null {
    return NEXT_STATUS[this.processo.status] ?? null;
  }
  get nextStatusMeta() {
    return this.nextStatusKey ? STATUS_META[this.nextStatusKey] : null;
  }
  get canWin(): boolean {
    return this.processo.status === 'EM_DISPUTA' || this.processo.status === 'NEGOCIACAO';
  }
  get canLose(): boolean {
    return this.processo.status !== 'GANHO' && this.processo.status !== 'PERDIDO';
  }
  get isPerdido(): boolean {
    return this.processo.status === 'PERDIDO';
  }

  advanceStatus(): void {
    const next = this.nextStatusKey;
    if (next) this.atualizarStatus(next);
  }

  atualizarStatus(status: StatusProcesso): void {
    this.savingStatus.set(status);
    this.svc.atualizarStatus(this.processo.uuid, status).subscribe({
      next: () => {
        this.toast.success(STATUS_META[status].label);
        this.dialogRef.close(true);
      },
      error: () => {
        this.toast.error('Erro ao atualizar status');
        this.savingStatus.set(null);
      },
    });
  }

  irParaImpugnacao(): void {
    this.dialogRef.close();
    this.router.navigate(['/impugnacao']);
  }
  irParaCotacao(): void {
    this.dialogRef.close();
    this.router.navigate(['/cotacao/itens']);
  }

  orgColor(name: string): string {
    return ORG_COLORS[(name?.charCodeAt(0) ?? 0) % ORG_COLORS.length];
  }
  orgInitial(name: string): string {
    return name?.charAt(0).toUpperCase() ?? '?';
  }
  downloadUrl(uuid: string): string {
    return this.svc.downloadUrl(uuid);
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    try {
      const dt = iso.includes('T') ? new Date(iso) : new Date(iso + 'T00:00:00');
      return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return iso;
    }
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }

  normalizeCase(text: string): string {
    if (!text) return '';
    const isAllCaps = text === text.toUpperCase() && /[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ]/.test(text);
    if (!isAllCaps) return text;
    return text.toLowerCase().replace(/(^\s*\S|[.!?]\s+\S)/g, (c) => c.toUpperCase());
  }
}
