import {
  Component, Input, OnDestroy,
  afterNextRender, ElementRef, inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type BgVariant = 'aurora' | 'grid' | 'network' | 'flow' | 'none';

@Component({
  selector: 'app-bg-layer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-layer" [class]="variant" [style.opacity]="opacity" aria-hidden="true">

      @if (variant === 'aurora') {
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="blob b3"></div>
      }

      @if (variant === 'grid') {
        <div class="beam h"></div>
        <div class="beam h"></div>
        <div class="beam h"></div>
        <div class="beam v"></div>
        <div class="beam v"></div>
        <div class="beam v"></div>
        <div class="pulse"></div>
        <div class="pulse"></div>
        <div class="pulse"></div>
      }

      @if (variant === 'network' || variant === 'flow') {
        <canvas class="bg-canvas"></canvas>
      }

    </div>
  `,
  styleUrl: './background-layer.component.scss',
})
export class BackgroundLayerComponent implements OnDestroy {
  @Input() variant: BgVariant = 'none';
  @Input() opacity = 1;

  private el = inject(ElementRef);
  private raf = 0;
  private reduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false } as MediaQueryList;

  constructor() {
    afterNextRender(() => {
      const canvas = this.el.nativeElement.querySelector('.bg-canvas') as HTMLCanvasElement | null;
      if (!canvas) return;
      if (this.variant === 'network') this.runNetwork(canvas);
      if (this.variant === 'flow')    this.runFlow(canvas);
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
  }

  private runNetwork(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const N = window.innerWidth < 768 ? 45 : 85;
    const LINK = 150;
    let w = 0, h = 0;
    let mouse = { x: -9999, y: -9999 };

    const onMouse = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener('pointermove', onMouse);

    const nodes = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - .5) * .0006,
      vy: (Math.random() - .5) * .0006,
      r: Math.random() * 1.6 + .8,
      gold: Math.random() < .08,
    }));

    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const frame = () => {
      if (this.reduced.matches) { ctx.clearRect(0, 0, w, h); return; }
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;
      }
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = (a.x - b.x) * w, dy = (a.y - b.y) * h;
          const d = Math.hypot(dx, dy);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(56,189,248,${(1 - d / LINK) * .35})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x * w, a.y * h);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        let px = n.x * w, py = n.y * h;
        const dm = Math.hypot(px - mouse.x, py - mouse.y);
        if (dm < 120) {
          const f = (120 - dm) / 120 * 14;
          px += (px - mouse.x) / (dm || 1) * f;
          py += (py - mouse.y) / (dm || 1) * f;
        }
        ctx.fillStyle = n.gold ? 'rgba(240,180,41,.95)' : 'rgba(45,212,191,.8)';
        ctx.shadowColor = n.gold ? 'rgba(240,180,41,.8)' : 'rgba(45,212,191,.5)';
        ctx.shadowBlur = n.gold ? 10 : 5;
        ctx.beginPath();
        ctx.arc(px, py, n.gold ? n.r + 1 : n.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  private runFlow(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let w = 0, h = 0, t = 0;
    const waves = [
      { amp: 46, len: .006, speed: .55, y: .62, color: 'rgba(99,102,241,.28)',  lw: 1.5 },
      { amp: 34, len: .009, speed: .8,  y: .68, color: 'rgba(56,189,248,.30)',  lw: 1.5 },
      { amp: 26, len: .013, speed: 1.15,y: .74, color: 'rgba(45,212,191,.35)',  lw: 2   },
      { amp: 60, len: .004, speed: .35, y: .56, color: 'rgba(240,180,41,.14)',  lw: 1   },
    ];
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    const frame = () => {
      if (!this.reduced.matches) t += 1 / 60;
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w * .5, -h * .2, 0, w * .5, -h * .2, h);
      g.addColorStop(0, 'rgba(56,189,248,.10)');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      for (const wv of waves) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const y = h * wv.y
            + Math.sin(x * wv.len + t * wv.speed) * wv.amp
            + Math.sin(x * wv.len * 2.7 + t * wv.speed * 1.6) * wv.amp * .35;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = wv.color; ctx.lineWidth = wv.lw; ctx.stroke();
      }
      if (!this.reduced.matches) this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }
}
