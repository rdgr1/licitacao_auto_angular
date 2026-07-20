export type StatusColetaPncpLead = 'EM_ANDAMENTO' | 'CONCLUIDA' | 'ERRO';

export interface ColetaPncpLeadStatus {
  uuid: string;
  leadId: string;
  status: StatusColetaPncpLead;
  mensagem: string;
  fatiaAtual: number | null;
  totalFatias: number | null;
  totalBrutos: number | null;
  totalRelevantes: number | null;
  salvos: number | null;
  duplicados: number | null;
  createdAt: string;
  lastModified: string;
}
