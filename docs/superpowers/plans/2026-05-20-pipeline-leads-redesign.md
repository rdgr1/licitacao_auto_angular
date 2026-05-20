# Pipeline de Leads — Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir as colunas da pipeline de qualificação de leads (5 novas etapas) e exigir justificativa obrigatória em toda mudança de status.

**Architecture:** Atualizar o tipo `LeadStatus` no model, criar um `JustificativaDialogComponent` reutilizável, refatorar as colunas do `PipelineComponent` e o `LeadDetalheDialogComponent` com novos botões contextuais por status.

**Tech Stack:** Angular 17+ (standalone components), Angular Material (MatDialog, MatFormField), CDK Drag-and-Drop, TypeScript

---

## File Map

| Ação | Arquivo |
|------|---------|
| Modify | `src/app/core/models/lead.model.ts` |
| Create | `src/app/shared/components/justificativa-dialog/justificativa-dialog.component.ts` |
| Create | `src/app/shared/components/justificativa-dialog/justificativa-dialog.component.spec.ts` |
| Modify | `src/app/features/pipeline/pipeline.component.ts` |
| Modify | `src/app/features/leads/lead-detalhe-dialog/lead-detalhe-dialog.component.ts` |

---

## Task 1: Atualizar `lead.model.ts`

**Files:**
- Modify: `src/app/core/models/lead.model.ts`

- [ ] **Step 1: Substituir o conteúdo do model**

Substitua o arquivo inteiro por:

```typescript
export type LeadStatus =
  | 'DESCARTADO'
  | 'NOVO'
  | 'APROVACAO_PRESIDENCIA'
  | 'ESTUDO_VIABILIDADE'
  | 'SEGUNDA_APROVACAO_PRESIDENCIA'
  | 'QUALIFICADO';

export interface Lead {
  uuid: string;
  fonte: string;
  idOrigem: string;
  dataPublicacao: string;
  titulo: string;
  texto: string;
  tipo: string;
  coDemandante: string;
  orgao: string;
  status: LeadStatus;
  detectadoEm: string;
  revisadoEm: string | null;
  revisadoPor: string | null;
  observacao: string | null;
  editalId?: string | null;
}

export interface AtualizarStatusRequest {
  status: LeadStatus;
  revisadoPor: string;
  observacao: string;
}
```

- [ ] **Step 2: Verificar que não há erros de compilação**

```bash
npx ng build --configuration development 2>&1 | grep -E "error TS|ERROR"
```

Esperado: sem erros `TS`.

> Erros esperados neste momento: o `lead-detalhe-dialog` usa `observacao?: string` (opcional) — será corrigido nas próximas tasks.

- [ ] **Step 3: Commit**

```bash
git add src/app/core/models/lead.model.ts
git commit -m "feat(leads): update LeadStatus enum and make observacao required"
```

---

## Task 2: Criar `JustificativaDialogComponent`

**Files:**
- Create: `src/app/shared/components/justificativa-dialog/justificativa-dialog.component.ts`
- Create: `src/app/shared/components/justificativa-dialog/justificativa-dialog.component.spec.ts`

- [ ] **Step 1: Escrever o spec (teste falha primeiro)**

Crie `src/app/shared/components/justificativa-dialog/justificativa-dialog.component.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { JustificativaDialogComponent } from './justificativa-dialog.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

const dialogRefStub = { close: jasmine.createSpy('close') };

describe('JustificativaDialogComponent', () => {
  let component: JustificativaDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JustificativaDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefStub },
        { provide: MAT_DIALOG_DATA, useValue: { titulo: 'Mover para Novos Leads' } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(JustificativaDialogComponent);
    component = fixture.componentInstance;
    dialogRefStub.close.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('valido is false when texto has less than 10 chars', () => {
    component.texto = 'curto';
    expect(component.valido).toBeFalse();
  });

  it('valido is false when texto is empty', () => {
    component.texto = '';
    expect(component.valido).toBeFalse();
  });

  it('valido is true when texto has exactly 10 chars', () => {
    component.texto = '1234567890';
    expect(component.valido).toBeTrue();
  });

  it('confirmar does nothing when invalido', () => {
    component.texto = 'curto';
    component.confirmar();
    expect(dialogRefStub.close).not.toHaveBeenCalled();
  });

  it('confirmar closes with trimmed text when valido', () => {
    component.texto = '  justificativa valida aqui  ';
    component.confirmar();
    expect(dialogRefStub.close).toHaveBeenCalledWith('justificativa valida aqui');
  });

  it('cancelar closes with undefined', () => {
    component.cancelar();
    expect(dialogRefStub.close).toHaveBeenCalledWith(undefined);
  });
});
```

- [ ] **Step 2: Rodar os testes para confirmar que falham**

```bash
npx ng test --include="**/justificativa-dialog.component.spec.ts" --watch=false 2>&1 | tail -20
```

Esperado: `FAILED` com `Cannot find module`.

- [ ] **Step 3: Criar o componente**

Crie `src/app/shared/components/justificativa-dialog/justificativa-dialog.component.ts`:

```typescript
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface JustificativaDialogData {
  titulo: string;
  placeholder?: string;
}

@Component({
  selector: 'app-justificativa-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatFormFieldModule],
  template: `
    <div class="jd-shell">
      <h2 class="jd-title">{{ data.titulo }}</h2>
      <p class="jd-sub">Informe o motivo da mudança de status.</p>
      <mat-form-field appearance="outline" class="jd-field">
        <mat-label>Justificativa</mat-label>
        <textarea matInput
                  [(ngModel)]="texto"
                  [placeholder]="data.placeholder ?? 'Descreva o motivo (mínimo 10 caracteres)...'"
                  rows="4"
                  maxlength="500"></textarea>
        <mat-hint align="end">{{ texto.length }}/500</mat-hint>
      </mat-form-field>
      <div class="jd-actions">
        <button mat-button (click)="cancelar()">Cancelar</button>
        <button mat-flat-button color="primary" [disabled]="!valido" (click)="confirmar()">
          Confirmar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .jd-shell {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 380px;
      max-width: 460px;
    }
    .jd-title { margin: 0; font-size: 16px; font-weight: 700; color: #0F172A; }
    .jd-sub   { margin: 0; font-size: 13px; color: #64748B; }
    .jd-field { width: 100%; }
    .jd-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 4px;
    }
  `],
})
export class JustificativaDialogComponent {
  texto = '';

  constructor(
    public dialogRef: MatDialogRef<JustificativaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: JustificativaDialogData,
  ) {}

  get valido(): boolean { return this.texto.trim().length >= 10; }

  confirmar(): void {
    if (this.valido) this.dialogRef.close(this.texto.trim());
  }

  cancelar(): void { this.dialogRef.close(undefined); }
}
```

- [ ] **Step 4: Rodar os testes para confirmar que passam**

```bash
npx ng test --include="**/justificativa-dialog.component.spec.ts" --watch=false 2>&1 | tail -20
```

Esperado: `6 specs, 0 failures`.

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/components/justificativa-dialog/
git commit -m "feat(shared): add JustificativaDialogComponent with validation"
```

---

## Task 3: Atualizar `PipelineComponent` — novas colunas e drag-and-drop com justificativa

**Files:**
- Modify: `src/app/features/pipeline/pipeline.component.ts`

- [ ] **Step 1: Substituir o arquivo `pipeline.component.ts`**

```typescript
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
import { LeadDetalheDialogComponent } from '../leads/lead-detalhe-dialog/lead-detalhe-dialog.component';
import { JustificativaDialogComponent } from '../../shared/components/justificativa-dialog/justificativa-dialog.component';
import { TruncatePipe } from '../../shared/pipes/truncate.pipe';

interface LeadCol  { id: string; key: LeadStatus;    label: string; icon: string; color: string; accent: string; leads: Lead[]; }
interface ProcCol  { id: string; key: StatusProcesso; label: string; icon: string; color: string; accent: string; processos: ProcessoLicitatorio[]; }

const ORG_COLORS = ['#E91E63','#9C27B0','#673AB7','#3F51B5','#2196F3','#0097A7','#00897B','#43A047','#FB8C00','#E53935'];

@Component({
  selector: 'app-pipeline',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressSpinnerModule, DragDropModule, TruncatePipe, LeadDetalheDialogComponent],
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
    { id: 'q-descartado', key: 'DESCARTADO',                    label: 'Descarte',              icon: 'block',         color: '#94A3B8', accent: '#F8FAFC',                    leads: [] },
    { id: 'q-novo',       key: 'NOVO',                          label: 'Novos Leads',            icon: 'inbox',         color: '#3B82F6', accent: 'rgba(17,191,127,0.06)',       leads: [] },
    { id: 'q-aprovacao',  key: 'APROVACAO_PRESIDENCIA',         label: 'Aprov. Presidência',     icon: 'how_to_reg',    color: '#8B5CF6', accent: '#F5F3FF',                    leads: [] },
    { id: 'q-viab',       key: 'ESTUDO_VIABILIDADE',            label: 'Estudo e Viabilidade',   icon: 'science',       color: '#F59E0B', accent: '#FFFBEB',                    leads: [] },
    { id: 'q-2aprov',     key: 'SEGUNDA_APROVACAO_PRESIDENCIA', label: '2ª Aprov. Presidência',  icon: 'verified_user', color: '#11BF7F', accent: '#F0FDF4',                    leads: [] },
  ];

  procColumns: ProcCol[] = [
    { id: 'p-proposta',   key: 'ELABORANDO_PROPOSTA', label: 'Elaborando Proposta', icon: 'edit_document',          color: '#3B82F6', accent: 'rgba(17,191,127,0.06)', processos: [] },
    { id: 'p-docs',       key: 'DOCUMENTACAO',        label: 'Documentação',        icon: 'folder_open',            color: '#8B5CF6', accent: '#F5F3FF', processos: [] },
    { id: 'p-abertura',   key: 'AGUARDANDO_ABERTURA', label: 'Aguard. Abertura',    icon: 'schedule',               color: '#F59E0B', accent: '#FFFBEB', processos: [] },
    { id: 'p-disputa',    key: 'EM_DISPUTA',          label: 'Em Disputa',          icon: 'gavel',                  color: '#EF4444', accent: '#FFF1F2', processos: [] },
    { id: 'p-negociacao', key: 'NEGOCIACAO',          label: 'Negociação',          icon: 'handshake',              color: '#F97316', accent: '#FFF7ED', processos: [] },
    { id: 'p-ganho',      key: 'GANHO',               label: 'Ganho',               icon: 'emoji_events',           color: '#11BF7F', accent: '#F0FDF4', processos: [] },
    { id: 'p-perdido',    key: 'PERDIDO',             label: 'Perdido',             icon: 'sentiment_dissatisfied', color: '#94A3B8', accent: '#F8FAFC', processos: [] },
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
          const col = this.qualColumns.find(c => c.key === lead.status);
          if (col) col.leads.push(lead);
        }
        this.refreshQualTotal();
        this.loadingQual.set(false);
      },
      error: () => { this.toast.error('Erro ao carregar leads'); this.loadingQual.set(false); }
    });
  }

  loadProcessos(): void {
    this.loadingProc.set(true);
    this.processoService.listar({ page: 0, size: 500 }).subscribe({
      next: (page) => {
        this.procColumns.forEach(c => c.processos = []);
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
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const lead      = event.previousContainer.data[event.previousIndex];
    const targetCol = this.qualColumns.find(c => c.id === event.container.id)!;
    const prevCol   = this.qualColumns.find(c => c.id === event.previousContainer.id)!;

    const ref = this.dialog.open(JustificativaDialogComponent, {
      data: { titulo: `Mover para ${targetCol.label}` },
      width: '460px',
      disableClose: true,
    });

    ref.afterClosed().subscribe((justificativa: string | undefined) => {
      if (!justificativa) return;

      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      this.refreshQualTotal();

      this.leadService.atualizarStatus(lead.uuid, {
        status: targetCol.key,
        revisadoPor: 'pipeline',
        observacao: justificativa,
      }).subscribe({
        error: () => {
          const fromIdx = event.container.data.findIndex(l => l.uuid === lead.uuid);
          if (fromIdx >= 0) transferArrayItem(event.container.data, prevCol.leads, fromIdx, event.previousIndex);
          this.refreshQualTotal();
          this.toast.error('Erro ao atualizar lead');
        }
      });
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

  openLeadDetalhe(lead: Lead): void {
    const ref = this.dialog.open(LeadDetalheDialogComponent, { data: lead, width: '680px', maxWidth: '95vw' });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadLeads();
      if (result === 'aprovado') setTimeout(() => this.loadProcessos(), 2000);
    });
  }

  openDetalhe(proc: ProcessoLicitatorio): void {
    const ref = this.dialog.open(ProcessoDetalheDialogComponent, { data: proc, width: '680px', maxWidth: '95vw' });
    ref.afterClosed().subscribe(changed => { if (changed) this.loadProcessos(); });
  }

  orgColor(name: string):   string { return ORG_COLORS[(name?.charCodeAt(0) ?? 0) % ORG_COLORS.length]; }
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
```

- [ ] **Step 2: Verificar compilação**

```bash
npx ng build --configuration development 2>&1 | grep -E "error TS|ERROR"
```

Esperado: sem erros (ou apenas erros do lead-detalhe-dialog ainda não atualizado).

- [ ] **Step 3: Commit**

```bash
git add src/app/features/pipeline/pipeline.component.ts
git commit -m "feat(pipeline): redesign qual columns and add mandatory justification on drag-and-drop"
```

---

## Task 4: Atualizar `LeadDetalheDialogComponent` — novos botões por status

**Files:**
- Modify: `src/app/features/leads/lead-detalhe-dialog/lead-detalhe-dialog.component.ts`

- [ ] **Step 1: Substituir o arquivo `lead-detalhe-dialog.component.ts`**

```typescript
import { Component, Inject, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Lead, LeadStatus } from '../../../core/models/lead.model';
import { EditalResponse } from '../../../core/models/edital.model';
import { LeadService } from '../../../core/services/lead.service';
import { EditaisService } from '../../../core/services/editais.service';
import { ToastService } from '../../../core/services/toast.service';
import { CurrencyBrPipe } from '../../../shared/pipes/currency-br.pipe';
import { JustificativaDialogComponent } from '../../../shared/components/justificativa-dialog/justificativa-dialog.component';

const STATUS_META: Record<LeadStatus, { label: string; bg: string; color: string; dot: string }> = {
  DESCARTADO:                    { label: 'Descartado',             bg: '#F1F5F9', color: '#334155', dot: '#64748B' },
  NOVO:                          { label: 'Novo Lead',              bg: '#EFF6FF', color: '#1E40AF', dot: '#3B82F6' },
  APROVACAO_PRESIDENCIA:         { label: 'Aprov. Presidência',     bg: '#F5F3FF', color: '#5B21B6', dot: '#8B5CF6' },
  ESTUDO_VIABILIDADE:            { label: 'Estudo e Viabilidade',   bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
  SEGUNDA_APROVACAO_PRESIDENCIA: { label: '2ª Aprov. Presidência',  bg: '#F0FDF4', color: '#166534', dot: '#10B981' },
  QUALIFICADO:                   { label: 'Qualificado',            bg: '#F0FDF4', color: '#166534', dot: '#10B981' },
};

const ORG_COLORS = ['#E91E63','#9C27B0','#673AB7','#3F51B5','#2196F3','#0097A7','#00897B','#43A047','#FB8C00','#E53935'];

@Component({
  selector: 'app-lead-detalhe-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule, CurrencyBrPipe],
  template: `
    <div class="ld-shell">

      <!-- Header -->
      <div class="ld-header">
        <div class="ld-header-top">
          <div class="ld-badges">
            <span class="fonte-badge fonte-{{ data.fonte?.toLowerCase() }}">{{ data.fonte }}</span>
            <span class="tipo-badge">{{ data.tipo }}</span>
          </div>
          <div class="ld-header-right">
            <span class="status-pill" [style.background]="statusMeta.bg" [style.color]="statusMeta.color">
              <span class="sdot" [style.background]="statusMeta.dot"></span>{{ statusMeta.label }}
            </span>
            <button class="close-btn" mat-dialog-close aria-label="Fechar"><mat-icon aria-hidden="true">close</mat-icon></button>
          </div>
        </div>
        <h2 class="ld-title">{{ normalizeCase(data.titulo) }}</h2>
      </div>

      <!-- Info bar -->
      <div class="ld-infobar">
        <div class="info-item">
          <span class="org-avatar" [style.background]="orgColor(data.orgao)">{{ orgInitial(data.orgao) }}</span>
          <div><span class="info-k">Órgão</span><span class="info-v">{{ data.orgao }}</span></div>
        </div>
        <div class="infobar-sep"></div>
        <div class="info-item">
          <mat-icon class="info-icon">calendar_today</mat-icon>
          <div><span class="info-k">Publicação</span><span class="info-v">{{ formatDate(data.dataPublicacao) }}</span></div>
        </div>
        @if (data.revisadoPor) {
          <div class="infobar-sep"></div>
          <div class="info-item">
            <mat-icon class="info-icon">person</mat-icon>
            <div><span class="info-k">Revisado por</span><span class="info-v">{{ data.revisadoPor }}</span></div>
          </div>
        }
      </div>

      <!-- Body -->
      <div class="ld-body">
        <p class="ld-texto">{{ data.texto || 'Texto completo não disponível.' }}</p>
        @if (data.observacao) {
          <div class="ld-obs"><mat-icon>sticky_note_2</mat-icon><span>{{ data.observacao }}</span></div>
        }
      </div>

      <!-- Edital PNCP -->
      <div class="ld-edital-section">
        <span class="edital-label"><mat-icon>description</mat-icon>Edital PNCP</span>

        @if (loadingEdital()) {
          <div class="edital-loading"><mat-spinner diameter="16" /><span>Buscando no PNCP...</span></div>

        } @else if (edital()) {
          <div class="edital-card">
            <div class="edital-grid">
              <div class="ef"><span class="ek">Número</span><span class="ev mono">{{ edital()!.numero }}</span></div>
              <div class="ef"><span class="ek">Modalidade</span><span class="ev">{{ formatModalidade(edital()!.modalidade) }}</span></div>
              <div class="ef"><span class="ek">Valor estimado</span><span class="ev money">{{ edital()!.valorEstimado | currencyBr }}</span></div>
              <div class="ef"><span class="ek">Abertura</span><span class="ev">{{ formatDate(edital()!.dataAbertura) }}</span></div>
            </div>
            <div class="edital-links">
              @if (edital()!.pdfUrl) {
                <a [href]="edital()!.pdfUrl" target="_blank" class="elink primary">
                  <mat-icon>picture_as_pdf</mat-icon>PDF do Edital
                </a>
              }
              @if (edital()!.sourceUrl) {
                <a [href]="edital()!.sourceUrl" target="_blank" class="elink">
                  <mat-icon>open_in_new</mat-icon>Ver no PNCP
                </a>
              }
            </div>
          </div>

        } @else if (editalError()) {
          <div class="edital-empty error">
            <mat-icon>search_off</mat-icon>
            <span>{{ editalError() }}</span>
            <button class="btn-buscar" (click)="buscarEdital()">Tentar novamente</button>
          </div>

        } @else {
          <div class="edital-empty">
            <mat-icon>manage_search</mat-icon>
            <div>
              <span>Nenhum edital vinculado.</span>
              <small>Busca por proximidade de data e título no PNCP.</small>
            </div>
            <button class="btn-buscar" (click)="buscarEdital()" [disabled]="salvando">
              <mat-icon>search</mat-icon>Buscar no PNCP
            </button>
          </div>
        }
      </div>

      <!-- Actions -->
      <div class="ld-actions">
        <button mat-button mat-dialog-close class="act-close">Fechar</button>
        <div class="act-right">

          @if (data.status === 'DESCARTADO') {
            <button class="act-btn act-next" (click)="moverPara('NOVO')" [disabled]="salvando">
              <mat-icon>inbox</mat-icon>Mover para Novos Leads
            </button>
          }

          @if (data.status === 'NOVO') {
            <button class="act-btn act-discard" (click)="moverPara('DESCARTADO')" [disabled]="salvando">
              <mat-icon>block</mat-icon>
            </button>
            <button class="act-btn act-next" (click)="moverPara('APROVACAO_PRESIDENCIA')" [disabled]="salvando">
              <mat-icon>how_to_reg</mat-icon>Aprov. Presidência
            </button>
          }

          @if (data.status === 'APROVACAO_PRESIDENCIA') {
            <button class="act-btn act-discard" (click)="moverPara('DESCARTADO')" [disabled]="salvando">
              <mat-icon>block</mat-icon>
            </button>
            <button class="act-btn act-next" (click)="moverPara('ESTUDO_VIABILIDADE')" [disabled]="salvando">
              <mat-icon>science</mat-icon>Estudo e Viabilidade
            </button>
          }

          @if (data.status === 'ESTUDO_VIABILIDADE') {
            <button class="act-btn act-impugnar" (click)="irParaImpugnacao()">
              <mat-icon>gavel</mat-icon>Impugnar
            </button>
            <button class="act-btn act-cotacao" (click)="irParaCotacao()">
              <mat-icon>request_quote</mat-icon>Cotação
            </button>
            <button class="act-btn act-discard" (click)="moverPara('DESCARTADO')" [disabled]="salvando">
              <mat-icon>block</mat-icon>
            </button>
            <button class="act-btn act-next" (click)="moverPara('SEGUNDA_APROVACAO_PRESIDENCIA')" [disabled]="salvando">
              <mat-icon>verified_user</mat-icon>2ª Aprovação
            </button>
          }

          @if (data.status === 'SEGUNDA_APROVACAO_PRESIDENCIA') {
            <button class="act-btn act-discard" (click)="moverPara('DESCARTADO')" [disabled]="salvando">
              <mat-icon>block</mat-icon>
            </button>
            <button class="act-btn act-qualify" (click)="aprovar()" [disabled]="salvando">
              @if (salvando) { <span class="saving-dot"></span> } @else { <mat-icon>verified</mat-icon> }
              Aprovar
            </button>
          }

          @if (data.status === 'QUALIFICADO') {
            <div class="act-done"><mat-icon>check_circle</mat-icon>Aprovado — em processo</div>
          }

        </div>
      </div>
    </div>
  `,
  styles: [`
    .ld-shell { display: flex; flex-direction: column; width: 100%; background: #fff; border-radius: 16px; overflow: hidden; }

    /* Header */
    .ld-header { padding: 20px 22px 16px; border-bottom: 1px solid #F1F5F9; }
    .ld-header-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
    .ld-badges { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .fonte-badge { font-size: 9px; font-weight: 800; border-radius: 4px; padding: 2px 7px; text-transform: uppercase; letter-spacing: 0.07em;
      &.fonte-dodf { background: #FFFBEB; color: #92400E; border: 1px solid #FDE68A; }
      &.fonte-pncp { background: #F5F3FF; color: #5B21B6; border: 1px solid #DDD6FE; }
      &.fonte-dou  { background: #EFF6FF; color: #1E40AF; border: 1px solid #BFDBFE; } }
    .tipo-badge { font-size: 10px; color: #94A3B8; background: #F8FAFC; border: 1px solid #E8EDF5; border-radius: 4px; padding: 1px 7px; font-family: var(--font-secondary); font-weight: 600; }
    .ld-header-right { display: flex; align-items: center; gap: 6px; }
    .status-pill { display: inline-flex; align-items: center; gap: 5px; border-radius: 20px; font-size: 11px; font-weight: 600; padding: 3px 10px; }
    .sdot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
    .close-btn { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; border: none; background: transparent; cursor: pointer; padding: 0; transition: background 140ms; flex-shrink: 0; mat-icon { font-size: 18px; width: 18px; height: 18px; line-height: 18px; color: #94A3B8; } &:hover { background: rgba(0,0,0,0.06); } }
    .ld-title { font-size: 15px; font-weight: 700; color: #0F172A; margin: 0; line-height: 1.5; }

    /* Info bar */
    .ld-infobar { display: flex; align-items: stretch; background: #F8FAFC; border-bottom: 1px solid #F1F5F9; flex-wrap: wrap; }
    .info-item { display: flex; align-items: center; gap: 10px; padding: 12px 18px; }
    .infobar-sep { width: 1px; background: #E8EDF5; flex-shrink: 0; margin: 8px 0; }
    .org-avatar { width: 30px; height: 30px; border-radius: 8px; color: #fff; flex-shrink: 0; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
    .info-icon { font-size: 18px; width: 18px; height: 18px; color: #94A3B8; flex-shrink: 0; }
    .info-k { display: block; font-size: 9.5px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 1px; font-family: var(--font-secondary); }
    .info-v { display: block; font-size: 12.5px; font-weight: 500; color: #1E293B; }

    /* Body */
    .ld-body { padding: 18px 22px; overflow-y: auto; max-height: 180px;
      &::-webkit-scrollbar { width: 4px; } &::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; } }
    .ld-texto { font-size: 13.5px; line-height: 1.75; color: #334155; margin: 0; white-space: pre-wrap; }
    .ld-obs { display: flex; gap: 8px; margin-top: 14px; padding: 10px 14px; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; font-size: 12.5px; color: #92400E;
      mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; } }

    /* Edital section */
    .ld-edital-section { border-top: 1px solid #F1F5F9; padding: 14px 22px; display: flex; flex-direction: column; gap: 10px; }
    .edital-label { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.06em;
      mat-icon { font-size: 14px; width: 14px; height: 14px; color: #11BF7F; } }
    .edital-loading { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748B; }
    .edital-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 3px solid #11BF7F; border-radius: 10px; padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; }
    .edital-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 20px; }
    .ef { display: flex; flex-direction: column; gap: 2px; }
    .ek { font-size: 9.5px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.06em; font-family: var(--font-secondary); }
    .ev { font-size: 13px; font-weight: 600; color: #1E293B; &.mono { font-family: 'JetBrains Mono','Courier New',monospace; font-size: 12px; } &.money { color: #059669; } }
    .edital-links { display: flex; gap: 8px; flex-wrap: wrap; }
    .elink { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 7px; text-decoration: none; font-size: 12px; font-weight: 600; transition: all 130ms;
      background: #F1F5F9; color: #475569; mat-icon { font-size: 14px; width: 14px; height: 14px; }
      &.primary { background: #11BF7F; color: #fff; &:hover { background: #0DA66E; } }
      &:not(.primary):hover { background: #E2E8F0; } }
    .edital-empty { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 10px; font-size: 13px; color: #64748B;
      mat-icon { font-size: 20px; width: 20px; height: 20px; color: #CBD5E1; flex-shrink: 0; }
      div { flex: 1; span { display: block; } small { font-size: 11px; color: #94A3B8; font-family: var(--font-secondary); } }
      &.error mat-icon { color: #FCA5A5; } }
    .btn-buscar { display: inline-flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: 8px; border: 1.5px solid #11BF7F; background: rgba(17,191,127,0.06); color: #059669;
      font-size: 12px; font-weight: 700; font-family: inherit; cursor: pointer; transition: all 130ms; white-space: nowrap;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
      &:hover { background: #11BF7F; color: #fff; } &:disabled { opacity: 0.5; cursor: not-allowed; } }

    /* Actions */
    .ld-actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 18px; border-top: 1px solid #F1F5F9; background: #FAFBFC; }
    .act-close { color: #64748B; font-size: 13px; }
    .act-right { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .act-btn { display: inline-flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 8px; border: 1.5px solid transparent; font-size: 12.5px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 130ms;
      mat-icon { font-size: 15px; width: 15px; height: 15px; } &:disabled { opacity: 0.5; cursor: not-allowed; }
      &.act-next     { background: #EFF6FF; border-color: #BFDBFE; color: #1E40AF; &:hover:not(:disabled) { background: #DBEAFE; } }
      &.act-discard  { background: transparent; border-color: #E2E8F0; color: #94A3B8; padding: 7px 10px; &:hover:not(:disabled) { background: #FEE2E2; border-color: #FCA5A5; color: #EF4444; } }
      &.act-qualify  { background: #11BF7F; border-color: #11BF7F; color: #fff; box-shadow: 0 2px 8px rgba(17,191,127,0.25); &:hover:not(:disabled) { background: #0DA66E; } }
      &.act-impugnar { background: #FFF1F2; border-color: #FCA5A5; color: #991B1B; &:hover { background: #FEE2E2; } }
      &.act-cotacao  { background: #EFF6FF; border-color: #BFDBFE; color: #1E40AF; &:hover { background: #DBEAFE; } } }
    .saving-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .act-done { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 600; color: #11BF7F; mat-icon { font-size: 16px; width: 16px; height: 16px; } }
  `]
})
export class LeadDetalheDialogComponent implements OnInit {
  private leadService    = inject(LeadService);
  private editaisService = inject(EditaisService);
  private toast          = inject(ToastService);
  private dialog         = inject(MatDialog);
  private router         = inject(Router);

  salvando      = false;
  loadingEdital = signal(false);
  edital        = signal<EditalResponse | null>(null);
  editalError   = signal<string | null>(null);

  constructor(
    public dialogRef: MatDialogRef<LeadDetalheDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Lead,
  ) {}

  ngOnInit(): void {
    if (this.data.editalId) {
      this.loadingEdital.set(true);
      this.editaisService.getById(this.data.editalId).subscribe({
        next: (e) => { this.edital.set(e); this.loadingEdital.set(false); },
        error: () => this.loadingEdital.set(false),
      });
    }
  }

  buscarEdital(): void {
    this.loadingEdital.set(true);
    this.editalError.set(null);
    this.leadService.buscarEdital(this.data.uuid).subscribe({
      next: (e) => { this.edital.set(e); this.loadingEdital.set(false); },
      error: (err) => {
        this.loadingEdital.set(false);
        this.editalError.set(err.status === 404
          ? 'Nenhum edital encontrado no PNCP para este lead.'
          : 'Erro ao buscar edital. Tente novamente.');
      }
    });
  }

  moverPara(status: LeadStatus): void {
    const label = STATUS_META[status].label;
    const ref = this.dialog.open(JustificativaDialogComponent, {
      data: { titulo: `Mover para ${label}` },
      width: '460px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((justificativa: string | undefined) => {
      if (!justificativa) return;
      this.salvando = true;
      this.leadService.atualizarStatus(this.data.uuid, {
        status,
        revisadoPor: 'analista@brasfort.com.br',
        observacao: justificativa,
      }).subscribe({
        next: () => { this.toast.success(label); this.dialogRef.close(true); },
        error: () => { this.toast.error('Erro ao atualizar status'); this.salvando = false; },
      });
    });
  }

  aprovar(): void {
    const ref = this.dialog.open(JustificativaDialogComponent, {
      data: { titulo: 'Aprovar lead — criar processo licitatório' },
      width: '460px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((justificativa: string | undefined) => {
      if (!justificativa) return;
      this.salvando = true;
      this.leadService.atualizarStatus(this.data.uuid, {
        status: 'QUALIFICADO',
        revisadoPor: 'analista@brasfort.com.br',
        observacao: justificativa,
      }).subscribe({
        next: () => {
          this.toast.success('Lead aprovado — criando processo...');
          this.dialogRef.close('aprovado');
        },
        error: () => { this.toast.error('Erro ao aprovar lead'); this.salvando = false; },
      });
    });
  }

  irParaImpugnacao(): void { this.dialogRef.close(); this.router.navigate(['/impugnacao']); }
  irParaCotacao():    void { this.dialogRef.close(); this.router.navigate(['/cotacao/itens']); }

  get statusMeta() { return STATUS_META[this.data.status] ?? STATUS_META['NOVO']; }
  orgColor(name: string):   string { return ORG_COLORS[(name?.charCodeAt(0) ?? 0) % ORG_COLORS.length]; }
  orgInitial(name: string): string { return name?.charAt(0).toUpperCase() ?? '?'; }

  formatDate(d: string): string {
    if (!d) return '';
    try {
      const dt = d.includes('T') ? new Date(d) : new Date(d + 'T00:00:00');
      return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return d; }
  }

  formatModalidade(m: string): string {
    return m?.replace(/_/g, ' ').replace('ELETRONICO', 'ELETRÔNICO').replace('CONCORRENCIA', 'CONCORRÊNCIA') ?? m;
  }

  normalizeCase(text: string): string {
    if (!text) return '';
    const isAllCaps = text === text.toUpperCase() && /[A-ZÁÉÍÓÚÀÂÊÔÃÕÇ]/.test(text);
    if (!isAllCaps) return text;
    return text.toLowerCase().replace(/(^\s*\S|[.!?]\s+\S)/g, c => c.toUpperCase());
  }
}
```

- [ ] **Step 2: Verificar compilação sem erros**

```bash
npx ng build --configuration development 2>&1 | grep -E "error TS|ERROR"
```

Esperado: nenhum erro.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/leads/lead-detalhe-dialog/lead-detalhe-dialog.component.ts
git commit -m "feat(leads): redesign lead dialog with contextual actions and mandatory justification"
```

---

## Task 5: Verificação final

- [ ] **Step 1: Build completo**

```bash
npx ng build --configuration development 2>&1 | tail -10
```

Esperado: `Build at: ... - Time: ...ms` sem erros.

- [ ] **Step 2: Rodar todos os testes**

```bash
npx ng test --watch=false 2>&1 | tail -20
```

Esperado: todos os specs passam (incluindo os 6 do `JustificativaDialogComponent`).

- [ ] **Step 3: Commit final de verificação (se necessário)**

```bash
git add -A
git status
```

Apenas commitar se houver arquivos não commitados.

---

## Contexto para o Backend

O arquivo `docs/superpowers/specs/2026-05-20-pipeline-leads-redesign.md` contém a seção **"Mudanças Necessárias no Backend"** com os 4 itens que precisam ser implementados no backend Spring Boot:

1. Enum `LeadStatus` — adicionar 3 novos valores, remover 2
2. Serviço de coleta — usar `NOVO`/`DESCARTADO` na classificação inicial
3. Trigger de processo — sem alteração (continua em `QUALIFICADO`)
4. Campo `observacao` — tornar obrigatório (`@NotBlank`) no `PATCH /leads/{uuid}/status`
