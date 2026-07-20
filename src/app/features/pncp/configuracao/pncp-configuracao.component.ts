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
import { PncpService } from '../../../core/services/pncp.service';
import { ToastService } from '../../../core/services/toast.service';
import { PncpModalidade, PncpUf, PncpKeyword } from '../../../core/models/pncp.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PncpItemDialogComponent } from './pncp-item-dialog.component';
import { PncpKeywordDialogComponent } from './pncp-keyword-dialog.component';

type Tab = 'modalidades' | 'ufs' | 'keywords';

@Component({
  selector: 'app-pncp-configuracao',
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
      <!-- Tab bar -->
      <div class="tab-bar">
        <button
          class="tab-pill"
          [class.active]="tab() === 'modalidades'"
          (click)="tab.set('modalidades')"
        >
          Modalidades <span class="pill-count">{{ mdTotal() }}</span>
        </button>
        <button class="tab-pill" [class.active]="tab() === 'ufs'" (click)="tab.set('ufs')">
          UFs monitoradas <span class="pill-count">{{ ufTotal() }}</span>
        </button>
        <button
          class="tab-pill"
          [class.active]="tab() === 'keywords'"
          (click)="tab.set('keywords')"
        >
          Keywords <span class="pill-count">{{ kwTotal() }}</span>
        </button>
        <span class="tab-spacer"></span>
        @if (tab() === 'keywords') {
          <button mat-flat-button color="primary" (click)="openKw()">
            <mat-icon>add</mat-icon>Nova Keyword
          </button>
        } @else if (tab() === 'modalidades') {
          <button
            class="bulk-btn desat"
            [disabled]="bulkLoading()"
            (click)="desativarMd()"
            aria-label="Desativar todas as modalidades"
          >
            <mat-icon aria-hidden="true">toggle_off</mat-icon>Desativar todas
          </button>
          <button
            class="bulk-btn ativ"
            [disabled]="bulkLoading()"
            (click)="ativarMd()"
            aria-label="Ativar todas as modalidades"
          >
            <mat-icon aria-hidden="true">toggle_on</mat-icon>Ativar todas
          </button>
          <button mat-flat-button color="primary" (click)="openMd(null)">
            <mat-icon>add</mat-icon>Nova Modalidade
          </button>
        } @else {
          <button
            class="bulk-btn desat"
            [disabled]="bulkLoading()"
            (click)="desativarUf()"
            aria-label="Desativar todas as UFs"
          >
            <mat-icon aria-hidden="true">toggle_off</mat-icon>Desativar todas
          </button>
          <button
            class="bulk-btn ativ"
            [disabled]="bulkLoading()"
            (click)="ativarUf()"
            aria-label="Ativar todas as UFs"
          >
            <mat-icon aria-hidden="true">toggle_on</mat-icon>Ativar todas
          </button>
          <button mat-flat-button color="primary" (click)="openUf(null)">
            <mat-icon>add</mat-icon>Nova UF
          </button>
        }
      </div>
      @if (tab() === 'keywords') {
        <p class="tab-hint">
          Estas são as suas keywords — cada usuário mantém a própria lista, sem afetar outros
          usuários do sistema. Editar/excluir ainda não é possível aqui (pendência de backend, ver
          docs/BACKEND_TODO.md).
        </p>
      }

      <!-- Keywords -->
      @if (tab() === 'keywords') {
        <div class="table-wrap">
          @if (loadingKw()) {
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
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let row">
                  <span class="status-chip" [class.inativo]="!row.ativo">
                    {{ row.ativo ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="kwCols"></tr>
              <tr mat-row *matRowDef="let row; columns: kwCols" class="cfg-row"></tr>
            </table>
          }
          <mat-paginator
            [length]="kwTotal()"
            [pageSize]="pageSize"
            [pageIndex]="kwPage"
            [pageSizeOptions]="[10, 20]"
            [style.display]="kwTotal() > pageSize ? '' : 'none'"
            (page)="onKwPage($event)"
            showFirstLastButtons
          />
        </div>
      }

      <!-- Modalidades -->
      @if (tab() === 'modalidades') {
        <div class="table-wrap">
          @if (loadingMd()) {
            <div class="table-state"><span>Carregando...</span></div>
          } @else if (modalidades().length === 0) {
            <div class="table-state">
              <mat-icon>search_off</mat-icon><span>Nenhuma modalidade cadastrada</span>
            </div>
          } @else {
            <table mat-table [dataSource]="modalidades()" class="cfg-table">
              <ng-container matColumnDef="codigo">
                <th mat-header-cell *matHeaderCellDef>Código</th>
                <td mat-cell *matCellDef="let row">
                  <code class="termo">{{ row.codigo }}</code>
                </td>
              </ng-container>
              <ng-container matColumnDef="nome">
                <th mat-header-cell *matHeaderCellDef>Descrição</th>
                <td mat-cell *matCellDef="let row">{{ row.nome }}</td>
              </ng-container>
              <ng-container matColumnDef="ativo">
                <th mat-header-cell *matHeaderCellDef>Ativo</th>
                <td mat-cell *matCellDef="let row">
                  <mat-slide-toggle
                    [checked]="row.ativo"
                    (change)="toggleMd(row)"
                    color="primary"
                  />
                </td>
              </ng-container>
              <ng-container matColumnDef="acoes">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row" class="actions-cell">
                  <button mat-icon-button matTooltip="Editar" (click)="openMd(row)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Excluir" color="warn" (click)="deleteMd(row)">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="mdCols"></tr>
              <tr mat-row *matRowDef="let row; columns: mdCols" class="cfg-row"></tr>
            </table>
          }
          <mat-paginator
            [length]="mdTotal()"
            [pageSize]="pageSize"
            [pageIndex]="mdPage"
            [pageSizeOptions]="[10, 20]"
            [style.display]="mdTotal() > pageSize ? '' : 'none'"
            (page)="onMdPage($event)"
            showFirstLastButtons
          />
        </div>
      }

      <!-- UFs -->
      @if (tab() === 'ufs') {
        <div class="table-wrap">
          @if (loadingUf()) {
            <div class="table-state"><span>Carregando...</span></div>
          } @else if (ufs().length === 0) {
            <div class="table-state">
              <mat-icon>search_off</mat-icon><span>Nenhuma UF cadastrada</span>
            </div>
          } @else {
            <table mat-table [dataSource]="ufs()" class="cfg-table">
              <ng-container matColumnDef="uf">
                <th mat-header-cell *matHeaderCellDef>UF</th>
                <td mat-cell *matCellDef="let row">
                  <code class="termo">{{ row.sigla }}</code>
                </td>
              </ng-container>
              <ng-container matColumnDef="ativo">
                <th mat-header-cell *matHeaderCellDef>Ativo</th>
                <td mat-cell *matCellDef="let row">
                  <mat-slide-toggle
                    [checked]="row.ativo"
                    (change)="toggleUf(row)"
                    color="primary"
                  />
                </td>
              </ng-container>
              <ng-container matColumnDef="acoes">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row" class="actions-cell">
                  <button mat-icon-button matTooltip="Editar" (click)="openUf(row)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button matTooltip="Excluir" color="warn" (click)="deleteUf(row)">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="ufCols"></tr>
              <tr mat-row *matRowDef="let row; columns: ufCols" class="cfg-row"></tr>
            </table>
          }
          <mat-paginator
            [length]="ufTotal()"
            [pageSize]="pageSize"
            [pageIndex]="ufPage"
            [pageSizeOptions]="[10, 50]"
            [style.display]="ufTotal() > pageSize ? '' : 'none'"
            (page)="onUfPage($event)"
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
      .tab-hint {
        margin: 0;
        font-size: 12px;
        color: var(--text-muted, #64748b);
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
        background: var(--content-bg, #eef2f7);
        border: 1px solid var(--card-border, #cbd5e1);
        border-radius: 0.25rem;
        padding: 0.125rem 0.5rem;
        color: var(--text-primary, #0f172a);
        font-weight: 500;
      }
      .status-chip {
        display: inline-block;
        font-size: 11px;
        font-weight: 600;
        color: #059669;
        background: rgba(17, 191, 127, 0.1);
        border-radius: 0.375rem;
        padding: 0.125rem 0.5rem;
        &.inativo {
          color: var(--text-muted, #94a3b8);
          background: var(--content-bg, #f1f5f9);
        }
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
export class PncpConfiguracaoComponent implements OnInit {
  @Input() embedded = false;

  private svc = inject(PncpService);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);

  tab = signal<Tab>('modalidades');
  bulkLoading = signal(false);
  pageSize = 10;
  mdCols = ['codigo', 'nome', 'ativo', 'acoes'];
  ufCols = ['uf', 'ativo', 'acoes'];
  kwCols = ['termo', 'ativo'];

  modalidades = signal<PncpModalidade[]>([]);
  mdTotal = signal(0);
  mdPage = 0;
  loadingMd = signal(true);
  ufs = signal<PncpUf[]>([]);
  ufTotal = signal(0);
  ufPage = 0;
  loadingUf = signal(true);
  keywords = signal<PncpKeyword[]>([]);
  kwTotal = signal(0);
  kwPage = 0;
  loadingKw = signal(true);

  ngOnInit(): void {
    this.loadMd();
    this.loadUf();
    this.loadKw();
  }

  // ── Keywords ──────────────────────────────────────────────────────────────
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
  openKw(): void {
    this.dialog
      .open(PncpKeywordDialogComponent, { width: '420px' })
      .afterClosed()
      .subscribe((r) => {
        if (!r) return;
        this.svc.createKeyword(r).subscribe({
          next: () => {
            this.toast.success('Criada');
            this.loadKw();
          },
          error: () => this.toast.error('Erro'),
        });
      });
  }

  // ── Modalidades ───────────────────────────────────────────────────────────
  loadMd(): void {
    this.loadingMd.set(true);
    this.svc.getModalidades(this.mdPage, this.pageSize).subscribe({
      next: (p) => {
        this.modalidades.set(p.content);
        this.mdTotal.set(p.totalElements);
        this.loadingMd.set(false);
      },
      error: () => this.loadingMd.set(false),
    });
  }
  onMdPage(e: PageEvent): void {
    this.mdPage = e.pageIndex;
    this.loadMd();
  }

  openMd(md: PncpModalidade | null): void {
    this.dialog
      .open(PncpItemDialogComponent, {
        data: {
          mode: 'modalidade',
          editando: !!md,
          codigoAtual: md?.codigo,
          nomeAtual: md?.nome,
          ativoAtual: md?.ativo,
        },
        width: '480px',
      })
      .afterClosed()
      .subscribe((r) => {
        if (!r) return;
        const call = md ? this.svc.updateModalidade(md.uuid, r) : this.svc.createModalidade(r);
        call.subscribe({
          next: () => {
            this.toast.success(md ? 'Atualizada' : 'Criada');
            this.loadMd();
          },
          error: () => this.toast.error('Erro'),
        });
      });
  }
  toggleMd(md: PncpModalidade): void {
    this.svc
      .updateModalidade(md.uuid, { codigo: md.codigo, nome: md.nome, ativo: !md.ativo })
      .subscribe({ next: () => this.loadMd() });
  }
  deleteMd(md: PncpModalidade): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Excluir Modalidade',
          message: `Excluir modalidade ${md.codigo} — ${md.nome}?`,
          confirmLabel: 'Excluir',
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok)
          this.svc.deleteModalidade(md.uuid).subscribe({
            next: () => {
              this.toast.success('Excluída');
              this.loadMd();
            },
          });
      });
  }

  // ── UFs ───────────────────────────────────────────────────────────────────
  loadUf(): void {
    this.loadingUf.set(true);
    this.svc.getUfs(this.ufPage, this.pageSize).subscribe({
      next: (p) => {
        this.ufs.set(p.content);
        this.ufTotal.set(p.totalElements);
        this.loadingUf.set(false);
      },
      error: () => this.loadingUf.set(false),
    });
  }
  onUfPage(e: PageEvent): void {
    this.ufPage = e.pageIndex;
    this.loadUf();
  }

  openUf(uf: PncpUf | null): void {
    this.dialog
      .open(PncpItemDialogComponent, {
        data: { mode: 'uf', editando: !!uf, ufAtual: uf?.sigla, ativoAtual: uf?.ativo },
        width: '360px',
      })
      .afterClosed()
      .subscribe((r) => {
        if (!r) return;
        const call = uf ? this.svc.updateUf(uf.uuid, r) : this.svc.createUf(r);
        call.subscribe({
          next: () => {
            this.toast.success(uf ? 'Atualizada' : 'Criada');
            this.loadUf();
          },
          error: () => this.toast.error('Erro'),
        });
      });
  }
  toggleUf(uf: PncpUf): void {
    this.svc
      .updateUf(uf.uuid, { sigla: uf.sigla, ativo: !uf.ativo })
      .subscribe({ next: () => this.loadUf() });
  }
  deleteUf(uf: PncpUf): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Excluir UF',
          message: `Excluir UF "${uf.sigla}"?`,
          confirmLabel: 'Excluir',
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok)
          this.svc.deleteUf(uf.uuid).subscribe({
            next: () => {
              this.toast.success('Excluída');
              this.loadUf();
            },
          });
      });
  }

  // ── Bulk toggle ───────────────────────────────────────────────────────────
  desativarMd(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Desativar todas',
          message: 'Desativar todas as modalidades?',
          confirmLabel: 'Desativar',
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.bulkMd(false);
      });
  }
  ativarMd(): void {
    this.bulkMd(true);
  }

  private bulkMd(ativo: boolean): void {
    this.bulkLoading.set(true);
    this.svc.getModalidades(0, 500).subscribe({
      next: (p) => {
        const targets = p.content.filter((m) => m.ativo !== ativo);
        if (!targets.length) {
          this.toast.success('Nenhuma alteração necessária');
          this.bulkLoading.set(false);
          return;
        }
        forkJoin(
          targets.map((m) =>
            this.svc.updateModalidade(m.uuid, { codigo: m.codigo, nome: m.nome, ativo }),
          ),
        ).subscribe({
          next: () => {
            this.toast.success(ativo ? 'Todas ativadas' : 'Todas desativadas');
            this.loadMd();
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

  desativarUf(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Desativar todas',
          message: 'Desativar todas as UFs monitoradas?',
          confirmLabel: 'Desativar',
          danger: true,
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.bulkUf(false);
      });
  }
  ativarUf(): void {
    this.bulkUf(true);
  }

  private bulkUf(ativo: boolean): void {
    this.bulkLoading.set(true);
    this.svc.getUfs(0, 500).subscribe({
      next: (p) => {
        const targets = p.content.filter((u) => u.ativo !== ativo);
        if (!targets.length) {
          this.toast.success('Nenhuma alteração necessária');
          this.bulkLoading.set(false);
          return;
        }
        forkJoin(
          targets.map((u) => this.svc.updateUf(u.uuid, { sigla: u.sigla, ativo })),
        ).subscribe({
          next: () => {
            this.toast.success(ativo ? 'Todas ativadas' : 'Todas desativadas');
            this.loadUf();
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
