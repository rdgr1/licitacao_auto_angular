import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TourService } from './tour.service';

describe('TourService', () => {
  let svc: TourService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    svc = TestBed.inject(TourService);
    localStorage.removeItem('lf_tour_done');
  });

  it('deve iniciar com tour inativo', () => {
    expect(svc.ativo()).toBe(false);
  });

  it('deve iniciar o tour e ir para o step 0', () => {
    svc.iniciar();
    expect(svc.ativo()).toBe(true);
    expect(svc.stepAtual()).toBe(0);
  });

  it('deve avançar para o próximo step', () => {
    svc.iniciar();
    svc.proximo();
    expect(svc.stepAtual()).toBe(1);
  });

  it('deve voltar para o step anterior', () => {
    svc.iniciar();
    svc.proximo();
    svc.anterior();
    expect(svc.stepAtual()).toBe(0);
  });

  it('deve encerrar o tour e gravar no localStorage', () => {
    svc.iniciar();
    svc.encerrar();
    expect(svc.ativo()).toBe(false);
    expect(localStorage.getItem('lf_tour_done')).toBe('true');
  });

  it('deve retornar o step atual com titulo', () => {
    svc.iniciar();
    expect(svc.step()).toBeDefined();
    expect(svc.step()?.titulo).toBeTruthy();
  });

  it('deveMostrar retorna false se tourCompleted é true', () => {
    expect(svc.deveMostrar(true)).toBe(false);
  });

  it('deveMostrar retorna false se lf_tour_done está no localStorage', () => {
    localStorage.setItem('lf_tour_done', 'true');
    expect(svc.deveMostrar(false)).toBe(false);
  });

  it('deveMostrar retorna true quando tourCompleted=false e sem localStorage', () => {
    expect(svc.deveMostrar(false)).toBe(true);
  });
});
