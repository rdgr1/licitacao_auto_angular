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
  private active = signal<Set<string>>(new Set());

  private readonly _hasAnyActive: Signal<boolean> = computed(() => this.active().size > 0);

  hasAnyActive(): Signal<boolean> {
    return this._hasAnyActive;
  }

  isLoading(key: string): Signal<boolean> {
    return computed(() => this.active().has(key));
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
    this.active.update((set) => {
      const next = new Set(set);
      isActive ? next.add(key) : next.delete(key);
      return next;
    });
  }
}
