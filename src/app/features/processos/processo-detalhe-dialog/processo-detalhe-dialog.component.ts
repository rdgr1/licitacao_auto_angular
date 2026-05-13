import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProcessoService } from '../../../core/services/processo.service';
import { ProcessoLicitatorio, EditalArquivo, StatusProcesso } from '../../../core/models/processo.model';
import { environment } from '../../../../environments/environment';

const STATUS_LABELS: Record<StatusProcesso, string> = {
  ELABORANDO_PROPOSTA:  'Elaborando Proposta',
  DOCUMENTACAO:         'Documentação',
  AGUARDANDO_ABERTURA:  'Aguardando Abertura',
  EM_DISPUTA:           'Em Disputa',
  NEGOCIACAO:           'Negociação',
  GANHO:                'Ganho',
  PERDIDO:              'Perdido',
};

@Component({
  selector: 'app-processo-detalhe-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule, MatDividerModule, MatProgressSpinnerModule, MatTooltipModule],
  template: `
    <div class="dialog-shell">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-left">
          <div class="fonte-badge fonte-{{ processo.fonte?.toLowerCase() }}">{{ processo.fonte }}</div>
          <span class="status-badge status-{{ processo.status }}">{{ statusLabel(processo.status) }}</span>
        </div>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <h2 class="titulo">{{ processo.titulo }}</h2>
        <div class="meta-row">
          <span class="meta-item"><mat-icon>business</mat-icon>{{ processo.orgao }}</span>
          @if (processo.responsavel) {
            <span class="meta-item"><mat-icon>person</mat-icon>{{ processo.responsavel }}</span>
          }
          <span class="meta-item"><mat-icon>event</mat-icon>{{ formatDate(processo.criadoEm) }}</span>
        </div>

        <mat-divider class="divider" />

        <!-- Editais -->
        <div class="section-title">
          <mat-icon>description</mat-icon>
          Editais Anexados
        </div>

        @if (loadingEditais()) {
          <div class="center"><mat-spinner diameter="24" /></div>
        } @else if (editais().length === 0) {
          <div class="empty-editais">
            <mat-icon>cloud_download</mat-icon>
            <span>Nenhum edital disponível ainda</span>
            <small>O download do edital pode estar em andamento.</small>
          </div>
        } @else {
          <div class="editais-list">
            @for (edital of editais(); track edital.uuid) {
              <div class="edital-row">
                <div class="edital-info">
                  <mat-icon class="pdf-icon">picture_as_pdf</mat-icon>
                  <div>
                    <span class="edital-label">Edital v{{ edital.versao }}</span>
                    @if (edital.tamanhoBytes) {
                      <span class="edital-size">{{ formatBytes(edital.tamanhoBytes) }}</span>
                    }
                    @if (edital.pendenteDownload) {
                      <span class="pending-badge">Download pendente</span>
                    }
                  </div>
                </div>
                <div class="edital-actions">
                  @if (edital.urlOrigem) {
                    <a mat-icon-button [href]="edital.urlOrigem" target="_blank" matTooltip="Abrir fonte original">
                      <mat-icon>open_in_new</mat-icon>
                    </a>
                  }
                  @if (edital.storagePath && !edital.pendenteDownload) {
                    <a mat-icon-button [href]="downloadUrl(edital.uuid)" target="_blank" matTooltip="Baixar PDF">
                      <mat-icon>download</mat-icon>
                    </a>
                  }
                </div>
              </div>
            }
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Fechar</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-shell { min-width: 560px; max-width: 680px; }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px 0;
    }

    .header-left { display: flex; align-items: center; gap: 8px; }

    .fonte-badge {
      font-size: 10px; font-weight: 700; border-radius: 5px;
      padding: 2px 7px; text-transform: uppercase; letter-spacing: 0.05em;
      background: #E2E8F0; color: #475569;
      &.fonte-dodf { background: #FEF3C7; color: #92400E; }
      &.fonte-pncp { background: #EDE9FE; color: #5B21B6; }
    }

    .status-badge {
      font-size: 10px; font-weight: 700; border-radius: 10px;
      padding: 2px 10px; text-transform: uppercase; letter-spacing: 0.04em;
      background: #E2E8F0; color: #475569;
      &.status-ELABORANDO_PROPOSTA { background: #DBEAFE; color: #1E40AF; }
      &.status-DOCUMENTACAO { background: #EDE9FE; color: #5B21B6; }
      &.status-AGUARDANDO_ABERTURA { background: #FEF3C7; color: #92400E; }
      &.status-EM_DISPUTA { background: #FEE2E2; color: #991B1B; }
      &.status-NEGOCIACAO { background: #FFEDD5; color: #9A3412; }
      &.status-GANHO { background: #DCFCE7; color: #166534; }
      &.status-PERDIDO { background: #F1F5F9; color: #475569; }
    }

    .titulo {
      font-size: 18px; font-weight: 700; color: #0D1526;
      margin: 12px 0 10px; line-height: 1.4;
    }

    .meta-row { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 16px; }

    .meta-item {
      display: flex; align-items: center; gap: 4px;
      font-size: 13px; color: #64748B;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
    }

    .divider { margin: 0 0 16px; }

    .section-title {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 700; color: #1E293B;
      text-transform: uppercase; letter-spacing: 0.06em;
      margin-bottom: 12px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #64748B; }
    }

    .center { display: flex; justify-content: center; padding: 20px; }

    .empty-editais {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 24px 16px; color: #94A3B8; text-align: center;
      mat-icon { font-size: 32px; width: 32px; height: 32px; margin-bottom: 4px; }
      span { font-size: 14px; font-weight: 500; color: #64748B; }
      small { font-size: 12px; }
    }

    .editais-list { display: flex; flex-direction: column; gap: 8px; }

    .edital-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px; background: #F8FAFC; border: 1px solid #E2E8F0;
      border-radius: 8px;
    }

    .edital-info { display: flex; align-items: center; gap: 10px; }

    .pdf-icon { font-size: 24px; width: 24px; height: 24px; color: #EF4444; }

    .edital-label { font-size: 13px; font-weight: 600; color: #1E293B; display: block; }
    .edital-size  { font-size: 11px; color: #94A3B8; display: block; }

    .pending-badge {
      display: inline-block; font-size: 10px; font-weight: 600;
      background: #FEF3C7; color: #92400E; border-radius: 4px; padding: 1px 6px;
    }

    .edital-actions { display: flex; gap: 2px; }

    @media (max-width: 600px) { .dialog-shell { min-width: unset; } }
  `]
})
export class ProcessoDetalheDialogComponent implements OnInit {
  private svc = inject(ProcessoService);

  loadingEditais = signal(true);
  editais = signal<EditalArquivo[]>([]);

  constructor(
    public dialogRef: MatDialogRef<ProcessoDetalheDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public processo: ProcessoLicitatorio
  ) {}

  ngOnInit(): void {
    this.svc.listarEditais(this.processo.uuid).subscribe({
      next: (e) => { this.editais.set(e ?? []); this.loadingEditais.set(false); },
      error: () => this.loadingEditais.set(false),
    });
  }

  statusLabel(s: StatusProcesso): string { return STATUS_LABELS[s] ?? s; }

  downloadUrl(uuid: string): string { return this.svc.downloadUrl(uuid); }

  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }
}
