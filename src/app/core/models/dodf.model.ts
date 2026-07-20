export interface DodfKeyword {
  uuid: string;
  termo: string;
  ativo: boolean;
}

export interface DodfTipoAbertura {
  uuid: string;
  valor: string;
  ativo: boolean;
}

// ── DOU entities ──────────────────────────────────────────────────────────────

export interface DouKeyword {
  uuid: string;
  termo: string;
  ativo: boolean;
}

export interface DouTipoArtigo {
  uuid: string;
  valor: string;
  ativo: boolean;
}

export interface DouRegiao {
  uuid: string;
  termo: string;
  ativo: boolean;
}

// ── Coleta ────────────────────────────────────────────────────────────────────

/**
 * Formato varia por fonte: DODF usa `data`/`totalMaterias`; DOU usa `data`/`totalAtos`;
 * PNCP usa `dataInicial`+`dataFinal`/`totalBrutos` (sem `data` único). `salvos` pode ser
 * maior que `totalRelevantes` — desde 2026-07-16 o PNCP salva todos os editais do período,
 * `totalRelevantes` só conta os classificados como INTERESSE (não é mais igual a `salvos`).
 */
export interface ColetaResultado {
  data?: string;
  dataInicial?: string;
  dataFinal?: string;
  totalMaterias?: number;
  totalAtos?: number;
  totalBrutos?: number;
  totalRelevantes: number;
  salvos: number;
  duplicados: number;
}

export interface DodfPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
