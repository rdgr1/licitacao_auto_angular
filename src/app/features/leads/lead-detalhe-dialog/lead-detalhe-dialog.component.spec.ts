import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { LeadDetalheDialogComponent } from './lead-detalhe-dialog.component';
import { LeadService } from '../../../core/services/lead.service';
import { EditaisService } from '../../../core/services/editais.service';
import { ToastService } from '../../../core/services/toast.service';
import { BuscaEdital } from '../../../core/models/busca-edital.model';
import { EditalResponse } from '../../../core/models/edital.model';

// Nota: este projeto roda Angular sem zone.js (não é dependência do projeto —
// ver package.json), então `fakeAsync`/`tick` não funcionam aqui ("zone-testing.js
// is needed for the fakeAsync() test helper but could not be found"). Usamos os
// fake timers nativos do Vitest para controlar o `interval(2000)` do polling.
describe('LeadDetalheDialogComponent — busca de edital assíncrona', () => {
  let fixture: ComponentFixture<LeadDetalheDialogComponent>;
  let component: LeadDetalheDialogComponent;
  let leadService: {
    buscarEdital: ReturnType<typeof vi.fn>;
    statusBuscaEdital: ReturnType<typeof vi.fn>;
    atualizarStatus: ReturnType<typeof vi.fn>;
  };
  let editaisService: { getById: ReturnType<typeof vi.fn> };

  const leadMock = { uuid: 'lead-1', status: 'NOVO', fonte: 'PNCP' } as any;

  beforeEach(() => {
    vi.useFakeTimers();

    leadService = {
      buscarEdital: vi.fn(),
      statusBuscaEdital: vi.fn(),
      atualizarStatus: vi.fn(),
    };
    editaisService = { getById: vi.fn() };

    TestBed.configureTestingModule({
      imports: [LeadDetalheDialogComponent],
      providers: [
        { provide: LeadService, useValue: leadService },
        { provide: EditaisService, useValue: editaisService },
        {
          provide: ToastService,
          useValue: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
        },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: leadMock },
      ],
    });

    fixture = TestBed.createComponent(LeadDetalheDialogComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve pollar o status até CONCLUIDA e então buscar o Edital completo', () => {
    const registroEmAndamento: BuscaEdital = {
      uuid: 'busca-1',
      leadId: 'lead-1',
      status: 'EM_ANDAMENTO',
      mensagem: '',
      createdAt: '',
      lastModified: '',
      createdBy: '',
    };
    const registroConcluido: BuscaEdital = {
      ...registroEmAndamento,
      status: 'CONCLUIDA',
      editalId: 'edital-9',
    };
    const editalMock: EditalResponse = {
      id: 'edital-9',
      numero: '1/2026',
      objeto: 'x',
      modalidade: 'PREGAO_ELETRONICO' as any,
      valorEstimado: 100,
      dataAbertura: '2026-08-01',
      orgaoOrigem: 'org',
      status: 'PROCESSADO' as any,
      sourceUrl: '',
      createdAt: '',
      updatedAt: '',
      quantidadeExigencias: 0,
    };

    leadService.buscarEdital.mockReturnValue(of(registroEmAndamento));
    leadService.statusBuscaEdital
      .mockReturnValueOnce(of(registroEmAndamento))
      .mockReturnValueOnce(of(registroConcluido));
    editaisService.getById.mockReturnValue(of(editalMock));

    component.buscarEdital();
    expect(component.operationTracker.isLoading(`busca-edital-${leadMock.uuid}`)()).toBe(true);

    vi.advanceTimersByTime(2000); // primeiro poll — ainda EM_ANDAMENTO
    vi.advanceTimersByTime(2000); // segundo poll — CONCLUIDA

    expect(editaisService.getById).toHaveBeenCalledWith('edital-9');
    expect(component.edital()).toEqual(editalMock);
    expect(component.operationTracker.isLoading(`busca-edital-${leadMock.uuid}`)()).toBe(false);
  });

  it('deve mostrar mensagem de não encontrado quando o status for NAO_ENCONTRADO', () => {
    const registro: BuscaEdital = {
      uuid: 'busca-1',
      leadId: 'lead-1',
      status: 'NAO_ENCONTRADO',
      mensagem: '',
      createdAt: '',
      lastModified: '',
      createdBy: '',
    };
    leadService.buscarEdital.mockReturnValue(of(registro));

    component.buscarEdital();

    expect(component.editalError()).toBe('Nenhum edital encontrado no PNCP para este lead.');
    expect(editaisService.getById).not.toHaveBeenCalled();
  });
});
