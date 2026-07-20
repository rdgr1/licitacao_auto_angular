# Padronização de Loading + Busca de Edital Assíncrona: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduzir um `OperationTrackerService` central que remove a redundância de loading na coleta de leads, substitui a infraestrutura de loading global órfã, e adapta o frontend ao novo contrato assíncrono (202 + polling) de `buscar-edital`.

**Architecture:** Um serviço root-provided (`OperationTrackerService`) assina os `Observable`s de operações assíncronas internamente (não no componente chamador), expondo signals de loading por chave — por isso a operação sobrevive a fechamento de dialog/navegação. `ColetaAndamentoService` é refatorado para eliminar dois signals paralelos que hoje trackeiam o mesmo estado. Uma barra fina e estática no topo do `main-layout` reflete "alguma operação rastreada está ativa", substituindo o trio órfão `LoadingService`/`loadingInterceptor`/`LoadingSpinnerComponent`.

**Tech Stack:** Angular 17+ standalone components, Signals, RxJS, Angular Material (MatSnackBar via `ToastService` existente), Jasmine/Karma (`ng test`).

## Global Constraints

- Dialogs migrados só desabilitam o botão de ação (`[disabled]="tracker.isLoading(key)"`) — **sem spinner próprio no dialog**; feedback visual concentra-se na barra global + toast (decisão do usuário: "não quero esse monte de loading espalhado").
- `buscarEdital` usa **polling** no `GET /leads/{id}/buscar-edital/status` a cada 2s (não SSE) — decisão documentada na spec, seção 4.5.
- Nenhuma mudança de comportamento visível para o pill de coleta no topbar (`main-layout.component.ts:138-154`) ou para `leads.component.ts` `coletaProgress` computed (`leads.component.ts:204-210`) — o refactor do `ColetaAndamentoService` é interno.
- Referência: spec completa em `docs/superpowers/specs/2026-07-15-loading-standardization-design.md`.

---

### Task 1: `OperationTrackerService`

**Files:**
- Create: `src/app/core/services/operation-tracker.service.ts`
- Test: `src/app/core/services/operation-tracker.service.spec.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface RunOptions<T> {
    successMessage?: string;
    errorMessage?: string | ((err: unknown) => string) | null;
    onSuccess?: (result: T) => void;
    onError?: (err: unknown) => void;
  }

  export class OperationTrackerService {
    isLoading(key: string): Signal<boolean>;
    hasAnyActive(): Signal<boolean>;
    run<T>(key: string, source$: Observable<T>, opts?: RunOptions<T>): void;
  }
  ```

- [ ] **Step 1: Write the failing tests**

```typescript
// src/app/core/services/operation-tracker.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { OperationTrackerService } from './operation-tracker.service';
import { ToastService } from './toast.service';

describe('OperationTrackerService', () => {
  let svc: OperationTrackerService;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    toast = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);
    TestBed.configureTestingModule({
      providers: [{ provide: ToastService, useValue: toast }],
    });
    svc = TestBed.inject(OperationTrackerService);
  });

  it('deve começar sem nenhuma key ativa', () => {
    expect(svc.isLoading('x')()).toBe(false);
    expect(svc.hasAnyActive()()).toBe(false);
  });

  it('deve ligar loading durante a operação e desligar ao concluir com sucesso', () => {
    const subject = new Subject<number>();
    svc.run('save-x', subject.asObservable());
    expect(svc.isLoading('save-x')()).toBe(true);
    expect(svc.hasAnyActive()()).toBe(true);

    subject.next(42);
    subject.complete();

    expect(svc.isLoading('save-x')()).toBe(false);
    expect(svc.hasAnyActive()()).toBe(false);
  });

  it('deve chamar onSuccess e o toast de sucesso quando fornecido', () => {
    const onSuccess = jasmine.createSpy('onSuccess');
    svc.run('save-x', of('resultado'), { successMessage: 'Salvo!', onSuccess });

    expect(onSuccess).toHaveBeenCalledWith('resultado');
    expect(toast.success).toHaveBeenCalledWith('Salvo!');
  });

  it('não deve chamar toast de sucesso quando successMessage não for fornecido', () => {
    svc.run('save-x', of('resultado'));
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('deve desligar loading e mostrar toast de erro em caso de falha', () => {
    const onError = jasmine.createSpy('onError');
    svc.run('save-x', throwError(() => new Error('boom')), {
      errorMessage: 'Erro ao salvar',
      onError,
    });

    expect(svc.isLoading('save-x')()).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Erro ao salvar');
    expect(onError).toHaveBeenCalled();
  });

  it('deve resolver errorMessage como função do erro', () => {
    svc.run('save-x', throwError(() => ({ status: 404 })), {
      errorMessage: (err: any) => (err.status === 404 ? 'Não encontrado' : 'Erro genérico'),
    });
    expect(toast.error).toHaveBeenCalledWith('Não encontrado');
  });

  it('deve suprimir o toast de erro quando errorMessage for null', () => {
    svc.run('save-x', throwError(() => new Error('boom')), { errorMessage: null });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('deve usar uma mensagem de erro genérica quando nenhuma for fornecida', () => {
    svc.run('save-x', throwError(() => new Error('boom')));
    expect(toast.error).toHaveBeenCalledWith('Ocorreu um erro. Tente novamente.');
  });

  it('deve rastrear múltiplas keys de forma independente', () => {
    const subjectA = new Subject<void>();
    const subjectB = new Subject<void>();
    svc.run('a', subjectA.asObservable());
    svc.run('b', subjectB.asObservable());

    expect(svc.isLoading('a')()).toBe(true);
    expect(svc.isLoading('b')()).toBe(true);

    subjectA.next();
    subjectA.complete();

    expect(svc.isLoading('a')()).toBe(false);
    expect(svc.isLoading('b')()).toBe(true);
    expect(svc.hasAnyActive()()).toBe(true);
  });

  it('não deve lançar exceção quando onSuccess/onError não forem fornecidos', () => {
    expect(() => svc.run('x', of(1))).not.toThrow();
    expect(() => svc.run('y', throwError(() => new Error('boom')))).not.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx ng test --include='**/operation-tracker.service.spec.ts' --watch=false`
Expected: FAIL — `Cannot find module './operation-tracker.service'`

- [ ] **Step 3: Write the implementation**

```typescript
// src/app/core/services/operation-tracker.service.ts
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

  readonly hasAnyActive: Signal<boolean> = computed(() => this.active().size > 0);

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx ng test --include='**/operation-tracker.service.spec.ts' --watch=false`
Expected: PASS (10 specs)

- [ ] **Step 5: Commit**

```bash
git add src/app/core/services/operation-tracker.service.ts src/app/core/services/operation-tracker.service.spec.ts
git commit -m "feat: adiciona OperationTrackerService para loading resiliente a fechamento de dialog"
```

---

### Task 2: Remover trio de loading órfão

**Files:**
- Delete: `src/app/core/services/loading.service.ts`
- Delete: `src/app/core/interceptors/loading.interceptor.ts`
- Delete: `src/app/shared/components/loading-spinner/loading-spinner.component.ts` (e a pasta `loading-spinner/` se ficar vazia)
- Modify: `src/app/app.config.ts:13,25`

**Interfaces:** Nenhuma — remoção pura, sem consumidores (confirmado: nenhum template lê `LoadingService.loading()` nem usa `<app-loading-spinner>`).

- [ ] **Step 1: Confirmar que não há consumidores (checagem, não teste automatizado)**

Run: `grep -rn "LoadingService\|loadingInterceptor\|LoadingSpinnerComponent\|app-loading-spinner" src/app --include="*.ts" --include="*.html"`
Expected: só os 3 arquivos-alvo e a linha de registro em `app.config.ts` aparecem — nenhum outro consumidor.

- [ ] **Step 2: Remover o interceptor do `app.config.ts`**

Em `src/app/app.config.ts`, remover a linha 13 (`import { loadingInterceptor } from './core/interceptors/loading.interceptor';`) e a linha 25 (`loadingInterceptor,`) dentro do array `withInterceptors([...])`:

```typescript
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        httpErrorInterceptor,
      ])
    ),
```

- [ ] **Step 3: Deletar os 3 arquivos**

```bash
git rm src/app/core/services/loading.service.ts
git rm src/app/core/interceptors/loading.interceptor.ts
git rm -r src/app/shared/components/loading-spinner
```

- [ ] **Step 4: Rodar o build para confirmar que nada quebrou**

Run: `npx ng build`
Expected: build sem erros de import quebrado.

- [ ] **Step 5: Commit**

```bash
git add src/app/app.config.ts
git commit -m "refactor: remove LoadingService/loadingInterceptor/LoadingSpinnerComponent órfãos"
```

---

### Task 3: Refatorar `ColetaAndamentoService` (colapsar signals duplicados)

**Files:**
- Modify: `src/app/core/services/coleta-andamento.service.ts` (arquivo inteiro — reescrita completa)
- Modify: `src/app/core/services/coleta-andamento.service.spec.ts` (adicionar testes de regressão)

**Interfaces:**
- Consumes: nenhuma (serviço isolado)
- Produces (inalterado para os consumidores — `main-layout.component.ts:138-154`, `leads.component.ts:204-210,324,334,340,369,386`):
  ```typescript
  export interface FonteAndamento {
    fonte: string;
    status: 'pending' | 'running' | 'done' | 'error';
    stepAtual: number;
    totalSteps: number;
    dataDisplay: string; // novo campo — necessário para derivar `andamento` sem estado imperativo separado
    salvos: number;
    materias: number;
    duracaoMs: number;
    iniciadoEm: number;
  }
  export interface ColetaAndamento {
    ativa: boolean;
    etapaAtual: { fonte: string; dataDisplay: string } | null;
    step: number;
    total: number;
    acumulado: { materias: number; salvos: number; duplicados: number };
    iniciadoEm: string | null;
  }
  class ColetaAndamentoService {
    readonly fontes: Signal<FonteAndamento[]>;
    readonly ativa: Signal<boolean>;
    readonly totalSalvos: Signal<number>;
    readonly andamento: Signal<ColetaAndamento>; // agora computed, não signal gravável
    iniciarColeta(fontesList: string[]): void;
    avancarEtapa(fonte: string, step: number, total: number, dataDisplay: string): void;
    concluirFonte(fonte: string, salvos: number, materias: number, duracaoMs: number): void;
    erroFonte(fonte: string): void;
    limpar(): void;
  }
  ```
  Removidos por serem código morto (confirmado via grep — nenhum caller fora do próprio arquivo): `iniciar()`, `acumular()`, `encerrar()`.

- [ ] **Step 1: Escrever os testes de regressão (adicionar ao spec existente)**

Adicionar ao final de `src/app/core/services/coleta-andamento.service.spec.ts` (antes do `});` final):

```typescript
  it('andamento deve refletir a fonte em running (regressão do refactor)', () => {
    svc.iniciarColeta(['DODF', 'DOU']);
    svc.avancarEtapa('DODF', 1, 3, '06/06/26');

    const a = svc.andamento();
    expect(a.ativa).toBe(true);
    expect(a.etapaAtual).toEqual({ fonte: 'DODF', dataDisplay: '06/06/26' });
    expect(a.step).toBe(1);
    expect(a.total).toBe(3);
  });

  it('andamento.ativa deve ficar false quando todas as fontes concluírem', () => {
    svc.iniciarColeta(['DODF']);
    svc.avancarEtapa('DODF', 1, 1, '06/06/26');
    svc.concluirFonte('DODF', 5, 10, 100);

    const a = svc.andamento();
    expect(a.ativa).toBe(false);
    expect(a.etapaAtual).toBeNull();
  });

  it('andamento.acumulado.salvos deve somar salvos de todas as fontes', () => {
    svc.iniciarColeta(['DODF', 'DOU']);
    svc.concluirFonte('DODF', 5, 20, 100);
    svc.concluirFonte('DOU', 3, 10, 80);
    expect(svc.andamento().acumulado.salvos).toBe(8);
  });
```

- [ ] **Step 2: Rodar os testes novos e confirmar que falham**

Run: `npx ng test --include='**/coleta-andamento.service.spec.ts' --watch=false`
Expected: FAIL — `dataDisplay` ainda não existe em `FonteAndamento`/`avancarEtapa`.

- [ ] **Step 3: Reescrever a implementação**

```typescript
// src/app/core/services/coleta-andamento.service.ts
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
```

- [ ] **Step 4: Rodar todos os testes do serviço e confirmar que passam**

Run: `npx ng test --include='**/coleta-andamento.service.spec.ts' --watch=false`
Expected: PASS (todos os specs antigos + os 3 novos)

- [ ] **Step 5: Rodar o build completo**

Run: `npx ng build`
Expected: sem erros de tipo (nenhum consumidor acessa campos removidos).

- [ ] **Step 6: Commit**

```bash
git add src/app/core/services/coleta-andamento.service.ts src/app/core/services/coleta-andamento.service.spec.ts
git commit -m "refactor: colapsa signals duplicados do ColetaAndamentoService em uma única fonte"
```

---

### Task 4: `GlobalProgressBarComponent` + wiring no `main-layout`

**Files:**
- Create: `src/app/shared/components/global-progress-bar/global-progress-bar.component.ts`
- Test: `src/app/shared/components/global-progress-bar/global-progress-bar.component.spec.ts`
- Modify: `src/app/features/layout/main-layout/main-layout.component.ts:1-14` (imports), `:33-44` (component imports array), `:187-189` (template), `:1008-1012` (class body)

**Interfaces:**
- Consumes: `OperationTrackerService.hasAnyActive(): Signal<boolean>` (Task 1)
- Produces: componente `<app-global-progress-bar />` sem inputs/outputs — lê o tracker direto via `inject()`.

- [ ] **Step 1: Write the failing test**

```typescript
// src/app/shared/components/global-progress-bar/global-progress-bar.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { GlobalProgressBarComponent } from './global-progress-bar.component';
import { OperationTrackerService } from '../../../core/services/operation-tracker.service';

describe('GlobalProgressBarComponent', () => {
  let fixture: ComponentFixture<GlobalProgressBarComponent>;
  let tracker: OperationTrackerService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [GlobalProgressBarComponent] });
    fixture = TestBed.createComponent(GlobalProgressBarComponent);
    tracker = TestBed.inject(OperationTrackerService);
  });

  it('não deve renderizar a barra quando nenhuma operação estiver ativa', () => {
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector('.global-progress-bar');
    expect(bar).toBeNull();
  });

  it('deve renderizar a barra quando o tracker tiver uma operação ativa', () => {
    const pending = new Subject<void>();
    tracker.run('y', pending.asObservable());
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector('.global-progress-bar');
    expect(bar).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include='**/global-progress-bar.component.spec.ts' --watch=false`
Expected: FAIL — `Cannot find module './global-progress-bar.component'`

- [ ] **Step 3: Write the implementation**

```typescript
// src/app/shared/components/global-progress-bar/global-progress-bar.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OperationTrackerService } from '../../../core/services/operation-tracker.service';

@Component({
  selector: 'app-global-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (tracker.hasAnyActive()) {
      <div class="global-progress-bar">
        <div class="global-progress-bar-fill"></div>
      </div>
    }
  `,
  styles: [
    `
      .global-progress-bar {
        height: 3px;
        width: 100%;
        background: var(--border, #e2e8f0);
        overflow: hidden;
        flex-shrink: 0;
      }
      .global-progress-bar-fill {
        height: 100%;
        border-radius: 4px;
        background: linear-gradient(90deg, #11bf7f 0%, #3b82f6 50%, #11bf7f 100%);
        background-size: 200% 100%;
        animation: global-bar-shimmer 2s linear infinite;
      }
      @keyframes global-bar-shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: 0 0;
        }
      }
    `,
  ],
})
export class GlobalProgressBarComponent {
  readonly tracker = inject(OperationTrackerService);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --include='**/global-progress-bar.component.spec.ts' --watch=false`
Expected: PASS (2 specs)

- [ ] **Step 5: Montar no `main-layout.component.ts`**

Em `src/app/features/layout/main-layout/main-layout.component.ts`, adicionar o import (perto da linha 14):

```typescript
import { GlobalProgressBarComponent } from '../../../shared/components/global-progress-bar/global-progress-bar.component';
```

No array `imports: [...]` do decorator (linhas 33-44), adicionar `GlobalProgressBarComponent`.

No template, entre o fechamento de `</header>` (linha 187) e a abertura de `<main class="page-content"...>` (linha 190):

```html
        </header>

        <app-global-progress-bar />

        <!-- Page content -->
        <main class="page-content" [@routeFade]="routeKey()">
```

- [ ] **Step 6: Rodar o build e verificar visualmente**

Run: `npx ng build`
Expected: build sem erros.

Verificação manual: rodar `npm start`, abrir o app, disparar qualquer operação rastreada pelo tracker (após Tasks 5-7 estarem prontas) e confirmar que a barra aparece entre o topbar e o conteúdo, sem deslocar o layout.

- [ ] **Step 7: Commit**

```bash
git add src/app/shared/components/global-progress-bar src/app/features/layout/main-layout/main-layout.component.ts
git commit -m "feat: adiciona GlobalProgressBarComponent como indicador de loading global"
```

---

### Task 5: Modelo e serviço para `buscar-edital` assíncrono

**Files:**
- Create: `src/app/core/models/busca-edital.model.ts`
- Modify: `src/app/core/services/lead.service.ts:1-40` (troca de tipo + novo método)
- Test: `src/app/core/services/lead.service.spec.ts` (novo arquivo — não existe teste hoje)

**Interfaces:**
- Produces:
  ```typescript
  // busca-edital.model.ts
  export type StatusBuscaEdital = 'EM_ANDAMENTO' | 'CONCLUIDA' | 'NAO_ENCONTRADO' | 'ERRO';
  export interface BuscaEdital {
    uuid: string;
    leadId: string;
    status: StatusBuscaEdital;
    mensagem: string;
    editalId?: string;
    createdAt: string;
    lastModified: string;
    createdBy: string;
  }

  // lead.service.ts
  buscarEdital(uuid: string): Observable<BuscaEdital>;
  statusBuscaEdital(uuid: string): Observable<BuscaEdital>;
  ```

- [ ] **Step 1: Criar o modelo**

```typescript
// src/app/core/models/busca-edital.model.ts
export type StatusBuscaEdital = 'EM_ANDAMENTO' | 'CONCLUIDA' | 'NAO_ENCONTRADO' | 'ERRO';

export interface BuscaEdital {
  uuid: string;
  leadId: string;
  status: StatusBuscaEdital;
  mensagem: string;
  editalId?: string;
  createdAt: string;
  lastModified: string;
  createdBy: string;
}
```

- [ ] **Step 2: Write the failing test para o serviço**

```typescript
// src/app/core/services/lead.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { LeadService } from './lead.service';
import { environment } from '../../../environments/environment';
import { BuscaEdital } from '../models/busca-edital.model';

describe('LeadService — buscarEdital assíncrono', () => {
  let svc: LeadService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/leads`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    svc = TestBed.inject(LeadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('buscarEdital deve fazer POST e retornar o registro BuscaEdital (202)', () => {
    const mockRegistro: BuscaEdital = {
      uuid: 'busca-1',
      leadId: 'lead-1',
      status: 'EM_ANDAMENTO',
      mensagem: '',
      createdAt: '2026-07-15T10:00:00',
      lastModified: '2026-07-15T10:00:00',
      createdBy: 'system',
    };

    svc.buscarEdital('lead-1').subscribe((registro) => {
      expect(registro).toEqual(mockRegistro);
    });

    const req = httpMock.expectOne(`${base}/lead-1/buscar-edital`);
    expect(req.request.method).toBe('POST');
    req.flush(mockRegistro, { status: 202, statusText: 'Accepted' });
  });

  it('statusBuscaEdital deve fazer GET no endpoint de status', () => {
    const mockRegistro: BuscaEdital = {
      uuid: 'busca-1',
      leadId: 'lead-1',
      status: 'CONCLUIDA',
      mensagem: '',
      editalId: 'edital-9',
      createdAt: '2026-07-15T10:00:00',
      lastModified: '2026-07-15T10:00:05',
      createdBy: 'system',
    };

    svc.statusBuscaEdital('lead-1').subscribe((registro) => {
      expect(registro).toEqual(mockRegistro);
    });

    const req = httpMock.expectOne(`${base}/lead-1/buscar-edital/status`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRegistro);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx ng test --include='**/lead.service.spec.ts' --watch=false`
Expected: FAIL — `svc.statusBuscaEdital is not a function`

- [ ] **Step 4: Atualizar `lead.service.ts`**

```typescript
// src/app/core/services/lead.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Lead, LeadStatus, AtualizarStatusRequest } from '../models/lead.model';
import { Page } from '../models/edital.model';
import { BuscaEdital } from '../models/busca-edital.model';

const toPage = <T>(res: Page<T> | T[]): Page<T> =>
  Array.isArray(res)
    ? { content: res, totalElements: res.length, totalPages: 1, size: res.length, number: 0, first: true, last: true, empty: res.length === 0 }
    : res;

@Injectable({ providedIn: 'root' })
export class LeadService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/leads`;

  listar(filtros: { status?: LeadStatus; fonte?: string; page?: number; size?: number } = {}): Observable<Page<Lead>> {
    let params = new HttpParams()
      .set('page', filtros.page ?? 0)
      .set('size', filtros.size ?? 20);
    if (filtros.status) params = params.set('status', filtros.status);
    if (filtros.fonte) params = params.set('fonte', filtros.fonte);
    return this.http.get<Page<Lead> | Lead[]>(this.base, { params }).pipe(map(toPage));
  }

  obter(uuid: string): Observable<Lead> {
    return this.http.get<Lead>(`${this.base}/${uuid}`);
  }

  atualizarStatus(uuid: string, req: AtualizarStatusRequest): Observable<Lead> {
    return this.http.patch<Lead>(`${this.base}/${uuid}/status`, req);
  }

  // Dispara a busca assíncrona do edital no PNCP (202 Accepted — conclui via statusBuscaEdital)
  buscarEdital(uuid: string): Observable<BuscaEdital> {
    return this.http.post<BuscaEdital>(`${this.base}/${uuid}/buscar-edital`, {});
  }

  statusBuscaEdital(uuid: string): Observable<BuscaEdital> {
    return this.http.get<BuscaEdital>(`${this.base}/${uuid}/buscar-edital/status`);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx ng test --include='**/lead.service.spec.ts' --watch=false`
Expected: PASS (2 specs)

- [ ] **Step 6: Rodar o build (checar consumidores do tipo antigo `EditalResponse` no retorno de `buscarEdital`)**

Run: `npx ng build`
Expected: FALHA esperada em `lead-detalhe-dialog.component.ts` (ainda não migrado — corrigido na Task 6). Confirmar que o único erro reportado é nesse arquivo.

- [ ] **Step 7: Commit**

```bash
git add src/app/core/models/busca-edital.model.ts src/app/core/services/lead.service.ts src/app/core/services/lead.service.spec.ts
git commit -m "feat: adapta LeadService ao contrato assíncrono (202 + status) de buscar-edital"
```

---

### Task 6: Migrar `lead-detalhe-dialog.component.ts` para o tracker (polling de `buscarEdital` + `moverPara`)

**Files:**
- Modify: `src/app/features/leads/lead-detalhe-dialog/lead-detalhe-dialog.component.ts` (imports, template linhas 137-190 e 198-271, classe linhas 783-859)
- Test: `src/app/features/leads/lead-detalhe-dialog/lead-detalhe-dialog.component.spec.ts` (novo arquivo — não existe teste hoje)

**Interfaces:**
- Consumes: `OperationTrackerService.run/isLoading` (Task 1), `LeadService.buscarEdital/statusBuscaEdital` (Task 5), `BuscaEdital`/`StatusBuscaEdital` (Task 5)
- Produces: nenhuma mudança de `@Input`/`@Output` — apenas comportamento interno.

- [ ] **Step 1: Write the failing tests**

```typescript
// src/app/features/leads/lead-detalhe-dialog/lead-detalhe-dialog.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { LeadDetalheDialogComponent } from './lead-detalhe-dialog.component';
import { LeadService } from '../../../core/services/lead.service';
import { EditaisService } from '../../../core/services/editais.service';
import { ToastService } from '../../../core/services/toast.service';
import { BuscaEdital } from '../../../core/models/busca-edital.model';
import { EditalResponse } from '../../../core/models/edital.model';

describe('LeadDetalheDialogComponent — busca de edital assíncrona', () => {
  let fixture: ComponentFixture<LeadDetalheDialogComponent>;
  let component: LeadDetalheDialogComponent;
  let leadService: jasmine.SpyObj<LeadService>;
  let editaisService: jasmine.SpyObj<EditaisService>;

  const leadMock = { uuid: 'lead-1', status: 'NOVO', fonte: 'PNCP' } as any;

  beforeEach(() => {
    leadService = jasmine.createSpyObj('LeadService', [
      'buscarEdital',
      'statusBuscaEdital',
      'atualizarStatus',
    ]);
    editaisService = jasmine.createSpyObj('EditaisService', ['getById']);

    TestBed.configureTestingModule({
      imports: [LeadDetalheDialogComponent],
      providers: [
        { provide: LeadService, useValue: leadService },
        { provide: EditaisService, useValue: editaisService },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error', 'info']) },
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
        { provide: MAT_DIALOG_DATA, useValue: leadMock },
      ],
    });

    fixture = TestBed.createComponent(LeadDetalheDialogComponent);
    component = fixture.componentInstance;
  });

  it('deve pollar o status até CONCLUIDA e então buscar o Edital completo', fakeAsync(() => {
    const registroEmAndamento: BuscaEdital = {
      uuid: 'busca-1', leadId: 'lead-1', status: 'EM_ANDAMENTO', mensagem: '',
      createdAt: '', lastModified: '', createdBy: '',
    };
    const registroConcluido: BuscaEdital = {
      ...registroEmAndamento, status: 'CONCLUIDA', editalId: 'edital-9',
    };
    const editalMock: EditalResponse = {
      id: 'edital-9', numero: '1/2026', objeto: 'x', modalidade: 'PREGAO_ELETRONICO' as any,
      valorEstimado: 100, dataAbertura: '2026-08-01', orgaoOrigem: 'org', status: 'PROCESSADO' as any,
      sourceUrl: '', createdAt: '', updatedAt: '', quantidadeExigencias: 0,
    };

    leadService.buscarEdital.and.returnValue(of(registroEmAndamento));
    leadService.statusBuscaEdital.and.returnValues(of(registroEmAndamento), of(registroConcluido));
    editaisService.getById.and.returnValue(of(editalMock));

    component.buscarEdital();
    expect(component.operationTracker.isLoading(`busca-edital-${leadMock.uuid}`)()).toBe(true);

    tick(2000); // primeiro poll — ainda EM_ANDAMENTO
    tick(2000); // segundo poll — CONCLUIDA

    expect(editaisService.getById).toHaveBeenCalledWith('edital-9');
    expect(component.edital()).toEqual(editalMock);
    expect(component.operationTracker.isLoading(`busca-edital-${leadMock.uuid}`)()).toBe(false);
  }));

  it('deve mostrar mensagem de não encontrado quando o status for NAO_ENCONTRADO', fakeAsync(() => {
    const registro: BuscaEdital = {
      uuid: 'busca-1', leadId: 'lead-1', status: 'NAO_ENCONTRADO', mensagem: '',
      createdAt: '', lastModified: '', createdBy: '',
    };
    leadService.buscarEdital.and.returnValue(of(registro));

    component.buscarEdital();
    tick(0);

    expect(component.editalError()).toBe('Nenhum edital encontrado no PNCP para este lead.');
    expect(editaisService.getById).not.toHaveBeenCalled();
  }));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx ng test --include='**/lead-detalhe-dialog.component.spec.ts' --watch=false`
Expected: FAIL — `component.operationTracker` é `undefined` (propriedade ainda não existe) e o comportamento de polling ainda não implementado.

- [ ] **Step 3: Atualizar imports e injeções no componente**

Em `src/app/features/leads/lead-detalhe-dialog/lead-detalhe-dialog.component.ts`, trocar a linha 1 e adicionar imports:

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
import { interval, switchMap, first, of } from 'rxjs';
import { Lead, LeadStatus } from '../../../core/models/lead.model';
import { EditalResponse } from '../../../core/models/edital.model';
import { BuscaEdital } from '../../../core/models/busca-edital.model';
import { LeadService } from '../../../core/services/lead.service';
import { EditaisService } from '../../../core/services/editais.service';
import { ToastService } from '../../../core/services/toast.service';
import { OperationTrackerService } from '../../../core/services/operation-tracker.service';
import { CurrencyBrPipe } from '../../../shared/pipes/currency-br.pipe';
import { JustificativaDialogComponent } from '../../../shared/components/justificativa-dialog/justificativa-dialog.component';
```

(As constantes `STATUS_META`/`ORG_COLORS`, o `@Component(...)` e o template das linhas 55-782 permanecem iguais, exceto os trechos abaixo.)

Trocar o bloco do "edital-loading" no template (linhas 137-140):

```html
        @if (operationTracker.isLoading('busca-edital-' + data.uuid)()) {
          <div class="edital-loading">
            <mat-spinner diameter="16" /><span>Buscando no PNCP...</span>
          </div>
        } @else if (edital()) {
```

Trocar o `[disabled]="salvando"` do botão "Buscar no PNCP" (linha 186) para também considerar o tracker:

```html
            <button
              class="btn-buscar"
              (click)="buscarEdital()"
              [disabled]="salvando || operationTracker.isLoading('busca-edital-' + data.uuid)()"
            >
```

- [ ] **Step 4: Substituir a classe do componente**

Trocar as linhas 783-830 (declaração da classe até o fim do método `buscarEdital` atual):

```typescript
export class LeadDetalheDialogComponent implements OnInit {
  private leadService = inject(LeadService);
  private editaisService = inject(EditaisService);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  readonly operationTracker = inject(OperationTrackerService);

  salvando = false;
  edital = signal<EditalResponse | null>(null);
  editalError = signal<string | null>(null);

  constructor(
    public dialogRef: MatDialogRef<LeadDetalheDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Lead,
  ) {}

  ngOnInit(): void {
    if (this.data.editalId) {
      this.editaisService.getById(this.data.editalId).subscribe({
        next: (e) => this.edital.set(e),
        error: () => {},
      });
    }
  }

  buscarEdital(): void {
    const key = `busca-edital-${this.data.uuid}`;
    this.editalError.set(null);

    const inicia$ = this.leadService.buscarEdital(this.data.uuid).pipe(
      switchMap((registro) =>
        registro.status === 'EM_ANDAMENTO'
          ? interval(2000).pipe(
              switchMap(() => this.leadService.statusBuscaEdital(this.data.uuid)),
              first((r) => r.status !== 'EM_ANDAMENTO'),
            )
          : of(registro),
      ),
    );

    this.operationTracker.run<BuscaEdital>(key, inicia$, {
      errorMessage: 'Erro ao buscar edital. Tente novamente.',
      onSuccess: (registro) => {
        if (registro.status === 'CONCLUIDA' && registro.editalId) {
          this.editaisService.getById(registro.editalId).subscribe((e) => this.edital.set(e));
        } else if (registro.status === 'NAO_ENCONTRADO') {
          this.editalError.set('Nenhum edital encontrado no PNCP para este lead.');
        } else {
          this.editalError.set(registro.mensagem || 'Erro ao buscar edital. Tente novamente.');
        }
      },
    });
  }
```

O restante da classe (`moverPara`, `irParaImpugnacao`, `irParaCotacao`, getters e formatadores — linhas 832-905) permanece igual, exceto `moverPara`, que também migra para o tracker:

```typescript
  moverPara(status: LeadStatus): void {
    const label = STATUS_META[status].label;
    const ref = this.dialog.open(JustificativaDialogComponent, {
      data: { titulo: `Mover para ${label}` },
      width: '460px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((justificativa: string | undefined) => {
      if (!justificativa) return;
      this.operationTracker.run(`mover-lead-${this.data.uuid}`, this.leadService.atualizarStatus(this.data.uuid, {
        status,
        revisadoPor: 'analista@brasfort.com.br',
        observacao: justificativa,
      }), {
        successMessage: label,
        errorMessage: 'Erro ao atualizar status',
        onSuccess: () => this.dialogRef.close(true),
      });
    });
  }
```

Trocar todos os `[disabled]="salvando"` do template usados nos botões de `moverPara` (linhas 198,207,214,224,231,247,254,267) por `[disabled]="operationTracker.isLoading('mover-lead-' + data.uuid)()"`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx ng test --include='**/lead-detalhe-dialog.component.spec.ts' --watch=false`
Expected: PASS (2 specs)

- [ ] **Step 6: Rodar o build completo**

Run: `npx ng build`
Expected: sem erros (o erro esperado da Task 5/Step 6 deve ter sumido).

- [ ] **Step 7: Verificação manual**

Rodar `npm start`, abrir um lead sem edital vinculado, clicar "Buscar no PNCP", fechar o dialog antes do polling concluir, reabrir o mesmo lead e confirmar que o texto "Buscando no PNCP..." ainda aparece (a operação continuou rodando) até concluir.

- [ ] **Step 8: Commit**

```bash
git add src/app/features/leads/lead-detalhe-dialog/lead-detalhe-dialog.component.ts src/app/features/leads/lead-detalhe-dialog/lead-detalhe-dialog.component.spec.ts
git commit -m "feat: migra busca de edital e mudança de status do lead para o OperationTrackerService com polling assíncrono"
```

---

### Task 7: Migrar `fornecedor-form-dialog` / `fornecedores.component.ts` (padrão de referência para os dialogs restantes)

**Files:**
- Modify: `src/app/features/cotacao/fornecedores/fornecedores.component.ts:435-529`
- Test: `src/app/features/cotacao/fornecedores/fornecedores.component.spec.ts` (novo arquivo — não existe teste hoje)

**Interfaces:**
- Consumes: `OperationTrackerService.run` (Task 1)
- Produces: nenhuma — comportamento externo idêntico (mesmos toasts, mesmo refresh de lista).

- [ ] **Step 1: Write the failing tests**

```typescript
// src/app/features/cotacao/fornecedores/fornecedores.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, Subject } from 'rxjs';
import { FornecedoresComponent } from './fornecedores.component';
import { CotacaoService } from '../../../core/services/cotacao.service';
import { ToastService } from '../../../core/services/toast.service';

describe('FornecedoresComponent — save resiliente a fechamento de dialog', () => {
  let fixture: ComponentFixture<FornecedoresComponent>;
  let component: FornecedoresComponent;
  let cotacaoService: jasmine.SpyObj<CotacaoService>;
  let toast: jasmine.SpyObj<ToastService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    cotacaoService = jasmine.createSpyObj('CotacaoService', [
      'listarFornecedores', 'criarFornecedor', 'atualizarFornecedor', 'deletarFornecedor',
    ]);
    cotacaoService.listarFornecedores.and.returnValue(
      of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 25, first: true, last: true, empty: true }),
    );
    toast = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);
    dialog = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      imports: [FornecedoresComponent],
      providers: [
        { provide: CotacaoService, useValue: cotacaoService },
        { provide: ToastService, useValue: toast },
        { provide: MatDialog, useValue: dialog },
      ],
    });

    fixture = TestBed.createComponent(FornecedoresComponent);
    component = fixture.componentInstance;
  });

  it('deve criar o fornecedor e recarregar a lista mesmo se o dialog já tiver fechado', () => {
    const afterClosedSubject = new Subject<any>();
    dialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);

    const criarSubject = new Subject<void>();
    cotacaoService.criarFornecedor.and.returnValue(criarSubject.asObservable());

    component.openForm(null);
    afterClosedSubject.next({ nome: 'Novo Fornecedor', email: 'a@b.com' });
    afterClosedSubject.complete();

    // dialog já "fechou" (afterClosed emitiu) — a criação ainda está em voo
    expect(cotacaoService.criarFornecedor).toHaveBeenCalled();

    criarSubject.next();
    criarSubject.complete();

    expect(toast.success).toHaveBeenCalledWith('Fornecedor criado');
    expect(cotacaoService.listarFornecedores).toHaveBeenCalledTimes(2); // load inicial + reload pós-save
  });

  it('deve mostrar toast de erro quando o save falhar', () => {
    const afterClosedSubject = new Subject<any>();
    dialog.open.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);
    const erroSubject = new Subject<void>();
    cotacaoService.criarFornecedor.and.returnValue(erroSubject.asObservable());

    component.openForm(null);
    afterClosedSubject.next({ nome: 'X', email: 'x@y.com' });
    erroSubject.error(new Error('boom'));

    expect(toast.error).toHaveBeenCalledWith('Erro ao salvar fornecedor');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx ng test --include='**/fornecedores.component.spec.ts' --watch=false`
Expected: FAIL ou PASS parcial — o comportamento externo já é correto hoje (sem o tracker), então este é o baseline verde antes do refactor interno. Confirmar que os 2 specs passam já nesta etapa (são testes de comportamento, não de implementação).

- [ ] **Step 3: Atualizar `fornecedores.component.ts`**

Adicionar o import e a injeção (perto da linha 1 e 436):

```typescript
import { OperationTrackerService } from '../../../core/services/operation-tracker.service';
```

```typescript
  private tracker = inject(OperationTrackerService);
```

Substituir `openForm` (linhas 488-507) e `confirmarExclusao` (linhas 509-529):

```typescript
  openForm(fornecedor: Fornecedor | null): void {
    const ref = this.dialog.open(FornecedorFormDialogComponent, {
      data: fornecedor,
      width: '600px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const call = fornecedor?.id
        ? this.svc.atualizarFornecedor(fornecedor.id, result)
        : this.svc.criarFornecedor(result);
      this.tracker.run(`save-fornecedor-${fornecedor?.id ?? 'novo'}`, call, {
        successMessage: fornecedor ? 'Fornecedor atualizado' : 'Fornecedor criado',
        errorMessage: 'Erro ao salvar fornecedor',
        onSuccess: () => this.load(),
      });
    });
  }

  confirmarExclusao(f: Fornecedor): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Excluir Fornecedor',
        message: `Deseja excluir "${f.nome}"? Esta ação é irreversível.`,
        confirmLabel: 'Excluir',
        danger: true,
      },
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok && f.id) {
        this.tracker.run(`delete-fornecedor-${f.id}`, this.svc.deletarFornecedor(f.id), {
          successMessage: 'Fornecedor excluído',
          errorMessage: 'Erro ao excluir',
          onSuccess: () => this.load(),
        });
      }
    });
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx ng test --include='**/fornecedores.component.spec.ts' --watch=false`
Expected: PASS (2 specs)

- [ ] **Step 5: Rodar o build completo**

Run: `npx ng build`
Expected: sem erros.

- [ ] **Step 6: Verificação manual**

Rodar `npm start`, abrir Fornecedores → Novo Fornecedor, preencher e salvar, confirmar que a lista atualiza e o toast aparece; repetir mas fechando o dialog (X) imediatamente após clicar em "Criar Fornecedor" — confirmar que o toast e o refresh da lista ainda acontecem.

- [ ] **Step 7: Commit**

```bash
git add src/app/features/cotacao/fornecedores/fornecedores.component.ts src/app/features/cotacao/fornecedores/fornecedores.component.spec.ts
git commit -m "refactor: migra save/delete de Fornecedores para o OperationTrackerService"
```

---

## Follow-ups (fora deste plano)

Os dialogs `item-form-dialog`, `keyword-dialog`, `tipo-abertura-dialog`, `dou-item-dialog`, `itens-dialog`, `pncp-item-dialog` e `processo-detalhe-dialog` seguem o mesmo padrão "dialog fecha imediatamente, o parent chama o serviço e trata o resultado" (igual ao `fornecedor-form-dialog`/`fornecedores.component.ts` da Task 7) ou o padrão "dialog fica aberto e chama o serviço direto" (igual ao `lead-detalhe-dialog` da Task 6). Depois que o padrão for validado em produção nessas duas referências, replicar a mesma refatoração (import do `OperationTrackerService`, troca do `.subscribe({next,error})` cru por `tracker.run(key, source$, opts)`) nos arquivos restantes, um plano por lote de 2-3 dialogs.
