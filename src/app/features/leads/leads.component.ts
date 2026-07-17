import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { listStagger, fadeSlideIn } from '../../shared/animations/app-animations';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LeadService } from '../../core/services/lead.service';
import { ColetaService } from '../../core/services/coleta.service';
import { ColetaAndamentoService } from '../../core/services/coleta-andamento.service';
import { ToastService } from '../../core/services/toast.service';
import { Lead, LeadStatus } from '../../core/models/lead.model';
import { ColetaLog, ColetaResumo } from '../../core/models/coleta-log.model';
import { ColetaResultado } from '../../core/models/dodf.model';
import { LeadDetalheDialogComponent } from './lead-detalhe-dialog/lead-detalhe-dialog.component';
import { TruncatePipe } from '../../shared/pipes/truncate.pipe';
import { ScoreBadgePipe } from '../../shared/pipes/score-badge.pipe';
import { LeadCategoriaPipe } from '../../shared/pipes/lead-categoria.pipe';

interface StatusTab {
  label: string;
  value: LeadStatus | null;
}
interface FonteBusca {
  key: string;
  label: string;
  sublabel: string;
  icon: string;
  canCollect: boolean;
  showBadge?: boolean;
}

interface HistoricoEntrada {
  logId: number;
  dataKey: string; // "YYYY-MM-DD"
  dataDisplay: string;
  fonte: string;
  totalMaterias: number; // encontradas no diário (do ColetaLog)
  salvos: number; // passaram o filtro e foram gravadas (do ColetaLog)
  duplicados: number; // já existiam, ignoradas (do ColetaLog)
  erros: number; // exceções durante coleta (do ColetaLog)
  rejeitados: number; // leads salvos e depois descartados pelo analista
  leadsRejeitados: Lead[];
}

const FONTES: FonteBusca[] = [
  {
    key: 'DODF',
    label: 'DODF',
    sublabel: 'Diário Oficial do DF',
    icon: 'article',
    canCollect: true,
  },
  {
    key: 'DOU',
    label: 'DOU',
    sublabel: 'Diário Oficial da União',
    icon: 'library_books',
    canCollect: true,
  },
  {
    key: 'PNCP',
    label: 'PNCP',
    sublabel: 'Portal Nac. de Contratações',
    icon: 'public',
    canCollect: true,
  },
];

const ORG_COLORS = [
  '#E91E63',
  '#9C27B0',
  '#673AB7',
  '#3F51B5',
  '#2196F3',
  '#0097A7',
  '#00897B',
  '#43A047',
  '#FB8C00',
  '#E53935',
];

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    TruncatePipe,
    ScoreBadgePipe,
    LeadCategoriaPipe,
    MatPaginatorModule,
  ],
  templateUrl: './leads.component.html',
  styleUrl: './leads.component.scss',
  animations: [listStagger, fadeSlideIn],
})
export class LeadsComponent implements OnInit {
  private leadService = inject(LeadService);
  private coletaService = inject(ColetaService);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);
  readonly coletaAndamento = inject(ColetaAndamentoService);

  fontes = FONTES;
  hoje = new Date();

  statusTabs: StatusTab[] = [
    { label: 'Todos', value: null },
    { label: 'Novos Leads', value: 'NOVO' },
    { label: 'Aprov. Presidência', value: 'APROVACAO_PRESIDENCIA' },
    { label: 'Estudo e Viab.', value: 'ESTUDO_VIABILIDADE' },
    { label: '2ª Aprovação', value: 'SEGUNDA_APROVACAO_PRESIDENCIA' },
    { label: 'Descartado', value: 'DESCARTADO' },
  ];

  selectedTabIdx = signal(parseInt(sessionStorage.getItem('leads_filter_tab') ?? '0', 10));
  selectedStatus = signal<LeadStatus | null>(
    (sessionStorage.getItem('leads_filter_status') as LeadStatus | null) ?? null,
  );
  selectedFontes = signal<string[]>([]);
  gridFonte = signal<string | null>(null);
  allLeads = signal<Lead[]>([]);
  totalElements = signal(0);
  currentPage = signal(0);
  pageSize = signal(12);
  loading = signal(true);
  apiError = signal(false);
  buscaAtiva = signal(false);

  dateMode = signal<'single' | 'range'>('single');
  dateSingle = signal<Date>(new Date());
  dateFrom = signal<Date | null>(null);
  dateTo = signal<Date | null>(null);
  coletaResultado = signal<ColetaResultado | null>(null);

  legendaAtiva = signal(false);
  historicoAtivo = signal(false);
  historicoLoading = signal(false);
  historicoLogs = signal<ColetaLog[]>([]);
  historicoResumoApi = signal<ColetaResumo | null>(null);
  descartadosLeads = signal<Lead[]>([]);
  historicoExpandidos = signal<Set<string>>(new Set());
  historicoPage = signal(0);
  historicoPageSize = signal(10);
  historicoTotal = signal(0);

  // ── Computeds ──────────────────────────────────────────────────

  countByStatus = (status: LeadStatus | null) =>
    this.allLeads().filter((l) => status === null || l.status === status).length;

  hasCollectableFonte = computed(() =>
    this.selectedFontes().some((k) => FONTES.find((f) => f.key === k)?.canCollect),
  );

  hasNonCollectableFonte = computed(() =>
    this.selectedFontes().some((k) => !FONTES.find((f) => f.key === k)?.canCollect),
  );

  nonCollectableLabel = computed(() =>
    this.selectedFontes()
      .filter((k) => !FONTES.find((f) => f.key === k)?.canCollect)
      .join(', '),
  );

  canSubmit = computed(() => {
    if (this.dateMode() === 'single') return !!this.dateSingle();
    const from = this.dateFrom(),
      to = this.dateTo();
    return !!from && !!to && to.getTime() >= from.getTime();
  });

  rangeInfo = computed(() => {
    const from = this.dateFrom(),
      to = this.dateTo();
    if (!from || !to || to < from) return null;
    const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
    return `${days} dia${days !== 1 ? 's' : ''}`;
  });

  coletaProgress = computed(() => {
    const a = this.coletaAndamento.andamento();
    if (!a.ativa || !a.etapaAtual) return 'Aguarde...';
    return a.total > 1
      ? `${a.etapaAtual.fonte} · ${a.etapaAtual.dataDisplay} (${a.step}/${a.total})`
      : `Coletando ${a.etapaAtual.fonte}...`;
  });

  historicoEntradas = computed<HistoricoEntrada[]>(() => {
    const descartados = this.descartadosLeads();
    return this.historicoLogs().map((log) => {
      const leadsRejeitados = descartados.filter(
        (l) => l.fonte === log.fonte && (l.detectadoEm ?? '').substring(0, 10) === log.data,
      );
      return {
        logId: log.id,
        dataKey: log.data,
        dataDisplay: this.formatDate(log.data),
        fonte: log.fonte,
        totalMaterias: log.totalMaterias,
        salvos: log.salvos,
        duplicados: log.duplicados,
        erros: log.erros,
        rejeitados: leadsRejeitados.length,
        leadsRejeitados,
      };
    });
  });

  historicoResumo = computed(() => {
    const api = this.historicoResumoApi();
    if (!api) return null;
    return api;
  });

  // ── Lifecycle ───────────────────────────────────────────────────

  ngOnInit(): void {
    this.carregarLeads();
  }

  // ── Fontes ──────────────────────────────────────────────────────

  isFonteSelected(key: string): boolean {
    return this.selectedFontes().includes(key);
  }

  fecharBusca(): void {
    this.buscaAtiva.set(false);
    this.selectedFontes.set([]);
    this.coletaResultado.set(null);
  }

  toggleFonte(key: string): void {
    this.selectedFontes.update((list) =>
      list.includes(key) ? list.filter((k) => k !== key) : [...list, key],
    );
    this.coletaResultado.set(null);
    this.currentPage.set(0);
    this.carregarLeads();
  }

  setGridFonte(fonte: string | null): void {
    this.gridFonte.set(fonte);
    this.currentPage.set(0);
    this.carregarLeads();
  }

  setDateMode(mode: 'single' | 'range'): void {
    this.dateMode.set(mode);
    if (mode === 'single') {
      this.dateFrom.set(null);
      this.dateTo.set(null);
    }
  }

  // ── Leads ───────────────────────────────────────────────────────

  carregarLeads(): void {
    this.loading.set(true);
    this.apiError.set(false);
    this.leadService
      .listar({
        status: this.selectedStatus() ?? undefined,
        fonte: this.gridFonte() ?? undefined,
        page: this.currentPage(),
        size: this.pageSize(),
      })
      .subscribe({
        next: (page) => {
          this.allLeads.set(page.content ?? []);
          this.totalElements.set(page.totalElements ?? 0);
          this.loading.set(false);
        },
        error: () => {
          this.apiError.set(true);
          this.loading.set(false);
          this.toast.error('Erro ao carregar leads');
        },
      });
  }

  setStatusFilter(status: LeadStatus | null, tabIdx: number): void {
    this.selectedStatus.set(status);
    this.selectedTabIdx.set(tabIdx);
    if (status) sessionStorage.setItem('leads_filter_status', status);
    else sessionStorage.removeItem('leads_filter_status');
    sessionStorage.setItem('leads_filter_tab', String(tabIdx));
    this.carregarLeads();
  }

  onTabChange(idx: number): void {
    this.setStatusFilter(this.statusTabs[idx].value, idx);
    this.currentPage.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.carregarLeads();
  }

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalElements() / this.pageSize())));

  // ── Coleta ──────────────────────────────────────────────────────

  async coletar(): Promise<void> {
    if (this.coletaAndamento.ativa()) return;
    const dates = this.buildDateList();
    if (!dates.length) return;

    const collectableFontes = this.selectedFontes().filter(
      (k) => FONTES.find((f) => f.key === k)?.canCollect,
    );
    if (!collectableFontes.length) return;

    this.coletaResultado.set(null);
    this.coletaAndamento.iniciarColeta(collectableFontes);

    const tarefas = collectableFontes.map((fonte) => this.coletarFonte(fonte, dates));

    await Promise.allSettled(tarefas);

    const fontes = this.coletaAndamento.fontes();
    const totalSalvos = fontes.reduce((n, f) => n + f.salvos, 0);
    const totalMaterias = fontes.reduce((n, f) => n + f.materias, 0);

    this.coletaResultado.set({
      totalMaterias,
      salvos: totalSalvos,
      duplicados: 0,
      data: '',
    } as any);

    if (totalSalvos > 0) {
      this.toast.success(
        `${totalSalvos} lead(s) encontrados em ${collectableFontes.length} fonte(s)`,
      );
      this.carregarLeads();
    } else {
      this.toast.info('Nenhum lead novo encontrado neste período');
    }
  }

  private async coletarFonte(fonte: string, dates: Date[]): Promise<void> {
    const inicio = Date.now();
    let totalSalvos = 0,
      totalMaterias = 0;

    const datesParaFonte = fonte === 'PNCP' ? [dates[0]] : dates;

    for (let i = 0; i < datesParaFonte.length; i++) {
      this.coletaAndamento.avancarEtapa(
        fonte,
        i + 1,
        datesParaFonte.length,
        this.formatDate(datesParaFonte[i]),
      );
      try {
        const r = await this.coletaService.dispararColeta(fonte, datesParaFonte[i]).toPromise();
        if (r) {
          totalSalvos += r.salvos ?? 0;
          totalMaterias += r.totalMaterias ?? 0;
        }
      } catch {
        this.toast.error(`Erro ao coletar ${fonte} em ${this.formatDate(datesParaFonte[i])}`);
      }
    }

    this.coletaAndamento.concluirFonte(fonte, totalSalvos, totalMaterias, Date.now() - inicio);
  }

  private buildDateList(): Date[] {
    if (this.dateMode() === 'single') return this.dateSingle() ? [this.dateSingle()] : [];
    const from = this.dateFrom(),
      to = this.dateTo();
    if (!from || !to) return [];
    const dates: Date[] = [];
    const cur = new Date(from);
    while (cur <= to) {
      dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }

  // ── Lead actions ────────────────────────────────────────────────

  verDetalhe(lead: Lead): void {
    const ref = this.dialog.open(LeadDetalheDialogComponent, {
      data: lead,
      width: '700px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((updated) => {
      if (updated) this.carregarLeads();
    });
  }

  atualizarStatus(lead: Lead, status: LeadStatus, event: Event): void {
    event.stopPropagation();
    this.leadService
      .atualizarStatus(lead.uuid, {
        status,
        revisadoPor: 'analista@brasfort.com.br',
        observacao: 'Atualizado via lista de leads',
      })
      .subscribe({
        next: () => {
          this.toast.success(this.statusLabel(status));
          this.carregarLeads();
        },
        error: () => this.toast.error('Erro ao atualizar status'),
      });
  }

  // ── Histórico ───────────────────────────────────────────────────

  toggleHistorico(): void {
    const next = !this.historicoAtivo();
    this.historicoAtivo.set(next);
    if (next && this.historicoLogs().length === 0) this.carregarHistorico();
  }

  carregarHistorico(): void {
    this.historicoLoading.set(true);
    this.historicoExpandidos.set(new Set());
    forkJoin({
      logs: this.coletaService.getHistorico({
        page: this.historicoPage(),
        size: this.historicoPageSize(),
      }),
      descartados: this.leadService.listar({ status: 'DESCARTADO', size: 500 }),
      resumo: this.coletaService.getResumo(),
    }).subscribe({
      next: ({ logs, descartados, resumo }) => {
        this.historicoLogs.set(logs.content ?? []);
        this.historicoTotal.set(logs.totalElements ?? 0);
        this.descartadosLeads.set(descartados.content ?? []);
        this.historicoResumoApi.set(resumo);
        this.historicoLoading.set(false);
      },
      error: () => {
        this.historicoLoading.set(false);
        this.toast.error('Erro ao carregar histórico');
      },
    });
  }

  onHistoricoPageChange(event: PageEvent): void {
    this.historicoPage.set(event.pageIndex);
    this.historicoPageSize.set(event.pageSize);
    this.carregarHistorico();
  }

  toggleHistoricoExpand(key: string): void {
    this.historicoExpandidos.update((set) => {
      const next = new Set(set);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  isHistoricoExpandido(key: string): boolean {
    return this.historicoExpandidos().has(key);
  }

  // ── Helpers ─────────────────────────────────────────────────────

  orgColor(name: string): string {
    return ORG_COLORS[(name?.charCodeAt(0) ?? 0) % ORG_COLORS.length];
  }
  orgInitial(name: string): string {
    return name?.charAt(0).toUpperCase() ?? '?';
  }

  normalizeCase(text: string): string {
    if (!text) return '';
    const isAllCaps = text === text.toUpperCase() && /[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ]/.test(text);
    if (!isAllCaps) return text;
    return text.toLowerCase().replace(/(^\s*\S|[.!?]\s+\S)/g, (c) => c.toUpperCase());
  }

  statusLabel(s: LeadStatus): string {
    const m: Record<LeadStatus, string> = {
      NOVO: 'Novo Lead',
      APROVACAO_PRESIDENCIA: 'Aprov. Presidência',
      ESTUDO_VIABILIDADE: 'Estudo e Viabilidade',
      SEGUNDA_APROVACAO_PRESIDENCIA: '2ª Aprovação',
      QUALIFICADO: 'Qualificado',
      DESCARTADO: 'Descartado',
    };
    return m[s] ?? s;
  }

  formatDate(d: string | Date): string {
    if (!d) return '';
    try {
      const dt =
        typeof d === 'string' ? (d.includes('T') ? new Date(d) : new Date(d + 'T00:00:00')) : d;
      return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch {
      return String(d);
    }
  }
}
