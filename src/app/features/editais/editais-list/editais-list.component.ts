import { Component, OnInit, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { EditaisService } from '../../../core/services/editais.service';
import { ToastService } from '../../../core/services/toast.service';
import { EditalResponse, EditalStatus, EstatisticasDTO } from '../../../core/models/edital.model';
import { CurrencyBrPipe } from '../../../shared/pipes/currency-br.pipe';
import { DateBrPipe } from '../../../shared/pipes/date-br.pipe';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ItensDialogComponent } from '../itens-dialog/itens-dialog.component';

@Component({
  selector: 'app-editais-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    CurrencyBrPipe,
    DateBrPipe,
    TruncatePipe,
  ],
  templateUrl: './editais-list.component.html',
  styleUrl:    './editais-list.component.scss',
})
export class EditaisListComponent implements OnInit {
  private editaisService = inject(EditaisService);
  private toast          = inject(ToastService);
  private dialog         = inject(MatDialog);
  private router         = inject(Router);

  @ViewChild(MatSort) set matSort(s: MatSort) {
    if (s) this.dataSource.sort = s;
  }

  loading    = signal(false);
  dataSource = new MatTableDataSource<EditalResponse>([]);
  displayedColumns = ['numero', 'objeto', 'modalidade', 'valorEstimado', 'dataAbertura', 'status', 'actions'];

  selectedStatus = signal<EditalStatus | ''>('');
  searchText     = signal('');

  currentPage    = signal(0);
  pageSize       = signal(25);
  totalElements  = signal(0);

  statsData = signal<EstatisticasDTO | null>(null);

  totalEditais     = computed(() => this.statsData()?.totalEditais ?? 0);
  totalProcessados = computed(() => this.statsData()?.processados ?? 0);
  totalPendentes   = computed(() => this.statsData()?.pendentes ?? 0);
  totalErros       = computed(() => this.statsData()?.erros ?? 0);
  totalValor       = computed(() => this.statsData()?.valorTotalEstimado ?? 0);

  statusOptions = [
    { label: 'Todos',       value: '' as const,            cls: '' },
    { label: 'Processado',  value: 'PROCESSADO' as const,  cls: 'processado' },
    { label: 'Pendente',    value: 'PENDENTE' as const,    cls: 'pendente' },
    { label: 'Processando', value: 'PROCESSANDO' as const, cls: 'processando' },
    { label: 'Erro',        value: 'ERRO' as const,        cls: 'erro' },
    { label: 'Antecipado',  value: 'ANTECIPADO' as const,  cls: 'antecipado' },
    { label: 'Arquivado',   value: 'ARQUIVADO' as const,   cls: 'arquivado' },
  ];

  ngOnInit(): void {
    this.dataSource.filterPredicate = (row: EditalResponse, f: string) => {
      if (!f) return true;
      const q = f.toLowerCase();
      return (row.numero?.toLowerCase().includes(q) ||
              row.objeto?.toLowerCase().includes(q) ||
              row.orgaoOrigem?.toLowerCase().includes(q)) ?? false;
    };
    this.loadStats();
    this.loadEditais();
  }

  private loadStats(): void {
    this.editaisService.getStats().subscribe({
      next: (s) => this.statsData.set(s),
      error: (e) => console.warn('Stats unavailable', e),
    });
  }

  loadEditais(): void {
    this.loading.set(true);
    const rawStatus = this.selectedStatus();
    const status = rawStatus || undefined;
    this.editaisService.getAll({ page: this.currentPage(), size: this.pageSize(), status }).subscribe({
      next: (page) => {
        this.dataSource.data = page.content ?? [];
        this.totalElements.set(page.totalElements ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar editais');
        this.loading.set(false);
      },
    });
  }

  applyFilter(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value.trim().toLowerCase());
    this.currentPage.set(0);
    this.dataSource.filter = this.searchText();
  }

  onStatusFilter(status: string): void {
    this.selectedStatus.set(status as EditalStatus | '');
    this.currentPage.set(0);
    this.loadEditais();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadEditais();
  }

  statusCount(value: string): number | undefined {
    const s = this.statsData();
    if (!s) return undefined;
    if (!value) return s.totalEditais;
    const m: Record<string, number> = {
      PROCESSADO: s.processados,
      PENDENTE:   s.pendentes,
      ERRO:       s.erros,
    };
    return value in m ? m[value] : undefined;
  }

  viewDetails(edital: EditalResponse): void { this.router.navigate(['/editais', edital.id]); }

  verItens(edital: EditalResponse): void {
    this.editaisService.getItens(edital.id).subscribe({
      next: (itens) => this.dialog.open(ItensDialogComponent, {
        data: { editalId: edital.id, numero: edital.numero, itens },
        width: '720px', maxWidth: '95vw',
      }),
      error: () => this.toast.error('Erro ao carregar itens do edital'),
    });
  }

  reprocessar(edital: EditalResponse): void {
    this.editaisService.reprocessar(edital.id).subscribe({
      next: () => { this.toast.success(`Edital ${edital.numero} reprocessado`); this.loadEditais(); this.loadStats(); },
      error: () => this.toast.error('Erro ao reprocessar'),
    });
  }

  delete(edital: EditalResponse): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Excluir Edital', message: `Deseja excluir o edital ${edital.numero}?`, confirmLabel: 'Excluir', danger: true },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.editaisService.delete(edital.id).subscribe({
        next: () => { this.toast.success(`Edital ${edital.numero} excluído`); this.loadEditais(); this.loadStats(); },
        error: () => this.toast.error('Erro ao excluir edital'),
      });
    });
  }

  formatModalidade(m: string): string {
    return m?.replace(/_/g, ' ').replace('ELETRONICO', 'ELETRÔNICO').replace('CONCORRENCIA', 'CONCORRÊNCIA') ?? m;
  }

  formatStatus(s: string): string {
    const map: Record<string, string> = {
      PROCESSADO: 'Processado', PENDENTE: 'Pendente', PROCESSANDO: 'Processando',
      ERRO: 'Erro', ANTECIPADO: 'Antecipado', ARQUIVADO: 'Arquivado',
    };
    return map[s] ?? s;
  }

  getStatusClass(status: string): string { return status.toLowerCase().replace(/_/g, '-'); }

  isUrgent(data: string): boolean {
    if (!data) return false;
    const diff = new Date(data).getTime() - Date.now();
    return diff > 0 && diff < 3 * 86_400_000;
  }
}
