import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { interval, switchMap, first, of, take, tap } from 'rxjs';
import { ColetaPncpLeadStatus } from '../models/coleta-pncp-lead.model';
import { LeadService } from './lead.service';
import { OperationTrackerService } from './operation-tracker.service';
import { ToastService } from './toast.service';

// Coleta em fatias de ~7 dias (até 5 fatias numa janela de 30 dias) — cada fatia pagina a
// API do PNCP com rate limit/retry, pode demorar mais que a busca de edital.
const MAX_POLLS = 90;

// Estado de progresso por lead vive aqui (root, singleton) em vez de num signal local do
// dialog — assim ele sobrevive ao fechar/reabrir o dialog, já que o polling do backend
// continua rodando em segundo plano independente do componente estar montado ou não.
@Injectable({ providedIn: 'root' })
export class ColetaPncpLeadService {
  private leadService = inject(LeadService);
  private operationTracker = inject(OperationTrackerService);
  private toast = inject(ToastService);

  private progressByLead = signal<Record<string, ColetaPncpLeadStatus | null>>({});

  isLoading(uuid: string): Signal<boolean> {
    return this.operationTracker.isLoading(this.opKey(uuid));
  }

  progress(uuid: string): Signal<ColetaPncpLeadStatus | null> {
    return computed(() => this.progressByLead()[uuid] ?? null);
  }

  iniciar(uuid: string): void {
    if (this.isLoading(uuid)()) return;

    this.setProgress(uuid, null);

    const inicia$ = this.leadService.coletarPncp(uuid).pipe(
      tap((r) => this.setProgress(uuid, r)),
      switchMap((registro) =>
        registro.status === 'EM_ANDAMENTO'
          ? interval(2000).pipe(
              take(MAX_POLLS),
              switchMap(() => this.leadService.statusColetaPncp(uuid)),
              tap((r) => this.setProgress(uuid, r)),
              first((r) => r.status !== 'EM_ANDAMENTO'),
            )
          : of(registro),
      ),
    );

    this.operationTracker.run(this.opKey(uuid), inicia$, {
      errorMessage: 'Erro ao coletar editais PNCP para este lead.',
      onSuccess: (r) => {
        if (r.status === 'CONCLUIDA') {
          this.toast.success(`${r.salvos} edital(is) salvos, ${r.totalRelevantes} de interesse.`);
        } else {
          this.toast.error(r.mensagem || 'Erro ao coletar editais PNCP para este lead.');
        }
      },
    });
  }

  private opKey(uuid: string): string {
    return `coletar-pncp-${uuid}`;
  }

  private setProgress(uuid: string, status: ColetaPncpLeadStatus | null): void {
    this.progressByLead.update((map) => ({ ...map, [uuid]: status }));
  }
}
