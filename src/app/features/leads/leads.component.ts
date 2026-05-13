import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { LeadService } from '../../core/services/lead.service';
import { ColetaService } from '../../core/services/coleta.service';
import { ToastService } from '../../core/services/toast.service';
import { Lead, LeadStatus } from '../../core/models/lead.model';
import { ColetaResultado } from '../../core/models/dodf.model';
import { LeadDetalheDialogComponent } from './lead-detalhe-dialog/lead-detalhe-dialog.component';
import { TruncatePipe } from '../../shared/pipes/truncate.pipe';

interface StatusTab { label: string; value: LeadStatus | null; }
interface FonteBusca { key: string; label: string; sublabel: string; icon: string; canCollect: boolean; showBadge?: boolean; }

const FONTES: FonteBusca[] = [
  { key: 'DODF', label: 'DODF', sublabel: 'Diário Oficial do DF',        icon: 'article',       canCollect: true  },
  { key: 'DOU',  label: 'DOU',  sublabel: 'Diário Oficial da União',      icon: 'library_books', canCollect: true  },
  { key: 'PNCP', label: 'PNCP', sublabel: 'Portal Nac. de Contratações', icon: 'public',        canCollect: false, showBadge: false },
];

const ORG_COLORS = ['#E91E63','#9C27B0','#673AB7','#3F51B5','#2196F3','#0097A7','#00897B','#43A047','#FB8C00','#E53935'];

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDatepickerModule, MatFormFieldModule,
    MatInputModule, MatNativeDateModule, TruncatePipe,
  ],
  templateUrl: './leads.component.html',
  styleUrl: './leads.component.scss',
})
export class LeadsComponent implements OnInit {
  private leadService   = inject(LeadService);
  private coletaService = inject(ColetaService);
  private toast         = inject(ToastService);
  private dialog        = inject(MatDialog);

  fontes = FONTES;
  hoje   = new Date();

  statusTabs: StatusTab[] = [
    { label: 'Todos',            value: null },
    { label: 'Nova',             value: 'NOVO' },
    { label: 'Em Triagem',       value: 'EM_TRIAGEM' },
    { label: 'Verificando Req.', value: 'VERIFICANDO_REQ' },
    { label: 'Qualificado',      value: 'QUALIFICADO' },
    { label: 'Descartado',       value: 'DESCARTADO' },
  ];

  selectedTabIdx  = signal(0);
  selectedStatus  = signal<LeadStatus | null>(null);
  selectedFontes  = signal<string[]>([]);
  allLeads        = signal<Lead[]>([]);
  totalElements   = signal(0);
  currentPage     = signal(0);
  pageSize        = signal(12);
  loading         = signal(true);
  apiError        = signal(false);
  buscaAtiva      = signal(false);

  dateMode   = signal<'single' | 'range'>('single');
  dateSingle = signal<Date>(new Date());
  dateFrom   = signal<Date | null>(null);
  dateTo     = signal<Date | null>(null);
  coletando       = signal(false);
  coletaResultado = signal<ColetaResultado | null>(null);
  private coletaStep  = signal(0);
  private coletaTotal = signal(0);

  // ── Computeds ──────────────────────────────────────────────────

  filteredLeads = computed(() => {
    const fontes = this.selectedFontes();
    const leads  = this.allLeads();
    if (!fontes.length) return leads;
    return leads.filter(l => fontes.includes(l.fonte));
  });

  countByStatus = (status: LeadStatus | null) =>
    this.allLeads().filter(l => status === null || l.status === status).length;

  hasCollectableFonte = computed(() =>
    this.selectedFontes().some(k => FONTES.find(f => f.key === k)?.canCollect)
  );

  hasNonCollectableFonte = computed(() =>
    this.selectedFontes().some(k => !FONTES.find(f => f.key === k)?.canCollect)
  );

  nonCollectableLabel = computed(() =>
    this.selectedFontes().filter(k => !FONTES.find(f => f.key === k)?.canCollect).join(', ')
  );

  canSubmit = computed(() => {
    if (this.dateMode() === 'single') return !!this.dateSingle();
    const from = this.dateFrom(), to = this.dateTo();
    return !!from && !!to && to.getTime() >= from.getTime();
  });

  rangeInfo = computed(() => {
    const from = this.dateFrom(), to = this.dateTo();
    if (!from || !to || to < from) return null;
    const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
    return `${days} dia${days !== 1 ? 's' : ''}`;
  });

  coletaProgress = computed(() => {
    const step = this.coletaStep(), total = this.coletaTotal();
    return total > 1 ? `Coletando ${step}/${total}...` : 'Coletando...';
  });

  // ── Lifecycle ───────────────────────────────────────────────────

  ngOnInit(): void { this.carregarLeads(); }

  // ── Fontes ──────────────────────────────────────────────────────

  isFonteSelected(key: string): boolean { return this.selectedFontes().includes(key); }

  fecharBusca(): void {
    this.buscaAtiva.set(false);
    this.selectedFontes.set([]);
    this.coletaResultado.set(null);
  }

  toggleFonte(key: string): void {
    this.selectedFontes.update(list =>
      list.includes(key) ? list.filter(k => k !== key) : [...list, key]
    );
    this.coletaResultado.set(null);
    this.currentPage.set(0);
    this.carregarLeads();
  }

  setDateMode(mode: 'single' | 'range'): void {
    this.dateMode.set(mode);
    if (mode === 'single') { this.dateFrom.set(null); this.dateTo.set(null); }
  }

  // ── Leads ───────────────────────────────────────────────────────

  carregarLeads(): void {
    this.loading.set(true);
    this.apiError.set(false);
    this.leadService.listar({
      status: this.selectedStatus() ?? undefined,
      page:   this.currentPage(),
      size:   this.pageSize(),
    }).subscribe({
      next: (page) => {
        this.allLeads.set(page.content ?? []);
        this.totalElements.set(page.totalElements ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.apiError.set(true);
        this.loading.set(false);
        this.toast.error('Erro ao carregar leads');
      }
    });
  }

  onTabChange(idx: number): void {
    this.selectedTabIdx.set(idx);
    this.selectedStatus.set(this.statusTabs[idx].value);
    this.currentPage.set(0);
    this.carregarLeads();
  }

  onPrev(): void { if (this.currentPage() > 0) { this.currentPage.update(p => p - 1); this.carregarLeads(); } }
  onNext(): void {
    if ((this.currentPage() + 1) * this.pageSize() < this.totalElements()) { this.currentPage.update(p => p + 1); this.carregarLeads(); }
  }

  totalPages = computed(() => Math.ceil(this.totalElements() / this.pageSize()));

  // ── Coleta ──────────────────────────────────────────────────────

  async coletar(): Promise<void> {
    if (!this.canSubmit() || this.coletando()) return;
    const dates = this.buildDateList();
    if (!dates.length) return;

    this.coletando.set(true);
    this.coletaResultado.set(null);

    const collectableFontes = this.selectedFontes().filter(k => FONTES.find(f => f.key === k)?.canCollect);
    // PNCP = 1 chamada (range); DODF/DOU = 1 por dia
    const totalOps = collectableFontes.reduce((n, f) => n + (f === 'PNCP' ? 1 : dates.length), 0);
    this.coletaStep.set(0);
    this.coletaTotal.set(totalOps);

    let totalMaterias = 0, totalSalvos = 0, totalDuplicados = 0, step = 0;
    for (const fonte of collectableFontes) {

      // DODF e DOU: uma chamada por dia
      for (let i = 0; i < dates.length; i++) {
        this.coletaStep.set(++step);
        try {
          const r = await this.coletaService.dispararColeta(fonte, dates[i]).toPromise();
          if (r) { totalMaterias += r.totalMaterias ?? 0; totalSalvos += r.salvos ?? 0; totalDuplicados += r.duplicados ?? 0; }
        } catch { this.toast.error(`Erro ao coletar ${fonte} ${this.formatDate(dates[i])}`); }
      }
    }

    this.coletaResultado.set({ totalMaterias, salvos: totalSalvos, duplicados: totalDuplicados, data: '' } as any);
    this.coletando.set(false);
    if (totalSalvos > 0) { this.toast.success(`${totalSalvos} lead(s) coletados`); this.carregarLeads(); }
    else { this.toast.info('Nenhum lead novo encontrado'); }
  }

  private buildDateList(): Date[] {
    if (this.dateMode() === 'single') return this.dateSingle() ? [this.dateSingle()] : [];
    const from = this.dateFrom(), to = this.dateTo();
    if (!from || !to) return [];
    const dates: Date[] = [];
    const cur = new Date(from);
    while (cur <= to) { dates.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
    return dates;
  }

  // ── Lead actions ────────────────────────────────────────────────

  verDetalhe(lead: Lead): void {
    const ref = this.dialog.open(LeadDetalheDialogComponent, { data: lead, width: '700px', maxWidth: '95vw' });
    ref.afterClosed().subscribe(updated => { if (updated) this.carregarLeads(); });
  }

  atualizarStatus(lead: Lead, status: LeadStatus, event: Event): void {
    event.stopPropagation();
    this.leadService.atualizarStatus(lead.uuid, { status, revisadoPor: 'analista@brasfort.com.br' }).subscribe({
      next: () => { this.toast.success(this.statusLabel(status)); this.carregarLeads(); },
      error: () => this.toast.error('Erro ao atualizar status'),
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────

  orgColor(name: string): string { return ORG_COLORS[(name?.charCodeAt(0) ?? 0) % ORG_COLORS.length]; }
  orgInitial(name: string): string { return name?.charAt(0).toUpperCase() ?? '?'; }

  normalizeCase(text: string): string {
    if (!text) return '';
    const isAllCaps = text === text.toUpperCase() && /[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ]/.test(text);
    if (!isAllCaps) return text;
    return text.toLowerCase().replace(/(^\s*\S|[.!?]\s+\S)/g, c => c.toUpperCase());
  }

  statusLabel(s: LeadStatus): string {
    const m: Record<LeadStatus, string> = { NOVO: 'Nova', EM_TRIAGEM: 'Em Triagem', VERIFICANDO_REQ: 'Verificando', QUALIFICADO: 'Qualificado', DESCARTADO: 'Descartado' };
    return m[s] ?? s;
  }

  formatDate(d: string | Date): string {
    if (!d) return '';
    try {
      const dt = typeof d === 'string' ? (d.includes('T') ? new Date(d) : new Date(d + 'T00:00:00')) : d;
      return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch { return String(d); }
  }
}
