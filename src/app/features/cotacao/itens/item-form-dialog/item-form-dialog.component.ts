import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  CatalogoItem,
  CATEGORIAS_SERVICO,
  UNIDADES_MEDIDA,
} from '../../../../core/models/cotacao.model';

@Component({
  selector: 'app-item-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ editando ? 'Editar Item' : 'Novo Item do Catálogo' }}</h2>

    <mat-dialog-content>
      <div class="form-grid">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Nome do Item *</mat-label>
          <input
            matInput
            [(ngModel)]="form.nome"
            name="nome"
            required
            placeholder="Ex: Vigilante Diurno"
          />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Descrição</mat-label>
          <textarea
            matInput
            [(ngModel)]="form.descricao"
            name="descricao"
            rows="3"
            placeholder="Especificações, requisitos, observações..."
          ></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Unidade de Medida *</mat-label>
          <mat-select [(ngModel)]="form.unidade" name="unidade" required>
            @for (u of unidades; track u) {
              <mat-option [value]="u">{{ u }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Categoria</mat-label>
          <mat-select [(ngModel)]="form.categoria" name="categoria">
            <mat-option [value]="null">Sem categoria</mat-option>
            @for (cat of categorias; track cat.key) {
              <mat-option [value]="cat.key">{{ cat.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="toggle-row full">
          <mat-slide-toggle [(ngModel)]="form.ativo" name="ativo" color="primary">
            {{ form.ativo ? 'Item ativo (disponível para cotação)' : 'Item inativo' }}
          </mat-slide-toggle>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        (click)="salvar()"
        [disabled]="!form.nome || !form.unidade"
      >
        {{ editando ? 'Salvar' : 'Criar Item' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        padding-top: 0.5rem !important;
      }
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 1rem;
        @media (max-width: 500px) {
          grid-template-columns: 1fr;
        }
      }
      .full {
        grid-column: 1 / -1;
      }
      .toggle-row {
        padding-bottom: 0.5rem;
      }
    `,
  ],
})
export class ItemFormDialogComponent {
  categorias = CATEGORIAS_SERVICO;
  unidades = UNIDADES_MEDIDA;
  editando: boolean;
  form: CatalogoItem;

  constructor(
    public dialogRef: MatDialogRef<ItemFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: CatalogoItem | null,
  ) {
    this.editando = !!data;
    this.form = data
      ? { ...data }
      : { nome: '', descricao: '', unidade: 'UN', categoria: undefined, ativo: true };
  }

  salvar(): void {
    if (!this.form.nome || !this.form.unidade) return;
    this.dialogRef.close(this.form);
  }
}
