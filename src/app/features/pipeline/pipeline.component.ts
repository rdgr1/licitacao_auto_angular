import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { LeadService } from '../../core/services/lead.service';
import { ProcessoService } from '../../core/services/processo.service';
import { ToastService } from '../../core/services/toast.service';
import { Lead, LeadStatus } from '../../core/models/lead.model';
import { ProcessoLicitatorio, StatusProcesso } from '../../core/models/processo.model';
import { ProcessoDetalheDialogComponent } from '../processos/processo-detalhe-dialog/processo-detalhe-dialog.component';
import { TruncatePipe } from '../../shared/pipes/truncate.pipe';

interface LeadCol  { id: string; key: LeadStatus;    label: string; icon: string; color: string; accent: string; leads: Lead[]; }
interface ProcCol  { id: string; key: StatusProcesso; label: string; icon: string; color: string; accent: string; processos: ProcessoLicitatorio[]; }

// ── Colors ───────────────────────────────────────────────────────────────────

const ORG_COLORS = ['#E91E63','#9C27B0','#673AB7','#3F51B5','#2196F3','#0097A7','#00897B','#43A047','#FB8C00','#E53935'];

@Component({
  selector: 'app-pipeline',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressSpinnerModule, DragDropModule, TruncatePipe],
  templateUrl: './pipeline.component.html',
  styleUrl: './pipeline.component.scss',
})
export class PipelineComponent implements OnInit {
  private leadService     = inject(LeadService);
  private processoService = inject(ProcessoService);
  private toast           = inject(ToastService);
  private dialog          = inject(MatDialog);

  active      = signal<'qual' | 'proc'>('qual');
  loadingQual = signal(true);
  loadingProc = signal(true);

  qualColumns: LeadCol[] = [
    { id: 'q-nova',        key: 'NOVO',           label: 'Nova',             icon: 'inbox',         color: '#3B82F6', accent: 'rgba(17,191,127,0.06)', leads: [] },
    { id: 'q-triagem',     key: 'EM_TRIAGEM',      label: 'Em Triagem',       icon: 'manage_search', color: '#8B5CF6', accent: '#F5F3FF', leads: [] },
    { id: 'q-verificando', key: 'VERIFICANDO_REQ', label: 'Verificando Req.', icon: 'checklist',     color: '#F59E0B', accent: '#FFFBEB', leads: [] },
    { id: 'q-qualificado', key: 'QUALIFICADO',     label: 'Qualificado',      icon: 'verified',      color: '#11BF7F', accent: '#F0FDF4', leads: [] },
    { id: 'q-descartado',  key: 'DESCARTADO',      label: 'Descartado',       icon: 'block',         color: '#94A3B8', accent: '#F8FAFC', leads: [] },
  ];

  procColumns: ProcCol[] = [
    { id: 'p-proposta',  key: 'ELABORANDO_PROPOSTA', label: 'Elaborando Proposta', icon: 'edit_document',          color: '#3B82F6', accent: 'rgba(17,191,127,0.06)', processos: [] },
    { id: 'p-docs',      key: 'DOCUMENTACAO',        label: 'Documentação',        icon: 'folder_open',            color: '#8B5CF6', accent: '#F5F3FF', processos: [] },
    { id: 'p-abertura',  key: 'AGUARDANDO_ABERTURA', label: 'Aguard. Abertura',    icon: 'schedule',               color: '#F59E0B', accent: '#FFFBEB', processos: [] },
    { id: 'p-disputa',   key: 'EM_DISPUTA',          label: 'Em Disputa',          icon: 'gavel',                  color: '#EF4444', accent: '#FFF1F2', processos: [] },
    { id: 'p-negociacao',key: 'NEGOCIACAO',          label: 'Negociação',          icon: 'handshake',              color: '#F97316', accent: '#FFF7ED', processos: [] },
    { id: 'p-ganho',     key: 'GANHO',               label: 'Ganho',               icon: 'emoji_events',           color: '#11BF7F', accent: '#F0FDF4', processos: [] },
    { id: 'p-perdido',   key: 'PERDIDO',             label: 'Perdido',             icon: 'sentiment_dissatisfied', color: '#94A3B8', accent: '#F8FAFC', processos: [] },
  ];

  get qualConnected(): string[] { return this.qualColumns.map(c => c.id); }
  get procConnected(): string[] { return this.procColumns.map(c => c.id); }

  qualTotal = signal(0);
  procTotal = signal(0);

  private refreshQualTotal(): void { this.qualTotal.set(this.qualColumns.reduce((n, c) => n + c.leads.length, 0)); }
  private refreshProcTotal(): void { this.procTotal.set(this.procColumns.reduce((n, c) => n + c.processos.length, 0)); }

  ngOnInit(): void {
    this.loadLeads();
    this.loadProcessos();
  }

  loadLeads(): void {
    this.loadingQual.set(true);
    this.qualColumns.forEach(c => c.leads = []);
    this.leadService.listar({ page: 0, size: 500 }).subscribe({
      next: (page) => {
        for (const lead of page.content ?? []) {
          (this.qualColumns.find(c => c.key === lead.status) ?? this.qualColumns[0]).leads.push(lead);
        }
        this.refreshQualTotal();
        this.loadingQual.set(false);
      },
      error: () => { this.toast.error('Erro ao carregar leads'); this.loadingQual.set(false); }
    });
  }

  loadProcessos(): void {
    this.loadingProc.set(true);
    this.procColumns.forEach(c => c.processos = []);
    this.processoService.listar({ page: 0, size: 500 }).subscribe({
      next: (page) => {
        for (const proc of page.content ?? []) {
          (this.procColumns.find(c => c.key === proc.status) ?? this.procColumns[0]).processos.push(proc);
        }
        this.refreshProcTotal();
        this.loadingProc.set(false);
      },
      error: () => { this.loadingProc.set(false); }
    });
  }

  dropQual(event: CdkDragDrop<Lead[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex); return;
    }
    const lead = event.previousContainer.data[event.previousIndex];
    const targetCol = this.qualColumns.find(c => c.id === event.container.id)!;
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    this.refreshQualTotal();

    this.leadService.atualizarStatus(lead.uuid, { status: targetCol.key, revisadoPor: 'pipeline' }).subscribe({
      next: () => {
        if (targetCol.key === 'QUALIFICADO') {
          this.toast.success('Lead qualificado — criando processo...');
          setTimeout(() => this.loadProcessos(), 2000);
        }
      },
      error: () => {
        const fromIdx = event.container.data.findIndex(l => l.uuid === lead.uuid);
        const prevCol = this.qualColumns.find(c => c.id === event.previousContainer.id)!;
        if (fromIdx >= 0) transferArrayItem(event.container.data, prevCol.leads, fromIdx, event.previousIndex);
        this.toast.error('Erro ao atualizar lead');
      }
    });
  }

  dropProc(event: CdkDragDrop<ProcessoLicitatorio[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex); return;
    }
    const proc = event.previousContainer.data[event.previousIndex];
    const targetCol = this.procColumns.find(c => c.id === event.container.id)!;
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    this.refreshProcTotal();

    this.processoService.atualizarStatus(proc.uuid, targetCol.key).subscribe({
      error: () => {
        const fromIdx = event.container.data.findIndex(p => p.uuid === proc.uuid);
        const prevCol = this.procColumns.find(c => c.id === event.previousContainer.id)!;
        if (fromIdx >= 0) transferArrayItem(event.container.data, prevCol.processos, fromIdx, event.previousIndex);
        this.toast.error('Erro ao atualizar processo');
      }
    });
  }

  openDetalhe(proc: ProcessoLicitatorio): void {
    this.dialog.open(ProcessoDetalheDialogComponent, { data: proc, width: '680px', maxWidth: '95vw' });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  orgColor(name: string): string { return ORG_COLORS[(name?.charCodeAt(0) ?? 0) % ORG_COLORS.length]; }
  orgInitial(name: string): string { return name?.charAt(0).toUpperCase() ?? '?'; }

  tipoShort(tipo: string): string {
    return tipo
      ?.replace('Aviso de Contratação Direta', 'Contratação Direta')
      ?.replace('Dispensa de Licitação', 'Dispensa')
      ?.replace('Concorrência Eletrônica', 'Concorrência')
      ?? tipo ?? '';
  }

  formatDate(d: string): string {
    if (!d) return '';
    try {
      const dt = d.includes('T') ? new Date(d) : new Date(d + 'T00:00:00');
      return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch { return d; }
  }
}
