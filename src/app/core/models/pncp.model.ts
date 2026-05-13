export interface PncpModalidade {
  uuid: string;
  codigo: number;
  nome: string;
  ativo: boolean;
}

export interface PncpUf {
  uuid: string;
  sigla: string;
  ativo: boolean;
}

// Catálogo oficial de modalidades PNCP (para o select no dialog)
export const PNCP_MODALIDADES_CATALOGO = [
  { codigo: 1,  nome: 'Leilão — Eletrônico' },
  { codigo: 2,  nome: 'Diálogo Competitivo' },
  { codigo: 3,  nome: 'Concurso' },
  { codigo: 4,  nome: 'Concorrência — Eletrônica' },
  { codigo: 5,  nome: 'Concorrência — Presencial' },
  { codigo: 6,  nome: 'Pregão — Eletrônico' },
  { codigo: 7,  nome: 'Pregão — Presencial' },
  { codigo: 8,  nome: 'Dispensa de Licitação' },
  { codigo: 9,  nome: 'Inexigibilidade' },
  { codigo: 10, nome: 'Manifestação de Interesse' },
  { codigo: 11, nome: 'Pré-qualificação' },
  { codigo: 12, nome: 'Credenciamento' },
  { codigo: 13, nome: 'Leilão — Presencial' },
] as const;

export const SIGLAS_UF = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA',
  'MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN',
  'RO','RR','RS','SC','SE','SP','TO',
] as const;
