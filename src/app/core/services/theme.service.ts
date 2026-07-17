import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'licitaflow_theme';
  readonly theme = signal<Theme>(this.readInitial());

  constructor() {
    effect(() => {
      const value = this.theme();
      document.documentElement.setAttribute('data-theme', value);
      localStorage.setItem(this.storageKey, value);
    });
  }

  toggle(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private readInitial(): Theme {
    const saved = localStorage.getItem(this.storageKey);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
