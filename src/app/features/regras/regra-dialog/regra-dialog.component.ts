import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';
import { RegraAnalise, TipoRegra, CategoriaLead } from '../../../core/models/edital.model';

@Component({
  selector: 'app-regra-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar Regra' : 'Nova Regra' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="regra-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tipo</mat-label>
          <mat-select formControlName="tipo">
            @for (t of tipos; track t) { <mat-option [value]="t">{{ t }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nome</mat-label>
          <input matInput formControlName="nome" placeholder="Nome único da regra">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Valor da Regra</mat-label>
          <input matInput formControlName="valorRegra" placeholder="Ex: vigilancia,seguranca ou 100000-5000000">
          <mat-hint>Keywords separadas por vírgula, ou faixa min-max para valores/prazos</mat-hint>
        </mat-form-field>
        <div class="row-2">
          <mat-form-field appearance="outline">
            <mat-label>Peso (0-100)</mat-label>
            <input matInput type="number" formControlName="peso" min="0" max="100">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Categoria</mat-label>
            <mat-select formControlName="categoria">
              <mat-option [value]="null">Nenhuma</mat-option>
              @for (c of categorias; track c) { <mat-option [value]="c">{{ c }}</mat-option> }
            </mat-select>
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descrição (opcional)</mat-label>
          <textarea matInput formControlName="descricao" rows="2"></textarea>
        </mat-form-field>
        <mat-slide-toggle formControlName="ativa" color="primary">Regra ativa</mat-slide-toggle>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">
        {{ data ? 'Salvar' : 'Criar Regra' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .regra-form { display: flex; flex-direction: column; gap: 8px; min-width: 480px; padding-top: 8px; }
    .full-width { width: 100%; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 599px) { .regra-form { min-width: unset; } .row-2 { grid-template-columns: 1fr; } }
  `]
})
export class RegraDialogComponent implements OnInit {
  private fb = inject(FormBuilder);

  tipos = Object.values(TipoRegra);
  categorias = Object.values(CategoriaLead);

  form = this.fb.group({
    tipo: [TipoRegra.KEYWORD_OBJETO, Validators.required],
    nome: ['', Validators.required],
    valorRegra: ['', Validators.required],
    peso: [30, [Validators.required, Validators.min(0), Validators.max(100)]],
    categoria: [null as CategoriaLead | null],
    descricao: [''],
    ativa: [true],
  });

  constructor(
    public dialogRef: MatDialogRef<RegraDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RegraAnalise | null
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue(this.data as never);
    }
  }

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
