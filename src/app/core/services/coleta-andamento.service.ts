import { Injectable, signal, computed } from '@angular/core';

export interface FonteAndamento {
  fonte: string;
  status: 'pending' | 'running' | 'done' | 'error';
  stepAtual: number;
  totalSteps: number;
  salvos: number;
  materias: number;
  duracaoMs: number;
  iniciadoEm: number;
}

export interface EtapaColeta {
  fonte: string;
  dataDisplay: string;
}

export interface ColetaAndamento {
  ativa: boolean;
  etapaAtual: EtapaColeta | null;
  step: number;
  total: number;
  acumulado: { materias: number; salvos: number; duplicados: number };
  iniciadoEm: string | null;
}

@Injectable({ providedIn: 'root' })
export class ColetaAndamentoService {

  // ── Legacy state (kept for topbar pill compatibility) ──
  readonly andamento = signal<ColetaAndamento>({
    ativa: false, etapaAtual: null, step: 0, total: 0,
    acumulado: { materias: 0, salvos: 0, duplicados: 0 }, iniciadoEm: null,
  });

  // ── Per-source state (new) ──
  private _fontes = signal<FonteAndamento[]>([]);
  readonly fontes = this._fontes.asReadonly();
  readonly ativa = computed(() => this._fontes().some(f => f.status === 'pending' || f.status === 'running'));
  readonly totalSalvos = computed(() => this._fontes().reduce((n, f) => n + f.salvos, 0));

  iniciarColeta(fontesList: string[]): void {
    const agora = Date.now();
    this._fontes.set(fontesList.map(fonte => ({
      fonte, status: 'pending', stepAtual: 0, totalSteps: 1,
      salvos: 0, materias: 0, duracaoMs: 0, iniciadoEm: agora,
    })));
    this.andamento.update(a => ({ ...a, ativa: true, iniciadoEm: new Date().toISOString() }));
  }

  avancarEtapa(fonte: string, step: number, total: number, dataDisplay: string): void {
    this._fontes.update(fs => fs.map(f =>
      f.fonte === fonte ? { ...f, status: 'running', stepAtual: step, totalSteps: total } : f
    ));
    this.andamento.update(a => ({ ...a, etapaAtual: { fonte, dataDisplay }, step, total }));
  }

  concluirFonte(fonte: string, salvos: number, materias: number, duracaoMs: number): void {
    this._fontes.update(fs => fs.map(f =>
      f.fonte === fonte ? { ...f, status: 'done', salvos, materias, duracaoMs } : f
    ));
    const todasConcluidas = this._fontes().every(f => f.status === 'done' || f.status === 'error');
    if (todasConcluidas) {
      this.andamento.update(a => ({ ...a, ativa: false }));
    }
  }

  erroFonte(fonte: string): void {
    this._fontes.update(fs => fs.map(f =>
      f.fonte === fonte ? { ...f, status: 'error' } : f
    ));
    const todasConcluidas = this._fontes().every(f => f.status === 'done' || f.status === 'error');
    if (todasConcluidas) {
      this.andamento.update(a => ({ ...a, ativa: false }));
    }
  }

  limpar(): void {
    this._fontes.set([]);
    this.andamento.update(a => ({ ...a, ativa: false, etapaAtual: null }));
  }

  // Legacy methods kept for compatibility with topbar pill
  iniciar(total: number): void {
    this.andamento.set({ ativa: true, etapaAtual: null, step: 0, total, acumulado: { materias: 0, salvos: 0, duplicados: 0 }, iniciadoEm: new Date().toISOString() });
  }

  acumular(materias: number, salvos: number, duplicados: number): void {
    this.andamento.update(a => ({ ...a, acumulado: { materias: a.acumulado.materias + materias, salvos: a.acumulado.salvos + salvos, duplicados: a.acumulado.duplicados + duplicados } }));
  }

  encerrar(): void {
    this.andamento.update(a => ({ ...a, ativa: false, etapaAtual: null }));
  }
}
