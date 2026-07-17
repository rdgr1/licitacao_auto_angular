import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { vi } from 'vitest';
import { OperationTrackerService } from './operation-tracker.service';
import { ToastService } from './toast.service';

describe('OperationTrackerService', () => {
  let svc: OperationTrackerService;
  let toast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    toast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
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
    const onSuccess = vi.fn();
    svc.run('save-x', of('resultado'), { successMessage: 'Salvo!', onSuccess });

    expect(onSuccess).toHaveBeenCalledWith('resultado');
    expect(toast.success).toHaveBeenCalledWith('Salvo!');
  });

  it('não deve chamar toast de sucesso quando successMessage não for fornecido', () => {
    svc.run('save-x', of('resultado'));
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('deve desligar loading e mostrar toast de erro em caso de falha', () => {
    const onError = vi.fn();
    svc.run(
      'save-x',
      throwError(() => new Error('boom')),
      {
        errorMessage: 'Erro ao salvar',
        onError,
      },
    );

    expect(svc.isLoading('save-x')()).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Erro ao salvar');
    expect(onError).toHaveBeenCalled();
  });

  it('deve resolver errorMessage como função do erro', () => {
    svc.run(
      'save-x',
      throwError(() => ({ status: 404 })),
      {
        errorMessage: (err: any) => (err.status === 404 ? 'Não encontrado' : 'Erro genérico'),
      },
    );
    expect(toast.error).toHaveBeenCalledWith('Não encontrado');
  });

  it('deve suprimir o toast de erro quando errorMessage for null', () => {
    svc.run(
      'save-x',
      throwError(() => new Error('boom')),
      { errorMessage: null },
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('deve usar uma mensagem de erro genérica quando nenhuma for fornecida', () => {
    svc.run(
      'save-x',
      throwError(() => new Error('boom')),
    );
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
    expect(() =>
      svc.run(
        'y',
        throwError(() => new Error('boom')),
      ),
    ).not.toThrow();
  });

  it('deve manter loading true enquanto houver uma chamada concorrente com a mesma key em voo', () => {
    const first = new Subject<void>();
    const second = new Subject<void>();

    svc.run('save-x', first.asObservable());
    svc.run('save-x', second.asObservable());
    expect(svc.isLoading('save-x')()).toBe(true);

    first.next();
    first.complete();
    expect(svc.isLoading('save-x')()).toBe(true); // a segunda ainda está em voo

    second.next();
    second.complete();
    expect(svc.isLoading('save-x')()).toBe(false);
  });
});
