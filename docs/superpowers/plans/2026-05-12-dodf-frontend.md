# DODF Frontend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the DODF frontend — a configuration page for keywords and tipos-abertura rules, and a coleta panel in the Pipeline page that triggers DODF collection for a given date.

**Architecture:** New `DodfService` wraps the three DODF endpoint groups. A new `DodfConfiguracaoComponent` manages keywords and tipos-abertura with paginated tables and CRUD dialogs. The existing `PipelineComponent` gains a collapsible "Coleta DODF" expansion panel at the top that calls the synchronous coleta endpoint and shows results immediately.

**Tech Stack:** Angular 18 standalone components, Angular Material (MatTable, MatPaginator, MatTabsModule, MatDatepickerModule, MatExpansionModule, MatDialogModule, MatSlideToggleModule), `HttpClient`, `inject()`, `signal()`.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/app/core/models/dodf.model.ts` | Create | Types: DodfKeyword, DodfTipoAbertura, ColetaResultado, Materia, Page |
| `src/app/core/services/dodf.service.ts` | Create | HTTP wrapper for /dodf/keywords, /dodf/tipos-abertura, /dodf/coleta |
| `src/app/features/dodf/configuracao/keyword-dialog/keyword-dialog.component.ts` | Create | Create/edit dialog for DodfKeyword |
| `src/app/features/dodf/configuracao/tipo-abertura-dialog/tipo-abertura-dialog.component.ts` | Create | Create/edit dialog for DodfTipoAbertura |
| `src/app/features/dodf/configuracao/dodf-configuracao.component.ts` | Create | Tabbed page: keywords tab + tipos-abertura tab |
| `src/app/features/pipeline/pipeline.component.ts` | Modify | Add "Coleta DODF" expansion panel + DodfService injection |
| `src/app/features/pipeline/pipeline.component.html` | Modify | Add coleta panel template + fonteOrigem chip on cards + remove "Novo Lead" |
| `src/app/features/pipeline/pipeline.component.scss` | Modify | Add coleta panel and fonte chip styles |
| `src/app/core/models/edital.model.ts` | Modify | Add `fonteOrigem?: string` to LeadResponse |
| `src/app/app.routes.ts` | Modify | Add `/dodf/configuracao` route |
| `src/app/features/layout/main-layout/main-layout.component.ts` | Modify | Add "Config. DODF" to Configurações nav section |

---

### Task 1: Models

**Files:**
- Create: `src/app/core/models/dodf.model.ts`

> **Backend note — required before testing:** `DodfKeyword.toDto()` currently returns `{ termo, ativo }` without `uuid`. Keywords cannot be edited or deleted from the frontend without the ID. Update `DodfKeyword.toDto()` in the backend:
> ```java
> public static DodfKeywordRecord toDto(DodfKeyword k) {
>     return new DodfKeywordRecord(k.getUuid(), k.getTermo(), k.getAtivo());
> }
> ```
> And add `UUID uuid` as the first field in `DodfKeywordRecord`. `DodfTipoAberturaRecord` already includes `uuid` — no change needed there.

- [ ] **Step 1: Create the models file**

```typescript
// src/app/core/models/dodf.model.ts

export interface DodfKeyword {
  uuid: string;
  termo: string;
  ativo: boolean;
}

export interface DodfTipoAbertura {
  uuid: string;
  valor: string;
  ativo: boolean;
}

export interface Materia {
  coDemandante: string;
  secao: string;
  poder: string[];
  tipo: string;
  coMateria: string;
  titulo: string;
  texto: string;
  slug: string;
}

export interface ColetaResultado {
  data: string;
  totalMaterias: number;
  totalRelevantes: number;
  relevantes: Materia[];
}

export interface DodfPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/core/models/dodf.model.ts
git commit -m "feat: add DODF models"
```

---

### Task 2: Service

**Files:**
- Create: `src/app/core/services/dodf.service.ts`

- [ ] **Step 1: Create the service**

```typescript
// src/app/core/services/dodf.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ColetaResultado, DodfKeyword, DodfTipoAbertura, DodfPage } from '../models/dodf.model';

@Injectable({ providedIn: 'root' })
export class DodfService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/dodf`;

  // ── Coleta ──────────────────────────────────────────────────────────
  coletar(data: string): Observable<ColetaResultado> {
    return this.http.post<ColetaResultado>(
      `${this.base}/coleta`,
      null,
      { params: new HttpParams().set('data', data) }
    );
  }

  // ── Keywords ────────────────────────────────────────────────────────
  getKeywords(page = 0, size = 10): Observable<DodfPage<DodfKeyword>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<DodfPage<DodfKeyword>>(`${this.base}/keywords`, { params });
  }

  createKeyword(payload: { termo: string; ativo: boolean }): Observable<DodfKeyword> {
    return this.http.post<DodfKeyword>(`${this.base}/keywords`, payload);
  }

  updateKeyword(uuid: string, payload: { termo: string; ativo: boolean }): Observable<DodfKeyword> {
    return this.http.put<DodfKeyword>(`${this.base}/keywords/${uuid}`, payload);
  }

  deleteKeyword(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/keywords/${uuid}`);
  }

  // ── Tipos de Abertura ───────────────────────────────────────────────
  getTipos(page = 0, size = 10): Observable<DodfPage<DodfTipoAbertura>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<DodfPage<DodfTipoAbertura>>(`${this.base}/tipos-abertura`, { params });
  }

  createTipo(payload: { valor: string; ativo: boolean }): Observable<DodfTipoAbertura> {
    return this.http.post<DodfTipoAbertura>(`${this.base}/tipos-abertura`, payload);
  }

  updateTipo(uuid: string, payload: { valor: string; ativo: boolean }): Observable<DodfTipoAbertura> {
    return this.http.put<DodfTipoAbertura>(`${this.base}/tipos-abertura/${uuid}`, payload);
  }

  deleteTipo(uuid: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/tipos-abertura/${uuid}`);
  }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/rrxx/rdPersonal/Trabalho/licitacao_auto_angular
npx ng build --configuration development 2>&1 | tail -20
```
Expected: no TypeScript errors mentioning `dodf.service.ts` or `dodf.model.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/app/core/services/dodf.service.ts
git commit -m "feat: add DodfService"
```

---

### Task 3: Keyword Dialog

**Files:**
- Create: `src/app/features/dodf/configuracao/keyword-dialog/keyword-dialog.component.ts`

- [ ] **Step 1: Create the keyword dialog**

```typescript
// src/app/features/dodf/configuracao/keyword-dialog/keyword-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DodfKeyword } from '../../../../core/models/dodf.model';

export interface KeywordDialogData {
  keyword?: DodfKeyword;
}

@Component({
  selector: 'app-keyword-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatSlideToggleModule],
  template: `
    <h2 mat-dialog-title>{{ data.keyword ? 'Editar Keyword' : 'Nova Keyword' }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Termo</mat-label>
        <input matInput [(ngModel)]="termo" placeholder="ex: licitação, pregão" required />
      </mat-form-field>
      <mat-slide-toggle [(ngModel)]="ativo">Ativo</mat-slide-toggle>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!termo.trim()" (click)="confirm()">
        {{ data.keyword ? 'Salvar' : 'Criar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; margin-bottom: 16px; }`]
})
export class KeywordDialogComponent {
  termo = this.data.keyword?.termo ?? '';
  ativo = this.data.keyword?.ativo ?? true;

  constructor(
    public dialogRef: MatDialogRef<KeywordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: KeywordDialogData
  ) {}

  confirm(): void {
    if (!this.termo.trim()) return;
    this.dialogRef.close({ termo: this.termo.trim(), ativo: this.ativo });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/dodf/configuracao/keyword-dialog/keyword-dialog.component.ts
git commit -m "feat: add KeywordDialogComponent"
```

---

### Task 4: TipoAbertura Dialog

**Files:**
- Create: `src/app/features/dodf/configuracao/tipo-abertura-dialog/tipo-abertura-dialog.component.ts`

- [ ] **Step 1: Create the tipo-abertura dialog**

```typescript
// src/app/features/dodf/configuracao/tipo-abertura-dialog/tipo-abertura-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DodfTipoAbertura } from '../../../../core/models/dodf.model';

export interface TipoAberturaDialogData {
  tipo?: DodfTipoAbertura;
}

@Component({
  selector: 'app-tipo-abertura-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatSlideToggleModule],
  template: `
    <h2 mat-dialog-title>{{ data.tipo ? 'Editar Tipo de Abertura' : 'Novo Tipo de Abertura' }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Valor</mat-label>
        <input matInput [(ngModel)]="valor" placeholder="ex: AVISO DE LICITAÇÃO" required />
      </mat-form-field>
      <mat-slide-toggle [(ngModel)]="ativo">Ativo</mat-slide-toggle>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="!valor.trim()" (click)="confirm()">
        {{ data.tipo ? 'Salvar' : 'Criar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; margin-bottom: 16px; }`]
})
export class TipoAberturaDialogComponent {
  valor = this.data.tipo?.valor ?? '';
  ativo = this.data.tipo?.ativo ?? true;

  constructor(
    public dialogRef: MatDialogRef<TipoAberturaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TipoAberturaDialogData
  ) {}

  confirm(): void {
    if (!this.valor.trim()) return;
    this.dialogRef.close({ valor: this.valor.trim(), ativo: this.ativo });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/features/dodf/configuracao/tipo-abertura-dialog/tipo-abertura-dialog.component.ts
git commit -m "feat: add TipoAberturaDialogComponent"
```

---

### Task 5: DODF Configuração Page

**Files:**
- Create: `src/app/features/dodf/configuracao/dodf-configuracao.component.ts`

- [ ] **Step 1: Create the main configuration page**

```typescript
// src/app/features/dodf/configuracao/dodf-configuracao.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { DodfService } from '../../../core/services/dodf.service';
import { ToastService } from '../../../core/services/toast.service';
import { DodfKeyword, DodfTipoAbertura } from '../../../core/models/dodf.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { KeywordDialogComponent } from './keyword-dialog/keyword-dialog.component';
import { TipoAberturaDialogComponent } from './tipo-abertura-dialog/tipo-abertura-dialog.component';

@Component({
  selector: 'app-dodf-configuracao',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatCardModule,
  ],
  template: `
    <div class="dodf-config-shell">
      <div class="config-header">
        <h1 class="config-title">Configuração DODF</h1>
        <p class="config-subtitle">Gerencie as palavras-chave e tipos de abertura usados na filtragem do Diário Oficial do DF.</p>
      </div>

      <mat-card appearance="outlined" class="config-card">
        <mat-tab-group>

          <!-- ── Keywords Tab ──────────────────────────────────────── -->
          <mat-tab label="Keywords">
            <div class="tab-toolbar">
              <button mat-flat-button color="primary" (click)="openCreateKeyword()">
                <mat-icon>add</mat-icon>Nova Keyword
              </button>
            </div>

            @if (loadingKeywords()) {
              <div class="tab-loading">Carregando...</div>
            } @else {
              <table mat-table [dataSource]="keywords()" class="config-table">
                <ng-container matColumnDef="termo">
                  <th mat-header-cell *matHeaderCellDef>Termo</th>
                  <td mat-cell *matCellDef="let row">{{ row.termo }}</td>
                </ng-container>
                <ng-container matColumnDef="ativo">
                  <th mat-header-cell *matHeaderCellDef>Ativo</th>
                  <td mat-cell *matCellDef="let row">
                    <mat-slide-toggle [checked]="row.ativo" (change)="toggleKeyword(row)" />
                  </td>
                </ng-container>
                <ng-container matColumnDef="acoes">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let row">
                    <button mat-icon-button matTooltip="Editar" (click)="openEditKeyword(row)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button matTooltip="Excluir" color="warn" (click)="deleteKeyword(row)">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="keywordCols"></tr>
                <tr mat-row *matRowDef="let row; columns: keywordCols;"></tr>
              </table>
              <mat-paginator
                [length]="keywordTotal()"
                [pageSize]="keywordPageSize"
                [pageSizeOptions]="[5, 10, 20]"
                (page)="onKeywordPage($event)"
                showFirstLastButtons />
            }
          </mat-tab>

          <!-- ── Tipos de Abertura Tab ─────────────────────────────── -->
          <mat-tab label="Tipos de Abertura">
            <div class="tab-toolbar">
              <button mat-flat-button color="primary" (click)="openCreateTipo()">
                <mat-icon>add</mat-icon>Novo Tipo
              </button>
            </div>

            @if (loadingTipos()) {
              <div class="tab-loading">Carregando...</div>
            } @else {
              <table mat-table [dataSource]="tipos()" class="config-table">
                <ng-container matColumnDef="valor">
                  <th mat-header-cell *matHeaderCellDef>Valor</th>
                  <td mat-cell *matCellDef="let row">{{ row.valor }}</td>
                </ng-container>
                <ng-container matColumnDef="ativo">
                  <th mat-header-cell *matHeaderCellDef>Ativo</th>
                  <td mat-cell *matCellDef="let row">
                    <mat-slide-toggle [checked]="row.ativo" (change)="toggleTipo(row)" />
                  </td>
                </ng-container>
                <ng-container matColumnDef="acoes">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let row">
                    <button mat-icon-button matTooltip="Editar" (click)="openEditTipo(row)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button matTooltip="Excluir" color="warn" (click)="deleteTipo(row)">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="tipoCols"></tr>
                <tr mat-row *matRowDef="let row; columns: tipoCols;"></tr>
              </table>
              <mat-paginator
                [length]="tipoTotal()"
                [pageSize]="tipoPageSize"
                [pageSizeOptions]="[5, 10, 20]"
                (page)="onTipoPage($event)"
                showFirstLastButtons />
            }
          </mat-tab>

        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [`
    .dodf-config-shell { padding: 24px; max-width: 900px; }
    .config-header { margin-bottom: 24px; }
    .config-title { font-size: 22px; font-weight: 700; color: #0F172A; margin: 0 0 4px; }
    .config-subtitle { font-size: 13px; color: #64748B; margin: 0; }
    .config-card { border-radius: 12px; overflow: hidden; }
    .tab-toolbar { padding: 16px 16px 8px; display: flex; justify-content: flex-end; }
    .tab-loading { padding: 32px; text-align: center; color: #64748B; }
    .config-table { width: 100%; }
  `]
})
export class DodfConfiguracaoComponent implements OnInit {
  private dodfService = inject(DodfService);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);

  keywords = signal<DodfKeyword[]>([]);
  keywordTotal = signal(0);
  keywordPage = 0;
  keywordPageSize = 10;
  loadingKeywords = signal(false);

  tipos = signal<DodfTipoAbertura[]>([]);
  tipoTotal = signal(0);
  tipoPage = 0;
  tipoPageSize = 10;
  loadingTipos = signal(false);

  keywordCols = ['termo', 'ativo', 'acoes'];
  tipoCols = ['valor', 'ativo', 'acoes'];

  ngOnInit(): void {
    this.loadKeywords();
    this.loadTipos();
  }

  // ── Keywords ────────────────────────────────────────────────────────

  loadKeywords(): void {
    this.loadingKeywords.set(true);
    this.dodfService.getKeywords(this.keywordPage, this.keywordPageSize).subscribe({
      next: (page) => {
        this.keywords.set(page.content);
        this.keywordTotal.set(page.totalElements);
        this.loadingKeywords.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar keywords');
        this.loadingKeywords.set(false);
      }
    });
  }

  onKeywordPage(event: PageEvent): void {
    this.keywordPage = event.pageIndex;
    this.keywordPageSize = event.pageSize;
    this.loadKeywords();
  }

  openCreateKeyword(): void {
    const ref = this.dialog.open(KeywordDialogComponent, { data: {}, width: '400px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.dodfService.createKeyword(result).subscribe({
          next: () => { this.toast.success('Keyword criada!'); this.loadKeywords(); },
          error: () => this.toast.error('Erro ao criar keyword'),
        });
      }
    });
  }

  openEditKeyword(keyword: DodfKeyword): void {
    const ref = this.dialog.open(KeywordDialogComponent, { data: { keyword }, width: '400px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.dodfService.updateKeyword(keyword.uuid, result).subscribe({
          next: () => { this.toast.success('Keyword atualizada!'); this.loadKeywords(); },
          error: () => this.toast.error('Erro ao atualizar keyword'),
        });
      }
    });
  }

  toggleKeyword(keyword: DodfKeyword): void {
    this.dodfService.updateKeyword(keyword.uuid, { termo: keyword.termo, ativo: !keyword.ativo }).subscribe({
      next: () => {
        this.toast.success(keyword.ativo ? 'Keyword desativada' : 'Keyword ativada');
        this.loadKeywords();
      },
      error: () => { this.toast.error('Erro ao alterar keyword'); this.loadKeywords(); },
    });
  }

  deleteKeyword(keyword: DodfKeyword): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Excluir Keyword', message: `Deseja excluir a keyword "${keyword.termo}"?`, confirmLabel: 'Excluir', danger: true }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.dodfService.deleteKeyword(keyword.uuid).subscribe({
          next: () => { this.toast.success('Keyword excluída'); this.loadKeywords(); },
          error: () => this.toast.error('Erro ao excluir keyword'),
        });
      }
    });
  }

  // ── Tipos de Abertura ───────────────────────────────────────────────

  loadTipos(): void {
    this.loadingTipos.set(true);
    this.dodfService.getTipos(this.tipoPage, this.tipoPageSize).subscribe({
      next: (page) => {
        this.tipos.set(page.content);
        this.tipoTotal.set(page.totalElements);
        this.loadingTipos.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar tipos de abertura');
        this.loadingTipos.set(false);
      }
    });
  }

  onTipoPage(event: PageEvent): void {
    this.tipoPage = event.pageIndex;
    this.tipoPageSize = event.pageSize;
    this.loadTipos();
  }

  openCreateTipo(): void {
    const ref = this.dialog.open(TipoAberturaDialogComponent, { data: {}, width: '400px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.dodfService.createTipo(result).subscribe({
          next: () => { this.toast.success('Tipo criado!'); this.loadTipos(); },
          error: () => this.toast.error('Erro ao criar tipo'),
        });
      }
    });
  }

  openEditTipo(tipo: DodfTipoAbertura): void {
    const ref = this.dialog.open(TipoAberturaDialogComponent, { data: { tipo }, width: '400px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.dodfService.updateTipo(tipo.uuid, result).subscribe({
          next: () => { this.toast.success('Tipo atualizado!'); this.loadTipos(); },
          error: () => this.toast.error('Erro ao atualizar tipo'),
        });
      }
    });
  }

  toggleTipo(tipo: DodfTipoAbertura): void {
    this.dodfService.updateTipo(tipo.uuid, { valor: tipo.valor, ativo: !tipo.ativo }).subscribe({
      next: () => {
        this.toast.success(tipo.ativo ? 'Tipo desativado' : 'Tipo ativado');
        this.loadTipos();
      },
      error: () => { this.toast.error('Erro ao alterar tipo'); this.loadTipos(); },
    });
  }

  deleteTipo(tipo: DodfTipoAbertura): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Excluir Tipo de Abertura', message: `Deseja excluir o tipo "${tipo.valor}"?`, confirmLabel: 'Excluir', danger: true }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.dodfService.deleteTipo(tipo.uuid).subscribe({
          next: () => { this.toast.success('Tipo excluído'); this.loadTipos(); },
          error: () => this.toast.error('Erro ao excluir tipo'),
        });
      }
    });
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npx ng build --configuration development 2>&1 | tail -20
```
Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/dodf/
git commit -m "feat: add DodfConfiguracaoComponent with keywords and tipos-abertura tabs"
```

---

### Task 6: Route + Sidebar Entry

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/features/layout/main-layout/main-layout.component.ts`

- [ ] **Step 1: Add route**

In `src/app/app.routes.ts`, inside the `children` array after the `regras` route, add:

```typescript
{
  path: 'dodf/configuracao',
  loadComponent: () =>
    import('./features/dodf/configuracao/dodf-configuracao.component').then(m => m.DodfConfiguracaoComponent),
},
```

- [ ] **Step 2: Add sidebar item**

In `src/app/features/layout/main-layout/main-layout.component.ts`, find the `'Configurações'` section in `navSections` and add the DODF entry:

```typescript
{
  label: 'Configurações',
  items: [
    { label: 'Regras de Análise', icon: 'rule', route: '/regras' },
    { label: 'Config. DODF', icon: 'article', route: '/dodf/configuracao' },
    { label: 'Relatórios', icon: 'bar_chart', route: '/relatorios' },
  ],
},
```

- [ ] **Step 3: Verify build**

```bash
npx ng build --configuration development 2>&1 | tail -20
```
Expected: clean build.

- [ ] **Step 4: Manual smoke test**

```bash
npx ng serve
```
Navigate to `/dodf/configuracao`. Expected: two tabs (Keywords, Tipos de Abertura), each with a table and a "+ Nova / + Novo" button. API calls will fail until backend is running — that's expected.

- [ ] **Step 5: Commit**

```bash
git add src/app/app.routes.ts src/app/features/layout/main-layout/main-layout.component.ts
git commit -m "feat: add DODF configuracao route and sidebar nav item"
```

---

### Task 7: Pipeline — Coleta DODF Panel

**Files:**
- Modify: `src/app/features/pipeline/pipeline.component.ts`
- Modify: `src/app/features/pipeline/pipeline.component.html`
- Modify: `src/app/features/pipeline/pipeline.component.scss`
- Modify: `src/app/core/models/edital.model.ts`

- [ ] **Step 1: Add `fonteOrigem` to `LeadResponse`**

In `src/app/core/models/edital.model.ts`, add `fonteOrigem?: string` to `LeadResponse`:

```typescript
export interface LeadResponse {
  id: string;
  numero: string;
  objeto: string;
  modalidade: string;
  valorEstimado: number;
  dataAbertura: string;
  orgaoOrigem: string;
  sourceUrl: string;
  leadScore: number;
  leadCategoriaPrincipal: string;
  leadCategorias: string;
  createdAt: string;
  viabilidadeScore?: number;
  viabilidadeRazao?: string;
  fonteOrigem?: string;
  status?: string;
}
```

- [ ] **Step 2: Update `pipeline.component.ts`**

Replace the full file content:

```typescript
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { EditaisService } from '../../core/services/editais.service';
import { DodfService } from '../../core/services/dodf.service';
import { ToastService } from '../../core/services/toast.service';
import { LeadResponse } from '../../core/models/edital.model';
import { ColetaResultado } from '../../core/models/dodf.model';
import { CurrencyBrPipe } from '../../shared/pipes/currency-br.pipe';
import { TruncatePipe } from '../../shared/pipes/truncate.pipe';

@Component({
  selector: 'app-pipeline',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatExpansionModule,
    MatChipsModule,
    DragDropModule,
    CurrencyBrPipe,
    TruncatePipe,
  ],
  templateUrl: './pipeline.component.html',
  styleUrl: './pipeline.component.scss',
})
export class PipelineComponent implements OnInit {
  private editaisService = inject(EditaisService);
  private dodfService = inject(DodfService);
  private toast = inject(ToastService);

  // ── Kanban ─────────────────────────────────────────────────────────
  loading = signal(true);
  hotLeads  = signal<LeadResponse[]>([]);
  warmLeads = signal<LeadResponse[]>([]);
  coldLeads = signal<LeadResponse[]>([]);

  get hotValue():  number { return this.hotLeads().reduce((a, l) => a + l.valorEstimado, 0); }
  get warmValue(): number { return this.warmLeads().reduce((a, l) => a + l.valorEstimado, 0); }
  get coldValue(): number { return this.coldLeads().reduce((a, l) => a + l.valorEstimado, 0); }

  // ── Coleta DODF ────────────────────────────────────────────────────
  coletaDate = signal<Date>(new Date());
  coletando = signal(false);
  coletaResultado = signal<ColetaResultado | null>(null);
  panelOpen = signal(true);

  ngOnInit(): void {
    this.loadLeads();
  }

  loadLeads(): void {
    this.loading.set(true);
    this.editaisService.getLeads({ scoreMinimo: 0 }).subscribe({
      next: (leads) => {
        this.hotLeads.set((leads ?? []).filter(l => l.leadScore >= 70));
        this.warmLeads.set((leads ?? []).filter(l => l.leadScore >= 40 && l.leadScore < 70));
        this.coldLeads.set((leads ?? []).filter(l => l.leadScore < 40));
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
  }

  coletar(): void {
    if (this.coletando()) return;
    const date = this.coletaDate();
    if (!date) { this.toast.error('Selecione uma data'); return; }

    const dataStr = date.toISOString().split('T')[0];
    this.coletando.set(true);
    this.coletaResultado.set(null);

    this.dodfService.coletar(dataStr).subscribe({
      next: (resultado) => {
        this.coletaResultado.set(resultado);
        this.coletando.set(false);
        if (resultado.totalRelevantes === 0) {
          this.toast.info('Nenhuma matéria relevante encontrada para esta data');
        } else {
          this.toast.success(`${resultado.totalRelevantes} matéria(s) relevante(s) encontrada(s)`);
        }
      },
      error: () => {
        this.coletando.set(false);
        this.toast.error('Erro ao coletar do DODF');
      },
    });
  }

  drop(event: CdkDragDrop<LeadResponse[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  formatVal(v: number): string {
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}K`;
    return `R$ ${v}`;
  }
}
```

- [ ] **Step 3: Replace `pipeline.component.html`**

Replace the full file content:

```html
<div class="pipeline-shell">

  <!-- ── Header ──────────────────────────────────────────────────────── -->
  <div class="pipeline-header">
    <div>
      <h1 class="pipeline-title">Pipeline de Leads</h1>
      <p class="pipeline-sub">{{ hotLeads().length + warmLeads().length + coldLeads().length }} leads ativos · Total: {{ formatVal(hotValue + warmValue + coldValue) }}</p>
    </div>
    <div class="header-actions">
      <button mat-icon-button matTooltip="Atualizar pipeline" (click)="loadLeads()">
        <mat-icon>refresh</mat-icon>
      </button>
    </div>
  </div>

  <!-- ── Coleta DODF Panel ────────────────────────────────────────────── -->
  <mat-expansion-panel
    [expanded]="panelOpen()"
    (opened)="panelOpen.set(true)"
    (closed)="panelOpen.set(false)"
    class="coleta-panel">
    <mat-expansion-panel-header>
      <mat-panel-title>
        <mat-icon class="panel-icon">article</mat-icon>
        Coleta DODF
      </mat-panel-title>
      <mat-panel-description>
        Busca matérias relevantes no Diário Oficial do DF
      </mat-panel-description>
    </mat-expansion-panel-header>

    <div class="coleta-form">
      <mat-form-field appearance="outline" class="date-field">
        <mat-label>Data de Coleta</mat-label>
        <input matInput [matDatepicker]="picker"
               [ngModel]="coletaDate()"
               (ngModelChange)="coletaDate.set($event)" />
        <mat-datepicker-toggle matIconSuffix [for]="picker" />
        <mat-datepicker #picker />
      </mat-form-field>

      <button mat-flat-button color="primary" (click)="coletar()" [disabled]="coletando()">
        @if (coletando()) {
          <mat-spinner diameter="16" />
        } @else {
          <mat-icon>download</mat-icon>
        }
        {{ coletando() ? 'Coletando...' : 'Coletar' }}
      </button>
    </div>

    @if (coletaResultado(); as resultado) {
      <div class="coleta-resultado">
        <div class="resultado-summary">
          <div class="summary-chip">
            <span class="summary-val">{{ resultado.totalMaterias }}</span>
            <span class="summary-lbl">matérias encontradas</span>
          </div>
          <div class="summary-chip relevantes">
            <span class="summary-val">{{ resultado.totalRelevantes }}</span>
            <span class="summary-lbl">relevantes</span>
          </div>
          <span class="summary-data">{{ resultado.data }}</span>
        </div>

        @if (resultado.relevantes.length > 0) {
          <div class="materias-list">
            @for (m of resultado.relevantes; track m.coMateria) {
              <div class="materia-card">
                <div class="materia-top">
                  <span class="tipo-chip">{{ m.tipo }}</span>
                  <span class="materia-secao">{{ m.secao }}</span>
                </div>
                <p class="materia-titulo">{{ m.titulo }}</p>
                <p class="materia-orgao">{{ m.coDemandante }}</p>
              </div>
            }
          </div>
        } @else {
          <p class="no-results">Nenhuma matéria relevante para esta data.</p>
        }
      </div>
    }
  </mat-expansion-panel>

  <!-- ── Loading ──────────────────────────────────────────────────────── -->
  @if (loading()) {
    <div class="pipeline-loading">
      <mat-spinner diameter="36"></mat-spinner>
      <span>Carregando leads...</span>
    </div>
  }

  <!-- ── Board ────────────────────────────────────────────────────────── -->
  @if (!loading()) {
  <div class="pipeline-board" cdkDropListGroup>

    <!-- HOT -->
    <div class="pipeline-column hot">
      <div class="col-header">
        <div class="col-title-row">
          <div class="col-indicator hot"></div>
          <h3>Quente</h3>
          <span class="col-badge hot">{{ hotLeads().length }}</span>
        </div>
        <span class="col-value">{{ formatVal(hotValue) }}</span>
      </div>
      <div class="col-body" cdkDropList id="hot-list"
           [cdkDropListData]="hotLeads()"
           [cdkDropListConnectedTo]="['warm-list','cold-list']"
           (cdkDropListDropped)="drop($event)">
        @for (lead of hotLeads(); track lead.id) {
          <mat-card appearance="outlined" class="lead-card card-live animate-war-enter" cdkDrag>
            <mat-card-content>
              <div class="card-top">
                <span class="lead-numero">{{ lead.numero }}</span>
                <span class="score-pill hot">{{ lead.leadScore }}</span>
              </div>
              @if (lead.fonteOrigem) {
                <span class="fonte-chip fonte-{{ lead.fonteOrigem.toLowerCase() }}">{{ lead.fonteOrigem }}</span>
              }
              <p class="lead-objeto">{{ lead.objeto | truncate:55 }}</p>
              <div class="score-track">
                <div class="score-fill hot" [style.width.%]="lead.leadScore"></div>
              </div>
              <div class="card-meta">
                <span class="meta-item"><mat-icon>business</mat-icon>{{ lead.orgaoOrigem | truncate:20 }}</span>
                <span class="meta-chip">{{ lead.leadCategoriaPrincipal }}</span>
              </div>
              <div class="card-footer">
                <span class="lead-valor">{{ lead.valorEstimado | currencyBr }}</span>
                <span class="lead-data">{{ lead.dataAbertura }}</span>
              </div>
            </mat-card-content>
          </mat-card>
        }
        @if (hotLeads().length === 0) {
          <div class="empty-col"><mat-icon>local_fire_department</mat-icon><span>Nenhum lead quente</span></div>
        }
      </div>
    </div>

    <!-- WARM -->
    <div class="pipeline-column warm">
      <div class="col-header">
        <div class="col-title-row">
          <div class="col-indicator warm"></div>
          <h3>Morno</h3>
          <span class="col-badge warm">{{ warmLeads().length }}</span>
        </div>
        <span class="col-value">{{ formatVal(warmValue) }}</span>
      </div>
      <div class="col-body" cdkDropList id="warm-list"
           [cdkDropListData]="warmLeads()"
           [cdkDropListConnectedTo]="['hot-list','cold-list']"
           (cdkDropListDropped)="drop($event)">
        @for (lead of warmLeads(); track lead.id) {
          <mat-card appearance="outlined" class="lead-card card-live animate-war-enter" cdkDrag>
            <mat-card-content>
              <div class="card-top">
                <span class="lead-numero">{{ lead.numero }}</span>
                <span class="score-pill warm">{{ lead.leadScore }}</span>
              </div>
              @if (lead.fonteOrigem) {
                <span class="fonte-chip fonte-{{ lead.fonteOrigem.toLowerCase() }}">{{ lead.fonteOrigem }}</span>
              }
              <p class="lead-objeto">{{ lead.objeto | truncate:55 }}</p>
              <div class="score-track">
                <div class="score-fill warm" [style.width.%]="lead.leadScore"></div>
              </div>
              <div class="card-meta">
                <span class="meta-item"><mat-icon>business</mat-icon>{{ lead.orgaoOrigem | truncate:20 }}</span>
                <span class="meta-chip">{{ lead.leadCategoriaPrincipal }}</span>
              </div>
              <div class="card-footer">
                <span class="lead-valor">{{ lead.valorEstimado | currencyBr }}</span>
                <span class="lead-data">{{ lead.dataAbertura }}</span>
              </div>
            </mat-card-content>
          </mat-card>
        }
        @if (warmLeads().length === 0) {
          <div class="empty-col"><mat-icon>whatshot</mat-icon><span>Nenhum lead morno</span></div>
        }
      </div>
    </div>

    <!-- COLD -->
    <div class="pipeline-column cold">
      <div class="col-header">
        <div class="col-title-row">
          <div class="col-indicator cold"></div>
          <h3>Frio</h3>
          <span class="col-badge cold">{{ coldLeads().length }}</span>
        </div>
        <span class="col-value">{{ formatVal(coldValue) }}</span>
      </div>
      <div class="col-body" cdkDropList id="cold-list"
           [cdkDropListData]="coldLeads()"
           [cdkDropListConnectedTo]="['hot-list','warm-list']"
           (cdkDropListDropped)="drop($event)">
        @for (lead of coldLeads(); track lead.id) {
          <mat-card appearance="outlined" class="lead-card card-live animate-war-enter" cdkDrag>
            <mat-card-content>
              <div class="card-top">
                <span class="lead-numero">{{ lead.numero }}</span>
                <span class="score-pill cold">{{ lead.leadScore }}</span>
              </div>
              @if (lead.fonteOrigem) {
                <span class="fonte-chip fonte-{{ lead.fonteOrigem.toLowerCase() }}">{{ lead.fonteOrigem }}</span>
              }
              <p class="lead-objeto">{{ lead.objeto | truncate:55 }}</p>
              <div class="score-track">
                <div class="score-fill cold" [style.width.%]="lead.leadScore"></div>
              </div>
              <div class="card-meta">
                <span class="meta-item"><mat-icon>business</mat-icon>{{ lead.orgaoOrigem | truncate:20 }}</span>
                <span class="meta-chip">{{ lead.leadCategoriaPrincipal }}</span>
              </div>
              <div class="card-footer">
                <span class="lead-valor">{{ lead.valorEstimado | currencyBr }}</span>
                <span class="lead-data">{{ lead.dataAbertura }}</span>
              </div>
            </mat-card-content>
          </mat-card>
        }
        @if (coldLeads().length === 0) {
          <div class="empty-col"><mat-icon>ac_unit</mat-icon><span>Nenhum lead frio</span></div>
        }
      </div>
    </div>

  </div>
  }
</div>
```

- [ ] **Step 4: Append SCSS to `pipeline.component.scss`**

Append to the end of `src/app/features/pipeline/pipeline.component.scss`:

```scss
// ── Coleta DODF Panel ──────────────────────────────────────────────────
.coleta-panel {
  margin: 0 24px 20px;
  border-radius: 12px !important;
  border: 1px solid #E2E8F0 !important;
  box-shadow: none !important;

  .panel-icon {
    margin-right: 8px;
    color: #10B981;
    font-size: 20px;
    width: 20px;
    height: 20px;
    vertical-align: middle;
  }
}

.coleta-form {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0 16px;
  flex-wrap: wrap;

  .date-field { width: 200px; }
}

.coleta-resultado {
  border-top: 1px solid #F1F5F9;
  padding-top: 16px;
}

.resultado-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.summary-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 8px 16px;

  &.relevantes {
    background: #ECFDF5;
    border-color: #A7F3D0;
  }

  .summary-val {
    font-size: 22px;
    font-weight: 700;
    color: #0F172A;
    line-height: 1;
  }

  .summary-lbl {
    font-size: 11px;
    color: #64748B;
    margin-top: 2px;
  }
}

.summary-data {
  font-size: 12px;
  color: #94A3B8;
  margin-left: auto;
}

.materias-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.materia-card {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 12px;

  .materia-top {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .tipo-chip {
    font-size: 10px;
    font-weight: 600;
    background: #E0E7FF;
    color: #3730A3;
    border-radius: 4px;
    padding: 2px 6px;
    white-space: nowrap;
  }

  .materia-secao {
    font-size: 10px;
    color: #94A3B8;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .materia-titulo {
    font-size: 12px;
    font-weight: 600;
    color: #0F172A;
    margin: 0 0 4px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .materia-orgao {
    font-size: 11px;
    color: #64748B;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.no-results {
  color: #94A3B8;
  font-size: 13px;
  text-align: center;
  padding: 16px 0;
}

// ── Fonte chip on lead cards ────────────────────────────────────────────
.fonte-chip {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  border-radius: 4px;
  padding: 1px 5px;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.fonte-dodf { background: #FEF3C7; color: #92400E; }
.fonte-pncp { background: #DBEAFE; color: #1E40AF; }
.fonte-dou  { background: #F3E8FF; color: #6B21A8; }
```

- [ ] **Step 5: Full build check**

```bash
npx ng build --configuration development 2>&1 | tail -30
```
Expected: zero errors.

- [ ] **Step 6: Verify in browser**

```bash
npx ng serve
```

Navigate to `/pipeline`. Expected:
- "Coleta DODF" expansion panel visible at the top, open by default
- Date picker shows today's date
- "Coletar" button present
- Kanban board below unchanged
- "Novo Lead" button is gone from the header

- [ ] **Step 7: Commit**

```bash
git add src/app/features/pipeline/ src/app/core/models/edital.model.ts
git commit -m "feat: add DODF coleta panel to Pipeline and fonteOrigem chip on lead cards"
```

---

## Self-Review

**Spec coverage:**
- ✅ DODF coleta panel in Pipeline (date picker + coletar + results grid)
- ✅ DODF keywords CRUD (`/dodf/keywords` — all 5 operations)
- ✅ DODF tipos-abertura CRUD (`/dodf/tipos-abertura` — all 5 operations)
- ✅ New route `/dodf/configuracao`
- ✅ Sidebar "Config. DODF" link
- ✅ `fonteOrigem` chip on kanban cards (all 3 columns)
- ✅ "Novo Lead" button removed from pipeline header
- ✅ Backend UUID requirement documented in Task 1

**Type consistency:**
- `DodfService.coletar()` → `ColetaResultado` ← used as `signal<ColetaResultado | null>` in pipeline ✅
- `DodfService.getKeywords()` → `DodfPage<DodfKeyword>` ← `.content` and `.totalElements` accessed in component ✅
- `KeywordDialogComponent` closes with `{ termo, ativo }` ← matches `createKeyword()` / `updateKeyword()` payload ✅
- `TipoAberturaDialogComponent` closes with `{ valor, ativo }` ← matches `createTipo()` / `updateTipo()` payload ✅
- `DodfKeyword.uuid` used in `updateKeyword(keyword.uuid, ...)` and `deleteKeyword(keyword.uuid)` ✅
- `DodfTipoAbertura.uuid` used in `updateTipo(tipo.uuid, ...)` and `deleteTipo(tipo.uuid)` ✅
