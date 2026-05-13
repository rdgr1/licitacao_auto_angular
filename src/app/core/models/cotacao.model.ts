export interface Fornecedor {
  id?: string;
  nome: string;
  cnpj?: string;
  email: string;
  whatsapp?: string;
  categorias?: string;
  ativo: boolean;
  criadoEm?: string;
}

export interface CatalogoItem {
  id?: string;
  nome: string;
  descricao?: string;
  unidade: string;
  categoria?: string;
  ativo: boolean;
  criadoEm?: string;
}

export const CATEGORIAS_SERVICO = [
  { key: 'VIGILANCIA',  label: 'Vigilância',  icon: 'security' },
  { key: 'LIMPEZA',     label: 'Limpeza',     icon: 'cleaning_services' },
  { key: 'MAO_DE_OBRA', label: 'Mão de Obra', icon: 'groups' },
  { key: 'BRIGADA',     label: 'Brigada',     icon: 'local_fire_department' },
  { key: 'COPEIRAGEM',  label: 'Copeiragem',  icon: 'coffee' },
] as const;

export type CategoriaServico = typeof CATEGORIAS_SERVICO[number]['key'];

export const UNIDADES_MEDIDA = ['UN', 'HR', 'M²', 'M', 'KG', 'L', 'MÊS', 'DIA', 'CX', 'PC', 'SC'] as const;
