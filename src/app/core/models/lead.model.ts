export type LeadStatus =
  | 'DESCARTADO'
  | 'NOVO'
  | 'APROVACAO_PRESIDENCIA'
  | 'ESTUDO_VIABILIDADE'
  | 'SEGUNDA_APROVACAO_PRESIDENCIA'
  | 'QUALIFICADO';

export interface Lead {
  uuid: string;
  fonte: string;
  idOrigem: string;
  dataPublicacao: string;
  titulo: string;
  texto: string;
  tipo: string;
  coDemandante: string;
  orgao: string;
  status: LeadStatus;
  detectadoEm: string;
  revisadoEm: string | null;
  revisadoPor: string | null;
  observacao: string | null;
  editalId?: string | null;
}

export interface AtualizarStatusRequest {
  status: LeadStatus;
  revisadoPor: string;
  observacao: string;
}
