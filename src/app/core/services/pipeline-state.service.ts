import { Injectable } from '@angular/core';

type QualCol = 'nova' | 'triagem' | 'verificando' | 'qualificado' | 'descartado';
type ProcCol = 'proposta' | 'habilitacao' | 'abertura' | 'disputa' | 'negociacao' | 'ganho' | 'perdido';

interface PipelineState {
  qual: Record<string, QualCol>;
  proc: Record<string, ProcCol>;
}

@Injectable({ providedIn: 'root' })
export class PipelineStateService {
  private static readonly KEY = 'lf_pipeline_v2';
  private state: PipelineState = { qual: {}, proc: {} };

  constructor() { this.load(); }

  qualCol(uuid: string): QualCol    { return this.state.qual[uuid] ?? 'nova'; }
  procCol(uuid: string): ProcCol    { return this.state.proc[uuid] ?? 'proposta'; }
  inProcesso(uuid: string): boolean { return uuid in this.state.proc; }

  setQual(uuid: string, col: QualCol): void {
    this.state.qual[uuid] = col;
    this.save();
  }

  sendToProcesso(uuid: string): void {
    this.state.proc[uuid] = 'proposta';
    this.save();
  }

  setProc(uuid: string, col: ProcCol): void {
    this.state.proc[uuid] = col;
    this.save();
  }

  removeFromProcesso(uuid: string): void {
    delete this.state.proc[uuid];
    this.state.qual[uuid] = 'qualificado';
    this.save();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(PipelineStateService.KEY);
      if (raw) {
        const s = JSON.parse(raw) as PipelineState;
        this.state = { qual: s.qual ?? {}, proc: s.proc ?? {} };
      }
    } catch { /* ignore corrupt data */ }
  }

  private save(): void {
    localStorage.setItem(PipelineStateService.KEY, JSON.stringify(this.state));
  }
}
