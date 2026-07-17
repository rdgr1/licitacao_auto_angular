import { Pipe, PipeTransform } from '@angular/core';

export interface CategoriaBadge {
  label: string;
  color: string;
  hidden: boolean;
}

const MAP: Record<string, { label: string; color: string }> = {
  VIGILÂNCIA: { label: 'Vigilância', color: '#8B5CF6' },
  LIMPEZA: { label: 'Limpeza', color: '#0EA5E9' },
  COPEIRAGEM: { label: 'Copeiragem', color: '#F59E0B' },
  MÃO_DE_OBRA: { label: 'Mão de Obra', color: '#14B8A6' },
  BRIGADA: { label: 'Brigada', color: '#EF4444' },
  DESCARTADO: { label: 'Descartado (IA)', color: '#94A3B8' },
};

@Pipe({
  name: 'leadCategoria',
  standalone: true,
})
export class LeadCategoriaPipe implements PipeTransform {
  transform(categoria: string | null | undefined): CategoriaBadge {
    const entry = categoria ? MAP[categoria] : undefined;
    if (!entry) {
      return { label: '', color: '', hidden: true };
    }
    return { ...entry, hidden: false };
  }
}
