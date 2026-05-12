// src/app/features/dodf/configuracao/tipo-abertura-dialog/tipo-abertura-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DodfTipoAbertura } from '../../../../core/models/dodf.model';

export interface TipoAberturaDialogData {
  tipo?: DodfTipoAbertura;
}

@Component({
  selector: 'app-tipo-abertura-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatSlideToggleModule],
  template: `
    <h2 mat-dialog-title>{{ data.tipo ? 'Editar Tipo de Abertura' : 'Novo Tipo de Abertura' }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Valor</mat-label>
        <input matInput [(ngModel)]="valor" placeholder="ex: AVISO DE LICITAÇÃO" required />
      </mat-form-field>
      <mat-slide-toggle [(ngModel)]="ativo">Ativo</mat-slide-toggle>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!valor.trim()" (click)="confirm()">
        {{ data.tipo ? 'Salvar' : 'Criar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; margin-bottom: 16px; }`]
})
export class TipoAberturaDialogComponent {
  valor: string;
  ativo: boolean;

  constructor(
    public dialogRef: MatDialogRef<TipoAberturaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TipoAberturaDialogData
  ) {
    this.valor = this.data.tipo?.valor ?? '';
    this.ativo = this.data.tipo?.ativo ?? true;
  }

  confirm(): void {
    if (!this.valor.trim()) return;
    this.dialogRef.close({ valor: this.valor.trim(), ativo: this.ativo });
  }
}
