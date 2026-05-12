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

export interface Materia {
  coDemandante: string;
  secao: string;
  poder: string[];
  tipo: string;
  coMateria: string;
  titulo: string;
  texto: string;
  slug: string;
}

export interface ColetaResultado {
  data: string;
  totalMaterias: number;
  totalRelevantes: number;
  relevantes: Materia[];
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
