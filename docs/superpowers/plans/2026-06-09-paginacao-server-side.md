# Paginação Server-Side Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar paginação server-side a todos os recursos que o usuário vê como lista, usando um `PaginatorComponent` compartilhado.

**Architecture:** Criar `app-paginator` standalone em `shared/components/paginator` com inputs `page`/`totalPages`/`totalElements`/`pageSize` e output `pageChange`. Editais migra de client-side (MatTableDataSource.paginator) para server-side via evento `(page)` do MatPaginator + chamada ao serviço. Leads substitui controles manuais pelo componente compartilhado, tornando a paginação sempre visível.

**Tech Stack:** Angular 17+, Angular Material (MatPaginator, MatIcon), RxJS, TypeScript signals.

---

## Mapa de arquivos

| Ação | Arquivo |
|---|---|
| **Criar** | `src/app/shared/components/paginator/paginator.component.ts` |
| **Criar** | `src/app/shared/components/paginator/paginator.component.html` |
| **Criar** | `src/app/shared/components/paginator/paginator.component.scss` |
| **Modificar** | `src/app/core/services/editais.service.ts` |
| **Modificar** | `src/app/features/editais/editais-list/editais-list.component.ts` |
| **Modificar** | `src/app/features/editais/editais-list/editais-list.component.html` |
| **Modificar** | `src/app/features/leads/leads.component.ts` |
| **Modificar** | `src/app/features/leads/leads.component.html` |

---

## Task 1: Criar PaginatorComponent compartilhado

**Files:**
- Create: `src/app/shared/components/paginator/paginator.component.ts`
- Create: `src/app/shared/components/paginator/paginator.component.html`
- Create: `src/app/shared/components/paginator/paginator.component.scss`

- [ ] **Step 1: Criar o componente TypeScript**

Criar `src/app/shared/components/paginator/paginator.component.ts`:

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './paginator.component.html',
  styleUrl: './paginator.component.scss',
})
export class PaginatorComponent {
  @Input() page = 0;            // 0-indexed
  @Input() totalPages = 1;
  @Input() totalElements?: number;
  @Input() pageSize?: number;

  @Output() pageChange = new EventEmitter<number>();

  prev(): void {
    if (this.page > 0) this.pageChange.emit(this.page - 1);
  }

  next(): void {
    if (this.page + 1 < this.totalPages) this.pageChange.emit(this.page + 1);
  }
}
```

- [ ] **Step 2: Criar o template HTML**

Criar `src/app/shared/components/paginator/paginator.component.html`:

```html
<div class="paginator">
  <button class="page-btn" (click)="prev()" [disabled]="page === 0">
    <mat-icon>chevron_left</mat-icon>
  </button>
  <span class="page-info">
    Página {{ page + 1 }} de {{ totalPages }}
    @if (totalElements !== undefined) {
      <span class="total-hint">· {{ totalElements | number:'1.0-0' }} registro{{ totalElements !== 1 ? 's' : '' }}</span>
    }
  </span>
  <button class="page-btn" (click)="next()" [disabled]="page + 1 >= totalPages">
    <mat-icon>chevron_right</mat-icon>
  </button>
</div>
```

- [ ] **Step 3: Criar o SCSS**

Criar `src/app/shared/components/paginator/paginator.component.scss`:

```scss
.paginator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 4px 0;
}

.page-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  transition: all 150ms;

  mat-icon {
    font-size: 20px;
    width: 20px;
    height: 20px;
  }

  &:hover:not(:disabled) {
    background: #F1F5F9;
    border-color: #CBD5E1;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.page-info {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  text-align: center;
  white-space: nowrap;
}

.total-hint {
  font-weight: 400;
  color: #94A3B8;
  margin-left: 2px;
}
```

- [ ] **Step 4: Verificar build sem erros**

```bash
cd /Users/rrxx/rdPersonal/Trabalho/licitacao_auto_angular
npx ng build --configuration development 2>&1 | tail -20
```

Esperado: sem erros de compilação.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/components/paginator/
git commit -m "feat(shared): add PaginatorComponent with server-side pagination support"
```

---

## Task 2: Atualizar EditaisService.getAll() para server-side

**Files:**
- Modify: `src/app/core/services/editais.service.ts`

- [ ] **Step 1: Alterar assinatura de getAll()**

Em `src/app/core/services/editais.service.ts`, substituir o método `getAll()` atual:

```typescript
// ANTES
getAll(status?: EditalStatus): Observable<EditalResponse[]> {
  const params = status ? new HttpParams().set('status', status) : {};
  return this.http.get<Page<EditalResponse> | EditalResponse[]>(this.apiUrl, { params }).pipe(
    map(extractContent)
  );
}
```

pelo novo:

```typescript
// DEPOIS
getAll(opts: { page?: number; size?: number; status?: EditalStatus } = {}): Observable<Page<EditalResponse>> {
  let params = new HttpParams()
    .set('page', opts.page ?? 0)
    .set('size', opts.size ?? 25);
  if (opts.status) params = params.set('status', opts.status);
  return this.http.get<Page<EditalResponse>>(this.apiUrl, { params });
}
```

> **Nota:** A função `extractContent` e o `map(extractContent)` são removidos apenas deste método. Os demais métodos (`getProximos`, `getLeads`, etc.) que ainda usam `extractContent` devem ser mantidos como estão.

- [ ] **Step 2: Verificar build**

```bash
npx ng build --configuration development 2>&1 | grep -E "error|warning|Error" | head -20
```

Esperado: erros somente nos componentes que chamavam `getAll()` com assinatura antiga (editais-list). Zero erros em outros arquivos.

- [ ] **Step 3: Commit**

```bash
git add src/app/core/services/editais.service.ts
git commit -m "feat(editais): update getAll() to support server-side pagination"
```

---

## Task 3: Migrar EditaisListComponent para server-side pagination

**Files:**
- Modify: `src/app/features/editais/editais-list/editais-list.component.ts`
- Modify: `src/app/features/editais/editais-list/editais-list.component.html`

- [ ] **Step 1: Substituir o arquivo .ts completo**

Substituir o conteúdo de `src/app/features/editais/editais-list/editais-list.component.ts`:

```typescript
import { Component, OnInit, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
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
  totalPages       = computed(() => Math.ceil(this.totalElements() / this.pageSize()) || 1);

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
    });
  }

  loadEditais(): void {
    this.loading.set(true);
    const status = this.selectedStatus() as EditalStatus | undefined || undefined;
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
    this.dataSource.filter = this.searchText();
  }

  onStatusFilter(status: EditalStatus | ''): void {
    this.selectedStatus.set(status);
    this.currentPage.set(0);
    this.loadEditais();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadEditais();
  }

  statusCount(value: string): number {
    const s = this.statsData();
    if (!s) return 0;
    if (!value) return s.totalEditais;
    const m: Record<string, number> = {
      PROCESSADO: s.processados,
      PENDENTE:   s.pendentes,
      ERRO:       s.erros,
    };
    return m[value] ?? 0;
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
      next: () => { this.toast.success(`Edital ${edital.numero} reprocessado`); this.loadEditais(); },
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
        next: () => { this.toast.success(`Edital ${edital.numero} excluído`); this.loadEditais(); },
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
```

- [ ] **Step 2: Atualizar o template HTML — header e MatPaginator**

No arquivo `src/app/features/editais/editais-list/editais-list.component.html`, fazer duas substituições:

**2a.** Substituir a linha do subtítulo (linha 8):
```html
<!-- ANTES -->
        {{ dataSource.filteredData.length }}
        resultado{{ dataSource.filteredData.length !== 1 ? 's' : '' }}
```
```html
<!-- DEPOIS -->
        @if (searchText()) {
          {{ dataSource.filteredData.length }} resultado(s) nesta página
        } @else {
          {{ totalElements() | number:'1.0-0' }} registro(s)
        }
```

**2b.** Substituir o `<mat-paginator>` (atualmente nas linhas 211-214):
```html
<!-- ANTES -->
      <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]"
                     [pageSize]="25"
                     showFirstLastButtons
                     aria-label="Navegação de páginas" />
```
```html
<!-- DEPOIS -->
      <mat-paginator [pageSizeOptions]="[10, 25, 50, 100]"
                     [pageSize]="pageSize()"
                     [pageIndex]="currentPage()"
                     [length]="totalElements()"
                     showFirstLastButtons
                     (page)="onPageChange($event)"
                     aria-label="Navegação de páginas" />
```

- [ ] **Step 3: Verificar build**

```bash
npx ng build --configuration development 2>&1 | grep -E "^.*error" | head -20
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/features/editais/editais-list/editais-list.component.ts \
        src/app/features/editais/editais-list/editais-list.component.html
git commit -m "feat(editais): migrate to server-side pagination with stats API"
```

---

## Task 4: Atualizar LeadsComponent para usar app-paginator

**Files:**
- Modify: `src/app/features/leads/leads.component.ts`
- Modify: `src/app/features/leads/leads.component.html`

- [ ] **Step 1: Adicionar PaginatorComponent aos imports e método onPageChange**

Em `src/app/features/leads/leads.component.ts`:

**1a.** Adicionar import no topo do arquivo (após os imports existentes):
```typescript
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
```

**1b.** Adicionar `PaginatorComponent` ao array `imports` do decorator `@Component`:
```typescript
imports: [
  CommonModule, FormsModule, MatButtonModule, MatIconModule, MatTooltipModule,
  MatProgressSpinnerModule, MatDatepickerModule, MatFormFieldModule,
  MatInputModule, MatNativeDateModule, TruncatePipe,
  PaginatorComponent,  // ← adicionar aqui
],
```

**1c.** Substituir os métodos `onPrev()` e `onNext()` pelo novo `onPageChange()`:
```typescript
// REMOVER estes dois métodos:
onPrev(): void { if (this.currentPage() > 0) { this.currentPage.update(p => p - 1); this.carregarLeads(); } }
onNext(): void {
  if ((this.currentPage() + 1) * this.pageSize() < this.totalElements()) { this.currentPage.update(p => p + 1); this.carregarLeads(); }
}

// ADICIONAR este:
onPageChange(p: number): void {
  this.currentPage.set(p);
  this.carregarLeads();
}
```

- [ ] **Step 2: Substituir controles manuais de paginação no template**

Em `src/app/features/leads/leads.component.html`, substituir o bloco de paginação (linhas 403-414):

```html
<!-- ANTES -->
    <!-- Paginação simples -->
    @if (totalPages() > 1) {
      <div class="pagination">
        <button class="page-btn" (click)="onPrev()" [disabled]="currentPage() === 0">
          <mat-icon>chevron_left</mat-icon>
        </button>
        <span class="page-info">{{ currentPage() + 1 }} / {{ totalPages() }}</span>
        <button class="page-btn" (click)="onNext()" [disabled]="currentPage() + 1 >= totalPages()">
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>
    }
```

```html
<!-- DEPOIS -->
    <!-- Paginação -->
    @if (totalElements() > 0) {
      <app-paginator
        [page]="currentPage()"
        [totalPages]="totalPages()"
        [totalElements]="totalElements()"
        [pageSize]="pageSize()"
        (pageChange)="onPageChange($event)" />
    }
```

- [ ] **Step 3: Verificar build**

```bash
npx ng build --configuration development 2>&1 | grep -E "^.*error" | head -20
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/features/leads/leads.component.ts \
        src/app/features/leads/leads.component.html
git commit -m "feat(leads): replace manual pagination controls with shared PaginatorComponent"
```

---

## Verificação final

- [ ] Subir o servidor de desenvolvimento:

```bash
npx ng serve --open
```

- [ ] Testar editais:
  1. Acessar `/editais` — tabela carrega com 25 registros
  2. Navegar para página 2 usando o MatPaginator — nova chamada ao backend visível no Network
  3. Mudar filtro de status (ex: Processado) — volta para página 1, dados do backend
  4. Buscar texto no campo — filtra dentro da página atual
  5. Stats cards mostram totais globais (Total, Processados, Pendentes, Erros)

- [ ] Testar leads:
  1. Acessar `/leads` — paginação visível mesmo com poucos dados ("Página 1 de 1 · X registros")
  2. Se houver mais de 12 registros, navegar entre páginas

- [ ] Commit final se tudo OK:

```bash
git add -A
git commit -m "chore: final verification of server-side pagination"
```
