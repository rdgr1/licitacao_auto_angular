import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { Fornecedor, CATEGORIAS_SERVICO } from '../../../../core/models/cotacao.model';

@Component({
  selector: 'app-fornecedor-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ editando ? 'Editar Fornecedor' : 'Novo Fornecedor' }}</h2>

    <mat-dialog-content>
      <div class="form-grid">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Nome do Fornecedor *</mat-label>
          <input
            matInput
            [(ngModel)]="form.nome"
            name="nome"
            required
            placeholder="Ex: Segurança Total Ltda."
          />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>E-mail *</mat-label>
          <mat-icon matPrefix>mail_outline</mat-icon>
          <input
            matInput
            [(ngModel)]="form.email"
            name="email"
            type="email"
            required
            placeholder="contato@fornecedor.com"
          />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>CNPJ</mat-label>
          <mat-icon matPrefix>badge</mat-icon>
          <input matInput [(ngModel)]="form.cnpj" name="cnpj" placeholder="00.000.000/0000-00" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>WhatsApp</mat-label>
          <mat-icon matPrefix>phone</mat-icon>
          <input
            matInput
            [(ngModel)]="form.whatsapp"
            name="whatsapp"
            placeholder="(61) 99999-0000"
          />
        </mat-form-field>

        <!-- Categorias -->
        <div class="field-block full">
          <label class="field-label">Categorias de serviço</label>
          <div class="cat-chips">
            @for (cat of categorias; track cat.key) {
              <button
                type="button"
                class="cat-chip"
                [class.selected]="isCatSelected(cat.key)"
                (click)="toggleCat(cat.key)"
              >
                <mat-icon>{{ cat.icon }}</mat-icon>
                {{ cat.label }}
              </button>
            }
          </div>
        </div>

        <!-- Ativo -->
        <div class="field-block">
          <label class="field-label">Status</label>
          <mat-slide-toggle [(ngModel)]="form.ativo" name="ativo" color="primary">
            {{ form.ativo ? 'Ativo' : 'Inativo' }}
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
        [disabled]="!form.nome || !form.email"
      >
        {{ editando ? 'Salvar' : 'Criar Fornecedor' }}
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
      .field-block {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      .field-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary, #475569);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .cat-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .cat-chip {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem 0.875rem;
        border-radius: 1.25rem;
        border: 1.5px solid #e2e8f0;
        background: transparent;
        color: var(--text-muted, #64748b);
        font-size: 13px;
        font-family: inherit;
        cursor: pointer;
        transition: all 150ms;
        mat-icon {
          font-size: 15px;
          width: 15px;
          height: 15px;
        }
        &:hover {
          border-color: var(--text-muted, #94a3b8);
        }
        &.selected {
          border-color: #11bf7f;
          background: rgba(16, 185, 129, 0.08);
          color: #0da66e;
          font-weight: 600;
        }
      }
    `,
  ],
})
export class FornecedorFormDialogComponent {
  categorias = CATEGORIAS_SERVICO;
  editando: boolean;
  form: Fornecedor;
  private selectedCats = new Set<string>();

  constructor(
    public dialogRef: MatDialogRef<FornecedorFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: Fornecedor | null,
  ) {
    this.editando = !!data;
    this.form = data
      ? { ...data }
      : { nome: '', email: '', cnpj: '', whatsapp: '', categorias: '', ativo: true };

    if (this.form.categorias) {
      this.form.categorias
        .split(',')
        .filter(Boolean)
        .forEach((k) => this.selectedCats.add(k.trim()));
    }
  }

  isCatSelected(key: string): boolean {
    return this.selectedCats.has(key);
  }

  toggleCat(key: string): void {
    this.selectedCats.has(key) ? this.selectedCats.delete(key) : this.selectedCats.add(key);
    this.form.categorias = Array.from(this.selectedCats).join(',');
  }

  salvar(): void {
    if (!this.form.nome || !this.form.email) return;
    this.dialogRef.close(this.form);
  }
}
