import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { RegrasService } from '../../core/services/regras.service';
import { EditaisService } from '../../core/services/editais.service';
import { ToastService } from '../../core/services/toast.service';
import { RegraAnalise } from '../../core/models/edital.model';
import { RegraDialogComponent } from './regra-dialog/regra-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-regras',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './regras.component.html',
  styleUrl: './regras.component.scss',
})
export class RegrasComponent implements OnInit {
  private regrasService = inject(RegrasService);
  private editaisService = inject(EditaisService);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);

  loading = signal(true);
  reclassificando = signal(false);
  regras = signal<RegraAnalise[]>([]);
  cols = ['ativa', 'tipo', 'nome', 'valorRegra', 'peso', 'categoria', 'acoes'];

  ngOnInit() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.regrasService.getAll().subscribe({
      next: (r) => {
        this.regras.set(r);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar regras');
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(RegraDialogComponent, { data: null, width: '560px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.regrasService.create(result).subscribe({
          next: () => {
            this.toast.success('Regra criada!');
            this.load();
          },
          error: () => this.toast.error('Erro ao criar regra'),
        });
      }
    });
  }

  openEdit(regra: RegraAnalise): void {
    const ref = this.dialog.open(RegraDialogComponent, { data: regra, width: '560px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.regrasService.update(regra.id, result).subscribe({
          next: () => {
            this.toast.success('Regra atualizada!');
            this.load();
          },
          error: () => this.toast.error('Erro ao atualizar regra'),
        });
      }
    });
  }

  toggle(regra: RegraAnalise): void {
    this.regrasService.toggle(regra.id).subscribe({
      next: (updated) => {
        this.regras.update(list => list.map(r => r.id === updated.id ? updated : r));
        this.toast.success(updated.ativa ? 'Regra ativada' : 'Regra desativada');
      },
      error: () => {
        this.toast.error('Erro ao alterar regra');
        this.load();
      },
    });
  }

  confirmDelete(regra: RegraAnalise): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Deletar Regra',
        message: `Deseja deletar a regra "${regra.nome}"? Esta ação é irreversível.`,
        confirmLabel: 'Deletar',
        danger: true,
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.regrasService.delete(regra.id).subscribe({
          next: () => {
            this.toast.success('Regra deletada');
            this.load();
          },
          error: () => this.toast.error('Erro ao deletar regra'),
        });
      }
    });
  }

  reclassificar(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Reclassificar Tudo',
        message: 'Isso irá recalcular o score de todos os editais com as regras atuais. Pode demorar alguns segundos.',
        confirmLabel: 'Reclassificar',
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.reclassificando.set(true);
        this.editaisService.reclassificar().subscribe({
          next: () => {
            this.toast.success('Reclassificação concluída!');
            this.reclassificando.set(false);
          },
          error: () => {
            this.toast.error('Erro na reclassificação');
            this.reclassificando.set(false);
          },
        });
      }
    });
  }

  tipoColor(tipo: string): string {
    const map: Record<string, string> = {
      KEYWORD_OBJETO: 'primary',
      KEYWORD_ITEM: 'primary',
      FAIXA_VALOR: 'accent',
      PRAZO_MIN_MAX: 'accent',
      MODALIDADE_PERMITIDA: 'warn',
      DESCARTE: 'warn',
    };
    return map[tipo] || 'primary';
  }
}
