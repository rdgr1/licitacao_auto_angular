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
import { CotacaoService } from '../../../core/services/cotacao.service';
import { ToastService } from '../../../core/services/toast.service';
import { CatalogoItem, CATEGORIAS_SERVICO, UNIDADES_MEDIDA } from '../../../core/models/cotacao.model';
import { ItemFormDialogComponent } from './item-form-dialog/item-form-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';

@Component({
  selector: 'app-itens',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatTooltipModule, MatProgressSpinnerModule,
    TruncatePipe,
  ],
  template: `
    <div class="page-shell">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Catálogo de Itens</h1>
          <p class="page-sub">Itens padrão utilizados nas solicitações de cotação</p>
        </div>
        <button mat-flat-button color="primary" (click)="openForm(null)">
          <mat-icon>add</mat-icon>
          Novo Item
        </button>
      </div>

      <!-- Filtros -->
      <div class="filters-bar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <mat-label>Buscar item</mat-label>
          <input matInput [(ngModel)]="searchQuery" />
          @if (searchQuery) {
            <button matSuffix mat-icon-button (click)="searchQuery = ''">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>

        <div class="cat-filter-chips">
          <button class="cat-chip" [class.active]="!selectedCat()" (click)="selectedCat.set(null)">
            Todos <span class="chip-count">{{ itens().length }}</span>
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

      <!-- Tabela / Grid -->
      @if (loading()) {
        <div class="table-state"><mat-spinner diameter="32" /><span>Carregando itens...</span></div>
      } @else if (filtered().length === 0) {
        <div class="table-state">
          <mat-icon>inventory_2</mat-icon>
          <span>{{ searchQuery || selectedCat() ? 'Nenhum item encontrado' : 'Catálogo vazio' }}</span>
          @if (!searchQuery && !selectedCat()) {
            <button mat-stroked-button (click)="openForm(null)">Adicionar primeiro item</button>
          }
        </div>
      } @else {
        <div class="items-grid">
          @for (item of filtered(); track item.id) {
            <div class="item-card" (click)="openForm(item)">
              <div class="item-card-top">
                <div class="unidade-badge">{{ item.unidade }}</div>
                @if (item.categoria) {
                  <span class="cat-badge cat-{{ item.categoria }}">{{ catLabel(item.categoria) }}</span>
                }
                <span class="status-dot" [class.ativo]="item.ativo" [matTooltip]="item.ativo ? 'Ativo' : 'Inativo'"></span>
              </div>

              <p class="item-nome">{{ item.nome }}</p>

              @if (item.descricao) {
                <p class="item-descricao">{{ item.descricao | truncate:80 }}</p>
              }

              <div class="item-actions">
                <button mat-icon-button matTooltip="Editar" (click)="openForm(item); $event.stopPropagation()">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Excluir" color="warn"
                        (click)="confirmarExclusao(item); $event.stopPropagation()">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }

    </div>
  `,
  styles: [`
    .page-shell { padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .page-title { font-size: 22px; font-weight: 700; color: #0D1526; margin: 0 0 4px; letter-spacing: -0.3px; }
    .page-sub   { font-size: 13px; color: #64748B; margin: 0; }

    .filters-bar { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .search-field { min-width: 260px; }

    .cat-filter-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .cat-chip {
      display: flex; align-items: center; gap: 5px;
      padding: 5px 12px; border-radius: 20px; border: 1.5px solid #E2E8F0;
      background: transparent; color: #64748B; font-size: 12.5px; font-family: inherit; cursor: pointer; transition: all 150ms;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
      &:hover { border-color: #94A3B8; }
      &.active { border-color: #11BF7F; background: rgba(16,185,129,0.08); color: #0DA66E; font-weight: 600; }
    }
    .chip-count { background: #E2E8F0; border-radius: 10px; font-size: 10px; font-weight: 700; padding: 0 5px; }

    .table-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 10px; padding: 56px 24px; color: #64748B; font-size: 14px;
      mat-icon { font-size: 40px; width: 40px; height: 40px; color: #CBD5E1; }
    }

    /* ── Grid de cards ── */
    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 14px;
    }

    .item-card {
      background: #fff; border-radius: 12px; border: 1px solid #E2E8F0;
      padding: 16px; cursor: pointer; transition: box-shadow 150ms, transform 150ms;
      display: flex; flex-direction: column; gap: 8px;
      &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.09); transform: translateY(-2px); }
    }

    .item-card-top {
      display: flex; align-items: center; gap: 6px;
    }

    .unidade-badge {
      font-size: 10px; font-weight: 800; border-radius: 6px;
      padding: 2px 8px; background: #F1F5F9; color: #475569;
      letter-spacing: 0.06em; text-transform: uppercase;
    }

    .cat-badge {
      font-size: 10px; font-weight: 600; border-radius: 5px;
      padding: 2px 7px; background: #DBEAFE; color: #1E40AF;
      text-transform: uppercase; letter-spacing: 0.04em; flex: 1;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      &.cat-VIGILANCIA  { background: #DBEAFE; color: #1E40AF; }
      &.cat-LIMPEZA     { background: #DCFCE7; color: #166534; }
      &.cat-MAO_DE_OBRA { background: #EDE9FE; color: #5B21B6; }
      &.cat-BRIGADA     { background: #FEE2E2; color: #991B1B; }
      &.cat-COPEIRAGEM  { background: #FEF3C7; color: #92400E; }
    }

    .status-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #CBD5E1; flex-shrink: 0;
      &.ativo { background: #16A34A; }
    }

    .item-nome { font-size: 14px; font-weight: 700; color: #1E293B; margin: 0; line-height: 1.4; }
    .item-descricao { font-size: 12px; color: #64748B; margin: 0; line-height: 1.5; flex: 1; }

    .item-actions {
      display: flex; justify-content: flex-end; gap: 2px;
      margin-top: 4px; padding-top: 8px; border-top: 1px solid #F1F5F9;
    }

    @media (max-width: 767px) { .page-shell { padding: 16px; } }
  `]
})
export class ItensComponent implements OnInit {
  private svc    = inject(CotacaoService);
  private toast  = inject(ToastService);
  private dialog = inject(MatDialog);

  categorias  = CATEGORIAS_SERVICO;
  loading     = signal(true);
  itens       = signal<CatalogoItem[]>([]);
  selectedCat = signal<string | null>(null);
  searchQuery = '';

  filtered = computed(() => {
    let list = this.itens();
    const cat = this.selectedCat();
    const q   = this.searchQuery.toLowerCase().trim();
    if (q)   list = list.filter(i => i.nome.toLowerCase().includes(q) || i.descricao?.toLowerCase().includes(q));
    if (cat) list = list.filter(i => i.categoria === cat);
    return list;
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.listarItens({ size: 500 }).subscribe({
      next: (p) => { this.itens.set(p.content ?? []); this.loading.set(false); },
      error: () => { this.toast.error('Erro ao carregar itens'); this.loading.set(false); }
    });
  }

  openForm(item: CatalogoItem | null): void {
    const ref = this.dialog.open(ItemFormDialogComponent, { data: item, width: '560px', maxWidth: '95vw' });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const call = item?.id ? this.svc.atualizarItem(item.id, result) : this.svc.criarItem(result);
      call.subscribe({
        next: () => { this.toast.success(item ? 'Item atualizado' : 'Item criado'); this.load(); },
        error: () => this.toast.error('Erro ao salvar item'),
      });
    });
  }

  confirmarExclusao(item: CatalogoItem): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Excluir Item', message: `Deseja excluir "${item.nome}"?`, confirmLabel: 'Excluir', danger: true }
    });
    ref.afterClosed().subscribe(ok => {
      if (ok && item.id) {
        this.svc.deletarItem(item.id).subscribe({
          next: () => { this.toast.success('Item excluído'); this.load(); },
          error: () => this.toast.error('Erro ao excluir'),
        });
      }
    });
  }

  catLabel(key?: string): string { return CATEGORIAS_SERVICO.find(c => c.key === key)?.label ?? key ?? ''; }
}
