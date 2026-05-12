// src/app/features/dodf/configuracao/keyword-dialog/keyword-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DodfKeyword } from '../../../../core/models/dodf.model';

export interface KeywordDialogData {
  keyword?: DodfKeyword;
}

@Component({
  selector: 'app-keyword-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatSlideToggleModule],
  template: `
    <h2 mat-dialog-title>{{ data.keyword ? 'Editar Keyword' : 'Nova Keyword' }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Termo</mat-label>
        <input matInput [(ngModel)]="termo" placeholder="ex: licitação, pregão" required />
      </mat-form-field>
      <mat-slide-toggle [(ngModel)]="ativo">Ativo</mat-slide-toggle>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!termo.trim()" (click)="confirm()">
        {{ data.keyword ? 'Salvar' : 'Criar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; margin-bottom: 16px; }`]
})
export class KeywordDialogComponent {
  termo: string;
  ativo: boolean;

  constructor(
    public dialogRef: MatDialogRef<KeywordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: KeywordDialogData
  ) {
    this.termo = this.data.keyword?.termo ?? '';
    this.ativo = this.data.keyword?.ativo ?? true;
  }

  confirm(): void {
    if (!this.termo.trim()) return;
    this.dialogRef.close({ termo: this.termo.trim(), ativo: this.ativo });
  }
}
