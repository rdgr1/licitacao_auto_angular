import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificacoesService } from '../../core/services/notificacoes.service';
import { ToastService } from '../../core/services/toast.service';
import { NotificacaoEvent } from '../../core/models/edital.model';

@Component({
  selector: 'app-notificacoes',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './notificacoes.component.html',
  styleUrl: './notificacoes.component.scss',
})
export class NotificacoesComponent implements OnInit, OnDestroy {
  private svc = inject(NotificacoesService);
  private toast = inject(ToastService);

  loading = signal(true);
  notificacoes = signal<NotificacaoEvent[]>([]);

  ngOnInit(): void {
    this.load();
    this.svc.clearNovas();
  }

  ngOnDestroy(): void {}

  load(): void {
    this.loading.set(true);
    this.svc.getHistorico().subscribe({
      next: (n) => {
        this.notificacoes.set(n);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar notificações');
        this.loading.set(false);
      },
    });
  }

  formatCurrency(v?: number): string {
    if (!v) return '';
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`;
    return `R$ ${v}`;
  }

  scoreColor(score: number): string {
    if (score >= 70) return 'hot';
    if (score >= 40) return 'warm';
    return 'cold';
  }
}
