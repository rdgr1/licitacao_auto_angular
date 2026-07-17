import { TestBed } from '@angular/core/testing';
import { ColetaAndamentoService } from './coleta-andamento.service';

describe('ColetaAndamentoService', () => {
  let svc: ColetaAndamentoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ColetaAndamentoService);
  });

  it('deve iniciar com estado vazio', () => {
    expect(svc.ativa()).toBe(false);
    expect(svc.fontes()).toEqual([]);
  });

  it('deve iniciar coleta e criar entradas por fonte', () => {
    svc.iniciarColeta(['DODF', 'DOU']);
    expect(svc.ativa()).toBe(true);
    expect(svc.fontes().length).toBe(2);
    expect(svc.fontes()[0].fonte).toBe('DODF');
    expect(svc.fontes()[0].status).toBe('pending');
  });

  it('deve marcar fonte como running ao avançar etapa', () => {
    svc.iniciarColeta(['DODF']);
    svc.avancarEtapa('DODF', 1, 3, '06/06/26');
    const f = svc.fontes().find((f) => f.fonte === 'DODF')!;
    expect(f.status).toBe('running');
    expect(f.stepAtual).toBe(1);
    expect(f.totalSteps).toBe(3);
  });

  it('deve marcar fonte como done ao concluir', () => {
    svc.iniciarColeta(['DODF']);
    svc.concluirFonte('DODF', 12, 47, 150);
    const f = svc.fontes().find((f) => f.fonte === 'DODF')!;
    expect(f.status).toBe('done');
    expect(f.salvos).toBe(12);
  });

  it('deve marcar fonte como error', () => {
    svc.iniciarColeta(['DOU']);
    svc.erroFonte('DOU');
    expect(svc.fontes()[0].status).toBe('error');
  });

  it('deve encerrar coleta quando todas as fontes concluírem', () => {
    svc.iniciarColeta(['DODF', 'DOU']);
    svc.concluirFonte('DODF', 5, 20, 100);
    expect(svc.ativa()).toBe(true);
    svc.concluirFonte('DOU', 3, 10, 80);
    expect(svc.ativa()).toBe(false);
  });

  it('deve calcular totalSalvos corretamente', () => {
    svc.iniciarColeta(['DODF', 'DOU']);
    svc.concluirFonte('DODF', 5, 20, 100);
    svc.concluirFonte('DOU', 3, 10, 80);
    expect(svc.totalSalvos()).toBe(8);
  });

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
});
