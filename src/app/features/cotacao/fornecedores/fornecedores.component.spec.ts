import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { FornecedoresComponent } from './fornecedores.component';
import { CotacaoService } from '../../../core/services/cotacao.service';
import { ToastService } from '../../../core/services/toast.service';

describe('FornecedoresComponent — save resiliente a fechamento de dialog', () => {
  let fixture: ComponentFixture<FornecedoresComponent>;
  let component: FornecedoresComponent;
  let cotacaoService: {
    listarFornecedores: ReturnType<typeof vi.fn>;
    criarFornecedor: ReturnType<typeof vi.fn>;
    atualizarFornecedor: ReturnType<typeof vi.fn>;
    deletarFornecedor: ReturnType<typeof vi.fn>;
  };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    cotacaoService = {
      listarFornecedores: vi.fn(),
      criarFornecedor: vi.fn(),
      atualizarFornecedor: vi.fn(),
      deletarFornecedor: vi.fn(),
    };
    cotacaoService.listarFornecedores.mockReturnValue(
      of({
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 25,
        first: true,
        last: true,
        empty: true,
      }),
    );
    toast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
    dialog = { open: vi.fn() };

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
    fixture.detectChanges(); // dispara ngOnInit → load() inicial
  });

  it('deve criar o fornecedor e recarregar a lista mesmo se o dialog já tiver fechado', () => {
    const afterClosedSubject = new Subject<any>();
    dialog.open.mockReturnValue({ afterClosed: () => afterClosedSubject.asObservable() });

    const criarSubject = new Subject<void>();
    cotacaoService.criarFornecedor.mockReturnValue(criarSubject.asObservable());

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
    dialog.open.mockReturnValue({ afterClosed: () => afterClosedSubject.asObservable() });

    const erroSubject = new Subject<void>();
    cotacaoService.criarFornecedor.mockReturnValue(erroSubject.asObservable());

    component.openForm(null);
    afterClosedSubject.next({ nome: 'X', email: 'x@y.com' });
    afterClosedSubject.complete();
    erroSubject.error(new Error('boom'));

    expect(toast.error).toHaveBeenCalledWith('Erro ao salvar fornecedor');
  });
});
