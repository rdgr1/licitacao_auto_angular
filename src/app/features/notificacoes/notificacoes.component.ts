import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificacoesService } from '../../core/services/notificacoes.service';
import { ToastService } from '../../core/services/toast.service';
import { NotificacaoEvent } from '../../core/models/edital.model';

type FiltroFonte = 'TODOS' | 'NOVO_LEAD' | 'BUSCA_CONCLUIDA';

@Component({
  selector: 'app-notificacoes',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatListModule, MatDividerModule, MatChipsModule,
            MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './notificacoes.component.html',
  styleUrl: './notificacoes.component.scss',
})
export class NotificacoesComponent implements OnInit {
  private svc = inject(NotificacoesService);
  private toast = inject(ToastService);

  loading = signal(true);
  todas = signal<NotificacaoEvent[]>([]);
  filtro = signal<FiltroFonte>('TODOS');

  filtros: { value: FiltroFonte; label: string }[] = [
    { value: 'TODOS',          label: 'Todas'  },
    { value: 'NOVO_LEAD',      label: 'Leads'  },
    { value: 'BUSCA_CONCLUIDA',label: 'Buscas' },
  ];

  notificacoes = computed(() => {
    const f = this.filtro();
    const all = this.todas();
    if (f === 'TODOS') return all;
    return all.filter(n => n.tipo === f);
  });

  ngOnInit(): void {
    this.svc.clearNovas();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc.getHistorico().subscribe({
      next: (n) => { this.todas.set(n ?? []); this.loading.set(false); },
      error: () => { this.toast.error('Erro ao carregar notificações'); this.loading.set(false); },
    });
  }

  marcarTodasLidas(): void {
    this.svc.clearNovas();
    this.toast.success('Notificações marcadas como lidas');
  }

  scoreClass(score: number): string {
    if (score >= 70) return 'hot';
    if (score >= 40) return 'warm';
    return 'cold';
  }

  formatTime(ts: string): string {
    if (!ts) return '';
    return new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
}
