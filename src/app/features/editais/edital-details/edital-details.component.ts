import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';

import { EditaisService } from '../../../core/services/editais.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  EditalResponse, ItemEdital, ArquivoEdital,
  ContratoEdital, AtaRegistroPreco, HistoricoEdital,
} from '../../../core/models/edital.model';
import { CurrencyBrPipe } from '../../../shared/pipes/currency-br.pipe';
import { DateBrPipe } from '../../../shared/pipes/date-br.pipe';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

type SectionState = 'idle' | 'loading' | 'loaded' | 'error' | 'empty';
interface Section<T> { open: boolean; state: SectionState; data: T[]; }
const mkSection = <T>(): Section<T> => ({ open: false, state: 'idle', data: [] });

@Component({
  selector: 'app-edital-details',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    CurrencyBrPipe, DateBrPipe,
  ],
  templateUrl: './edital-details.component.html',
  styleUrl:    './edital-details.component.scss',
})
export class EditalDetailsComponent implements OnInit {
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private editaisService = inject(EditaisService);
  private toast          = inject(ToastService);
  private dialog         = inject(MatDialog);

  loading       = signal(false);
  reprocessando = signal(false);
  edital        = signal<EditalResponse | null>(null);

  itensSection     = signal<Section<ItemEdital>>(mkSection());
  arquivosSection  = signal<Section<ArquivoEdital>>(mkSection());
  contratosSection = signal<Section<ContratoEdital>>(mkSection());
  atasSection      = signal<Section<AtaRegistroPreco>>(mkSection());
  historicoSection = signal<Section<HistoricoEdital>>(mkSection());

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadEdital(id);
  }

  loadEdital(id: string): void {
    this.loading.set(true);
    this.editaisService.getById(id).subscribe({
      next: (e) => { this.edital.set(e); this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigate(['/editais']); },
    });
  }

  goBack(): void { this.router.navigate(['/editais']); }

  private toggleSection<T>(
    sig: WritableSignal<Section<T>>,
    loader: () => Observable<T[]>,
  ): void {
    const s = sig();
    if (s.open) { sig.update(x => ({ ...x, open: false })); return; }
    sig.update(x => ({ ...x, open: true }));
    if (s.state === 'loaded' || s.state === 'loading') return;
    sig.update(x => ({ ...x, state: 'loading' }));
    loader().subscribe({
      next:  (data) => sig.update(x => ({ ...x, data, state: data.length ? 'loaded' : 'empty' })),
      error: ()     => sig.update(x => ({ ...x, state: 'error' })),
    });
  }

  private retrySection<T>(
    sig: WritableSignal<Section<T>>,
    loader: () => Observable<T[]>,
  ): void {
    sig.update(x => ({ ...x, state: 'idle' }));
    this.toggleSection(sig, loader);
  }

  toggleItens(): void {
    const s = this.itensSection();
    if (s.open) { this.itensSection.update(x => ({ ...x, open: false })); return; }
    this.itensSection.update(x => ({ ...x, open: true }));
    if (s.state === 'loaded' || s.state === 'loading') return;
    this.itensSection.update(x => ({ ...x, state: 'loading' }));
    const id = this.edital()!.id;
    this.editaisService.getItens(id).subscribe({
      next: (data) => {
        if (data.length > 0) {
          this.itensSection.update(x => ({ ...x, data, state: 'loaded' }));
        } else {
          // Auto-sync: banco vazio → busca no PNCP automaticamente
          this.editaisService.sincronizarItens(id).subscribe({
            next: (synced) => this.itensSection.update(x => ({
              ...x, data: synced, state: synced.length ? 'loaded' : 'empty'
            })),
            error: () => this.itensSection.update(x => ({ ...x, state: 'empty' })),
          });
        }
      },
      error: () => this.itensSection.update(x => ({ ...x, state: 'error' })),
    });
  }

  toggleArquivos():  void { this.toggleSection(this.arquivosSection,  () => this.editaisService.getArquivos(this.edital()!.id)); }
  toggleContratos(): void { this.toggleSection(this.contratosSection, () => this.editaisService.getContratos(this.edital()!.id)); }
  toggleAtas():      void { this.toggleSection(this.atasSection,      () => this.editaisService.getAtas(this.edital()!.id)); }
  toggleHistorico(): void { this.toggleSection(this.historicoSection, () => this.editaisService.getHistorico(this.edital()!.id)); }

  retryItens():     void { this.itensSection.update(x => ({ ...x, state: 'idle', open: false })); this.toggleItens(); }
  retryArquivos():  void { this.retrySection(this.arquivosSection,  () => this.editaisService.getArquivos(this.edital()!.id)); }
  retryContratos(): void { this.retrySection(this.contratosSection, () => this.editaisService.getContratos(this.edital()!.id)); }
  retryAtas():      void { this.retrySection(this.atasSection,      () => this.editaisService.getAtas(this.edital()!.id)); }
  retryHistorico(): void { this.retrySection(this.historicoSection, () => this.editaisService.getHistorico(this.edital()!.id)); }

  reprocessar(): void {
    const id = this.edital()?.id;
    if (!id) return;
    this.reprocessando.set(true);
    this.editaisService.reprocessar(id).subscribe({
      next: () => {
        this.toast.success('Edital enviado para reprocessamento');
        this.reprocessando.set(false);
        this.loadEdital(id);
      },
      error: () => { this.toast.error('Erro ao reprocessar'); this.reprocessando.set(false); },
    });
  }

  delete(): void {
    const e = this.edital();
    if (!e) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Excluir Edital',
        message: `Excluir o edital ${e.numero}? Esta ação não pode ser desfeita.`,
        confirmLabel: 'Excluir',
        danger: true,
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.editaisService.delete(e.id).subscribe({
        next: () => { this.toast.success(`Edital ${e.numero} excluído`); this.router.navigate(['/editais']); },
        error: () => this.toast.error('Erro ao excluir edital'),
      });
    });
  }

  formatStatus(s: string): string {
    const m: Record<string, string> = {
      PROCESSADO: 'Processado', PENDENTE: 'Pendente', PROCESSANDO: 'Processando',
      ERRO: 'Erro', ANTECIPADO: 'Antecipado', ARQUIVADO: 'Arquivado',
    };
    return m[s] ?? s;
  }

  formatModalidade(m: string): string {
    return m?.replace(/_/g, ' ').replace('ELETRONICO', 'ELETRÔNICO').replace('CONCORRENCIA', 'CONCORRÊNCIA') ?? m;
  }

  isUrgent(data: string): boolean {
    if (!data) return false;
    const diff = new Date(data).getTime() - Date.now();
    return diff > 0 && diff < 3 * 86_400_000;
  }
}
