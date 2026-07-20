import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-pncp-keyword-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>Nova Keyword</h2>
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
        Criar
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width {
        width: 100%;
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class PncpKeywordDialogComponent {
  termo = '';
  ativo = true;

  constructor(public dialogRef: MatDialogRef<PncpKeywordDialogComponent>) {}

  confirm(): void {
    if (!this.termo.trim()) return;
    this.dialogRef.close({ termo: this.termo.trim(), ativo: this.ativo });
  }
}
