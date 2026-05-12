import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Lead, LeadStatus } from '../../../core/models/lead.model';
import { LeadService } from '../../../core/services/lead.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-lead-detalhe-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatChipsModule, MatIconModule, MatDividerModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">{{ data.titulo }}</h2>
    <mat-dialog-content class="dialog-content">
      <div class="lead-meta">
        <span class="meta-item"><mat-icon>business</mat-icon>{{ data.orgao }}</span>
        <span class="meta-item"><mat-icon>category</mat-icon>{{ data.tipo }}</span>
        <span class="meta-item"><mat-icon>calendar_today</mat-icon>{{ data.dataPublicacao }}</span>
        <span class="meta-item"><mat-icon>source</mat-icon>{{ data.fonte }}</span>
      </div>
      <mat-divider class="divider" />
      <p class="lead-texto">{{ data.texto }}</p>
      @if (data.observacao) {
        <div class="observacao">
          <strong>Observação:</strong> {{ data.observacao }}
        </div>
      }
      @if (data.revisadoPor) {
        <p class="revisado">Revisado por {{ data.revisadoPor }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Fechar</button>
      @if (data.status !== 'EM_ANALISE') {
        <button mat-stroked-button (click)="atualizar('EM_ANALISE')" [disabled]="salvando">
          <mat-icon>hourglass_empty</mat-icon>Em Análise
        </button>
      }
      @if (data.status !== 'REJEITADO') {
        <button mat-stroked-button color="warn" (click)="atualizar('REJEITADO')" [disabled]="salvando">
          <mat-icon>close</mat-icon>Rejeitar
        </button>
      }
      @if (data.status !== 'APROVADO') {
        <button mat-flat-button color="primary" (click)="atualizar('APROVADO')" [disabled]="salvando">
          <mat-icon>check</mat-icon>Aprovar
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title { font-size: 16px; font-weight: 700; line-height: 1.4; padding-right: 8px; }
    .dialog-content { padding-top: 8px !important; }
    .lead-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 12px;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #64748B;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .divider { margin: 12px 0; }
    .lead-texto {
      font-size: 13px;
      line-height: 1.7;
      color: #374151;
      white-space: pre-wrap;
      max-height: 400px;
      overflow-y: auto;
      margin: 0;
    }
    .observacao {
      margin-top: 12px;
      padding: 8px 12px;
      background: #F8FAFC;
      border-radius: 6px;
      font-size: 12px;
      color: #64748B;
    }
    .revisado {
      margin-top: 8px;
      font-size: 11px;
      color: #94A3B8;
    }
  `]
})
export class LeadDetalheDialogComponent {
  private leadService = inject(LeadService);
  private toast = inject(ToastService);

  salvando = false;

  constructor(
    public dialogRef: MatDialogRef<LeadDetalheDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Lead
  ) {}

  atualizar(status: LeadStatus): void {
    this.salvando = true;
    this.leadService.atualizarStatus(this.data.uuid, {
      status,
      revisadoPor: 'analista@brasfort.com.br',
    }).subscribe({
      next: () => {
        this.toast.success(`Lead marcado como ${status.replace('_', ' ').toLowerCase()}`);
        this.dialogRef.close(true);
      },
      error: () => {
        this.toast.error('Erro ao atualizar status');
        this.salvando = false;
      },
    });
  }
}
