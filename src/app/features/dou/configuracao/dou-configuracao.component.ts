import { Component, OnInit, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { forkJoin } from 'rxjs';
import { DouService } from '../../../core/services/dou.service';
import { ToastService } from '../../../core/services/toast.service';
import { DouKeyword, DouTipoArtigo, DouRegiao } from '../../../core/models/dodf.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { DouItemDialogComponent } from './dou-item-dialog.component';

type Tab = 'keywords' | 'tipos' | 'regioes';

@Component({
  selector: 'app-dou-configuracao',
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
          Keywords <span class="pill-count">{{ kwTotal() }}</span>
        </button>
        <button class="tab-pill" [class.active]="tab() === 'tipos'" (click)="tab.set('tipos')">
          Tipos de Artigo <span class="pill-count">{{ tpTotal() }}</span>
        </button>
        <button class="tab-pill" [class.active]="tab() === 'regioes'" (click)="tab.set('regioes')">
          Regiões <span class="pill-count">{{ rgTotal() }}</span>
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
          <button mat-flat-button color="primary" (click)="openKw(null)">
            <mat-icon>add</mat-icon>Nova Keyword
          </button>
        } @else if (tab() === 'tipos') {
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
          <button mat-flat-button color="primary" (click)="openTp(null)">
            <mat-icon>add</mat-icon>Novo Tipo
          </button>
        } @else {
          <button
            class="bulk-btn desat"
            [disabled]="bulkLoading()"
            (click)="desativarRg()"
            aria-label="Desativar todas as regiões"
          >
            <mat-icon aria-hidden="true">toggle_off</mat-icon>Desativar todas
          </button>
          <button
            class="bulk-btn ativ"
            [disabled]="bulkLoading()"
            (click)="ativarRg()"
            aria-label="Ativar todas as regiões"
          >
            <mat-icon aria-hidden="true">toggle_on</mat-icon>Ativar todas
          </button>
          <button mat-flat-button color="primary" (click)="openRg(null)">
            <mat-icon>add</mat-icon>Nova Região
          </button>
        }
      </div>

      <!-- ── Keywords ─────────────────────────────────────────────── -->
      @if (tab() === 'keywords') {
        <div class="table-wrap">
          @if (loadingKw()) {
            <div class="table-state"><span>Carregando...</span></div>
          } @else if (keywords().length === 0) {
            <div class="table-state">
              <mat-icon>search_off</mat-icon><span>Nenhuma keyword</span>
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
                    (change)="toggleKw(row)"
                    color="primary"
                  />
                </td>
              </ng-container>
              <ng-container matColumnDef="acoes">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row" class="actions-cell">
                  <button mat-icon-button matTooltip="Editar" (click)="openKw(row)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Excluir" color="warn" (click)="deleteKw(row)">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="termoCols"></tr>
              <tr mat-row *matRowDef="let row; columns: termoCols" class="cfg-row"></tr>
            </table>
          }
          <mat-paginator
            [length]="kwTotal()"
            [pageSize]="pageSize"
            [pageIndex]="kwPage"
            [pageSizeOptions]="[10, 20, 50]"
            [style.display]="kwTotal() > pageSize ? '' : 'none'"
            (page)="onKwPage($event)"
            showFirstLastButtons
          />
        </div>
      }

      <!-- ── Tipos de Artigo ─────────────────────────────────────── -->
      @if (tab() === 'tipos') {
        <div class="table-wrap">
          @if (loadingTp()) {
            <div class="table-state"><span>Carregando...</span></div>
          } @else if (tipos().length === 0) {
            <div class="table-state">
              <mat-icon>search_off</mat-icon><span>Nenhum tipo cadastrado</span>
            </div>
          } @else {
            <table mat-table [dataSource]="tipos()" class="cfg-table">
              <ng-container matColumnDef="valor">
                <th mat-header-cell *matHeaderCellDef>Valor XML (artType)</th>
                <td mat-cell *matCellDef="let row">
                  <code class="termo">{{ row.valor }}</code>
                </td>
              </ng-container>
              <ng-container matColumnDef="ativo">
                <th mat-header-cell *matHeaderCellDef>Ativo</th>
                <td mat-cell *matCellDef="let row">
                  <mat-slide-toggle
                    [checked]="row.ativo"
                    (change)="toggleTp(row)"
                    color="primary"
                  />
                </td>
              </ng-container>
              <ng-container matColumnDef="acoes">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row" class="actions-cell">
                  <button mat-icon-button matTooltip="Editar" (click)="openTp(row)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Excluir" color="warn" (click)="deleteTp(row)">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="valorCols"></tr>
              <tr mat-row *matRowDef="let row; columns: valorCols" class="cfg-row"></tr>
            </table>
          }
          <mat-paginator
            [length]="tpTotal()"
            [pageSize]="pageSize"
            [pageIndex]="tpPage"
            [pageSizeOptions]="[10, 20, 50]"
            [style.display]="tpTotal() > pageSize ? '' : 'none'"
            (page)="onTpPage($event)"
            showFirstLastButtons
          />
        </div>
      }

      <!-- ── Regiões ───────────────────────────────────────────────── -->
      @if (tab() === 'regioes') {
        <div class="table-wrap">
          @if (loadingRg()) {
            <div class="table-state"><span>Carregando...</span></div>
          } @else if (regioes().length === 0) {
            <div class="table-state">
              <mat-icon>search_off</mat-icon><span>Nenhuma região cadastrada</span>
            </div>
          } @else {
            <table mat-table [dataSource]="regioes()" class="cfg-table">
              <ng-container matColumnDef="termo">
                <th mat-header-cell *matHeaderCellDef>Termo de Localidade</th>
                <td mat-cell *matCellDef="let row">
                  <code class="termo">{{ row.termo }}</code>
                </td>
              </ng-container>
              <ng-container matColumnDef="ativo">
                <th mat-header-cell *matHeaderCellDef>Ativo</th>
                <td mat-cell *matCellDef="let row">
                  <mat-slide-toggle
                    [checked]="row.ativo"
                    (change)="toggleRg(row)"
                    color="primary"
                  />
                </td>
              </ng-container>
              <ng-container matColumnDef="acoes">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row" class="actions-cell">
                  <button mat-icon-button matTooltip="Editar" (click)="openRg(row)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Excluir" color="warn" (click)="deleteRg(row)">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="termoCols"></tr>
              <tr mat-row *matRowDef="let row; columns: termoCols" class="cfg-row"></tr>
            </table>
          }
          <mat-paginator
            [length]="rgTotal()"
            [pageSize]="pageSize"
            [pageIndex]="rgPage"
            [pageSizeOptions]="[10, 20, 50]"
            [style.display]="rgTotal() > pageSize ? '' : 'none'"
            (page)="onRgPage($event)"
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
        background: #eef2f7;
        border: 1px solid #cbd5e1;
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
export class DouConfiguracaoComponent implements OnInit {
  @Input() embedded = false;

  private svc = inject(DouService);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);

  tab = signal<Tab>('keywords');
  bulkLoading = signal(false);
  pageSize = 10;

  termoCols = ['termo', 'ativo', 'acoes'];
  valorCols = ['valor', 'ativo', 'acoes'];

  keywords = signal<DouKeyword[]>([]);
  kwTotal = signal(0);
  kwPage = 0;
  loadingKw = signal(true);
  tipos = signal<DouTipoArtigo[]>([]);
  tpTotal = signal(0);
  tpPage = 0;
  loadingTp = signal(true);
  regioes = signal<DouRegiao[]>([]);
  rgTotal = signal(0);
  rgPage = 0;
  loadingRg = signal(true);

  ngOnInit(): void {
    this.loadKw();
    this.loadTp();
    this.loadRg();
  }

  // ── Keywords ──────────────────────────────────────────────────────
  loadKw(): void {
    this.loadingKw.set(true);
    this.svc.getKeywords(this.kwPage, this.pageSize).subscribe({
      next: (p) => {
        this.keywords.set(p.content);
        this.kwTotal.set(p.totalElements);
        this.loadingKw.set(false);
      },
      error: () => this.loadingKw.set(false),
    });
  }
  onKwPage(e: PageEvent): void {
    this.kwPage = e.pageIndex;
    this.loadKw();
  }

  openKw(kw: DouKeyword | null): void {
    this.dialog
      .open(DouItemDialogComponent, {
        data: {
          label: 'Keyword',
          campo: 'Termo',
          placeholder: 'ex: vigilância',
          editando: !!kw,
          valorAtual: kw?.termo,
          ativoAtual: kw?.ativo,
        },
        width: '420px',
      })
      .afterClosed()
      .subscribe((r) => {
        if (!r) return;
        const call = kw
          ? this.svc.updateKeyword(kw.uuid, { termo: r.valor, ativo: r.ativo })
          : this.svc.createKeyword({ termo: r.valor, ativo: r.ativo });
        call.subscribe({
          next: () => {
            this.toast.success(kw ? 'Atualizada' : 'Criada');
            this.loadKw();
          },
          error: () => this.toast.error('Erro'),
        });
      });
  }
  toggleKw(kw: DouKeyword): void {
    this.svc
      .updateKeyword(kw.uuid, { termo: kw.termo, ativo: !kw.ativo })
      .subscribe({ next: () => this.loadKw() });
  }
  deleteKw(kw: DouKeyword): void {
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
          this.svc.deleteKeyword(kw.uuid).subscribe({
            next: () => {
              this.toast.success('Excluída');
              this.loadKw();
            },
          });
      });
  }

  // ── Tipos ─────────────────────────────────────────────────────────
  loadTp(): void {
    this.loadingTp.set(true);
    this.svc.getTipos(this.tpPage, this.pageSize).subscribe({
      next: (p) => {
        this.tipos.set(p.content);
        this.tpTotal.set(p.totalElements);
        this.loadingTp.set(false);
      },
      error: () => this.loadingTp.set(false),
    });
  }
  onTpPage(e: PageEvent): void {
    this.tpPage = e.pageIndex;
    this.loadTp();
  }

  openTp(tp: DouTipoArtigo | null): void {
    this.dialog
      .open(DouItemDialogComponent, {
        data: {
          label: 'Tipo de Artigo',
          campo: 'Valor XML',
          placeholder: 'ex: Aviso de Licitação-Pregão',
          editando: !!tp,
          valorAtual: tp?.valor,
          ativoAtual: tp?.ativo,
        },
        width: '460px',
      })
      .afterClosed()
      .subscribe((r) => {
        if (!r) return;
        const call = tp
          ? this.svc.updateTipo(tp.uuid, { valor: r.valor, ativo: r.ativo })
          : this.svc.createTipo({ valor: r.valor, ativo: r.ativo });
        call.subscribe({
          next: () => {
            this.toast.success(tp ? 'Atualizado' : 'Criado');
            this.loadTp();
          },
          error: () => this.toast.error('Erro'),
        });
      });
  }
  toggleTp(tp: DouTipoArtigo): void {
    this.svc
      .updateTipo(tp.uuid, { valor: tp.valor, ativo: !tp.ativo })
      .subscribe({ next: () => this.loadTp() });
  }
  deleteTp(tp: DouTipoArtigo): void {
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
          this.svc.deleteTipo(tp.uuid).subscribe({
            next: () => {
              this.toast.success('Excluído');
              this.loadTp();
            },
          });
      });
  }

  // ── Regiões ───────────────────────────────────────────────────────
  loadRg(): void {
    this.loadingRg.set(true);
    this.svc.getRegioes(this.rgPage, this.pageSize).subscribe({
      next: (p) => {
        this.regioes.set(p.content);
        this.rgTotal.set(p.totalElements);
        this.loadingRg.set(false);
      },
      error: () => this.loadingRg.set(false),
    });
  }
  onRgPage(e: PageEvent): void {
    this.rgPage = e.pageIndex;
    this.loadRg();
  }

  openRg(rg: DouRegiao | null): void {
    this.dialog
      .open(DouItemDialogComponent, {
        data: {
          label: 'Região',
          campo: 'Termo de Localidade',
          placeholder: 'ex: distrito federal',
          editando: !!rg,
          valorAtual: rg?.termo,
          ativoAtual: rg?.ativo,
        },
        width: '420px',
      })
      .afterClosed()
      .subscribe((r) => {
        if (!r) return;
        const call = rg
          ? this.svc.updateRegiao(rg.uuid, { termo: r.valor, ativo: r.ativo })
          : this.svc.createRegiao({ termo: r.valor, ativo: r.ativo });
        call.subscribe({
          next: () => {
            this.toast.success(rg ? 'Atualizada' : 'Criada');
            this.loadRg();
          },
          error: () => this.toast.error('Erro'),
        });
      });
  }
  toggleRg(rg: DouRegiao): void {
    this.svc
      .updateRegiao(rg.uuid, { termo: rg.termo, ativo: !rg.ativo })
      .subscribe({ next: () => this.loadRg() });
  }
  deleteRg(rg: DouRegiao): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Excluir Região',
          message: `Excluir "${rg.termo}"?`,
          confirmLabel: 'Excluir',
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok)
          this.svc.deleteRegiao(rg.uuid).subscribe({
            next: () => {
              this.toast.success('Excluída');
              this.loadRg();
            },
          });
      });
  }

  // ── Bulk toggle ───────────────────────────────────────────────────────────
  desativarKw(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Desativar todas',
          message: 'Desativar todas as keywords do DOU?',
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
    this.svc.getKeywords(0, 500).subscribe({
      next: (p) => {
        const targets = p.content.filter((k) => k.ativo !== ativo);
        if (!targets.length) {
          this.toast.success('Nenhuma alteração necessária');
          this.bulkLoading.set(false);
          return;
        }
        forkJoin(
          targets.map((k) => this.svc.updateKeyword(k.uuid, { termo: k.termo, ativo })),
        ).subscribe({
          next: () => {
            this.toast.success(ativo ? 'Todas ativadas' : 'Todas desativadas');
            this.loadKw();
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
          message: 'Desativar todos os tipos de artigo do DOU?',
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
    this.svc.getTipos(0, 500).subscribe({
      next: (p) => {
        const targets = p.content.filter((t) => t.ativo !== ativo);
        if (!targets.length) {
          this.toast.success('Nenhuma alteração necessária');
          this.bulkLoading.set(false);
          return;
        }
        forkJoin(
          targets.map((t) => this.svc.updateTipo(t.uuid, { valor: t.valor, ativo })),
        ).subscribe({
          next: () => {
            this.toast.success(ativo ? 'Todos ativados' : 'Todos desativados');
            this.loadTp();
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

  desativarRg(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Desativar todas',
          message: 'Desativar todas as regiões do DOU?',
          confirmLabel: 'Desativar',
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.bulkRg(false);
      });
  }
  ativarRg(): void {
    this.bulkRg(true);
  }

  private bulkRg(ativo: boolean): void {
    this.bulkLoading.set(true);
    this.svc.getRegioes(0, 500).subscribe({
      next: (p) => {
        const targets = p.content.filter((r) => r.ativo !== ativo);
        if (!targets.length) {
          this.toast.success('Nenhuma alteração necessária');
          this.bulkLoading.set(false);
          return;
        }
        forkJoin(
          targets.map((r) => this.svc.updateRegiao(r.uuid, { termo: r.termo, ativo })),
        ).subscribe({
          next: () => {
            this.toast.success(ativo ? 'Todas ativadas' : 'Todas desativadas');
            this.loadRg();
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
