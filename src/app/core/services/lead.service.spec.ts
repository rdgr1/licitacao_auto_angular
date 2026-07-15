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
