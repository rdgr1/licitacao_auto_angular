import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface TourStep {
  selector: string;
  titulo: string;
  descricao: string;
  posicao: 'top' | 'bottom' | 'right' | 'left';
  rota?: string;
}

const STEPS: TourStep[] = [
  {
    selector: '.coleta-panel',
    titulo: 'Disparar uma busca',
    descricao: 'Selecione as fontes (DODF, DOU) e uma data ou período. Clique em "Disparar Busca" para coletar leads automaticamente.',
    posicao: 'right',
    rota: '/leads',
  },
  {
    selector: '.leads-grid',
    titulo: 'Lista de Leads',
    descricao: 'Cada lead é uma oportunidade de licitação identificada automaticamente. Clique num lead para ver detalhes e avaliar se vale a pena.',
    posicao: 'top',
    rota: '/leads',
  },
  {
    selector: '.pipeline-shell',
    titulo: 'Pipeline',
    descricao: 'Acompanhe o ciclo de vida de cada oportunidade — desde a avaliação inicial até o processo licitatório completo.',
    posicao: 'top',
    rota: '/pipeline',
  },
  {
    selector: '.editais-shell',
    titulo: 'Editais',
    descricao: 'Acesse os editais completos das licitações monitoradas. Filtre por órgão, valor e status.',
    posicao: 'top',
    rota: '/editais',
  },
  {
    selector: '.notif-btn',
    titulo: 'Notificações',
    descricao: 'Você é avisado em tempo real quando novos leads são encontrados. O sino mostra quantos há para revisar.',
    posicao: 'bottom',
  },
  {
    selector: '.header-avatar',
    titulo: 'Configurações',
    descricao: 'Clique no seu avatar para acessar configurações, gerenciar fontes de busca e preferências de notificação.',
    posicao: 'bottom',
  },
];

@Injectable({ providedIn: 'root' })
export class TourService {
  private http = inject(HttpClient);

  private _ativo = signal(false);
  private _step = signal(0);

  readonly ativo = this._ativo.asReadonly();
  readonly stepAtual = this._step.asReadonly();
  readonly step = computed(() => STEPS[this._step()] ?? null);
  readonly totalSteps = STEPS.length;
  readonly ehUltimo = computed(() => this._step() === STEPS.length - 1);
  readonly ehPrimeiro = computed(() => this._step() === 0);

  iniciar(): void {
    this._step.set(0);
    this._ativo.set(true);
  }

  proximo(): void {
    if (this._step() < STEPS.length - 1) {
      this._step.update(s => s + 1);
    } else {
      this.encerrar();
    }
  }

  anterior(): void {
    if (this._step() > 0) this._step.update(s => s - 1);
  }

  encerrar(): void {
    this._ativo.set(false);
    localStorage.setItem('lf_tour_done', 'true');
    this.http.patch(`${environment.apiUrl}/users/me`, { tourCompleted: true }).subscribe({ error: () => {} });
  }

  deveMostrar(tourCompleted: boolean): boolean {
    return !tourCompleted && localStorage.getItem('lf_tour_done') !== 'true';
  }
}
