import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { pageNormalizeInterceptor } from './page-normalize.interceptor';

describe('pageNormalizeInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([pageNormalizeInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('achata o formato aninhado do Spring Page pro formato plano esperado pelo app', () => {
    let result: any;
    http.get('/leads').subscribe((res) => (result = res));

    httpMock.expectOne('/leads').flush({
      content: [{ uuid: '1' }],
      page: { size: 12, number: 0, totalElements: 874, totalPages: 73 },
    });

    expect(result.totalElements).toBe(874);
    expect(result.totalPages).toBe(73);
    expect(result.number).toBe(0);
    expect(result.size).toBe(12);
    expect(result.first).toBe(true);
    expect(result.last).toBe(false);
    expect(result.content).toEqual([{ uuid: '1' }]);
  });

  it('nao mexe em respostas ja no formato plano', () => {
    let result: any;
    http.get('/leads').subscribe((res) => (result = res));

    const flat = { content: [], totalElements: 0, totalPages: 1, number: 0, size: 12 };
    httpMock.expectOne('/leads').flush(flat);

    expect(result).toEqual(flat);
  });

  it('nao mexe em respostas que nao sao paginas', () => {
    let result: any;
    http.get('/leads/1').subscribe((res) => (result = res));

    const single = { uuid: '1', titulo: 'algo' };
    httpMock.expectOne('/leads/1').flush(single);

    expect(result).toEqual(single);
  });
});
