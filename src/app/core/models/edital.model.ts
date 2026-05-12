export enum EditalStatus {
  PROCESSADO = 'PROCESSADO',
  PENDENTE = 'PENDENTE',
  ERRO = 'ERRO',
  ANTECIPADO = 'ANTECIPADO',
  PROCESSANDO = 'PROCESSANDO',
  ARQUIVADO = 'ARQUIVADO'
}

export enum Modalidade {
  PREGAO_ELETRONICO = 'PREGAO_ELETRONICO',
  CONCORRENCIA = 'CONCORRENCIA',
  TOMADA_PRECOS = 'TOMADA_PRECOS',
  CONVITE = 'CONVITE',
  CONCURSO = 'CONCURSO',
  LEILAO = 'LEILAO'
}

export enum CategoriaLead {
  VIGILANCIA = 'VIGILANCIA',
  MAO_DE_OBRA = 'MAO_DE_OBRA',
  LIMPEZA = 'LIMPEZA',
  BRIGADA = 'BRIGADA',
  COPEIRAGEM = 'COPEIRAGEM'
}

export enum TipoRegra {
  KEYWORD_OBJETO = 'KEYWORD_OBJETO',
  KEYWORD_ITEM = 'KEYWORD_ITEM',
  FAIXA_VALOR = 'FAIXA_VALOR',
  PRAZO_MIN_MAX = 'PRAZO_MIN_MAX',
  MODALIDADE_PERMITIDA = 'MODALIDADE_PERMITIDA',
  DESCARTE = 'DESCARTE'
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface EditalResponse {
  id: string;
  numero: string;
  objeto: string;
  modalidade: Modalidade;
  valorEstimado: number;
  dataAbertura: string;
  orgaoOrigem: string;
  status: EditalStatus;
  errorMessage?: string;
  pdfUrl?: string;
  sourceUrl: string;
  createdAt: string;
  updatedAt: string;
  quantidadeExigencias: number;
}

export interface LeadResponse {
  id: string;
  numero: string;
  objeto: string;
  modalidade: string;
  valorEstimado: number;
  dataAbertura: string;
  orgaoOrigem: string;
  sourceUrl: string;
  leadScore: number;
  leadCategoriaPrincipal: string;
  leadCategorias: string;
  createdAt: string;
  viabilidadeScore?: number;
  viabilidadeRazao?: string;
  fonteOrigem?: string;
  status?: string;
}

export interface EstatisticasDTO {
  totalEditais: number;
  processados: number;
  pendentes: number;
  erros: number;
  valorTotalEstimado: number;
  ultimaExecucao?: string;
  proximaExecucao?: string;
}

export interface LeadParams {
  scoreMinimo?: number;
  categoria?: string;
  uf?: string;
}

export interface RegraAnalise {
  id: number;
  tipo: TipoRegra;
  nome: string;
  descricao?: string;
  valorRegra: string;
  peso: number;
  categoria?: CategoriaLead | null;
  ativa: boolean;
  createdAt?: string;
}

export interface ItemEdital {
  id: number;
  numeroItem: number;
  descricao: string;
  quantidade: number;
  unidadeMedida: string;
  valorUnitarioEstimado: number;
  valorTotal: number;
}

export interface NotificacaoEvent {
  tipo: string;
  timestamp: string;
  editalId: number;
  numero: string;
  objeto: string;
  orgao?: string;
  valorEstimado?: number;
  leadScore: number;
  categoria: string;
  urlPncp?: string;
}

export interface ProcessarResult {
  running: boolean;
  success?: boolean;
  total?: number;
  processados?: number;
  erros?: number;
  message?: string;
  scrapersExecutados?: number;
  mensagensErro?: string[];
}
