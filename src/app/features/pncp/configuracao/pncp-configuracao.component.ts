import { Component, OnInit, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { PncpService } from '../../../core/services/pncp.service';
import { ToastService } from '../../../core/services/toast.service';
import { PncpModalidade, PncpUf } from '../../../core/models/pncp.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PncpItemDialogComponent } from './pncp-item-dialog.component';

type Tab = 'modalidades' | 'ufs';

@Component({
  selector: 'app-pncp-configuracao',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatSlideToggleModule, MatTooltipModule],
  template: `
    <div class="cfg-shell">

      <!-- Tab bar -->
      <div class="tab-bar">
        <button class="tab-pill" [class.active]="tab() === 'modalidades'" (click)="tab.set('modalidades')">
          Modalidades <span class="pill-count">{{ mdTotal() }}</span>
        </button>
        <button class="tab-pill" [class.active]="tab() === 'ufs'" (click)="tab.set('ufs')">
          UFs monitoradas <span class="pill-count">{{ ufTotal() }}</span>
        </button>
        <span class="tab-spacer"></span>
        @if (tab() === 'modalidades') {
          <button mat-flat-button color="primary" (click)="openMd(null)"><mat-icon>add</mat-icon>Nova Modalidade</button>
        } @else {
          <button mat-flat-button color="primary" (click)="openUf(null)"><mat-icon>add</mat-icon>Nova UF</button>
        }
      </div>

      <!-- Modalidades -->
      @if (tab() === 'modalidades') {
        <div class="table-wrap">
          @if (loadingMd()) {
            <div class="table-state"><span>Carregando...</span></div>
          } @else if (modalidades().length === 0) {
            <div class="table-state"><mat-icon>search_off</mat-icon><span>Nenhuma modalidade cadastrada</span></div>
          } @else {
            <table mat-table [dataSource]="modalidades()" class="cfg-table">
              <ng-container matColumnDef="codigo">
                <th mat-header-cell *matHeaderCellDef>Código</th>
                <td mat-cell *matCellDef="let row"><code class="termo">{{ row.codigo }}</code></td>
              </ng-container>
              <ng-container matColumnDef="nome">
                <th mat-header-cell *matHeaderCellDef>Descrição</th>
                <td mat-cell *matCellDef="let row">{{ row.nome }}</td>
              </ng-container>
              <ng-container matColumnDef="ativo">
                <th mat-header-cell *matHeaderCellDef>Ativo</th>
                <td mat-cell *matCellDef="let row">
                  <mat-slide-toggle [checked]="row.ativo" (change)="toggleMd(row)" color="primary" />
                </td>
              </ng-container>
              <ng-container matColumnDef="acoes">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row" class="actions-cell">
                  <button mat-icon-button matTooltip="Editar" (click)="openMd(row)"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button matTooltip="Excluir" color="warn" (click)="deleteMd(row)"><mat-icon>delete_outline</mat-icon></button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="mdCols"></tr>
              <tr mat-row *matRowDef="let row; columns: mdCols;" class="cfg-row"></tr>
            </table>
          }
          <mat-paginator [length]="mdTotal()" [pageSize]="pageSize" [pageIndex]="mdPage"
                         [pageSizeOptions]="[10,20]"
                         [style.display]="mdTotal() > pageSize ? '' : 'none'"
                         (page)="onMdPage($event)" showFirstLastButtons />
        </div>
      }

      <!-- UFs -->
      @if (tab() === 'ufs') {
        <div class="table-wrap">
          @if (loadingUf()) {
            <div class="table-state"><span>Carregando...</span></div>
          } @else if (ufs().length === 0) {
            <div class="table-state"><mat-icon>search_off</mat-icon><span>Nenhuma UF cadastrada</span></div>
          } @else {
            <table mat-table [dataSource]="ufs()" class="cfg-table">
              <ng-container matColumnDef="uf">
                <th mat-header-cell *matHeaderCellDef>UF</th>
                <td mat-cell *matCellDef="let row"><code class="termo">{{ row.sigla }}</code></td>
              </ng-container>
              <ng-container matColumnDef="ativo">
                <th mat-header-cell *matHeaderCellDef>Ativo</th>
                <td mat-cell *matCellDef="let row">
                  <mat-slide-toggle [checked]="row.ativo" (change)="toggleUf(row)" color="primary" />
                </td>
              </ng-container>
              <ng-container matColumnDef="acoes">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row" class="actions-cell">
                  <button mat-icon-button matTooltip="Editar" (click)="openUf(row)"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button matTooltip="Excluir" color="warn" (click)="deleteUf(row)"><mat-icon>delete_outline</mat-icon></button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="ufCols"></tr>
              <tr mat-row *matRowDef="let row; columns: ufCols;" class="cfg-row"></tr>
            </table>
          }
          <mat-paginator [length]="ufTotal()" [pageSize]="pageSize" [pageIndex]="ufPage"
                         [pageSizeOptions]="[10,50]"
                         [style.display]="ufTotal() > pageSize ? '' : 'none'"
                         (page)="onUfPage($event)" showFirstLastButtons />
        </div>
      }

    </div>
  `,
  styles: [`
    .cfg-shell { display: flex; flex-direction: column; gap: 14px; }
    .tab-bar { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .tab-pill {
      display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px;
      border: 1.5px solid #E8EDF5; background: #fff; color: #64748B;
      font-size: 12.5px; font-weight: 500; font-family: inherit; cursor: pointer; transition: all 150ms;
      &:hover { border-color: #CBD5E1; color: #1E293B; }
      &.active { border-color: #1E293B; background: #1E293B; color: #fff; font-weight: 600;
        .pill-count { background: rgba(255,255,255,0.2); color: #fff; } }
    }
    .pill-count { background: #F1F5F9; color: #475569; border-radius: 10px; font-size: 10px; font-weight: 700; padding: 0 6px; min-width: 18px; text-align: center; }
    .tab-spacer { flex: 1; }
    .table-wrap { background: #fff; border-radius: 12px; border: 1px solid #E2E8F0; overflow: hidden; }
    .cfg-table { width: 100%; }
    ::ng-deep .cfg-table { --mat-table-background-color: #fff; --mat-table-row-item-container-color: #fff;
      th.mat-mdc-header-cell { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.06em; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; padding: 10px 14px; }
      td.mat-mdc-cell { padding: 11px 14px; font-size: 13px; color: #334155; border-bottom: 1px solid #F1F5F9; }
    }
    .cfg-row:last-child ::ng-deep td.mat-mdc-cell { border-bottom: none; }
    code.termo { font-family: 'JetBrains Mono','Courier New',monospace; font-size: 12px; background: #EEF2F7; border: 1px solid #CBD5E1; border-radius: 4px; padding: 2px 8px; color: #0F172A; font-weight: 500; }
    .actions-cell { text-align: right; white-space: nowrap; }
    .table-state { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 40px 24px; color: #94A3B8; font-size: 13.5px;
      mat-icon { font-size: 22px; width: 22px; height: 22px; } }
  `]
})
export class PncpConfiguracaoComponent implements OnInit {
  @Input() embedded = false;

  private svc    = inject(PncpService);
  private toast  = inject(ToastService);
  private dialog = inject(MatDialog);

  tab      = signal<Tab>('modalidades');
  pageSize = 10;
  mdCols   = ['codigo', 'nome', 'ativo', 'acoes'];
  ufCols   = ['uf', 'ativo', 'acoes'];

  modalidades = signal<PncpModalidade[]>([]); mdTotal = signal(0); mdPage = 0; loadingMd = signal(true);
  ufs         = signal<PncpUf[]>([]);         ufTotal = signal(0); ufPage = 0; loadingUf = signal(true);

  ngOnInit(): void { this.loadMd(); this.loadUf(); }

  // ── Modalidades ───────────────────────────────────────────────────────────
  loadMd(): void {
    this.loadingMd.set(true);
    this.svc.getModalidades(this.mdPage, this.pageSize).subscribe({
      next: (p) => { this.modalidades.set(p.content); this.mdTotal.set(p.totalElements); this.loadingMd.set(false); },
      error: () => this.loadingMd.set(false),
    });
  }
  onMdPage(e: PageEvent): void { this.mdPage = e.pageIndex; this.loadMd(); }

  openMd(md: PncpModalidade | null): void {
    this.dialog.open(PncpItemDialogComponent, {
      data: { mode: 'modalidade', editando: !!md, codigoAtual: md?.codigo, nomeAtual: md?.nome, ativoAtual: md?.ativo },
      width: '480px',
    }).afterClosed().subscribe(r => {
      if (!r) return;
      const call = md ? this.svc.updateModalidade(md.uuid, r) : this.svc.createModalidade(r);
      call.subscribe({ next: () => { this.toast.success(md ? 'Atualizada' : 'Criada'); this.loadMd(); }, error: () => this.toast.error('Erro') });
    });
  }
  toggleMd(md: PncpModalidade): void {
    this.svc.updateModalidade(md.uuid, { codigo: md.codigo, nome: md.nome, ativo: !md.ativo }).subscribe({ next: () => this.loadMd() });
  }
  deleteMd(md: PncpModalidade): void {
    this.dialog.open(ConfirmDialogComponent, { data: { title: 'Excluir Modalidade', message: `Excluir modalidade ${md.codigo} — ${md.nome}?`, confirmLabel: 'Excluir', danger: true } })
      .afterClosed().subscribe(ok => { if (ok) this.svc.deleteModalidade(md.uuid).subscribe({ next: () => { this.toast.success('Excluída'); this.loadMd(); } }); });
  }

  // ── UFs ───────────────────────────────────────────────────────────────────
  loadUf(): void {
    this.loadingUf.set(true);
    this.svc.getUfs(this.ufPage, this.pageSize).subscribe({
      next: (p) => { this.ufs.set(p.content); this.ufTotal.set(p.totalElements); this.loadingUf.set(false); },
      error: () => this.loadingUf.set(false),
    });
  }
  onUfPage(e: PageEvent): void { this.ufPage = e.pageIndex; this.loadUf(); }

  openUf(uf: PncpUf | null): void {
    this.dialog.open(PncpItemDialogComponent, {
      data: { mode: 'uf', editando: !!uf, ufAtual: uf?.sigla, ativoAtual: uf?.ativo },
      width: '360px',
    }).afterClosed().subscribe(r => {
      if (!r) return;
      const call = uf ? this.svc.updateUf(uf.uuid, r) : this.svc.createUf(r);
      call.subscribe({ next: () => { this.toast.success(uf ? 'Atualizada' : 'Criada'); this.loadUf(); }, error: () => this.toast.error('Erro') });
    });
  }
  toggleUf(uf: PncpUf): void {
    this.svc.updateUf(uf.uuid, { sigla: uf.sigla, ativo: !uf.ativo }).subscribe({ next: () => this.loadUf() });
  }
  deleteUf(uf: PncpUf): void {
    this.dialog.open(ConfirmDialogComponent, { data: { title: 'Excluir UF', message: `Excluir UF "${uf.sigla}"?`, confirmLabel: 'Excluir', danger: true } })
      .afterClosed().subscribe(ok => { if (ok) this.svc.deleteUf(uf.uuid).subscribe({ next: () => { this.toast.success('Excluída'); this.loadUf(); } }); });
  }
}
