import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const storageKey = 'licitaflow_theme';

  beforeEach(() => {
    localStorage.removeItem(storageKey);
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
  });

  it('usa o tema salvo no localStorage quando presente', () => {
    localStorage.setItem(storageKey, 'dark');
    const svc = TestBed.inject(ThemeService);
    TestBed.tick();
    expect(svc.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('cai para light quando não há preferência salva nem matchMedia dark', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    const svc = TestBed.inject(ThemeService);
    TestBed.tick();
    expect(svc.theme()).toBe('light');
  });

  it('toggle alterna o tema e persiste', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    const svc = TestBed.inject(ThemeService);
    TestBed.tick();
    svc.toggle();
    TestBed.tick();
    expect(svc.theme()).toBe('dark');
    expect(localStorage.getItem(storageKey)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    svc.toggle();
    TestBed.tick();
    expect(svc.theme()).toBe('light');
    expect(localStorage.getItem(storageKey)).toBe('light');
  });
});
