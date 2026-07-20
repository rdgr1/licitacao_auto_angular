import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface PromoverDialogData {
  numero: string;
  revisadoPorDefault: string;
}

@Component({
  selector: 'app-promover-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatFormFieldModule],
  template: `
    <h2 mat-dialog-title>Promover para Lead</h2>
    <mat-dialog-content>
      <p class="promover-desc">
        O edital <strong>{{ data.numero }}</strong> será promovido para Lead, mesmo tendo sido
        classificado automaticamente como fora de interesse.
      </p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Revisado por</mat-label>
        <input matInput [(ngModel)]="revisadoPor" required />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Observação (opcional)</mat-label>
        <textarea matInput [(ngModel)]="observacao" rows="3"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!revisadoPor.trim()" (click)="confirm()">
        Promover
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .promover-desc {
        font-size: 13px;
        color: var(--text-secondary, #475569);
        margin: 0 0 1rem;
      }
      .full-width {
        width: 100%;
      }
    `,
  ],
})
export class PromoverDialogComponent {
  revisadoPor: string;
  observacao = '';

  constructor(
    public dialogRef: MatDialogRef<PromoverDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PromoverDialogData,
  ) {
    this.revisadoPor = data.revisadoPorDefault;
  }

  confirm(): void {
    if (!this.revisadoPor.trim()) return;
    this.dialogRef.close({
      revisadoPor: this.revisadoPor.trim(),
      observacao: this.observacao.trim() || undefined,
    });
  }
}
