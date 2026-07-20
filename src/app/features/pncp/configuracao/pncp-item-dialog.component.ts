import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { PNCP_MODALIDADES_CATALOGO, SIGLAS_UF } from '../../../core/models/pncp.model';

export type PncpDialogMode = 'modalidade' | 'uf';

export interface PncpItemDialogData {
  mode: PncpDialogMode;
  editando: boolean;
  codigoAtual?: number;
  nomeAtual?: string;
  siglaAtual?: string;
  ativoAtual?: boolean;
}

@Component({
  selector: 'app-pncp-item-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ data.editando ? 'edit' : 'add' }}</mat-icon>
      {{ data.editando ? 'Editar' : data.mode === 'modalidade' ? 'Nova Modalidade' : 'Nova UF' }}
    </h2>

    <mat-dialog-content>
      @if (data.mode === 'modalidade') {
        <!-- Select com todos os códigos PNCP oficiais -->
        <mat-form-field appearance="outline" style="width:100%; margin-top:10px">
          <mat-label>Modalidade</mat-label>
          <mat-select [(ngModel)]="selectedCodigo" (ngModelChange)="onModalidadeSelect($event)">
            @for (m of catalogo; track m.codigo) {
              <mat-option [value]="m.codigo">
                <span class="opt-code">{{ m.codigo }}</span>
                <span class="opt-sep">·</span>
                {{ m.nome }}
              </mat-option>
            }
          </mat-select>
          <mat-hint>Código oficial usado na API do PNCP</mat-hint>
        </mat-form-field>

        @if (selectedCodigo) {
          <div class="selected-preview">
            <span class="preview-code">Código {{ selectedCodigo }}</span>
            <span class="preview-name">{{ nomeResolvido }}</span>
          </div>
        }
      } @else {
        <!-- Select com todas as UFs brasileiras -->
        <mat-form-field appearance="outline" style="width:100%; margin-top:10px">
          <mat-label>Estado (UF)</mat-label>
          <mat-select [(ngModel)]="sigla">
            @for (uf of siglas; track uf) {
              <mat-option [value]="uf">{{ uf }}</mat-option>
            }
          </mat-select>
          <mat-hint>Sigla do estado a monitorar no PNCP</mat-hint>
        </mat-form-field>
      }

      <div style="margin-top: 16px">
        <mat-slide-toggle [(ngModel)]="ativo" color="primary">
          {{ ativo ? 'Ativo — incluído nas buscas' : 'Inativo — ignorado nas buscas' }}
        </mat-slide-toggle>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="salvar()" [disabled]="!canSave()">
        {{ data.editando ? 'Salvar' : 'Adicionar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      h2 mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        vertical-align: middle;
        margin-right: 0.375rem;
      }
      .opt-code {
        font-family: 'JetBrains Mono', 'Courier New', monospace;
        font-size: 12px;
        font-weight: 700;
        color: #0da66e;
        min-width: 20px;
        display: inline-block;
      }
      .opt-sep {
        color: var(--text-muted, #cbd5e1);
        margin: 0 0.25rem;
      }
      .selected-preview {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        background: rgba(17, 191, 127, 0.06);
        border: 1px solid rgba(17, 191, 127, 0.2);
        border-radius: 0.5rem;
        padding: 0.5rem 0.75rem;
        margin-top: -0.25rem;
      }
      .preview-code {
        font-family: 'JetBrains Mono', 'Courier New', monospace;
        font-size: 13px;
        font-weight: 800;
        color: #0da66e;
      }
      .preview-name {
        font-size: 13px;
        font-weight: 500;
        color: var(--text-primary, #1e293b);
      }
    `,
  ],
})
export class PncpItemDialogComponent {
  catalogo = PNCP_MODALIDADES_CATALOGO;
  siglas = SIGLAS_UF;

  selectedCodigo: number | null;
  sigla: string;
  ativo: boolean;

  constructor(
    public dialogRef: MatDialogRef<PncpItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PncpItemDialogData,
  ) {
    this.selectedCodigo = data.codigoAtual ?? null;
    this.sigla = data.siglaAtual ?? '';
    this.ativo = data.ativoAtual ?? true;
  }

  get nomeResolvido(): string {
    return this.catalogo.find((m) => m.codigo === this.selectedCodigo)?.nome ?? '';
  }

  onModalidadeSelect(codigo: number): void {
    this.selectedCodigo = codigo;
  }

  canSave(): boolean {
    return this.data.mode === 'modalidade' ? !!this.selectedCodigo : !!this.sigla;
  }

  salvar(): void {
    if (!this.canSave()) return;
    if (this.data.mode === 'modalidade') {
      this.dialogRef.close({
        codigo: this.selectedCodigo,
        nome: this.nomeResolvido,
        ativo: this.ativo,
      });
    } else {
      this.dialogRef.close({ sigla: this.sigla, ativo: this.ativo });
    }
  }
}
