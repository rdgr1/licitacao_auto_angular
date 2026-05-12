export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  sources?: ChatSource[];
  isLoading?: boolean;
}

export interface ChatSource {
  title: string;
  url?: string;
  relevance?: number;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  sources?: ChatSource[];
}

export interface ImpugnacaoRequest {
  editalNumero: string;
  editalId?: number;
  motivosAdicionais?: string;
}

export interface EditalImpugnacao {
  id: number;
  numero: string;
  objeto: string;
  orgao: string;
  dataAbertura: string;
  valorEstimado: number;
  modalidade: string;
  prazoImpugnacao: string;
}

export interface ImpugnacaoResponse {
  texto: string;
  editalNumero: string;
  orgao: string;
  prazo: string;
  fundamentos: string[];
  irregularidades: string[];
}
