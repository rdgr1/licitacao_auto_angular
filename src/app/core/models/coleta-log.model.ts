export interface ColetaLog {
  id: number;
  fonte: string;
  data: string;        // "YYYY-MM-DD"
  iniciadoEm: string;  // ISO-8601
  encerradoEm: string;
  totalMaterias: number;
  salvos: number;
  duplicados: number;
  erros: number;
}

export interface ColetaResumo {
  totalSessoes: number;
  totalMaterias: number;
  totalSalvos: number;
  totalDuplicados: number;
  totalErros: number;
}
