import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, finalize, tap } from 'rxjs';
import { ToastService } from './toast.service';

export interface RunOptions<T> {
  successMessage?: string;
  errorMessage?: string | ((err: unknown) => string) | null;
  onSuccess?: (result: T) => void;
  onError?: (err: unknown) => void;
}

const GENERIC_ERROR = 'Ocorreu um erro. Tente novamente.';

@Injectable({ providedIn: 'root' })
export class OperationTrackerService {
  private toast = inject(ToastService);
  // Ref-counted por key: chamadas concorrentes com a mesma key (ex: duplo clique
  // antes do botão desabilitar) só zeram o loading quando a última delas concluir.
  private active = signal<Map<string, number>>(new Map());

  private readonly _hasAnyActive: Signal<boolean> = computed(() => this.active().size > 0);

  hasAnyActive(): Signal<boolean> {
    return this._hasAnyActive;
  }

  isLoading(key: string): Signal<boolean> {
    return computed(() => (this.active().get(key) ?? 0) > 0);
  }

  run<T>(key: string, source$: Observable<T>, opts: RunOptions<T> = {}): void {
    this.setActive(key, true);

    source$
      .pipe(
        tap((result) => {
          if (opts.successMessage) this.toast.success(opts.successMessage);
          opts.onSuccess?.(result);
        }),
        catchError((err: unknown) => {
          const message =
            opts.errorMessage === null
              ? null
              : typeof opts.errorMessage === 'function'
                ? opts.errorMessage(err)
                : (opts.errorMessage ?? GENERIC_ERROR);
          if (message) this.toast.error(message);
          opts.onError?.(err);
          return of(null);
        }),
        finalize(() => this.setActive(key, false)),
      )
      .subscribe();
  }

  private setActive(key: string, isActive: boolean): void {
    this.active.update((map) => {
      const next = new Map(map);
      const count = next.get(key) ?? 0;
      const nextCount = isActive ? count + 1 : count - 1;
      nextCount > 0 ? next.set(key, nextCount) : next.delete(key);
      return next;
    });
  }
}
