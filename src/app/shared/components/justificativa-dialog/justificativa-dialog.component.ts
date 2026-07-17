import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface JustificativaDialogData {
  titulo: string;
  placeholder?: string;
}

@Component({
  selector: 'app-justificativa-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatFormFieldModule],
  template: `
    <div class="jd-shell">
      <h2 class="jd-title">{{ data.titulo }}</h2>
      <p class="jd-sub">Informe o motivo da mudança de status.</p>
      <mat-form-field appearance="outline" class="jd-field">
        <mat-label>Justificativa</mat-label>
        <textarea matInput
                  [(ngModel)]="texto"
                  [placeholder]="data.placeholder ?? 'Descreva o motivo (mínimo 10 caracteres)...'"
                  rows="4"
                  maxlength="500"></textarea>
        <mat-hint align="end">{{ texto.length }}/500</mat-hint>
      </mat-form-field>
      <div class="jd-actions">
        <button mat-button (click)="cancelar()">Cancelar</button>
        <button mat-flat-button color="primary" [disabled]="!valido" (click)="confirmar()">
          Confirmar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .jd-shell {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 380px;
      max-width: 460px;
    }
    .jd-title { margin: 0; font-size: 16px; font-weight: 700; color: #0F172A; }
    .jd-sub   { margin: 0; font-size: 13px; color: var(--text-muted, #64748B); }
    .jd-field { width: 100%; }
    .jd-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 4px;
    }
  `],
})
export class JustificativaDialogComponent {
  texto = '';

  constructor(
    public dialogRef: MatDialogRef<JustificativaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: JustificativaDialogData,
  ) {}

  get valido(): boolean { return this.texto.trim().length >= 10; }

  confirmar(): void {
    if (this.valido) this.dialogRef.close(this.texto.trim());
  }

  cancelar(): void { this.dialogRef.close(undefined); }
}
