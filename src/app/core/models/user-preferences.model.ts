export type FonteBusca = 'DODF' | 'DOU' | 'PNCP';
export type DataBusca = 'DIA_UNICO' | 'PERIODO';

/** Espelha BuscaPrefsDto do backend. `fontesPadrao` ainda não é lido por nenhum fluxo de coleta. */
export interface BuscaPrefsDto {
  fontesPadrao: FonteBusca[];
  dataBuscaPadrao: DataBusca;
  periodoDias: number;
}

/** Espelha NotificaoPrefsDto do backend. `buscaConcluida` ainda não condiciona nenhuma notificação. */
export interface NotificaoPrefsDto {
  novoLead: boolean;
  buscaConcluida: boolean;
  score: number;
}

// Defaults devolvidos pelo GET quando o usuário nunca salvou nada (não persistem sozinhos).
export const DEFAULT_BUSCA_PREFS: BuscaPrefsDto = {
  fontesPadrao: ['PNCP'],
  dataBuscaPadrao: 'DIA_UNICO',
  periodoDias: 7,
};

export const DEFAULT_NOTIFICACAO_PREFS: NotificaoPrefsDto = {
  novoLead: false,
  buscaConcluida: false,
  score: 40,
};
