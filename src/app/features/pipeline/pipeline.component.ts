import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { LeadService } from '../../core/services/lead.service';
import { ProcessoService } from '../../core/services/processo.service';
import { ToastService } from '../../core/services/toast.service';
import { Lead, LeadStatus } from '../../core/models/lead.model';
import { ProcessoLicitatorio, StatusProcesso } from '../../core/models/processo.model';
import { ProcessoDetalheDialogComponent } from '../processos/processo-detalhe-dialog/processo-detalhe-dialog.component';
import { LeadDetalheDialogComponent } from '../leads/lead-detalhe-dialog/lead-detalhe-dialog.component';
import { JustificativaDialogComponent } from '../../shared/components/justificativa-dialog/justificativa-dialog.component';
import { TruncatePipe } from '../../shared/pipes/truncate.pipe';
import { ScoreBadgePipe } from '../../shared/pipes/score-badge.pipe';
import { LeadCategoriaPipe } from '../../shared/pipes/lead-categoria.pipe';

interface LeadCol {
  id: string;
  key: LeadStatus;
  label: string;
  icon: string;
  color: string;
  accent: string;
  leads: Lead[];
}
interface ProcCol {
  id: string;
  key: StatusProcesso;
  label: string;
  icon: string;
  color: string;
  accent: string;
  processos: ProcessoLicitatorio[];
}

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
  selector: 'app-pipeline',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    DragDropModule,
    TruncatePipe,
    ScoreBadgePipe,
    LeadCategoriaPipe,
    LeadDetalheDialogComponent,
  ],
  templateUrl: './pipeline.component.html',
  styleUrl: './pipeline.component.scss',
})
export class PipelineComponent implements OnInit {
  private leadService = inject(LeadService);
  private processoService = inject(ProcessoService);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);

  active = signal<'qual' | 'proc'>('qual');
  loadingQual = signal(true);
  loadingProc = signal(true);
  gridFonte = signal<string | null>(null);
  searchTerm = signal('');
  fontes = [
    { key: 'DODF', label: 'DODF' },
    { key: 'DOU', label: 'DOU' },
    { key: 'PNCP', label: 'PNCP' },
  ];
  private allLeadsRaw: Lead[] = [];

  qualColumns = signal<LeadCol[]>([
    {
      id: 'q-descartado',
      key: 'DESCARTADO',
      label: 'Descarte',
      icon: 'block',
      color: '#94A3B8',
      accent: '#F8FAFC',
      leads: [],
    },
    {
      id: 'q-novo',
      key: 'NOVO',
      label: 'Novos Leads',
      icon: 'inbox',
      color: '#3B82F6',
      accent: 'rgba(17,191,127,0.06)',
      leads: [],
    },
    {
      id: 'q-aprovacao',
      key: 'APROVACAO_PRESIDENCIA',
      label: 'Aprov. Presidência',
      icon: 'how_to_reg',
      color: '#8B5CF6',
      accent: '#F5F3FF',
      leads: [],
    },
    {
      id: 'q-viab',
      key: 'ESTUDO_VIABILIDADE',
      label: 'Estudo e Viabilidade',
      icon: 'science',
      color: '#F59E0B',
      accent: '#FFFBEB',
      leads: [],
    },
    {
      id: 'q-2aprov',
      key: 'SEGUNDA_APROVACAO_PRESIDENCIA',
      label: '2ª Aprov. Presidência',
      icon: 'verified_user',
      color: '#11BF7F',
      accent: '#F0FDF4',
      leads: [],
    },
  ]);

  procColumns = signal<ProcCol[]>([
    {
      id: 'p-proposta',
      key: 'ELABORANDO_PROPOSTA',
      label: 'Elaborando Proposta',
      icon: 'edit_document',
      color: '#3B82F6',
      accent: 'rgba(17,191,127,0.06)',
      processos: [],
    },
    {
      id: 'p-docs',
      key: 'DOCUMENTACAO',
      label: 'Documentação',
      icon: 'folder_open',
      color: '#8B5CF6',
      accent: '#F5F3FF',
      processos: [],
    },
    {
      id: 'p-abertura',
      key: 'AGUARDANDO_ABERTURA',
      label: 'Aguard. Abertura',
      icon: 'schedule',
      color: '#F59E0B',
      accent: '#FFFBEB',
      processos: [],
    },
    {
      id: 'p-disputa',
      key: 'EM_DISPUTA',
      label: 'Em Disputa',
      icon: 'gavel',
      color: '#EF4444',
      accent: '#FFF1F2',
      processos: [],
    },
    {
      id: 'p-negociacao',
      key: 'NEGOCIACAO',
      label: 'Negociação',
      icon: 'handshake',
      color: '#F97316',
      accent: '#FFF7ED',
      processos: [],
    },
    {
      id: 'p-ganho',
      key: 'GANHO',
      label: 'Ganho',
      icon: 'emoji_events',
      color: '#11BF7F',
      accent: '#F0FDF4',
      processos: [],
    },
    {
      id: 'p-perdido',
      key: 'PERDIDO',
      label: 'Perdido',
      icon: 'sentiment_dissatisfied',
      color: '#94A3B8',
      accent: '#F8FAFC',
      processos: [],
    },
  ]);

  get qualConnected(): string[] {
    return this.qualColumns().map((c) => c.id);
  }
  get procConnected(): string[] {
    return this.procColumns().map((c) => c.id);
  }

  qualTotal = signal(0);
  procTotal = signal(0);
  justDroppedId = signal<string | null>(null);
  moveAnnouncement = signal('');

  private refreshQualTotal(): void {
    this.qualTotal.set(this.qualColumns().reduce((n, c) => n + c.leads.length, 0));
  }
  private refreshProcTotal(): void {
    this.procTotal.set(this.procColumns().reduce((n, c) => n + c.processos.length, 0));
  }

  private notifyQualColumns(): void {
    this.qualColumns.update((cols) => [...cols]);
  }
  private notifyProcColumns(): void {
    this.procColumns.update((cols) => [...cols]);
  }

  ngOnInit(): void {
    this.loadLeads();
    this.loadProcessos();
  }

  loadLeads(): void {
    this.loadingQual.set(true);
    this.leadService
      .listar({ fonte: this.gridFonte() ?? undefined, page: 0, size: 500 })
      .subscribe({
        next: (page) => {
          this.allLeadsRaw = page.content ?? [];
          this.redistribuirQualColumns();
          this.loadingQual.set(false);
        },
        error: () => {
          this.toast.error('Erro ao carregar leads');
          this.loadingQual.set(false);
        },
      });
  }

  setGridFonte(fonte: string | null): void {
    this.gridFonte.set(fonte);
    this.loadLeads();
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.redistribuirQualColumns();
  }

  /** Reaplica busca (client-side, sobre o lote já carregado) e redistribui nas colunas por status. */
  private redistribuirQualColumns(): void {
    const termo = this.searchTerm().trim().toLowerCase();
    const filtrados = termo
      ? this.allLeadsRaw.filter(
          (l) =>
            l.titulo?.toLowerCase().includes(termo) || l.orgao?.toLowerCase().includes(termo),
        )
      : this.allLeadsRaw;

    const byStatus = new Map<LeadStatus, Lead[]>();
    for (const lead of filtrados) {
      const list = byStatus.get(lead.status) ?? [];
      list.push(lead);
      byStatus.set(lead.status, list);
    }
    this.qualColumns.update((cols) =>
      cols.map((c) => ({ ...c, leads: byStatus.get(c.key) ?? [] })),
    );
    this.refreshQualTotal();
  }

  loadProcessos(): void {
    this.loadingProc.set(true);
    this.processoService.listar({ page: 0, size: 500 }).subscribe({
      next: (page) => {
        const cols = this.procColumns();
        const byStatus = new Map<StatusProcesso, ProcessoLicitatorio[]>();
        for (const proc of page.content ?? []) {
          const key = cols.some((c) => c.key === proc.status) ? proc.status : cols[0].key;
          const list = byStatus.get(key) ?? [];
          list.push(proc);
          byStatus.set(key, list);
        }
        this.procColumns.update((cs) =>
          cs.map((c) => ({ ...c, processos: byStatus.get(c.key) ?? [] })),
        );
        this.refreshProcTotal();
        this.loadingProc.set(false);
      },
      error: () => {
        this.loadingProc.set(false);
      },
    });
  }

  dropQual(event: CdkDragDrop<Lead[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const lead = event.previousContainer.data[event.previousIndex];
    const targetCol = this.qualColumns().find((c) => c.id === event.container.id)!;
    const prevCol = this.qualColumns().find((c) => c.id === event.previousContainer.id)!;

    const ref = this.dialog.open(JustificativaDialogComponent, {
      data: { titulo: `Mover para ${targetCol.label}` },
      width: '460px',
      disableClose: true,
    });

    ref.afterClosed().subscribe((justificativa: string | undefined) => {
      if (!justificativa) return;

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      this.notifyQualColumns();
      this.refreshQualTotal();
      this.justDroppedId.set(lead.uuid ?? null);
      setTimeout(() => this.justDroppedId.set(null), 700);

      this.leadService
        .atualizarStatus(lead.uuid, {
          status: targetCol.key,
          revisadoPor: 'pipeline',
          observacao: justificativa,
        })
        .subscribe({
          error: () => {
            const fromIdx = event.container.data.findIndex((l) => l.uuid === lead.uuid);
            if (fromIdx >= 0)
              transferArrayItem(event.container.data, prevCol.leads, fromIdx, event.previousIndex);
            this.notifyQualColumns();
            this.refreshQualTotal();
            this.toast.error('Erro ao atualizar lead');
          },
        });
    });
  }

  dropProc(event: CdkDragDrop<ProcessoLicitatorio[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }
    const proc = event.previousContainer.data[event.previousIndex];
    const targetCol = this.procColumns().find((c) => c.id === event.container.id)!;
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );
    this.notifyProcColumns();
    this.refreshProcTotal();

    this.processoService.atualizarStatus(proc.uuid, targetCol.key).subscribe({
      error: () => {
        const fromIdx = event.container.data.findIndex((p) => p.uuid === proc.uuid);
        const prevCol = this.procColumns().find((c) => c.id === event.previousContainer.id)!;
        if (fromIdx >= 0)
          transferArrayItem(event.container.data, prevCol.processos, fromIdx, event.previousIndex);
        this.notifyProcColumns();
        this.toast.error('Erro ao atualizar processo');
      },
    });
  }

  moveLeadToColumn(lead: any, targetColId: string): void {
    const cols = this.qualColumns();
    const srcCol = cols.find((c) => c.leads.some((l: any) => l.uuid === lead.uuid));
    const tgtCol = cols.find((c) => c.id === targetColId);
    if (!srcCol || !tgtCol || srcCol.id === tgtCol.id) return;

    const applyMove = (fromId: string, toId: string) => {
      this.qualColumns.update((cs) =>
        cs.map((c) => {
          if (c.id === fromId)
            return { ...c, leads: c.leads.filter((l: any) => l.uuid !== lead.uuid) };
          if (c.id === toId) return { ...c, leads: [...c.leads, lead] };
          return c;
        }),
      );
    };

    applyMove(srcCol.id, tgtCol.id);
    this.refreshQualTotal();
    this.moveAnnouncement.set(`Lead movido para ${tgtCol.label}`);
    this.justDroppedId.set(lead.uuid ?? null);
    setTimeout(() => this.justDroppedId.set(null), 700);
    setTimeout(() => this.moveAnnouncement.set(''), 2000);
    this.leadService
      .atualizarStatus(lead.uuid, {
        status: tgtCol.key,
        revisadoPor: 'pipeline-teclado',
        observacao: `Movido para ${tgtCol.label} via teclado`,
      })
      .subscribe({
        error: () => {
          applyMove(tgtCol.id, srcCol.id);
          this.refreshQualTotal();
          this.toast.error('Erro ao atualizar lead');
        },
      });
  }

  openLeadDetalhe(lead: Lead): void {
    const ref = this.dialog.open(LeadDetalheDialogComponent, {
      data: lead,
      width: '680px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadLeads();
      if (result === 'aprovado') setTimeout(() => this.loadProcessos(), 2000);
    });
  }

  openDetalhe(proc: ProcessoLicitatorio): void {
    const ref = this.dialog.open(ProcessoDetalheDialogComponent, {
      data: proc,
      width: '680px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((changed) => {
      if (changed) this.loadProcessos();
    });
  }

  orgColor(name: string): string {
    return ORG_COLORS[(name?.charCodeAt(0) ?? 0) % ORG_COLORS.length];
  }
  orgInitial(name: string): string {
    return name?.charAt(0).toUpperCase() ?? '?';
  }

  tipoShort(tipo: string): string {
    return (
      tipo
        ?.replace('Aviso de Contratação Direta', 'Contratação Direta')
        ?.replace('Dispensa de Licitação', 'Dispensa')
        ?.replace('Concorrência Eletrônica', 'Concorrência') ??
      tipo ??
      ''
    );
  }

  colTotalValue(leads: any[]): number {
    return leads.reduce((sum: number, l: any) => sum + (l.valorEstimado ?? 0), 0);
  }

  formatMillion(val: number): string {
    if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `R$ ${(val / 1_000).toFixed(0)}K`;
    return val > 0 ? `R$ ${val}` : '';
  }

  formatDate(d: string): string {
    if (!d) return '';
    try {
      const dt = d.includes('T') ? new Date(d) : new Date(d + 'T00:00:00');
      return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch {
      return d;
    }
  }
}
