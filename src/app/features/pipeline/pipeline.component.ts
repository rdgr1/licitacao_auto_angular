import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { EditaisService } from '../../core/services/editais.service';
import { LeadResponse } from '../../core/models/edital.model';
import { CurrencyBrPipe } from '../../shared/pipes/currency-br.pipe';
import { TruncatePipe } from '../../shared/pipes/truncate.pipe';

@Component({
  selector: 'app-pipeline',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule, DragDropModule, CurrencyBrPipe, TruncatePipe],
  templateUrl: './pipeline.component.html',
  styleUrl: './pipeline.component.scss',
})
export class PipelineComponent implements OnInit {
  private editaisService = inject(EditaisService);

  loading = signal(true);
  hotLeads  = signal<LeadResponse[]>([]);
  warmLeads = signal<LeadResponse[]>([]);
  coldLeads = signal<LeadResponse[]>([]);

  get hotValue():  number { return this.hotLeads().reduce((a, l) => a + l.valorEstimado, 0); }
  get warmValue(): number { return this.warmLeads().reduce((a, l) => a + l.valorEstimado, 0); }
  get coldValue(): number { return this.coldLeads().reduce((a, l) => a + l.valorEstimado, 0); }

  ngOnInit() {
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

  drop(event: CdkDragDrop<LeadResponse[]>) {
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
