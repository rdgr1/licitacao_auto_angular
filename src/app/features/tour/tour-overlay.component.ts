import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TourService } from '../../core/services/tour.service';

interface TooltipPos { top: string; left: string; }

@Component({
  selector: 'app-tour-overlay',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    @if (tour.ativo()) {
      <div class="tour-backdrop" (click)="tour.encerrar()"></div>

      @if (tooltipPos()) {
        <div class="tour-tooltip" [style.top]="tooltipPos()!.top" [style.left]="tooltipPos()!.left">
          <div class="tour-header">
            <span class="tour-step-count">{{ tour.stepAtual() + 1 }} / {{ tour.totalSteps }}</span>
            <button class="tour-close" (click)="tour.encerrar()" aria-label="Fechar tour">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="tour-titulo">{{ tour.step()?.titulo }}</div>
          <div class="tour-desc">{{ tour.step()?.descricao }}</div>
          <div class="tour-actions">
            @if (!tour.ehPrimeiro()) {
              <button mat-button class="btn-ant" (click)="tour.anterior()">Anterior</button>
            }
            <button mat-flat-button class="btn-prox" (click)="avancar()">
              {{ tour.ehUltimo() ? 'Concluir' : 'Próximo' }}
            </button>
            <button mat-button class="btn-pular" (click)="tour.encerrar()">Pular</button>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .tour-backdrop {
      position: fixed; inset: 0;
      box-shadow: 0 0 0 9999px rgba(0,0,0,0.55);
      z-index: 1000; pointer-events: all;
    }
    .tour-tooltip {
      position: fixed; z-index: 1001; background: var(--card-bg, #fff); border-radius: 12px;
      padding: 16px 20px; max-width: 300px; min-width: 260px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      pointer-events: all;
    }
    .tour-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
    }
    .tour-step-count { font-size: 11px; font-weight: 700; color: var(--text-muted, #94A3B8); text-transform: uppercase; letter-spacing: .05em; }
    .tour-close {
      background: none; border: none; cursor: pointer; padding: 2px; color: var(--text-muted, #94A3B8);
      display: flex; align-items: center;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .tour-titulo { font-size: 15px; font-weight: 700; color: var(--text-primary, #0D1526); margin-bottom: 6px; }
    .tour-desc { font-size: 13px; color: var(--text-muted, #64748B); line-height: 1.5; margin-bottom: 14px; }
    .tour-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .btn-prox { background: #0D1526; color: #fff; font-size: 13px; font-weight: 600; border-radius: 7px; }
    .btn-ant { font-size: 13px; color: var(--text-muted, #64748B); }
    .btn-pular { font-size: 12px; color: var(--text-muted, #94A3B8); margin-left: auto; }
  `],
})
export class TourOverlayComponent {
  readonly tour = inject(TourService);
  private router = inject(Router);
  tooltipPos = signal<TooltipPos | null>(null);

  constructor() {
    effect(() => {
      if (this.tour.ativo()) {
        const step = this.tour.step();
        if (step?.rota && !this.router.url.startsWith(step.rota)) {
          this.router.navigate([step.rota]).then(() => setTimeout(() => this.posicionarTooltip(), 300));
        } else {
          setTimeout(() => this.posicionarTooltip(), 150);
        }
      }
    });
  }

  posicionarTooltip(): void {
    const step = this.tour.step();
    if (!step) return;
    const el = document.querySelector(step.selector);
    if (!el) { this.tooltipPos.set({ top: '45%', left: '50%' }); return; }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const rect = el.getBoundingClientRect();
    const margin = 12;
    let top: number, left: number;

    switch (step.posicao) {
      case 'bottom': top = rect.bottom + margin; left = rect.left; break;
      case 'top':    top = rect.top - 200 - margin; left = rect.left; break;
      case 'right':  top = rect.top; left = rect.right + margin; break;
      case 'left':   top = rect.top; left = rect.left - 320 - margin; break;
      default:       top = rect.bottom + margin; left = rect.left;
    }

    top  = Math.max(10, Math.min(top,  window.innerHeight - 220));
    left = Math.max(10, Math.min(left, window.innerWidth  - 320));

    this.tooltipPos.set({ top: `${top}px`, left: `${left}px` });
  }

  avancar(): void {
    this.tour.proximo();
  }
}
