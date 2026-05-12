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
