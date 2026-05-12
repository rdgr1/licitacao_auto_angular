import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { EditaisService } from '../../core/services/editais.service';
import { ColetaService } from '../../core/services/coleta.service';
import { ToastService } from '../../core/services/toast.service';
import { LeadResponse } from '../../core/models/edital.model';
import { ColetaResultado } from '../../core/models/dodf.model';
import { CurrencyBrPipe } from '../../shared/pipes/currency-br.pipe';
import { TruncatePipe } from '../../shared/pipes/truncate.pipe';

@Component({
  selector: 'app-pipeline',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatExpansionModule,
    DragDropModule,
    CurrencyBrPipe,
    TruncatePipe,
  ],
  templateUrl: './pipeline.component.html',
  styleUrl: './pipeline.component.scss',
})
export class PipelineComponent implements OnInit {
  private editaisService = inject(EditaisService);
  private coletaService = inject(ColetaService);
  private toast = inject(ToastService);

  // ── Kanban ─────────────────────────────────────────────────────────
  loading = signal(true);
  hotLeads  = signal<LeadResponse[]>([]);
  warmLeads = signal<LeadResponse[]>([]);
  coldLeads = signal<LeadResponse[]>([]);

  get hotValue():  number { return this.hotLeads().reduce((a, l) => a + l.valorEstimado, 0); }
  get warmValue(): number { return this.warmLeads().reduce((a, l) => a + l.valorEstimado, 0); }
  get coldValue(): number { return this.coldLeads().reduce((a, l) => a + l.valorEstimado, 0); }

  // ── Coleta DODF ────────────────────────────────────────────────────
  coletaDate = signal<Date>(new Date());
  coletando = signal(false);
  coletaResultado = signal<ColetaResultado | null>(null);
  panelOpen = signal(true);

  ngOnInit(): void {
    this.loadLeads();
  }

  loadLeads(): void {
    this.loading.set(true);
    this.editaisService.getLeads({ scoreMinimo: 0 }).subscribe({
      next: (leads) => {
        this.hotLeads.set((leads ?? []).filter(l => l.leadScore >= 70));
        this.warmLeads.set((leads ?? []).filter(l => l.leadScore >= 40 && l.leadScore < 70));
        this.coldLeads.set((leads ?? []).filter(l => l.leadScore < 40));
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
  }

  coletar(): void {
    if (this.coletando()) return;
    const date = this.coletaDate();
    if (!date) { this.toast.error('Selecione uma data'); return; }

    this.coletando.set(true);
    this.coletaResultado.set(null);

    this.coletaService.dispararColeta(date).subscribe({
      next: (resultado) => {
        this.coletaResultado.set(resultado);
        this.coletando.set(false);
        if (resultado.salvos === 0) {
          this.toast.info('Nenhum lead novo encontrado para esta data');
        } else {
          this.toast.success(`${resultado.salvos} lead(s) salvos, ${resultado.duplicados} duplicados`);
        }
      },
      error: () => {
        this.coletando.set(false);
        this.toast.error('Erro ao coletar do DODF');
      },
    });
  }

  drop(event: CdkDragDrop<LeadResponse[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  formatVal(v: number): string {
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`;
    return `R$ ${v}`;
  }
}
