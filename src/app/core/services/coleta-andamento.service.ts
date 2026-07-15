import { Injectable, signal, computed } from '@angular/core';

export interface FonteAndamento {
  fonte: string;
  status: 'pending' | 'running' | 'done' | 'error';
  stepAtual: number;
  totalSteps: number;
  dataDisplay: string;
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
  private _fontes = signal<FonteAndamento[]>([]);
  readonly fontes = this._fontes.asReadonly();
  readonly ativa = computed(() =>
    this._fontes().some((f) => f.status === 'pending' || f.status === 'running'),
  );
  readonly totalSalvos = computed(() => this._fontes().reduce((n, f) => n + f.salvos, 0));

  // Única fonte de verdade é `_fontes`; `andamento` é derivado dela — mantido só
  // pela forma que o pill do topbar (main-layout) e leads.component já consomem.
  readonly andamento = computed<ColetaAndamento>(() => {
    const fontes = this._fontes();
    const emAndamento =
      fontes.find((f) => f.status === 'running') ?? fontes.find((f) => f.status === 'pending');
    const iniciadoEm = fontes.length ? Math.min(...fontes.map((f) => f.iniciadoEm)) : null;

    return {
      ativa: this.ativa(),
      etapaAtual: emAndamento
        ? { fonte: emAndamento.fonte, dataDisplay: emAndamento.dataDisplay }
        : null,
      step: emAndamento?.stepAtual ?? 0,
      total: emAndamento?.totalSteps ?? 0,
      acumulado: {
        materias: fontes.reduce((n, f) => n + f.materias, 0),
        salvos: this.totalSalvos(),
        duplicados: 0,
      },
      iniciadoEm: iniciadoEm ? new Date(iniciadoEm).toISOString() : null,
    };
  });

  iniciarColeta(fontesList: string[]): void {
    const agora = Date.now();
    this._fontes.set(
      fontesList.map((fonte) => ({
        fonte,
        status: 'pending' as const,
        stepAtual: 0,
        totalSteps: 1,
        dataDisplay: '',
        salvos: 0,
        materias: 0,
        duracaoMs: 0,
        iniciadoEm: agora,
      })),
    );
  }

  avancarEtapa(fonte: string, step: number, total: number, dataDisplay: string): void {
    this._fontes.update((fs) =>
      fs.map((f) =>
        f.fonte === fonte
          ? { ...f, status: 'running' as const, stepAtual: step, totalSteps: total, dataDisplay }
          : f,
      ),
    );
  }

  concluirFonte(fonte: string, salvos: number, materias: number, duracaoMs: number): void {
    this._fontes.update((fs) =>
      fs.map((f) =>
        f.fonte === fonte ? { ...f, status: 'done' as const, salvos, materias, duracaoMs } : f,
      ),
    );
  }

  erroFonte(fonte: string): void {
    this._fontes.update((fs) =>
      fs.map((f) => (f.fonte === fonte ? { ...f, status: 'error' as const } : f)),
    );
  }

  limpar(): void {
    this._fontes.set([]);
  }
}
