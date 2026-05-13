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

export interface ColetaResultado {
  data: string;
  totalMaterias: number;
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
