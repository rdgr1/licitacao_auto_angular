import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { EditaisService } from '../../../core/services/editais.service';
import { ToastService } from '../../../core/services/toast.service';
import { EditalResponse } from '../../../core/models/edital.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { CurrencyBrPipe } from '../../../shared/pipes/currency-br.pipe';
import { DateBrPipe } from '../../../shared/pipes/date-br.pipe';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ItensDialogComponent } from '../../regras/itens-dialog/itens-dialog.component';

@Component({
  selector: 'app-editais-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatDividerModule,
    MatMenuModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    CurrencyBrPipe,
    DateBrPipe,
    TruncatePipe,
  ],
  templateUrl: './editais-list.component.html',
  styleUrl: './editais-list.component.scss'
})
export class EditaisListComponent implements OnInit {
  private editaisService = inject(EditaisService);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading = signal(false);
  dataSource = new MatTableDataSource<EditalResponse>([]);
  displayedColumns = ['numero', 'objeto', 'modalidade', 'valorEstimado', 'dataAbertura', 'status', 'actions'];

  ngOnInit() {
    this.loadEditais();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadEditais() {
    this.loading.set(true);
    this.editaisService.getAll().subscribe({
      next: (editais) => {
        this.dataSource.data = editais;
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar editais');
        this.loading.set(false);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  viewDetails(edital: EditalResponse) {
    this.router.navigate(['/editais', edital.id]);
  }

  verItens(edital: EditalResponse): void {
    this.editaisService.getItens(edital.id).subscribe({
      next: (itens) => {
        this.dialog.open(ItensDialogComponent, {
          data: { editalId: edital.id, numero: edital.numero, itens },
          width: '720px',
          maxWidth: '95vw',
        });
      },
      error: () => this.toast.error('Erro ao carregar itens do edital'),
    });
  }

  delete(edital: EditalResponse) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Excluir Edital',
        message: `Deseja realmente excluir o edital ${edital.numero}?`,
        confirmLabel: 'Excluir',
        danger: true,
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.editaisService.delete(edital.id).subscribe({
          next: () => {
            this.toast.success(`Edital ${edital.numero} excluído`);
            this.loadEditais();
          },
          error: () => this.toast.error('Erro ao excluir edital'),
        });
      }
    });
  }

  reprocessar(edital: EditalResponse) {
    this.editaisService.reprocessar(edital.id).subscribe({
      next: () => {
        this.toast.success(`Edital ${edital.numero} enviado para reprocessamento`);
        this.loadEditais();
      },
      error: () => this.toast.error('Erro ao reprocessar edital'),
    });
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(/_/g, '-');
  }
}
