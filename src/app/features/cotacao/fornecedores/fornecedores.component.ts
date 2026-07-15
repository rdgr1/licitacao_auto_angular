import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CotacaoService } from '../../../core/services/cotacao.service';
import { ToastService } from '../../../core/services/toast.service';
import { OperationTrackerService } from '../../../core/services/operation-tracker.service';
import { Fornecedor, CATEGORIAS_SERVICO } from '../../../core/models/cotacao.model';
import { FornecedorFormDialogComponent } from './fornecedor-form-dialog/fornecedor-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';

@Component({
  selector: 'app-fornecedores',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatTooltipModule, MatProgressSpinnerModule,
    MatPaginatorModule, TruncatePipe,
  ],
  template: `
    <div class="page-shell">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Fornecedores</h1>
          <p class="page-sub">Cadastro de fornecedores para solicitações de cotação</p>
        </div>
        <button mat-flat-button color="primary" (click)="openForm(null)">
          <mat-icon>add</mat-icon>
          Novo Fornecedor
        </button>
      </div>

      <!-- Filtros -->
      <div class="filters-bar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <mat-label>Buscar por nome ou e-mail</mat-label>
          <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" />
          @if (searchQuery) {
            <button matSuffix mat-icon-button (click)="searchQuery = ''; onSearch()">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>

        <div class="cat-filter-chips">
          <button class="cat-chip" [class.active]="!selectedCat()" (click)="selectedCat.set(null)">
            Todos <span class="chip-count">{{ fornecedores().length }}</span>
          </button>
          @for (cat of categorias; track cat.key) {
            <button class="cat-chip" [class.active]="selectedCat() === cat.key"
                    (click)="selectedCat.set(cat.key)">
              <mat-icon>{{ cat.icon }}</mat-icon>
              {{ cat.label }}
            </button>
          }
        </div>
      </div>

      <!-- Tabela -->
      <div class="table-card">
        @if (loading()) {
          <div class="table-state"><mat-spinner diameter="32" /><span>Carregando...</span></div>
        } @else if (filtered().length === 0) {
          <div class="table-state">
            <mat-icon>storefront</mat-icon>
            <span>{{ searchQuery || selectedCat() ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado' }}</span>
            @if (!searchQuery && !selectedCat()) {
              <button mat-stroked-button (click)="openForm(null)">Cadastrar primeiro fornecedor</button>
            }
          </div>
        } @else {
          <table mat-table [dataSource]="filtered()" class="data-table">

            <!-- Avatar + Nome -->
            <ng-container matColumnDef="nome">
              <th mat-header-cell *matHeaderCellDef>Fornecedor</th>
              <td mat-cell *matCellDef="let row">
                <div class="cell-nome">
                  <div class="avatar" [style.background]="avatarColor(row.nome)">
                    {{ initials(row.nome) }}
                  </div>
                  <div>
                    <span class="nome-primary">{{ row.nome }}</span>
                    <span class="nome-secondary">{{ row.email }}</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- CNPJ -->
            <ng-container matColumnDef="cnpj">
              <th mat-header-cell *matHeaderCellDef>CNPJ</th>
              <td mat-cell *matCellDef="let row">
                <span class="text-muted">{{ row.cnpj || '—' }}</span>
              </td>
            </ng-container>

            <!-- WhatsApp -->
            <ng-container matColumnDef="whatsapp">
              <th mat-header-cell *matHeaderCellDef>WhatsApp</th>
              <td mat-cell *matCellDef="let row">
                @if (row.whatsapp) {
                  <div class="cell-whats">
                    <mat-icon>phone</mat-icon>
                    {{ row.whatsapp }}
                  </div>
                } @else {
                  <span class="text-muted">—</span>
                }
              </td>
            </ng-container>

            <!-- Categorias -->
            <ng-container matColumnDef="categorias">
              <th mat-header-cell *matHeaderCellDef>Categorias</th>
              <td mat-cell *matCellDef="let row">
                <div class="cat-chips-row">
                  @for (cat of parseCats(row.categorias); track cat) {
                    <span class="cat-badge">{{ catLabel(cat) }}</span>
                  }
                  @if (!row.categorias) { <span class="text-muted">—</span> }
                </div>
              </td>
            </ng-container>

            <!-- Status -->
            <ng-container matColumnDef="ativo">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row">
                <span class="status-badge" [class.ativo]="row.ativo" [class.inativo]="!row.ativo">
                  <span class="status-dot"></span>
                  {{ row.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
            </ng-container>

            <!-- Ações -->
            <ng-container matColumnDef="acoes">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <div class="actions-cell">
                  <button mat-icon-button matTooltip="Editar" (click)="openForm(row); $event.stopPropagation()">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Excluir" color="warn" (click)="confirmarExclusao(row); $event.stopPropagation()">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols" class="data-row" (click)="openForm(row)"></tr>
          </table>

          <mat-paginator [length]="totalElements()" [pageSize]="pageSize"
                         [pageSizeOptions]="[10, 25, 50]" (page)="onPage($event)" showFirstLastButtons />
        }
      </div>
    </div>
  `,
  styles: [`
    .page-shell { padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; max-width: 1400px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .page-title { font-size: 22px; font-weight: 700; color: #0D1526; margin: 0 0 4px; letter-spacing: -0.3px; }
    .page-sub   { font-size: 13px; color: #64748B; margin: 0; }

    .filters-bar { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .search-field { min-width: 280px; }

    .cat-filter-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .cat-chip {
      display: flex; align-items: center; gap: 5px;
      padding: 5px 12px; border-radius: 20px; border: 1.5px solid #E2E8F0;
      background: transparent; color: #64748B; font-size: 12.5px; font-family: inherit; cursor: pointer; transition: all 150ms;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
      &:hover { border-color: #94A3B8; color: #1E293B; }
      &.active { border-color: #11BF7F; background: rgba(16,185,129,0.08); color: #0DA66E; font-weight: 600; }
    }
    .chip-count { background: #E2E8F0; border-radius: 10px; font-size: 10px; font-weight: 700; padding: 0 5px; margin-left: 2px; }

    .table-card { background: #fff; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
    .data-table { width: 100%; }
    .data-row { cursor: pointer; transition: background 120ms; &:hover { background: #F8FAFC; } }

    .table-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 10px; padding: 56px 24px; color: #64748B; font-size: 14px;
      mat-icon { font-size: 36px; width: 36px; height: 36px; color: #CBD5E1; }
    }

    .cell-nome { display: flex; align-items: center; gap: 12px; }
    .avatar {
      width: 36px; height: 36px; border-radius: 10px; color: #fff;
      font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .nome-primary { display: block; font-size: 13.5px; font-weight: 600; color: #1E293B; }
    .nome-secondary { display: block; font-size: 12px; color: #64748B; }
    .text-muted { color: #94A3B8; font-size: 13px; }

    .cell-whats { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #374151;
      mat-icon { font-size: 14px; width: 14px; height: 14px; color: #11BF7F; } }

    .cat-chips-row { display: flex; flex-wrap: wrap; gap: 4px; }
    .cat-badge {
      font-size: 10px; font-weight: 600; border-radius: 5px; padding: 2px 7px;
      background: #F1F5F9; color: #475569; text-transform: uppercase; letter-spacing: 0.04em;
    }

    .status-badge {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 11.5px; font-weight: 600; border-radius: 20px; padding: 3px 10px;
      &.ativo   { background: #DCFCE7; color: #166534; }
      &.inativo { background: #F1F5F9; color: #64748B; }
    }
    .status-dot {
      width: 6px; height: 6px; border-radius: 50%;
      .ativo &   { background: #16A34A; }
      .inativo & { background: #94A3B8; }
    }

    .actions-cell { display: flex; gap: 2px; justify-content: flex-end; }

    @media (max-width: 767px) { .page-shell { padding: 16px; } .search-field { min-width: unset; width: 100%; } }
  `]
})
export class FornecedoresComponent implements OnInit {
  private svc    = inject(CotacaoService);
  private toast  = inject(ToastService);
  private dialog = inject(MatDialog);
  private tracker = inject(OperationTrackerService);

  categorias = CATEGORIAS_SERVICO;
  cols = ['nome', 'cnpj', 'whatsapp', 'categorias', 'ativo', 'acoes'];

  loading       = signal(true);
  fornecedores  = signal<Fornecedor[]>([]);
  totalElements = signal(0);
  currentPage   = signal(0);
  pageSize      = 25;
  selectedCat   = signal<string | null>(null);
  searchQuery   = '';

  filtered = computed(() => {
    let list = this.fornecedores();
    const cat = this.selectedCat();
    const q   = this.searchQuery.toLowerCase().trim();
    if (q) list = list.filter(f => f.nome.toLowerCase().includes(q) || f.email.toLowerCase().includes(q));
    if (cat) list = list.filter(f => f.categorias?.includes(cat));
    return list;
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.listarFornecedores({ page: this.currentPage(), size: this.pageSize }).subscribe({
      next: (p) => { this.fornecedores.set(p.content ?? []); this.totalElements.set(p.totalElements); this.loading.set(false); },
      error: () => { this.toast.error('Erro ao carregar fornecedores'); this.loading.set(false); }
    });
  }

  onSearch(): void { /* filtered() reacts to signal, client-side */ }

  onPage(e: PageEvent): void { this.currentPage.set(e.pageIndex); this.pageSize = e.pageSize; this.load(); }

  openForm(fornecedor: Fornecedor | null): void {
    const ref = this.dialog.open(FornecedorFormDialogComponent, { data: fornecedor, width: '600px', maxWidth: '95vw' });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const call = fornecedor?.id
        ? this.svc.atualizarFornecedor(fornecedor.id, result)
        : this.svc.criarFornecedor(result);
      this.tracker.run(`save-fornecedor-${fornecedor?.id ?? 'novo'}`, call, {
        successMessage: fornecedor ? 'Fornecedor atualizado' : 'Fornecedor criado',
        errorMessage: 'Erro ao salvar fornecedor',
        onSuccess: () => this.load(),
      });
    });
  }

  confirmarExclusao(f: Fornecedor): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Excluir Fornecedor', message: `Deseja excluir "${f.nome}"? Esta ação é irreversível.`, confirmLabel: 'Excluir', danger: true }
    });
    ref.afterClosed().subscribe(ok => {
      if (ok && f.id) {
        this.tracker.run(`delete-fornecedor-${f.id}`, this.svc.deletarFornecedor(f.id), {
          successMessage: 'Fornecedor excluído',
          errorMessage: 'Erro ao excluir',
          onSuccess: () => this.load(),
        });
      }
    });
  }

  parseCats(cats?: string): string[] { return cats ? cats.split(',').filter(Boolean) : []; }
  catLabel(key: string): string { return CATEGORIAS_SERVICO.find(c => c.key === key)?.label ?? key; }
  initials(nome: string): string { return nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase(); }
  avatarColor(nome: string): string {
    const colors = ['#3B82F6','#8B5CF6','#11BF7F','#F59E0B','#EF4444','#06B6D4','#F97316'];
    return colors[nome.charCodeAt(0) % colors.length];
  }
}
