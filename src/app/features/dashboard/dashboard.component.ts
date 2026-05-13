import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart as ChartJS, ChartData, ChartOptions,
  ArcElement, Tooltip, Legend,
  DoughnutController,
  BarController, BarElement, CategoryScale, LinearScale,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, DoughnutController, BarController, BarElement, CategoryScale, LinearScale);

import { EditaisService } from '../../core/services/editais.service';
import { NotificacoesService } from '../../core/services/notificacoes.service';
import { ToastService } from '../../core/services/toast.service';
import { EstatisticasDTO, LeadResponse, NotificacaoEvent } from '../../core/models/edital.model';

interface UpcomingEdital {
  numero: string;
  objeto: string;
  orgao: string;
  daysLeft: number;
  valor: number;
  urgent: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatTooltipModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private editaisService = inject(EditaisService);
  private notificacoesService = inject(NotificacoesService);
  private toast = inject(ToastService);

  loading = signal(true);
  stats = signal<EstatisticasDTO | null>(null);
  notifications = signal<NotificacaoEvent[]>([]);
  upcoming = signal<UpcomingEdital[]>([]);

  donutData = signal<ChartData<'doughnut'>>({
    labels: ['Processados', 'Pendentes', 'Erros'],
    datasets: [{
      data: [89, 24, 14],
      backgroundColor: ['#11BF7F', '#F59E0B', '#EF4444'],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  });

  donutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
          font: { size: 12, family: "'Inter Tight', sans-serif" },
        },
      },
      tooltip: {
        callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw} editais` },
      },
    },
  };

  barData = signal<ChartData<'bar'>>({
    labels: ['Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar'],
    datasets: [
      {
        label: 'Processados',
        data: [42, 58, 71, 65, 80, 89],
        backgroundColor: '#11BF7F',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Pendentes',
        data: [8, 12, 15, 19, 22, 24],
        backgroundColor: '#F59E0B',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  });

  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { font: { size: 12, family: "'Inter Tight', sans-serif" } },
      },
      y: {
        grid: { color: '#F1F5F9' },
        border: { display: false },
        ticks: { font: { size: 12, family: "'Inter Tight', sans-serif" } },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyleWidth: 8,
          font: { size: 12, family: "'Inter Tight', sans-serif" },
        },
      },
    },
  };

  ngOnInit() {
    this.loading.set(true);

    this.editaisService.getStats().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.loading.set(false);
        this.donutData.set({
          labels: ['Processados', 'Pendentes', 'Erros'],
          datasets: [{
            data: [s.processados, s.pendentes, s.erros],
            backgroundColor: ['#11BF7F', '#F59E0B', '#EF4444'],
            borderWidth: 0,
            hoverOffset: 8,
          }],
        });
      },
      error: () => { this.loading.set(false); },
    });

    this.editaisService.getLeads({ scoreMinimo: 0 }).subscribe({
      next: (leads) => {
        if (!leads?.length) return;
        const today = Date.now();
        const items = leads
          .filter(l => l.dataAbertura)
          .map(l => {
            const msLeft = new Date(l.dataAbertura).getTime() - today;
            const daysLeft = Math.max(0, Math.ceil(msLeft / 86_400_000));
            return { numero: l.numero, objeto: l.objeto, orgao: l.orgaoOrigem, daysLeft, valor: l.valorEstimado, urgent: daysLeft <= 2 };
          })
          .filter(i => i.daysLeft >= 0)
          .sort((a, b) => a.daysLeft - b.daysLeft)
          .slice(0, 5);
        this.upcoming.set(items);
      },
    });

    this.notificacoesService.getHistorico().subscribe({
      next: (notifs) => this.notifications.set((notifs ?? []).slice(0, 6)),
    });
  }

  formatCurrency(value: number): string {
    if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`;
    return `R$ ${value.toLocaleString('pt-BR')}`;
  }

  get taxaSucesso(): number {
    const s = this.stats();
    if (!s || s.totalEditais === 0) return 0;
    return Math.round((s.processados / s.totalEditais) * 100);
  }
}
