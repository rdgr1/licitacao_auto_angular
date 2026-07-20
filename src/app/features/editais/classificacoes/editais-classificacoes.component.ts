import { Component, OnInit, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

import { EditaisService } from '../../../core/services/editais.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { EditalResponse, EstadoClassificacaoEdital } from '../../../core/models/edital.model';
import { CurrencyBrPipe } from '../../../shared/pipes/currency-br.pipe';
import { DateBrPipe } from '../../../shared/pipes/date-br.pipe';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { PromoverDialogComponent } from './promover-dialog.component';

@Component({
  selector: 'app-editais-classificacoes',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    CurrencyBrPipe,
    DateBrPipe,
    TruncatePipe,
  ],
  template: `
    <div class="cfg-shell" [class.embedded]="embedded">
      @if (!embedded) {
        <div class="page-header">
          <div>
            <h1>Auditoria de Classificação</h1>
            <p class="page-sub">
              Editais coletados do PNCP e classificados automaticamente por keyword — revise os
              descartados e promova para Lead quando discordar da classificação.
            </p>
          </div>
        </div>
      }

      <div class="tab-bar">
        <button
          class="tab-pill"
          [class.active]="estado() === 'REJEITADO'"
          (click)="mudarEstado('REJEITADO')"
        >
          Rejeitados
        </button>
        <button
          class="tab-pill"
          [class.active]="estado() === 'INTERESSE'"
          (click)="mudarEstado('INTERESSE')"
        >
          Interesse
        </button>
      </div>

      <div class="table-wrap">
        @if (loading()) {
          <div class="table-state"><span>Carregando...</span></div>
        } @else if (editais().length === 0) {
          <div class="table-state">
            <mat-icon>search_off</mat-icon><span>Nenhum edital nesta classificação</span>
          </div>
        } @else {
          <table mat-table [dataSource]="editais()" class="cfg-table">
            <ng-container matColumnDef="numero">
              <th mat-header-cell *matHeaderCellDef>Número</th>
              <td mat-cell *matCellDef="let row">
                <code class="mono">{{ row.numero }}</code>
              </td>
            </ng-container>
            <ng-container matColumnDef="objeto">
              <th mat-header-cell *matHeaderCellDef>Objeto</th>
              <td mat-cell *matCellDef="let row">{{ row.objeto | truncate: 90 }}</td>
            </ng-container>
            <ng-container matColumnDef="orgaoOrigem">
              <th mat-header-cell *matHeaderCellDef>Órgão</th>
              <td mat-cell *matCellDef="let row">{{ row.orgaoOrigem }}</td>
            </ng-container>
            <ng-container matColumnDef="valorEstimado">
              <th mat-header-cell *matHeaderCellDef>Valor</th>
              <td mat-cell *matCellDef="let row">{{ row.valorEstimado | currencyBr }}</td>
            </ng-container>
            <ng-container matColumnDef="dataAbertura">
              <th mat-header-cell *matHeaderCellDef>Abertura</th>
              <td mat-cell *matCellDef="let row">{{ row.dataAbertura | dateBr }}</td>
            </ng-container>
            <ng-container matColumnDef="acoes">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row" class="actions-cell">
                @if (estado() === 'REJEITADO') {
                  <button
                    mat-stroked-button
                    color="primary"
                    matTooltip="Promover para Lead"
                    (click)="promover(row)"
                    [disabled]="promovendoId() === row.id"
                  >
                    <mat-icon>trending_up</mat-icon>Promover
                  </button>
                }
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols" class="cfg-row"></tr>
          </table>
        }
        <mat-paginator
          [length]="total()"
          [pageSize]="pageSize"
          [pageIndex]="page"
          [pageSizeOptions]="[20, 50]"
          (page)="onPage($event)"
          showFirstLastButtons
        />
      </div>
    </div>
  `,
  styles: [
    `
      .cfg-shell {
        display: flex;
        flex-direction: column;
        gap: 0.875rem;
        padding: 1.5rem;
        &.embedded {
          padding: 0;
        }
      }
      .page-header h1 {
        font-size: 20px;
        font-weight: 700;
        margin: 0 0 0.25rem;
        color: var(--text-primary, #0f172a);
      }
      .page-sub {
        font-size: 13px;
        color: var(--text-muted, #64748b);
        margin: 0;
        max-width: 620px;
      }
      .tab-bar {
        display: flex;
        align-items: center;
        gap: 0.375rem;
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
        &.active {
          border-color: var(--text-primary, #1e293b);
          background: #1e293b;
          color: #fff;
          font-weight: 600;
        }
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
      code.mono {
        font-family: 'JetBrains Mono', 'Courier New', monospace;
        font-size: 11.5px;
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
      }
    `,
  ],
})
export class EditaisClassificacoesComponent implements OnInit {
  @Input() embedded = false;

  private editaisService = inject(EditaisService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);

  cols = ['numero', 'objeto', 'orgaoOrigem', 'valorEstimado', 'dataAbertura', 'acoes'];
  pageSize = 20;
  page = 0;

  estado = signal<EstadoClassificacaoEdital>('REJEITADO');
  editais = signal<EditalResponse[]>([]);
  total = signal(0);
  loading = signal(true);
  promovendoId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  mudarEstado(estado: EstadoClassificacaoEdital): void {
    if (this.estado() === estado) return;
    this.estado.set(estado);
    this.page = 0;
    this.load();
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex;
    this.pageSize = e.pageSize;
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.editaisService
      .getClassificacoes(this.estado(), { page: this.page, size: this.pageSize })
      .subscribe({
        next: (p) => {
          this.editais.set(p.content);
          this.total.set(p.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toast.error('Erro ao carregar classificações');
        },
      });
  }

  promover(edital: EditalResponse): void {
    this.dialog
      .open(PromoverDialogComponent, {
        data: {
          numero: edital.numero,
          revisadoPorDefault: this.auth.currentUser()?.name ?? '',
        },
        width: '460px',
      })
      .afterClosed()
      .subscribe((r) => {
        if (!r) return;
        this.promovendoId.set(edital.id);
        this.editaisService.promover(edital.id, r).subscribe({
          next: () => {
            this.promovendoId.set(null);
            this.toast.success('Edital promovido para Lead — confira na tela de Leads.');
            this.editais.update((list) => list.filter((e) => e.id !== edital.id));
            this.total.update((t) => Math.max(0, t - 1));
          },
          error: (err: HttpErrorResponse) => {
            this.promovendoId.set(null);
            if (err.status === 409) {
              this.toast.error('Este edital já tem um Lead vinculado.');
            } else {
              this.toast.error('Erro ao promover edital');
            }
          },
        });
      });
  }
}
