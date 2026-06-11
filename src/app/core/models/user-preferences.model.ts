export interface UserPreferences {
  notifNovoLead: boolean;
  notifBuscaConcluida: boolean;
  notifScoreMinimo: number;
  buscaFontesDefault: string[];
  buscaModoDataDefault: 'single' | 'range';
  buscaPeriodoDias: number;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  notifNovoLead: true,
  notifBuscaConcluida: true,
  notifScoreMinimo: 40,
  buscaFontesDefault: ['DODF', 'DOU'],
  buscaModoDataDefault: 'single',
  buscaPeriodoDias: 7,
};
