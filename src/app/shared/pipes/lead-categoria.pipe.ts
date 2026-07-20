import { Pipe, PipeTransform } from '@angular/core';

export interface CategoriaBadge {
  label: string;
  /** @deprecated hex fixo, não respeita dark mode — prefira `cls` com as classes .cat-* */
  color: string;
  cls: string;
  hidden: boolean;
}

const MAP: Record<string, { label: string; color: string; cls: string }> = {
  VIGILÂNCIA: { label: 'Vigilância', color: '#8B5CF6', cls: 'cat-purple' },
  LIMPEZA: { label: 'Limpeza', color: '#0EA5E9', cls: 'cat-blue' },
  COPEIRAGEM: { label: 'Copeiragem', color: '#F59E0B', cls: 'cat-amber' },
  MÃO_DE_OBRA: { label: 'Mão de Obra', color: '#14B8A6', cls: 'cat-teal' },
  BRIGADA: { label: 'Brigada', color: '#EF4444', cls: 'cat-red' },
  DESCARTADO: { label: 'Descartado (IA)', color: '#94A3B8', cls: 'cat-neutral' },
};

@Pipe({
  name: 'leadCategoria',
  standalone: true,
})
export class LeadCategoriaPipe implements PipeTransform {
  transform(categoria: string | null | undefined): CategoriaBadge {
    const entry = categoria ? MAP[categoria] : undefined;
    if (!entry) {
      return { label: '', color: '', cls: '', hidden: true };
    }
    return { ...entry, hidden: false };
  }
}
