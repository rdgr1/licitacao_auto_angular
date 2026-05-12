import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { LeadService } from '../../core/services/lead.service';
import { ColetaService } from '../../core/services/coleta.service';
import { ToastService } from '../../core/services/toast.service';
import { Lead, LeadStatus } from '../../core/models/lead.model';
import { LeadDetalheDialogComponent } from './lead-detalhe-dialog/lead-detalhe-dialog.component';
import { TruncatePipe } from '../../shared/pipes/truncate.pipe';

interface StatusTab {
  label: string;
  value: LeadStatus | null;
}

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    TruncatePipe,
  ],
  template: `
    <div class="leads-shell">

      <!-- ── Header ──────────────────────────────────────────────── -->
      <div class="leads-header">
        <div>
          <h1 class="leads-title">Leads</h1>
          <p class="leads-sub">Matérias coletadas do DODF classificadas para análise</p>
        </div>
        <div class="header-actions">
          <mat-form-field appearance="outline" class="date-field">
            <mat-label>Data</mat-label>
            <input matInput [matDatepicker]="picker"
                   [ngModel]="coletaDate()"
                   (ngModelChange)="coletaDate.set($event)" />
            <mat-datepicker-toggle matIconSuffix [for]="picker" />
            <mat-datepicker #picker />
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="coletar()" [disabled]="coletando()">
            @if (coletando()) {
              <mat-spinner diameter="16" />
            } @else {
              <mat-icon>download</mat-icon>
            }
            {{ coletando() ? 'Coletando...' : 'Coletar agora' }}
          </button>
        </div>
      </div>

      <!-- ── Status Tabs ──────────────────────────────────────────── -->
      <mat-card appearance="outlined" class="leads-card">
        <mat-tab-group (selectedIndexChange)="onTabChange($event)">
          @for (tab of statusTabs; track tab.label) {
            <mat-tab [label]="tab.label" />
          }
        </mat-tab-group>

        <!-- ── Table ─────────────────────────────────────────────── -->
        @if (loading()) {
          <div class="table-loading">
            <mat-spinner diameter="32" />
            <span>Carregando leads...</span>
          </div>
        } @else if (leads().length === 0) {
          <div class="table-empty">
            <mat-icon>inbox</mat-icon>
            <span>Nenhum lead encontrado</span>
          </div>
        } @else {
          <table mat-table [dataSource]="leads()" class="leads-table">

            <ng-container matColumnDef="dataPublicacao">
              <th mat-header-cell *matHeaderCellDef>Data</th>
              <td mat-cell *matCellDef="let row">{{ row.dataPublicacao }}</td>
            </ng-container>

            <ng-container matColumnDef="orgao">
              <th mat-header-cell *matHeaderCellDef>Órgão</th>
              <td mat-cell *matCellDef="let row">{{ row.orgao | truncate:30 }}</td>
            </ng-container>

            <ng-container matColumnDef="tipo">
              <th mat-header-cell *matHeaderCellDef>Tipo</th>
              <td mat-cell *matCellDef="let row">{{ row.tipo | truncate:20 }}</td>
            </ng-container>

            <ng-container matColumnDef="titulo">
              <th mat-header-cell *matHeaderCellDef>Título</th>
              <td mat-cell *matCellDef="let row">{{ row.titulo | truncate:60 }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row">
                <span class="status-chip status-{{ row.status.toLowerCase().replace('_', '-') }}">
                  {{ statusLabel(row.status) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="acoes">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button matTooltip="Ver detalhes" (click)="verDetalhe(row)">
                  <mat-icon>open_in_new</mat-icon>
                </button>
                @if (row.status !== 'APROVADO') {
                  <button mat-icon-button matTooltip="Aprovar" color="primary"
                          (click)="atualizarStatus(row, 'APROVADO', $event)">
                    <mat-icon>check_circle_outline</mat-icon>
                  </button>
                }
                @if (row.status !== 'REJEITADO') {
                  <button mat-icon-button matTooltip="Rejeitar" color="warn"
                          (click)="atualizarStatus(row, 'REJEITADO', $event)">
                    <mat-icon>cancel</mat-icon>
                  </button>
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                class="lead-row"
                (click)="verDetalhe(row)"></tr>
          </table>

          <mat-paginator
            [length]="totalElements()"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="onPage($event)"
            showFirstLastButtons />
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .leads-shell { padding: 24px; }
    .leads-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .leads-title { font-size: 22px; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .leads-sub { font-size: 13px; color: #64748B; margin: 0; }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .date-field { width: 160px; }
    .leads-card { border-radius: 12px; overflow: hidden; }
    .leads-table { width: 100%; }
    .lead-row { cursor: pointer; transition: background 150ms; }
    .lead-row:hover { background: #F8FAFC; }
    .table-loading, .table-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 48px 24px;
      color: #64748B;
      font-size: 14px;
      mat-icon { font-size: 28px; width: 28px; height: 28px; }
    }
    .status-chip {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      border-radius: 6px;
      padding: 2px 8px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .status-novo { background: #DBEAFE; color: #1E40AF; }
    .status-em-analise { background: #FEF3C7; color: #92400E; }
    .status-aprovado { background: #DCFCE7; color: #166534; }
    .status-rejeitado { background: #FEE2E2; color: #991B1B; }
  `]
})
export class LeadsComponent implements OnInit {
  private leadService = inject(LeadService);
  private coletaService = inject(ColetaService);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);

  statusTabs: StatusTab[] = [
    { label: 'Todos', value: null },
    { label: 'Novo', value: 'NOVO' },
    { label: 'Em Análise', value: 'EM_ANALISE' },
    { label: 'Aprovado', value: 'APROVADO' },
    { label: 'Rejeitado', value: 'REJEITADO' },
  ];

  selectedStatus = signal<LeadStatus | null>(null);
  leads = signal<Lead[]>([]);
  totalElements = signal(0);
  currentPage = signal(0);
  pageSize = 20;
  loading = signal(false);
  displayedColumns = ['dataPublicacao', 'orgao', 'tipo', 'titulo', 'status', 'acoes'];

  coletaDate = signal<Date>(new Date());
  coletando = signal(false);

  ngOnInit(): void {
    this.carregarLeads();
  }

  carregarLeads(): void {
    this.loading.set(true);
    this.leadService.listar({
      status: this.selectedStatus() ?? undefined,
      page: this.currentPage(),
      size: this.pageSize,
    }).subscribe({
      next: (page) => {
        this.leads.set(page.content);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar leads');
        this.loading.set(false);
      }
    });
  }

  onTabChange(index: number): void {
    this.selectedStatus.set(this.statusTabs[index].value);
    this.currentPage.set(0);
    this.carregarLeads();
  }

  onPage(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize = event.pageSize;
    this.carregarLeads();
  }

  verDetalhe(lead: Lead): void {
    const ref = this.dialog.open(LeadDetalheDialogComponent, {
      data: lead,
      width: '700px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe(updated => {
      if (updated) this.carregarLeads();
    });
  }

  atualizarStatus(lead: Lead, status: LeadStatus, event: Event): void {
    event.stopPropagation();
    this.leadService.atualizarStatus(lead.uuid, {
      status,
      revisadoPor: 'analista@brasfort.com.br',
    }).subscribe({
      next: () => {
        this.toast.success(`Lead ${this.statusLabel(status).toLowerCase()}`);
        this.carregarLeads();
      },
      error: () => this.toast.error('Erro ao atualizar status'),
    });
  }

  coletar(): void {
    if (this.coletando()) return;
    this.coletando.set(true);
    this.coletaService.dispararColeta(this.coletaDate()).subscribe({
      next: (resultado) => {
        this.coletando.set(false);
        this.toast.success(`Coleta concluída: ${resultado.salvos} salvos, ${resultado.duplicados} duplicados`);
        this.carregarLeads();
      },
      error: () => {
        this.coletando.set(false);
        this.toast.error('Erro ao disparar coleta');
      }
    });
  }

  statusLabel(status: LeadStatus): string {
    const map: Record<LeadStatus, string> = {
      NOVO: 'Novo',
      EM_ANALISE: 'Em Análise',
      APROVADO: 'Aprovado',
      REJEITADO: 'Rejeitado',
    };
    return map[status];
  }
}
