export type StatusProcesso =
  | 'ELABORANDO_PROPOSTA'
  | 'DOCUMENTACAO'
  | 'AGUARDANDO_ABERTURA'
  | 'EM_DISPUTA'
  | 'NEGOCIACAO'
  | 'GANHO'
  | 'PERDIDO';

export interface ProcessoLicitatorio {
  uuid: string;
  leadUuid: string;
  titulo: string;
  orgao: string;
  fonte: string;
  status: StatusProcesso;
  responsavel?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface EditalArquivo {
  uuid: string;
  processoUuid: string;
  versao: number;
  storagePath?: string;
  urlOrigem?: string;
  hashSha256?: string;
  tamanhoBytes?: number;
  pendenteDownload?: boolean;
  baixadoEm?: string;
}

export interface AtualizarStatusProcessoRequest {
  status: StatusProcesso;
}
