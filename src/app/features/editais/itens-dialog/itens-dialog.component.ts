import { Component, Inject, computed, signal } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ItemEdital } from '../../../core/models/edital.model';

@Component({
  selector: 'app-itens-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    CurrencyPipe,
  ],
  template: `
    <h2 mat-dialog-title>Itens do Edital</h2>
    <mat-dialog-content>
      @if (data.itens.length === 0) {
        <p>Nenhum item encontrado.</p>
      } @else {
        <table mat-table [dataSource]="itensPagina()" class="itens-table">
          <ng-container matColumnDef="numero">
            <th mat-header-cell *matHeaderCellDef>#</th>
            <td mat-cell *matCellDef="let i">{{ i.numeroItem }}</td>
          </ng-container>
          <ng-container matColumnDef="descricao">
            <th mat-header-cell *matHeaderCellDef>Descrição</th>
            <td mat-cell *matCellDef="let i">{{ i.descricao }}</td>
          </ng-container>
          <ng-container matColumnDef="qtd">
            <th mat-header-cell *matHeaderCellDef>Qtd</th>
            <td mat-cell *matCellDef="let i">{{ i.quantidade }} {{ i.unidadeMedida }}</td>
          </ng-container>
          <ng-container matColumnDef="unitario">
            <th mat-header-cell *matHeaderCellDef>Unit.</th>
            <td mat-cell *matCellDef="let i">
              {{ i.valorUnitarioEstimado | currency: 'BRL' : 'symbol' : '1.2-2' : 'pt-BR' }}
            </td>
          </ng-container>
          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let i">
              <strong>{{ i.valorTotal | currency: 'BRL' : 'symbol' : '1.2-2' : 'pt-BR' }}</strong>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
        <mat-paginator
          [length]="data.itens.length"
          [pageSize]="pageSize()"
          [pageIndex]="pageIndex()"
          [pageSizeOptions]="[10, 25, 50]"
          [showFirstLastButtons]="true"
          (page)="onPageChange($event)"
        />
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Fechar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .itens-table {
        width: 100%;
        min-width: 37.5rem;
      }
      mat-dialog-content {
        max-height: 70vh;
        overflow: auto;
      }
    `,
  ],
})
export class ItensDialogComponent {
  cols = ['numero', 'descricao', 'qtd', 'unitario', 'total'];
  pageIndex = signal(0);
  pageSize = signal(10);

  itensPagina = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.data.itens.slice(start, start + this.pageSize());
  });

  constructor(
    public dialogRef: MatDialogRef<ItensDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { editalId: string; numero: string; itens: ItemEdital[] },
  ) {}

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }
}
