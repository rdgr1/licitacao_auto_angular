export type StatusBuscaEdital = 'EM_ANDAMENTO' | 'CONCLUIDA' | 'NAO_ENCONTRADO' | 'ERRO';

export interface BuscaEdital {
  uuid: string;
  leadId: string;
  status: StatusBuscaEdital;
  mensagem: string;
  editalId?: string;
  createdAt: string;
  lastModified: string;
  createdBy: string;
}
