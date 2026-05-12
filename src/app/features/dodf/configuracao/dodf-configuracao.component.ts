// src/app/features/dodf/configuracao/dodf-configuracao.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { DodfService } from '../../../core/services/dodf.service';
import { ToastService } from '../../../core/services/toast.service';
import { DodfKeyword, DodfTipoAbertura } from '../../../core/models/dodf.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { KeywordDialogComponent } from './keyword-dialog/keyword-dialog.component';
import { TipoAberturaDialogComponent } from './tipo-abertura-dialog/tipo-abertura-dialog.component';

@Component({
  selector: 'app-dodf-configuracao',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatCardModule,
  ],
  template: `
    <div class="dodf-config-shell">
      <div class="config-header">
        <h1 class="config-title">Configuração DODF</h1>
        <p class="config-subtitle">Gerencie as palavras-chave e tipos de abertura usados na filtragem do Diário Oficial do DF.</p>
      </div>

      <mat-card appearance="outlined" class="config-card">
        <mat-tab-group>

          <!-- ── Keywords Tab ──────────────────────────────────────── -->
          <mat-tab label="Keywords">
            <div class="tab-toolbar">
              <button mat-flat-button color="primary" (click)="openCreateKeyword()">
                <mat-icon>add</mat-icon>Nova Keyword
              </button>
            </div>

            @if (loadingKeywords()) {
              <div class="tab-loading">Carregando...</div>
            } @else {
              <table mat-table [dataSource]="keywords()" class="config-table">
                <ng-container matColumnDef="termo">
                  <th mat-header-cell *matHeaderCellDef>Termo</th>
                  <td mat-cell *matCellDef="let row">{{ row.termo }}</td>
                </ng-container>
                <ng-container matColumnDef="ativo">
                  <th mat-header-cell *matHeaderCellDef>Ativo</th>
                  <td mat-cell *matCellDef="let row">
                    <mat-slide-toggle [checked]="row.ativo" (change)="toggleKeyword(row)" />
                  </td>
                </ng-container>
                <ng-container matColumnDef="acoes">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let row">
                    <button mat-icon-button matTooltip="Editar" (click)="openEditKeyword(row)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button matTooltip="Excluir" color="warn" (click)="deleteKeyword(row)">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="keywordCols"></tr>
                <tr mat-row *matRowDef="let row; columns: keywordCols;"></tr>
              </table>
              <mat-paginator
                [length]="keywordTotal()"
                [pageSize]="keywordPageSize"
                [pageSizeOptions]="[5, 10, 20]"
                (page)="onKeywordPage($event)"
                showFirstLastButtons />
            }
          </mat-tab>

          <!-- ── Tipos de Abertura Tab ─────────────────────────────── -->
          <mat-tab label="Tipos de Abertura">
            <div class="tab-toolbar">
              <button mat-flat-button color="primary" (click)="openCreateTipo()">
                <mat-icon>add</mat-icon>Novo Tipo
              </button>
            </div>

            @if (loadingTipos()) {
              <div class="tab-loading">Carregando...</div>
            } @else {
              <table mat-table [dataSource]="tipos()" class="config-table">
                <ng-container matColumnDef="valor">
                  <th mat-header-cell *matHeaderCellDef>Valor</th>
                  <td mat-cell *matCellDef="let row">{{ row.valor }}</td>
                </ng-container>
                <ng-container matColumnDef="ativo">
                  <th mat-header-cell *matHeaderCellDef>Ativo</th>
                  <td mat-cell *matCellDef="let row">
                    <mat-slide-toggle [checked]="row.ativo" (change)="toggleTipo(row)" />
                  </td>
                </ng-container>
                <ng-container matColumnDef="acoes">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let row">
                    <button mat-icon-button matTooltip="Editar" (click)="openEditTipo(row)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button matTooltip="Excluir" color="warn" (click)="deleteTipo(row)">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="tipoCols"></tr>
                <tr mat-row *matRowDef="let row; columns: tipoCols;"></tr>
              </table>
              <mat-paginator
                [length]="tipoTotal()"
                [pageSize]="tipoPageSize"
                [pageSizeOptions]="[5, 10, 20]"
                (page)="onTipoPage($event)"
                showFirstLastButtons />
            }
          </mat-tab>

        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [`
    .dodf-config-shell { padding: 24px; max-width: 900px; }
    .config-header { margin-bottom: 24px; }
    .config-title { font-size: 22px; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .config-subtitle { font-size: 13px; color: #64748B; margin: 0; }
    .config-card { border-radius: 12px; overflow: hidden; }
    .tab-toolbar { padding: 16px 16px 8px; display: flex; justify-content: flex-end; }
    .tab-loading { padding: 32px; text-align: center; color: #64748B; }
    .config-table { width: 100%; }
  `]
})
export class DodfConfiguracaoComponent implements OnInit {
  private dodfService = inject(DodfService);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);

  keywords = signal<DodfKeyword[]>([]);
  keywordTotal = signal(0);
  keywordPage = 0;
  keywordPageSize = 10;
  loadingKeywords = signal(false);

  tipos = signal<DodfTipoAbertura[]>([]);
  tipoTotal = signal(0);
  tipoPage = 0;
  tipoPageSize = 10;
  loadingTipos = signal(false);

  keywordCols = ['termo', 'ativo', 'acoes'];
  tipoCols = ['valor', 'ativo', 'acoes'];

  ngOnInit(): void {
    this.loadKeywords();
    this.loadTipos();
  }

  loadKeywords(): void {
    this.loadingKeywords.set(true);
    this.dodfService.getKeywords(this.keywordPage, this.keywordPageSize).subscribe({
      next: (page) => {
        this.keywords.set(page.content);
        this.keywordTotal.set(page.totalElements);
        this.loadingKeywords.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar keywords');
        this.loadingKeywords.set(false);
      }
    });
  }

  onKeywordPage(event: PageEvent): void {
    this.keywordPage = event.pageIndex;
    this.keywordPageSize = event.pageSize;
    this.loadKeywords();
  }

  openCreateKeyword(): void {
    const ref = this.dialog.open(KeywordDialogComponent, { data: {}, width: '400px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.dodfService.createKeyword(result).subscribe({
          next: () => { this.toast.success('Keyword criada!'); this.loadKeywords(); },
          error: () => this.toast.error('Erro ao criar keyword'),
        });
      }
    });
  }

  openEditKeyword(keyword: DodfKeyword): void {
    const ref = this.dialog.open(KeywordDialogComponent, { data: { keyword }, width: '400px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.dodfService.updateKeyword(keyword.uuid, result).subscribe({
          next: () => { this.toast.success('Keyword atualizada!'); this.loadKeywords(); },
          error: () => this.toast.error('Erro ao atualizar keyword'),
        });
      }
    });
  }

  toggleKeyword(keyword: DodfKeyword): void {
    this.dodfService.updateKeyword(keyword.uuid, { termo: keyword.termo, ativo: !keyword.ativo }).subscribe({
      next: () => {
        this.toast.success(keyword.ativo ? 'Keyword desativada' : 'Keyword ativada');
        this.loadKeywords();
      },
      error: () => { this.toast.error('Erro ao alterar keyword'); this.loadKeywords(); },
    });
  }

  deleteKeyword(keyword: DodfKeyword): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Excluir Keyword', message: `Deseja excluir a keyword "${keyword.termo}"?`, confirmLabel: 'Excluir', danger: true }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.dodfService.deleteKeyword(keyword.uuid).subscribe({
          next: () => { this.toast.success('Keyword excluída'); this.loadKeywords(); },
          error: () => this.toast.error('Erro ao excluir keyword'),
        });
      }
    });
  }

  loadTipos(): void {
    this.loadingTipos.set(true);
    this.dodfService.getTipos(this.tipoPage, this.tipoPageSize).subscribe({
      next: (page) => {
        this.tipos.set(page.content);
        this.tipoTotal.set(page.totalElements);
        this.loadingTipos.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar tipos de abertura');
        this.loadingTipos.set(false);
      }
    });
  }

  onTipoPage(event: PageEvent): void {
    this.tipoPage = event.pageIndex;
    this.tipoPageSize = event.pageSize;
    this.loadTipos();
  }

  openCreateTipo(): void {
    const ref = this.dialog.open(TipoAberturaDialogComponent, { data: {}, width: '400px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.dodfService.createTipo(result).subscribe({
          next: () => { this.toast.success('Tipo criado!'); this.loadTipos(); },
          error: () => this.toast.error('Erro ao criar tipo'),
        });
      }
    });
  }

  openEditTipo(tipo: DodfTipoAbertura): void {
    const ref = this.dialog.open(TipoAberturaDialogComponent, { data: { tipo }, width: '400px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.dodfService.updateTipo(tipo.uuid, result).subscribe({
          next: () => { this.toast.success('Tipo atualizado!'); this.loadTipos(); },
          error: () => this.toast.error('Erro ao atualizar tipo'),
        });
      }
    });
  }

  toggleTipo(tipo: DodfTipoAbertura): void {
    this.dodfService.updateTipo(tipo.uuid, { valor: tipo.valor, ativo: !tipo.ativo }).subscribe({
      next: () => {
        this.toast.success(tipo.ativo ? 'Tipo desativado' : 'Tipo ativado');
        this.loadTipos();
      },
      error: () => { this.toast.error('Erro ao alterar tipo'); this.loadTipos(); },
    });
  }

  deleteTipo(tipo: DodfTipoAbertura): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Excluir Tipo de Abertura', message: `Deseja excluir o tipo "${tipo.valor}"?`, confirmLabel: 'Excluir', danger: true }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.dodfService.deleteTipo(tipo.uuid).subscribe({
          next: () => { this.toast.success('Tipo excluído'); this.loadTipos(); },
          error: () => this.toast.error('Erro ao excluir tipo'),
        });
      }
    });
  }
}
