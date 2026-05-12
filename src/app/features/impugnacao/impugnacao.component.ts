import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ChatService } from '../../core/services/chat.service';
import { EditalImpugnacao, ImpugnacaoResponse } from '../../core/models/chat.model';

type Step = 'search' | 'found' | 'generating' | 'done';

@Component({
  selector: 'app-impugnacao',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    DecimalPipe,
    DatePipe,
  ],
  template: `
    <div class="page-wrapper">

      <!-- ── Page Header ──────────────────────────────────────────────── -->
      <div class="page-header">
        <div class="header-icon">
          <mat-icon>gavel</mat-icon>
        </div>
        <div>
          <h1>Motor de Impugnação</h1>
          <p>Gere petições de impugnação fundamentadas na Lei 14.133/21 com análise automática de irregularidades</p>
        </div>
      </div>

      <div class="impug-layout">

        <!-- ── Left: Search + Edital ───────────────────────────────────── -->
        <div class="left-col">

          <!-- Step 1: Search -->
          <div class="card search-card">
            <div class="card-title">
              <span class="step-badge">1</span>
              Localizar Edital
            </div>

            <form [formGroup]="searchForm" (ngSubmit)="buscarEdital()" class="search-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Número do Edital</mat-label>
                <mat-icon matPrefix>search</mat-icon>
                <input matInput formControlName="numero"
                       placeholder="Ex: PE-007/2024, CC-001/2024" />
                @if (searchForm.controls.numero.touched && searchForm.controls.numero.errors?.['required']) {
                  <mat-error>Informe o número do edital</mat-error>
                }
              </mat-form-field>

              <button mat-flat-button type="submit"
                      class="search-btn"
                      [disabled]="searching()">
                @if (searching()) {
                  <mat-spinner diameter="18"></mat-spinner>
                  <span>Buscando...</span>
                } @else {
                  <ng-container>
                    <mat-icon>search</mat-icon>
                    <span>Buscar Edital</span>
                  </ng-container>
                }
              </button>
            </form>

            @if (searchError()) {
              <div class="error-msg">
                <mat-icon>error_outline</mat-icon>
                {{ searchError() }}
              </div>
            }
          </div>

          <!-- Step 2: Edital Found -->
          @if (edital()) {
            <div class="card edital-card">
              <div class="card-title">
                <span class="step-badge">2</span>
                Edital Identificado
                <span class="found-badge">
                  <mat-icon>check_circle</mat-icon> Encontrado
                </span>
              </div>

              <div class="edital-number">{{ edital()!.numero }}</div>

              <p class="edital-objeto">{{ edital()!.objeto }}</p>

              <div class="edital-meta">
                <div class="meta-item">
                  <mat-icon>business</mat-icon>
                  <span>{{ edital()!.orgao }}</span>
                </div>
                <div class="meta-item">
                  <mat-icon>payments</mat-icon>
                  <span>R$ {{ edital()!.valorEstimado | number:'1.2-2' }}</span>
                </div>
                <div class="meta-item">
                  <mat-icon>event</mat-icon>
                  <span>Abertura: {{ edital()!.dataAbertura | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="meta-item deadline" [class.urgent]="isUrgent()">
                  <mat-icon>schedule</mat-icon>
                  <span>Prazo impugnação: {{ edital()!.prazoImpugnacao | date:'dd/MM/yyyy HH:mm' }}</span>
                  @if (isUrgent()) {
                    <span class="urgent-tag">URGENTE</span>
                  }
                </div>
              </div>

              <!-- Step 3: Motivos adicionais -->
              <div class="card-title mt-section">
                <span class="step-badge">3</span>
                Argumentos Adicionais <span class="optional">(opcional)</span>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Descreva irregularidades específicas encontradas</mat-label>
                <textarea matInput
                          [formControl]="motivosCtrl"
                          placeholder="Ex: A cláusula 5.2 exige certificação específica que restringe a competição..."
                          rows="3">
                </textarea>
              </mat-form-field>

              <button mat-flat-button class="generate-btn"
                      (click)="gerarImpugnacao()"
                      [disabled]="step() === 'generating'">
                @if (step() === 'generating') {
                  <mat-spinner diameter="20"></mat-spinner>
                  <span>Analisando e redigindo petição...</span>
                } @else {
                  <ng-container>
                    <mat-icon>auto_awesome</mat-icon>
                    <span>Gerar Impugnação com IA</span>
                  </ng-container>
                }
              </button>
            </div>
          }
        </div>

        <!-- ── Right: Result ───────────────────────────────────────────── -->
        <div class="right-col">
          @if (step() === 'done' && result()) {
            <div class="card result-card">
              <div class="result-header">
                <div class="result-title">
                  <mat-icon>description</mat-icon>
                  Impugnação Gerada
                </div>
                <div class="result-actions">
                  <button mat-stroked-button class="action-btn" (click)="copyText()"
                          [matTooltip]="copied() ? 'Copiado!' : 'Copiar texto'">
                    <mat-icon>{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
                    {{ copied() ? 'Copiado' : 'Copiar' }}
                  </button>
                  <button mat-stroked-button class="action-btn" matTooltip="Baixar em .docx">
                    <mat-icon>download</mat-icon>
                    Download
                  </button>
                  <button mat-flat-button class="print-btn" matTooltip="Imprimir">
                    <mat-icon>print</mat-icon>
                    Imprimir
                  </button>
                </div>
              </div>

              <!-- Legal basis tags -->
              <div class="legal-tags">
                @for (fund of result()!.fundamentos; track fund) {
                  <span class="legal-tag">
                    <mat-icon>gavel</mat-icon>
                    {{ fund }}
                  </span>
                }
              </div>

              <!-- Irregularidades -->
              <div class="irregularidades-section">
                <div class="section-label">Irregularidades identificadas</div>
                <ul class="irregularidades-list">
                  @for (irreg of result()!.irregularidades; track irreg) {
                    <li>
                      <mat-icon>warning_amber</mat-icon>
                      <span>{{ irreg }}</span>
                    </li>
                  }
                </ul>
              </div>

              <!-- Document text -->
              <div class="document-area">
                <div class="document-watermark">RASCUNHO</div>
                <pre class="document-text">{{ result()!.texto }}</pre>
              </div>

              <div class="deadline-info">
                <mat-icon>schedule</mat-icon>
                Prazo para protocolo:
                <strong>{{ formatPrazo(result()!.prazo) }}</strong>
              </div>
            </div>
          } @else if (step() === 'generating') {
            <div class="card generating-card">
              <div class="generating-inner">
                <mat-spinner diameter="48"></mat-spinner>
                <h3>Analisando o edital...</h3>
                <p>A IA está revisando as cláusulas, verificando irregularidades e redigindo a petição com base na Lei 14.133/21.</p>
                <div class="generating-steps">
                  <div class="gen-step done">
                    <mat-icon>check_circle</mat-icon> Edital carregado
                  </div>
                  <div class="gen-step active">
                    <div class="step-dot"></div> Analisando cláusulas
                  </div>
                  <div class="gen-step pending">
                    <div class="step-dot"></div> Redigindo petição
                  </div>
                </div>
              </div>
            </div>
          } @else {
            <div class="card placeholder-card">
              <div class="placeholder-inner">
                <div class="placeholder-icon">
                  <mat-icon>gavel</mat-icon>
                </div>
                <h3>Motor de Impugnação IA</h3>
                <p>Busque um edital à esquerda e nossa IA irá analisar automaticamente as irregularidades, identificar os fundamentos legais e redigir a petição formal.</p>

                <div class="capabilities">
                  <div class="cap-item">
                    <mat-icon>check_circle</mat-icon>
                    <span>Análise automática da Lei 14.133/21</span>
                  </div>
                  <div class="cap-item">
                    <mat-icon>check_circle</mat-icon>
                    <span>Verificação de súmulas do TCU</span>
                  </div>
                  <div class="cap-item">
                    <mat-icon>check_circle</mat-icon>
                    <span>Identificação de cláusulas restritivas</span>
                  </div>
                  <div class="cap-item">
                    <mat-icon>check_circle</mat-icon>
                    <span>Petição formal pronta para protocolo</span>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper {
      padding: 28px 32px;
      max-width: 1400px;
      font-family: 'Plus Jakarta Sans', sans-serif;

      @media (max-width: 768px) { padding: 16px; }
    }

    /* ── Header ──────────────────────────────────────────────────────── */
    .page-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 28px;

      h1 { font-size: 22px; font-weight: 800; color: #0F172A; margin: 0 0 4px; }
      p  { color: #64748B; font-size: 13.5px; line-height: 1.5; margin: 0; }
    }

    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #0F172A, #1E293B);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon { font-size: 24px; width: 24px; height: 24px; color: #10B981; }
    }

    /* ── Layout ──────────────────────────────────────────────────────── */
    .impug-layout {
      display: grid;
      grid-template-columns: 420px 1fr;
      gap: 20px;
      align-items: start;

      @media (max-width: 1100px) { grid-template-columns: 1fr; }
    }

    .left-col { display: flex; flex-direction: column; gap: 16px; }
    .right-col { position: sticky; top: 16px; }

    /* ── Card ────────────────────────────────────────────────────────── */
    .card {
      background: white;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 16px;
    }

    .mt-section { margin-top: 20px; }

    .step-badge {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #0F172A;
      color: white;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .optional {
      font-weight: 400;
      color: #94A3B8;
      font-size: 12px;
    }

    .found-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: auto;
      font-size: 12px;
      font-weight: 600;
      color: #059669;
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      border-radius: 20px;
      padding: 3px 10px;

      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    /* ── Search ──────────────────────────────────────────────────────── */
    .search-form { display: flex; gap: 10px; align-items: flex-start; }
    .full-width { width: 100%; }

    .search-btn {
      height: 56px;
      border-radius: 8px !important;
      background: #0F172A !important;
      color: white !important;
      white-space: nowrap;
      display: flex;
      gap: 6px;
      align-items: center;
      font-size: 13px;
      flex-shrink: 0;

      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      mat-spinner { margin: 0; }
    }

    .error-msg {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 13px;
      color: #B91C1C;
      margin-top: 8px;

      mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    }

    /* ── Edital card ─────────────────────────────────────────────────── */
    .edital-card {
      border-left: 3px solid #10B981;
    }

    .edital-number {
      font-size: 20px;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: -0.3px;
      margin-bottom: 8px;
    }

    .edital-objeto {
      font-size: 13px;
      color: #475569;
      line-height: 1.5;
      margin: 0 0 16px;
    }

    .edital-meta {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 20px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #475569;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #94A3B8;
        flex-shrink: 0;
      }

      &.deadline mat-icon { color: #F59E0B; }
      &.urgent { color: #DC2626; mat-icon { color: #DC2626; } }
    }

    .urgent-tag {
      background: #FEF2F2;
      color: #DC2626;
      border: 1px solid #FECACA;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 800;
      padding: 1px 6px;
      letter-spacing: 0.05em;
    }

    .generate-btn {
      width: 100%;
      height: 48px;
      border-radius: 8px !important;
      background: linear-gradient(135deg, #2563EB, #1D4ED8) !important;
      color: white !important;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 4px;
      transition: all 200ms ease;

      &:hover:not(:disabled) {
        box-shadow: 0 4px 14px rgba(37,99,235,0.35);
        transform: translateY(-1px);
      }

      &:disabled { background: #94A3B8 !important; }

      mat-icon { font-size: 20px; width: 20px; height: 20px; }
      mat-spinner { margin: 0; }
    }

    /* ── Result card ─────────────────────────────────────────────────── */
    .result-card { padding: 0; overflow: hidden; }

    .result-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      padding: 18px 20px;
      border-bottom: 1px solid #E2E8F0;
      background: #F8FAFC;
    }

    .result-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;

      mat-icon { font-size: 20px; width: 20px; height: 20px; color: #2563EB; }
    }

    .result-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .action-btn {
      border-radius: 8px !important;
      font-size: 13px !important;
      border-color: #E2E8F0 !important;
      color: #475569 !important;
      gap: 5px;

      &:hover { background: #F1F5F9 !important; }

      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .print-btn {
      border-radius: 8px !important;
      background: #0F172A !important;
      color: white !important;
      font-size: 13px !important;
      gap: 5px;

      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .legal-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 14px 20px;
      border-bottom: 1px solid #F1F5F9;
    }

    .legal-tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #EFF6FF;
      color: #1D4ED8;
      border: 1px solid #BFDBFE;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;

      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }

    .irregularidades-section {
      padding: 14px 20px;
      border-bottom: 1px solid #F1F5F9;
    }

    .section-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94A3B8;
      margin-bottom: 10px;
    }

    .irregularidades-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;

      li {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 13px;
        color: #475569;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          color: #F59E0B;
          flex-shrink: 0;
          margin-top: 1px;
        }
      }
    }

    /* ── Document ────────────────────────────────────────────────────── */
    .document-area {
      padding: 20px;
      position: relative;
      border-bottom: 1px solid #F1F5F9;
    }

    .document-watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 80px;
      font-weight: 900;
      color: rgba(0,0,0,0.03);
      pointer-events: none;
      z-index: 0;
      white-space: nowrap;
      letter-spacing: 0.1em;
    }

    .document-text {
      position: relative;
      z-index: 1;
      font-family: 'Georgia', serif;
      font-size: 12.5px;
      line-height: 1.8;
      color: #1E293B;
      white-space: pre-wrap;
      word-break: break-word;
      background: #FEFEFE;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 20px 24px;
      max-height: 400px;
      overflow-y: auto;
      margin: 0;
    }

    .deadline-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 20px;
      font-size: 13px;
      color: #475569;
      background: #FFFBEB;

      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #F59E0B; }

      strong { color: #0F172A; }
    }

    /* ── Generating card ─────────────────────────────────────────────── */
    .generating-card { text-align: center; }

    .generating-inner {
      padding: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;

      h3 { font-size: 18px; font-weight: 700; color: #0F172A; margin: 0; }
      p  { font-size: 13.5px; color: #64748B; max-width: 320px; line-height: 1.6; margin: 0; }
    }

    .generating-steps {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      max-width: 280px;
      text-align: left;
    }

    .gen-step {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #94A3B8;

      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #10B981; }

      .step-dot {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid currentColor;
        flex-shrink: 0;
      }

      &.done { color: #10B981; }
      &.active { color: #2563EB; animation: blink 1s infinite; }
      &.pending { color: #CBD5E1; }
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* ── Placeholder card ────────────────────────────────────────────── */
    .placeholder-card { border: 2px dashed #E2E8F0; background: #FAFBFC; }

    .placeholder-inner {
      padding: 32px;
      text-align: center;

      h3 { font-size: 18px; font-weight: 700; color: #0F172A; margin: 16px 0 8px; }
      p  { font-size: 13.5px; color: #64748B; max-width: 340px; margin: 0 auto 24px; line-height: 1.6; }
    }

    .placeholder-icon {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      background: linear-gradient(135deg, #F1F5F9, #E2E8F0);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;

      mat-icon { font-size: 28px; width: 28px; height: 28px; color: #94A3B8; }
    }

    .capabilities {
      display: flex;
      flex-direction: column;
      gap: 10px;
      text-align: left;
      max-width: 280px;
      margin: 0 auto;
    }

    .cap-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #475569;

      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #10B981; flex-shrink: 0; }
    }
  `],
})
export class ImpugnacaoComponent {
  private chatSvc = inject(ChatService);
  private fb = inject(FormBuilder);

  searchForm = this.fb.group({
    numero: ['PE-007/2024', Validators.required],
  });

  motivosCtrl = this.fb.control('');

  step = signal<Step>('search');
  searching = signal(false);
  searchError = signal<string | null>(null);
  edital = signal<EditalImpugnacao | null>(null);
  result = signal<ImpugnacaoResponse | null>(null);
  copied = signal(false);

  isUrgent(): boolean {
    const ed = this.edital();
    if (!ed) return false;
    const prazo = new Date(ed.prazoImpugnacao);
    const diff = prazo.getTime() - Date.now();
    return diff > 0 && diff < 48 * 3600 * 1000;
  }

  buscarEdital(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }
    this.searching.set(true);
    this.searchError.set(null);
    this.edital.set(null);
    this.result.set(null);
    this.step.set('search');

    const numero = this.searchForm.value.numero!;
    this.chatSvc.buscarEditalParaImpugnacao(numero).subscribe({
      next: ed => {
        this.edital.set(ed);
        this.step.set('found');
        this.searching.set(false);
      },
      error: () => {
        this.searchError.set('Edital não encontrado. Verifique o número e tente novamente.');
        this.searching.set(false);
      },
    });
  }

  gerarImpugnacao(): void {
    const ed = this.edital();
    if (!ed) return;

    this.step.set('generating');

    this.chatSvc.gerarImpugnacao({
      editalNumero: ed.numero,
      editalId: ed.id,
      motivosAdicionais: this.motivosCtrl.value ?? undefined,
    }).subscribe({
      next: res => {
        this.result.set(res);
        this.step.set('done');
      },
      error: () => {
        this.step.set('found');
      },
    });
  }

  formatPrazo(prazo: string): string {
    const d = new Date(prazo);
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  copyText(): void {
    const text = this.result()?.texto;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
