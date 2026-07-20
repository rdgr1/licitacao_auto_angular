export type EstadoClassificacaoEdital = 'INTERESSE' | 'REJEITADO';

export enum EditalStatus {
  PROCESSADO = 'PROCESSADO',
  PENDENTE = 'PENDENTE',
  ERRO = 'ERRO',
  ANTECIPADO = 'ANTECIPADO',
  PROCESSANDO = 'PROCESSANDO',
  ARQUIVADO = 'ARQUIVADO',
}

export enum Modalidade {
  PREGAO_ELETRONICO = 'PREGAO_ELETRONICO',
  CONCORRENCIA = 'CONCORRENCIA',
  TOMADA_PRECOS = 'TOMADA_PRECOS',
  CONVITE = 'CONVITE',
  CONCURSO = 'CONCURSO',
  LEILAO = 'LEILAO',
}

export enum CategoriaLead {
  VIGILANCIA = 'VIGILANCIA',
  MAO_DE_OBRA = 'MAO_DE_OBRA',
  LIMPEZA = 'LIMPEZA',
  BRIGADA = 'BRIGADA',
  COPEIRAGEM = 'COPEIRAGEM',
}

export enum TipoRegra {
  KEYWORD_OBJETO = 'KEYWORD_OBJETO',
  KEYWORD_ITEM = 'KEYWORD_ITEM',
  FAIXA_VALOR = 'FAIXA_VALOR',
  PRAZO_MIN_MAX = 'PRAZO_MIN_MAX',
  MODALIDADE_PERMITIDA = 'MODALIDADE_PERMITIDA',
  DESCARTE = 'DESCARTE',
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
  /** Só preenchidos em GET /editais/{numero} e /editais/id/{id} (view Detalhe); ausentes em listas e nulos em editais coletados antes de 2026-07-16. */
  cnpjOrgao?: string;
  numeroCompra?: string;
  anoCompra?: number;
  municipio?: string;
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
  numeroItem: number;
  descricao: string;
  quantidade: number;
  unidadeMedida: string;
  valorUnitarioEstimado: number;
  valorTotal: number;
  materialOuServico?: string;
  materialOuServicoNome?: string;
  criterioJulgamentoNome?: string;
  situacaoCompraItemNome?: string;
  tipoBeneficioNome?: string;
  temResultado?: boolean;
  orcamentoSigiloso?: boolean;
  ncmNbsCodigo?: string;
  ncmNbsDescricao?: string;
  informacaoComplementar?: string;
}

/** Documento PNCP (edital, anexo, minuta, retificação) */
export interface ArquivoEdital {
  sequencialDocumento?: number;
  titulo: string;
  url: string;
  tipoDocumentoDescricao?: string;
  dataPublicacaoPncp?: string;
  descricao?: string;
}

export interface ContratoEdital {
  sequencialContrato?: number;
  numero: string;
  objeto?: string;
  valorInicial?: number;
  dataAssinatura?: string;
  dataVigenciaInicio?: string;
  dataVigenciaFim?: string;
  nomeRazaoSocialFornecedor?: string;
  numeroCnpjFornecedor?: string;
  nomeStatusContrato?: string;
}

export interface AtaRegistroPreco {
  sequencialAta?: number;
  numero: string;
  objeto?: string;
  valorTotal?: number;
  dataAssinatura?: string;
  vigenciaDataInicio?: string;
  vigenciaDataFim?: string;
  nomeRazaoSocialFornecedor?: string;
  numeroCnpjFornecedor?: string;
}

/** Histórico retorna os mesmos documentos PNCP que Arquivos */
export type HistoricoEdital = ArquivoEdital;

export type NotificacaoTipo = 'NOVO_LEAD' | 'ACAO_PIPELINE' | 'BUSCA_EDITAL' | 'SISTEMA';

export interface NotificacaoEvent {
  tipo: NotificacaoTipo | string; // string for backend compatibility
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

/** Notificação persistida (TB_NOTIFICACAO), retornada por GET /notificacoes/lista. */
export interface Notificacao {
  uuid: string;
  tipo: NotificacaoTipo | string;
  titulo: string;
  mensagem?: string;
  destinatario?: string;
  lida: boolean;
  referenciaId?: string;
  referenciaTipo?: string;
  origem?: string;
  createdAt: string;
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
