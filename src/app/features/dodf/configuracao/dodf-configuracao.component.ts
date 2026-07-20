import { Component, OnInit, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { DodfService } from '../../../core/services/dodf.service';
import { ToastService } from '../../../core/services/toast.service';
import { DodfKeyword, DodfTipoAbertura } from '../../../core/models/dodf.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { KeywordDialogComponent } from './keyword-dialog/keyword-dialog.component';
import { TipoAberturaDialogComponent } from './tipo-abertura-dialog/tipo-abertura-dialog.component';

type Tab = 'keywords' | 'tipos';

@Component({
  selector: 'app-dodf-configuracao',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  template: `
    <div class="cfg-shell">
      <!-- ── Tab bar ─────────────────────────────────────────────── -->
      <div class="tab-bar">
        <button
          class="tab-pill"
          [class.active]="tab() === 'keywords'"
          (click)="tab.set('keywords')"
        >
          Keywords <span class="pill-count">{{ keywordTotal() }}</span>
        </button>
        <button class="tab-pill" [class.active]="tab() === 'tipos'" (click)="tab.set('tipos')">
          Tipos de Abertura <span class="pill-count">{{ tipoTotal() }}</span>
        </button>
        <span class="tab-spacer"></span>
        @if (tab() === 'keywords') {
          <button
            class="bulk-btn desat"
            [disabled]="bulkLoading()"
            (click)="desativarKw()"
            aria-label="Desativar todas as keywords"
          >
            <mat-icon aria-hidden="true">toggle_off</mat-icon>Desativar todas
          </button>
          <button
            class="bulk-btn ativ"
            [disabled]="bulkLoading()"
            (click)="ativarKw()"
            aria-label="Ativar todas as keywords"
          >
            <mat-icon aria-hidden="true">toggle_on</mat-icon>Ativar todas
          </button>
          <button mat-flat-button color="primary" (click)="openCreateKeyword()">
            <mat-icon>add</mat-icon>Nova Keyword
          </button>
        } @else {
          <button
            class="bulk-btn desat"
            [disabled]="bulkLoading()"
            (click)="desativarTp()"
            aria-label="Desativar todos os tipos"
          >
            <mat-icon aria-hidden="true">toggle_off</mat-icon>Desativar todos
          </button>
          <button
            class="bulk-btn ativ"
            [disabled]="bulkLoading()"
            (click)="ativarTp()"
            aria-label="Ativar todos os tipos"
          >
            <mat-icon aria-hidden="true">toggle_on</mat-icon>Ativar todos
          </button>
          <button mat-flat-button color="primary" (click)="openCreateTipo()">
            <mat-icon>add</mat-icon>Novo Tipo
          </button>
        }
      </div>

      <!-- ── Keywords ─────────────────────────────────────────────── -->
      @if (tab() === 'keywords') {
        <div class="table-wrap">
          @if (loadingKeywords()) {
            <div class="table-state"><span>Carregando...</span></div>
          } @else if (keywords().length === 0) {
            <div class="table-state">
              <mat-icon>search_off</mat-icon><span>Nenhuma keyword cadastrada</span>
            </div>
          } @else {
            <table mat-table [dataSource]="keywords()" class="cfg-table">
              <ng-container matColumnDef="termo">
                <th mat-header-cell *matHeaderCellDef>Termo</th>
                <td mat-cell *matCellDef="let row">
                  <code class="termo">{{ row.termo }}</code>
                </td>
              </ng-container>
              <ng-container matColumnDef="ativo">
                <th mat-header-cell *matHeaderCellDef>Ativo</th>
                <td mat-cell *matCellDef="let row">
                  <mat-slide-toggle
                    [checked]="row.ativo"
                    (change)="toggleKeyword(row)"
                    color="primary"
                  />
                </td>
              </ng-container>
              <ng-container matColumnDef="acoes">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row" class="actions-cell">
                  <button mat-icon-button matTooltip="Editar" (click)="openEditKeyword(row)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    matTooltip="Excluir"
                    color="warn"
                    (click)="deleteKeyword(row)"
                  >
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="kwCols"></tr>
              <tr mat-row *matRowDef="let row; columns: kwCols" class="cfg-row"></tr>
            </table>
          }
          <!-- Fora do @else: nunca é destruído, mantém estado de página -->
          <mat-paginator
            [length]="keywordTotal()"
            [pageSize]="keywordPageSize"
            [pageIndex]="keywordPage"
            [pageSizeOptions]="[5, 10, 20]"
            [style.display]="keywordTotal() > keywordPageSize ? '' : 'none'"
            (page)="onKeywordPage($event)"
            showFirstLastButtons
          />
        </div>
      }

      <!-- ── Tipos de Abertura ─────────────────────────────────────── -->
      @if (tab() === 'tipos') {
        <div class="table-wrap">
          @if (loadingTipos()) {
            <div class="table-state"><span>Carregando...</span></div>
          } @else if (tipos().length === 0) {
            <div class="table-state">
              <mat-icon>search_off</mat-icon><span>Nenhum tipo cadastrado</span>
            </div>
          } @else {
            <table mat-table [dataSource]="tipos()" class="cfg-table">
              <ng-container matColumnDef="valor">
                <th mat-header-cell *matHeaderCellDef>Valor</th>
                <td mat-cell *matCellDef="let row">
                  <code class="termo">{{ row.valor }}</code>
                </td>
              </ng-container>
              <ng-container matColumnDef="ativo">
                <th mat-header-cell *matHeaderCellDef>Ativo</th>
                <td mat-cell *matCellDef="let row">
                  <mat-slide-toggle
                    [checked]="row.ativo"
                    (change)="toggleTipo(row)"
                    color="primary"
                  />
                </td>
              </ng-container>
              <ng-container matColumnDef="acoes">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row" class="actions-cell">
                  <button mat-icon-button matTooltip="Editar" (click)="openEditTipo(row)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    matTooltip="Excluir"
                    color="warn"
                    (click)="deleteTipo(row)"
                  >
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="tpCols"></tr>
              <tr mat-row *matRowDef="let row; columns: tpCols" class="cfg-row"></tr>
            </table>
          }
          <mat-paginator
            [length]="tipoTotal()"
            [pageSize]="tipoPageSize"
            [pageIndex]="tipoPage"
            [pageSizeOptions]="[5, 10, 20]"
            [style.display]="tipoTotal() > tipoPageSize ? '' : 'none'"
            (page)="onTipoPage($event)"
            showFirstLastButtons
          />
        </div>
      }
    </div>
  `,
  styles: [
    `
      .cfg-shell {
        display: flex;
        flex-direction: column;
        gap: 0.875rem;
      }

      /* Tab bar */
      .tab-bar {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        flex-wrap: wrap;
      }
      .tab-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem 0.875rem;
        border-radius: 1.25rem;
        border: 1.5px solid #e8edf5;
        background: var(--card-bg, #fff);
        color: var(--text-muted, #64748b);
        font-size: 12.5px;
        font-weight: 500;
        font-family: inherit;
        cursor: pointer;
        transition: all 150ms;
        &:hover {
          border-color: var(--text-muted, #cbd5e1);
          color: var(--text-primary, #1e293b);
        }
        &.active {
          border-color: var(--text-primary, #1e293b);
          background: #1e293b;
          color: #fff;
          font-weight: 600;
          .pill-count {
            background: rgba(255, 255, 255, 0.2);
            color: #fff;
          }
        }
      }
      .pill-count {
        background: var(--content-bg, #f1f5f9);
        color: var(--text-secondary, #475569);
        border-radius: 0.625rem;
        font-size: 10px;
        font-weight: 700;
        padding: 0 0.375rem;
        min-width: 1.125rem;
        text-align: center;
      }
      .tab-spacer {
        flex: 1;
      }

      /* Table container */
      .table-wrap {
        background: var(--card-bg, #fff);
        border-radius: 0.75rem;
        border: 1px solid #e2e8f0;
        overflow: hidden;
      }
      .cfg-table {
        width: 100%;
      }

      ::ng-deep .cfg-table {
        --mat-table-background-color: #fff;
        --mat-table-row-item-container-color: #fff;
        th.mat-mdc-header-cell {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted, #94a3b8);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          background: var(--content-bg, #f8fafc);
          border-bottom: 1px solid #e2e8f0;
          padding: 0.625rem 0.875rem;
        }
        td.mat-mdc-cell {
          padding: 0.6875rem 0.875rem;
          font-size: 13px;
          color: var(--text-secondary, #334155);
          border-bottom: 1px solid #f1f5f9;
        }
      }

      .cfg-row:last-child ::ng-deep td.mat-mdc-cell {
        border-bottom: none;
      }

      code.termo {
        font-family: 'JetBrains Mono', 'Courier New', monospace;
        font-size: 12px;
        background: var(--content-bg, #eef2f7);
        border: 1px solid var(--card-border, #cbd5e1);
        border-radius: 0.25rem;
        padding: 0.125rem 0.5rem;
        color: var(--text-primary, #0f172a);
        font-weight: 500;
      }
      .actions-cell {
        text-align: right;
        white-space: nowrap;
      }

      .table-state {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 2.5rem 1.5rem;
        color: var(--text-muted, #94a3b8);
        font-size: 13.5px;
        mat-icon {
          font-size: 22px;
          width: 22px;
          height: 22px;
        }
      }
      .bulk-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.3125rem 0.625rem;
        border-radius: 0.4375rem;
        border: 1.5px solid;
        font-size: 11.5px;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: all 130ms;
        mat-icon {
          font-size: 15px;
          width: 15px;
          height: 15px;
        }
        &:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        &.desat {
          border-color: #fca5a5;
          background: #fff1f2;
          color: #dc2626;
          &:hover:not(:disabled) {
            background: #fee2e2;
          }
        }
        &.ativ {
          border-color: #a7f3d0;
          background: rgba(17, 191, 127, 0.06);
          color: #059669;
          &:hover:not(:disabled) {
            background: rgba(17, 191, 127, 0.12);
          }
        }
      }
    `,
  ],
})
export class DodfConfiguracaoComponent implements OnInit {
  @Input() embedded = false;

  private dodfService = inject(DodfService);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);

  tab = signal<Tab>('keywords');
  bulkLoading = signal(false);

  keywords = signal<DodfKeyword[]>([]);
  keywordTotal = signal(0);
  keywordPage = 0;
  keywordPageSize = 10;
  loadingKeywords = signal(true);

  tipos = signal<DodfTipoAbertura[]>([]);
  tipoTotal = signal(0);
  tipoPage = 0;
  tipoPageSize = 10;
  loadingTipos = signal(true);

  kwCols = ['termo', 'ativo', 'acoes'];
  tpCols = ['valor', 'ativo', 'acoes'];

  ngOnInit(): void {
    this.loadKeywords();
    this.loadTipos();
  }

  // ── Keywords ──────────────────────────────────────────────────────

  loadKeywords(): void {
    this.loadingKeywords.set(true);
    this.dodfService.getKeywords(this.keywordPage, this.keywordPageSize).subscribe({
      next: (p) => {
        this.keywords.set(p.content);
        this.keywordTotal.set(p.totalElements);
        this.loadingKeywords.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar keywords');
        this.loadingKeywords.set(false);
      },
    });
  }

  onKeywordPage(e: PageEvent): void {
    this.keywordPage = e.pageIndex;
    this.keywordPageSize = e.pageSize;
    this.loadKeywords();
  }

  openCreateKeyword(): void {
    this.dialog
      .open(KeywordDialogComponent, { data: {}, width: '400px' })
      .afterClosed()
      .subscribe((r) => {
        if (r)
          this.dodfService.createKeyword(r).subscribe({
            next: () => {
              this.toast.success('Keyword criada!');
              this.loadKeywords();
            },
            error: () => this.toast.error('Erro ao criar'),
          });
      });
  }

  openEditKeyword(kw: DodfKeyword): void {
    this.dialog
      .open(KeywordDialogComponent, { data: { keyword: kw }, width: '400px' })
      .afterClosed()
      .subscribe((r) => {
        if (r)
          this.dodfService.updateKeyword(kw.uuid, r).subscribe({
            next: () => {
              this.toast.success('Atualizada!');
              this.loadKeywords();
            },
            error: () => this.toast.error('Erro'),
          });
      });
  }

  toggleKeyword(kw: DodfKeyword): void {
    this.dodfService
      .updateKeyword(kw.uuid, { termo: kw.termo, ativo: !kw.ativo })
      .subscribe({ next: () => this.loadKeywords(), error: () => this.loadKeywords() });
  }

  deleteKeyword(kw: DodfKeyword): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Excluir Keyword',
          message: `Excluir "${kw.termo}"?`,
          confirmLabel: 'Excluir',
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok)
          this.dodfService.deleteKeyword(kw.uuid).subscribe({
            next: () => {
              this.toast.success('Excluída');
              this.loadKeywords();
            },
            error: () => this.toast.error('Erro'),
          });
      });
  }

  // ── Tipos ─────────────────────────────────────────────────────────

  loadTipos(): void {
    this.loadingTipos.set(true);
    this.dodfService.getTipos(this.tipoPage, this.tipoPageSize).subscribe({
      next: (p) => {
        this.tipos.set(p.content);
        this.tipoTotal.set(p.totalElements);
        this.loadingTipos.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar tipos');
        this.loadingTipos.set(false);
      },
    });
  }

  onTipoPage(e: PageEvent): void {
    this.tipoPage = e.pageIndex;
    this.tipoPageSize = e.pageSize;
    this.loadTipos();
  }

  openCreateTipo(): void {
    this.dialog
      .open(TipoAberturaDialogComponent, { data: {}, width: '400px' })
      .afterClosed()
      .subscribe((r) => {
        if (r)
          this.dodfService.createTipo(r).subscribe({
            next: () => {
              this.toast.success('Tipo criado!');
              this.loadTipos();
            },
            error: () => this.toast.error('Erro'),
          });
      });
  }

  openEditTipo(tp: DodfTipoAbertura): void {
    this.dialog
      .open(TipoAberturaDialogComponent, { data: { tipo: tp }, width: '400px' })
      .afterClosed()
      .subscribe((r) => {
        if (r)
          this.dodfService.updateTipo(tp.uuid, r).subscribe({
            next: () => {
              this.toast.success('Atualizado!');
              this.loadTipos();
            },
            error: () => this.toast.error('Erro'),
          });
      });
  }

  toggleTipo(tp: DodfTipoAbertura): void {
    this.dodfService
      .updateTipo(tp.uuid, { valor: tp.valor, ativo: !tp.ativo })
      .subscribe({ next: () => this.loadTipos(), error: () => this.loadTipos() });
  }

  deleteTipo(tp: DodfTipoAbertura): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Excluir Tipo',
          message: `Excluir "${tp.valor}"?`,
          confirmLabel: 'Excluir',
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok)
          this.dodfService.deleteTipo(tp.uuid).subscribe({
            next: () => {
              this.toast.success('Excluído');
              this.loadTipos();
            },
            error: () => this.toast.error('Erro'),
          });
      });
  }

  // ── Bulk toggle ───────────────────────────────────────────────────────────
  desativarKw(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Desativar todas',
          message: 'Desativar todas as keywords do DODF?',
          confirmLabel: 'Desativar',
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.bulkKw(false);
      });
  }
  ativarKw(): void {
    this.bulkKw(true);
  }

  private bulkKw(ativo: boolean): void {
    this.bulkLoading.set(true);
    this.dodfService.getKeywords(0, 500).subscribe({
      next: (p) => {
        const targets = p.content.filter((k) => k.ativo !== ativo);
        if (!targets.length) {
          this.toast.success('Nenhuma alteração necessária');
          this.bulkLoading.set(false);
          return;
        }
        forkJoin(
          targets.map((k) => this.dodfService.updateKeyword(k.uuid, { termo: k.termo, ativo })),
        ).subscribe({
          next: () => {
            this.toast.success(ativo ? 'Todas ativadas' : 'Todas desativadas');
            this.loadKeywords();
            this.bulkLoading.set(false);
          },
          error: () => {
            this.toast.error('Erro na operação');
            this.bulkLoading.set(false);
          },
        });
      },
      error: () => this.bulkLoading.set(false),
    });
  }

  desativarTp(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Desativar todos',
          message: 'Desativar todos os tipos de abertura do DODF?',
          confirmLabel: 'Desativar',
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.bulkTp(false);
      });
  }
  ativarTp(): void {
    this.bulkTp(true);
  }

  private bulkTp(ativo: boolean): void {
    this.bulkLoading.set(true);
    this.dodfService.getTipos(0, 500).subscribe({
      next: (p) => {
        const targets = p.content.filter((t) => t.ativo !== ativo);
        if (!targets.length) {
          this.toast.success('Nenhuma alteração necessária');
          this.bulkLoading.set(false);
          return;
        }
        forkJoin(
          targets.map((t) => this.dodfService.updateTipo(t.uuid, { valor: t.valor, ativo })),
        ).subscribe({
          next: () => {
            this.toast.success(ativo ? 'Todos ativados' : 'Todos desativados');
            this.loadTipos();
            this.bulkLoading.set(false);
          },
          error: () => {
            this.toast.error('Erro na operação');
            this.bulkLoading.set(false);
          },
        });
      },
      error: () => this.bulkLoading.set(false),
    });
  }
}
