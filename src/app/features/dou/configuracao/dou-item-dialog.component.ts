import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';

export interface DouItemDialogData {
  label: string;
  campo: string;
  placeholder: string;
  editando: boolean;
  valorAtual?: string;
  ativoAtual?: boolean;
}

@Component({
  selector: 'app-dou-item-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ data.editando ? 'edit' : 'add' }}</mat-icon>
      {{ data.editando ? 'Editar' : 'Novo' }} {{ data.label }}
    </h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" style="width:100%; margin-top:10px">
        <mat-label>{{ data.campo }}</mat-label>
        <input matInput [(ngModel)]="valor" [placeholder]="data.placeholder" />
      </mat-form-field>
      <mat-slide-toggle [(ngModel)]="ativo" color="primary">
        {{ ativo ? 'Ativo' : 'Inativo' }}
      </mat-slide-toggle>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="salvar()" [disabled]="!valor.trim()">
        {{ data.editando ? 'Salvar alterações' : 'Criar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 mat-icon { font-size: 20px; width: 20px; height: 20px; vertical-align: middle; margin-right: 6px; }
  `]
})
export class DouItemDialogComponent {
  valor: string;
  ativo: boolean;

  constructor(
    public dialogRef: MatDialogRef<DouItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DouItemDialogData
  ) {
    this.valor = data.valorAtual ?? '';
    this.ativo = data.ativoAtual ?? true;
  }

  salvar(): void {
    if (!this.valor.trim()) return;
    this.dialogRef.close({ valor: this.valor.trim(), ativo: this.ativo });
  }
}
