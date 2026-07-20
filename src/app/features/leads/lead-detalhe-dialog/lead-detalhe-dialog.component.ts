import { Component, Inject, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { interval, switchMap, first, of, take, tap } from 'rxjs';
import { Lead, LeadStatus } from '../../../core/models/lead.model';
import { EditalResponse } from '../../../core/models/edital.model';
import { BuscaEdital } from '../../../core/models/busca-edital.model';
import { ColetaPncpLeadStatus } from '../../../core/models/coleta-pncp-lead.model';
import { LeadService } from '../../../core/services/lead.service';
import { EditaisService } from '../../../core/services/editais.service';
import { ToastService } from '../../../core/services/toast.service';
import { OperationTrackerService } from '../../../core/services/operation-tracker.service';
import { CurrencyBrPipe } from '../../../shared/pipes/currency-br.pipe';
import { JustificativaDialogComponent } from '../../../shared/components/justificativa-dialog/justificativa-dialog.component';

// `cls` mapeia pra uma classe CSS (.status-pill.status-X), não pra hex direto — permite que
// o dark mode funcione via `var(--tint-*)`, diferente do `[style.x]` inline que tinha antes.
const STATUS_META: Record<LeadStatus, { label: string; cls: string }> = {
  DESCARTADO: { label: 'Descartado', cls: 'status-neutral' },
  NOVO: { label: 'Novo Lead', cls: 'status-blue' },
  APROVACAO_PRESIDENCIA: { label: 'Aprov. Presidência', cls: 'status-purple' },
  ESTUDO_VIABILIDADE: { label: 'Estudo e Viabilidade', cls: 'status-amber' },
  SEGUNDA_APROVACAO_PRESIDENCIA: { label: '2ª Aprov. Presidência', cls: 'status-green' },
  QUALIFICADO: { label: 'Qualificado', cls: 'status-green' },
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
  selector: 'app-lead-detalhe-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    CurrencyBrPipe,
    JustificativaDialogComponent,
  ],
  template: `
    <div class="ld-shell">
      <!-- Header -->
      <div class="ld-header">
        <div class="ld-header-top">
          <div class="ld-badges">
            <span class="fonte-badge fonte-{{ data.fonte?.toLowerCase() }}">{{ data.fonte }}</span>
            <span class="tipo-badge">{{ data.tipo }}</span>
          </div>
          <div class="ld-header-right">
            <span class="status-pill" [ngClass]="statusMeta.cls">
              <span class="sdot"></span>{{ statusMeta.label }}
            </span>
            <button class="close-btn" mat-dialog-close aria-label="Fechar">
              <mat-icon aria-hidden="true">close</mat-icon>
            </button>
          </div>
        </div>
        <h2 class="ld-title">{{ normalizeCase(data.titulo) }}</h2>
      </div>

      <!-- Info bar -->
      <div class="ld-infobar">
        <div class="info-item">
          <span class="org-avatar" [style.background]="orgColor(data.orgao)">{{
            orgInitial(data.orgao)
          }}</span>
          <div>
            <span class="info-k">Órgão</span><span class="info-v">{{ data.orgao }}</span>
          </div>
        </div>
        <div class="infobar-sep"></div>
        <div class="info-item">
          <mat-icon class="info-icon">calendar_today</mat-icon>
          <div>
            <span class="info-k">Publicação</span
            ><span class="info-v">{{ formatDate(data.dataPublicacao) }}</span>
          </div>
        </div>
        @if (data.revisadoPor) {
          <div class="infobar-sep"></div>
          <div class="info-item">
            <mat-icon class="info-icon">person</mat-icon>
            <div>
              <span class="info-k">Revisado por</span
              ><span class="info-v">{{ data.revisadoPor }}</span>
            </div>
          </div>
        }
      </div>

      <!-- Body -->
      <div class="ld-body">
        <p class="ld-texto">{{ data.texto || 'Texto completo não disponível.' }}</p>
        @if (data.observacao) {
          <div class="ld-obs">
            <mat-icon>sticky_note_2</mat-icon><span>{{ data.observacao }}</span>
          </div>
        }
      </div>

      <!-- Edital PNCP -->
      <div class="ld-edital-section">
        <div class="edital-header">
          <span class="edital-label"><mat-icon>description</mat-icon>Edital PNCP</span>
          <button
            class="btn-atualizar-editais"
            (click)="coletarPncpDoLead()"
            [disabled]="operationTracker.isLoading('coletar-pncp-' + data.uuid)()"
            matTooltip="Coleta manual do PNCP na janela de 30 dias deste lead — pode demorar"
          >
            @if (operationTracker.isLoading('coletar-pncp-' + data.uuid)()) {
              <mat-spinner diameter="14" />
              @if (coletaPncpProgress()?.fatiaAtual != null) {
                Coletando {{ coletaPncpProgress()!.fatiaAtual }}/{{
                  coletaPncpProgress()!.totalFatias
                }}
              } @else {
                Iniciando...
              }
            } @else {
              <mat-icon>sync</mat-icon>
              Atualizar editais
            }
          </button>
        </div>

        @if (operationTracker.isLoading('busca-edital-' + data.uuid)()) {
          <div class="edital-loading">
            <mat-spinner diameter="16" /><span>Buscando no PNCP...</span>
          </div>
        } @else if (edital()) {
          <div class="edital-card">
            <div class="edital-grid">
              <div class="ef">
                <span class="ek">Número</span><span class="ev mono">{{ edital()!.numero }}</span>
              </div>
              <div class="ef">
                <span class="ek">Modalidade</span
                ><span class="ev">{{ formatModalidade(edital()!.modalidade) }}</span>
              </div>
              <div class="ef">
                <span class="ek">Valor estimado</span
                ><span class="ev money">{{ edital()!.valorEstimado | currencyBr }}</span>
              </div>
              <div class="ef">
                <span class="ek">Abertura</span
                ><span class="ev">{{ formatDate(edital()!.dataAbertura) }}</span>
              </div>
            </div>
            <div class="edital-links">
              @if (edital()!.pdfUrl) {
                <a [href]="edital()!.pdfUrl" target="_blank" class="elink primary">
                  <mat-icon>picture_as_pdf</mat-icon>PDF do Edital
                </a>
              }
              @if (edital()!.sourceUrl) {
                <a [href]="edital()!.sourceUrl" target="_blank" class="elink">
                  <mat-icon>open_in_new</mat-icon>Ver no PNCP
                </a>
              }
            </div>
          </div>
        } @else if (editalError()) {
          <div class="edital-empty error">
            <mat-icon>search_off</mat-icon>
            <span>{{ editalError() }}</span>
            <button class="btn-buscar" (click)="buscarEdital()">Tentar novamente</button>
          </div>
        } @else {
          <div class="edital-empty">
            <mat-icon>manage_search</mat-icon>
            <div>
              <span>Nenhum edital vinculado.</span>
              <small>Busca por proximidade de data e título no PNCP.</small>
            </div>
            <button
              class="btn-buscar"
              (click)="buscarEdital()"
              [disabled]="salvando || operationTracker.isLoading('busca-edital-' + data.uuid)()"
            >
              <mat-icon>search</mat-icon>Buscar no PNCP
            </button>
          </div>
        }
      </div>

      <!-- Actions -->
      <div class="ld-actions">
        <button mat-button mat-dialog-close class="act-close">Fechar</button>
        <div class="act-right">
          @if (data.status === 'DESCARTADO') {
            <button
              class="act-btn act-next"
              (click)="moverPara('NOVO')"
              [disabled]="operationTracker.isLoading('mover-lead-' + data.uuid)()"
            >
              <mat-icon>inbox</mat-icon>Mover para Novos Leads
            </button>
          }

          @if (data.status === 'NOVO') {
            <button
              class="act-btn act-discard"
              (click)="moverPara('DESCARTADO')"
              [disabled]="operationTracker.isLoading('mover-lead-' + data.uuid)()"
            >
              <mat-icon>block</mat-icon>
            </button>
            <button
              class="act-btn act-next"
              (click)="moverPara('APROVACAO_PRESIDENCIA')"
              [disabled]="operationTracker.isLoading('mover-lead-' + data.uuid)()"
            >
              <mat-icon>how_to_reg</mat-icon>Aprov. Presidência
            </button>
          }

          @if (data.status === 'APROVACAO_PRESIDENCIA') {
            <button
              class="act-btn act-discard"
              (click)="moverPara('DESCARTADO')"
              [disabled]="operationTracker.isLoading('mover-lead-' + data.uuid)()"
            >
              <mat-icon>block</mat-icon>
            </button>
            <button
              class="act-btn act-next"
              (click)="moverPara('ESTUDO_VIABILIDADE')"
              [disabled]="operationTracker.isLoading('mover-lead-' + data.uuid)()"
            >
              <mat-icon>science</mat-icon>Estudo e Viabilidade
            </button>
          }

          @if (data.status === 'ESTUDO_VIABILIDADE') {
            <button class="act-btn act-impugnar" (click)="irParaImpugnacao()">
              <mat-icon>gavel</mat-icon>Impugnar
            </button>
            <button class="act-btn act-cotacao" (click)="irParaCotacao()">
              <mat-icon>request_quote</mat-icon>Cotação
            </button>
            <button
              class="act-btn act-discard"
              (click)="moverPara('DESCARTADO')"
              [disabled]="operationTracker.isLoading('mover-lead-' + data.uuid)()"
            >
              <mat-icon>block</mat-icon>
            </button>
            <button
              class="act-btn act-next"
              (click)="moverPara('SEGUNDA_APROVACAO_PRESIDENCIA')"
              [disabled]="operationTracker.isLoading('mover-lead-' + data.uuid)()"
            >
              <mat-icon>verified_user</mat-icon>2ª Aprovação
            </button>
          }

          @if (data.status === 'SEGUNDA_APROVACAO_PRESIDENCIA') {
            <div class="act-pending">
              <mat-icon>hourglass_top</mat-icon>Aguardando aprovação da presidência
            </div>
            <button
              class="act-btn act-discard"
              (click)="moverPara('DESCARTADO')"
              [disabled]="operationTracker.isLoading('mover-lead-' + data.uuid)()"
            >
              <mat-icon>block</mat-icon>
            </button>
          }

          @if (data.status === 'QUALIFICADO') {
            <div class="act-done"><mat-icon>check_circle</mat-icon>Aprovado — em processo</div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .ld-shell {
        display: flex;
        flex-direction: column;
        width: 100%;
        background: var(--card-bg, #fff);
        border-radius: 1rem;
        overflow: hidden;
      }

      /* Header */
      .ld-header {
        padding: 1.25rem 1.375rem 1rem;
        border-bottom: 1px solid var(--border);
      }
      .ld-header-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.625rem;
        margin-bottom: 0.75rem;
      }
      .ld-badges {
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
          background: var(--fonte-dodf-bg);
          color: var(--fonte-dodf-color);
          border: 1px solid var(--border);
        }
        &.fonte-pncp {
          background: var(--fonte-pncp-bg);
          color: var(--fonte-pncp-color);
          border: 1px solid var(--border);
        }
        &.fonte-dou {
          background: var(--fonte-dou-bg);
          color: var(--fonte-dou-color);
          border: 1px solid var(--border);
        }
      }
      .tipo-badge {
        font-size: 10px;
        color: var(--text-muted, #94a3b8);
        background: var(--content-bg, #f8fafc);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 1px 7px;
        font-family: var(--font-secondary);
        font-weight: 600;
      }
      .ld-header-right {
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
      .status-pill.status-blue {
        background: var(--tint-blue-bg);
        color: var(--tint-blue-text);
      }
      .status-pill.status-purple {
        background: var(--tint-purple-bg);
        color: var(--tint-purple-text);
      }
      .status-pill.status-amber {
        background: var(--tint-amber-bg);
        color: var(--tint-amber-text);
      }
      .status-pill.status-green {
        background: var(--tint-green-bg);
        color: var(--tint-green-text);
      }
      .status-pill.status-neutral {
        background: var(--lead-desc-bg);
        color: var(--lead-desc-color);
      }
      .status-blue .sdot {
        background: var(--tint-blue-text);
      }
      .status-purple .sdot {
        background: var(--tint-purple-icon);
      }
      .status-amber .sdot {
        background: var(--tint-amber-text);
      }
      .status-green .sdot {
        background: var(--tint-green-text-strong);
      }
      .status-neutral .sdot {
        background: var(--lead-desc-color);
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
      }
      .ld-title {
        font-size: 15px;
        font-weight: 700;
        color: var(--text-primary, #0f172a);
        margin: 0;
        line-height: 1.5;
      }

      /* Info bar */
      .ld-infobar {
        display: flex;
        align-items: stretch;
        background: var(--content-bg, #f8fafc);
        border-bottom: 1px solid var(--border);
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
        background: var(--border);
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

      /* Body */
      .ld-body {
        padding: 1.125rem 1.375rem;
        overflow-y: auto;
        max-height: 11.25rem;
        &::-webkit-scrollbar {
          width: 4px;
        }
        &::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 4px;
        }
      }
      .ld-texto {
        font-size: 13.5px;
        line-height: 1.75;
        color: var(--text-secondary, #334155);
        margin: 0;
        white-space: pre-wrap;
      }
      .ld-obs {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.875rem;
        padding: 0.625rem 0.875rem;
        background: var(--tint-amber-bg);
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        font-size: 12.5px;
        color: var(--tint-amber-text);
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin-top: 1px;
        }
      }

      /* Edital section */
      .ld-edital-section {
        border-top: 1px solid var(--border);
        padding: 0.875rem 1.375rem;
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
      }
      .edital-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .edital-label {
        display: flex;
        align-items: center;
        gap: 0.3125rem;
        font-size: 11px;
        font-weight: 700;
        color: var(--text-secondary, #475569);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
          color: var(--brand-primary);
        }
      }
      .btn-atualizar-editais {
        display: flex;
        align-items: center;
        gap: 0.3125rem;
        background: none;
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 0.25rem 0.5rem;
        font-size: 11px;
        font-weight: 600;
        color: var(--text-secondary, #475569);
        cursor: pointer;

        &:hover:not(:disabled) {
          background: var(--content-bg);
          border-color: var(--text-muted);
        }
        &:disabled {
          opacity: 0.6;
          cursor: default;
        }
        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }
      .edital-loading {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 13px;
        color: var(--text-muted, #64748b);
      }
      .edital-card {
        background: var(--content-bg, #f8fafc);
        border: 1px solid var(--border);
        border-left: 3px solid var(--brand-primary);
        border-radius: 0.625rem;
        padding: 0.875rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .edital-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.625rem 1.25rem;
      }
      .ef {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .ek {
        font-size: 9.5px;
        font-weight: 700;
        color: var(--text-muted, #94a3b8);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-family: var(--font-secondary);
      }
      .ev {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary, #1e293b);
        &.mono {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 12px;
        }
        &.money {
          color: var(--tint-green-text-strong);
        }
      }
      .edital-links {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .elink {
        display: inline-flex;
        align-items: center;
        gap: 0.3125rem;
        padding: 0.3125rem 0.75rem;
        border-radius: 0.4375rem;
        text-decoration: none;
        font-size: 12px;
        font-weight: 600;
        transition: all 130ms;
        background: var(--content-bg, #f1f5f9);
        color: var(--text-secondary, #475569);
        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
        &.primary {
          background: var(--brand-primary);
          color: #fff;
          &:hover {
            background: var(--brand-primary-hover);
          }
        }
        &:not(.primary):hover {
          background: var(--border);
        }
      }
      .edital-empty {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        background: var(--content-bg, #f8fafc);
        border: 1px dashed var(--text-muted);
        border-radius: 0.625rem;
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
          span {
            display: block;
          }
          small {
            font-size: 11px;
            color: var(--text-muted, #94a3b8);
            font-family: var(--font-secondary);
          }
        }
        &.error mat-icon {
          color: var(--tint-red-text);
        }
      }
      .btn-buscar {
        display: inline-flex;
        align-items: center;
        gap: 0.3125rem;
        padding: 0.375rem 0.875rem;
        border-radius: 0.5rem;
        border: 1.5px solid var(--brand-primary);
        background: var(--brand-primary-light);
        color: var(--tint-green-text-strong);
        font-size: 12px;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
        transition: all 130ms;
        white-space: nowrap;
        mat-icon {
          font-size: 15px;
          width: 15px;
          height: 15px;
        }
        &:hover {
          background: var(--brand-primary);
          color: #fff;
        }
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      /* Actions */
      .ld-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.625rem;
        padding: 0.875rem 1.125rem;
        border-top: 1px solid var(--border);
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
        flex-wrap: wrap;
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
        &.act-next {
          background: var(--tint-blue-bg);
          border-color: var(--tint-blue-text);
          color: var(--tint-blue-text);
          &:hover:not(:disabled) {
            background: var(--content-bg);
          }
        }
        &.act-discard {
          background: transparent;
          border-color: var(--border);
          color: var(--text-muted, #94a3b8);
          padding: 0.4375rem 0.625rem;
          &:hover:not(:disabled) {
            background: var(--tint-red-bg);
            border-color: var(--tint-red-text);
            color: var(--status-erro);
          }
        }
        &.act-qualify {
          background: var(--brand-primary);
          border-color: var(--brand-primary);
          color: #fff;
          box-shadow: 0 2px 8px rgba(17, 191, 127, 0.25);
          &:hover:not(:disabled) {
            background: var(--brand-primary-hover);
          }
        }
        &.act-impugnar {
          background: var(--tint-red-bg);
          border-color: var(--tint-red-text);
          color: var(--tint-red-text-strong);
          &:hover {
            background: var(--content-bg);
          }
        }
        &.act-cotacao {
          background: var(--tint-blue-bg);
          border-color: var(--tint-blue-text);
          color: var(--tint-blue-text);
          &:hover {
            background: var(--content-bg);
          }
        }
      }
      .saving-dot {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.4);
        border-top-color: #fff;
        animation: spin 0.7s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .act-done {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 12.5px;
        font-weight: 600;
        color: var(--brand-primary);
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
      .act-pending {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 12px;
        font-weight: 500;
        color: var(--tint-purple-icon);
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    `,
  ],
})
export class LeadDetalheDialogComponent implements OnInit {
  private leadService = inject(LeadService);
  private editaisService = inject(EditaisService);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  readonly operationTracker = inject(OperationTrackerService);

  salvando = false;
  edital = signal<EditalResponse | null>(null);
  editalError = signal<string | null>(null);
  coletaPncpProgress = signal<ColetaPncpLeadStatus | null>(null);

  constructor(
    public dialogRef: MatDialogRef<LeadDetalheDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Lead,
  ) {}

  ngOnInit(): void {
    if (this.data.editalId) {
      this.editaisService.getById(this.data.editalId).subscribe({
        next: (e) => this.edital.set(e),
        error: () => {},
      });
    }
  }

  buscarEdital(): void {
    const key = `busca-edital-${this.data.uuid}`;
    this.editalError.set(null);

    // Máximo de 60 polls (2min) — evita que um backend travado em EM_ANDAMENTO
    // deixe a key ativa (e a barra global acesa) para sempre.
    const MAX_POLLS = 60;

    const inicia$ = this.leadService.buscarEdital(this.data.uuid).pipe(
      switchMap((registro) =>
        registro.status === 'EM_ANDAMENTO'
          ? interval(2000).pipe(
              take(MAX_POLLS),
              switchMap(() => this.leadService.statusBuscaEdital(this.data.uuid)),
              first((r) => r.status !== 'EM_ANDAMENTO'),
            )
          : of(registro),
      ),
    );

    this.operationTracker.run<BuscaEdital>(key, inicia$, {
      errorMessage: 'Erro ao buscar edital. Tente novamente.',
      onSuccess: (registro) => {
        if (registro.status === 'CONCLUIDA' && registro.editalId) {
          this.editaisService.getById(registro.editalId).subscribe({
            next: (e) => this.edital.set(e),
            error: () =>
              this.editalError.set('Edital encontrado, mas houve erro ao carregar os detalhes.'),
          });
        } else if (registro.status === 'NAO_ENCONTRADO') {
          this.editalError.set('Nenhum edital encontrado no PNCP para este lead.');
        } else {
          this.editalError.set(registro.mensagem || 'Erro ao buscar edital. Tente novamente.');
        }
      },
    });
  }

  coletarPncpDoLead(): void {
    const key = `coletar-pncp-${this.data.uuid}`;
    this.coletaPncpProgress.set(null);

    // Coleta em fatias de ~7 dias (até 5 fatias numa janela de 30 dias) — cada fatia pagina a
    // API do PNCP com rate limit/retry, pode demorar mais que a busca de edital (item 13).
    const MAX_POLLS = 90;

    const inicia$ = this.leadService.coletarPncp(this.data.uuid).pipe(
      tap((r) => this.coletaPncpProgress.set(r)),
      switchMap((registro) =>
        registro.status === 'EM_ANDAMENTO'
          ? interval(2000).pipe(
              take(MAX_POLLS),
              switchMap(() => this.leadService.statusColetaPncp(this.data.uuid)),
              tap((r) => this.coletaPncpProgress.set(r)),
              first((r) => r.status !== 'EM_ANDAMENTO'),
            )
          : of(registro),
      ),
    );

    this.operationTracker.run(key, inicia$, {
      errorMessage: 'Erro ao coletar editais PNCP para este lead.',
      onSuccess: (r) => {
        this.coletaPncpProgress.set(null);
        if (r.status === 'CONCLUIDA') {
          this.toast.success(`${r.salvos} edital(is) salvos, ${r.totalRelevantes} de interesse.`);
        } else {
          this.toast.error(r.mensagem || 'Erro ao coletar editais PNCP para este lead.');
        }
      },
    });
  }

  moverPara(status: LeadStatus): void {
    const label = STATUS_META[status].label;
    const ref = this.dialog.open(JustificativaDialogComponent, {
      data: { titulo: `Mover para ${label}` },
      width: '460px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((justificativa: string | undefined) => {
      if (!justificativa) return;
      this.operationTracker.run(
        `mover-lead-${this.data.uuid}`,
        this.leadService.atualizarStatus(this.data.uuid, {
          status,
          revisadoPor: 'analista@brasfort.com.br',
          observacao: justificativa,
        }),
        {
          successMessage: label,
          errorMessage: 'Erro ao atualizar status',
          onSuccess: () => this.dialogRef.close(true),
        },
      );
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

  get statusMeta() {
    return STATUS_META[this.data.status] ?? STATUS_META['NOVO'];
  }
  orgColor(name: string): string {
    return ORG_COLORS[(name?.charCodeAt(0) ?? 0) % ORG_COLORS.length];
  }
  orgInitial(name: string): string {
    return name?.charAt(0).toUpperCase() ?? '?';
  }

  formatDate(d: string): string {
    if (!d) return '';
    try {
      const dt = d.includes('T') ? new Date(d) : new Date(d + 'T00:00:00');
      return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return d;
    }
  }

  formatModalidade(m: string): string {
    return (
      m
        ?.replace(/_/g, ' ')
        .replace('ELETRONICO', 'ELETRÔNICO')
        .replace('CONCORRENCIA', 'CONCORRÊNCIA') ?? m
    );
  }

  normalizeCase(text: string): string {
    if (!text) return '';
    const isAllCaps = text === text.toUpperCase() && /[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ]/.test(text);
    if (!isAllCaps) return text;
    return text.toLowerCase().replace(/(^\s*\S|[.!?]\s+\S)/g, (c) => c.toUpperCase());
  }
}
