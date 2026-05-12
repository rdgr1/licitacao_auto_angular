export type LeadStatus = 'NOVO' | 'EM_ANALISE' | 'APROVADO' | 'REJEITADO';

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
}

export interface AtualizarStatusRequest {
  status: LeadStatus;
  revisadoPor: string;
  observacao?: string;
}
