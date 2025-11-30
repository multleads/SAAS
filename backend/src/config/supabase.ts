// backend/src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Tipos TypeScript para as tabelas
export interface Admin {
  id: number;
  email: string;
  senha: string;
  nome: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Empresa {
  id: number;
  nome: string;
  email: string;
  senha: string;
  cnpj: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  logo_url: string;
  banner_url: string;
  descricao: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Produto {
  id: number;
  empresa_id: number;
  nome: string;
  descricao: string;
  logo_url: string;
  banner_url: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Cliente {
  id: number;
  produto_id: number;
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  cnpj_cpf: string;
  estado: string;
  cidade: string;
  endereco: string;
  numero: string;
  complemento: string;
  cep: string;
  whatsapp: string;
  termos_aceitos: boolean;
  verificado: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Verificacao {
  id: number;
  cliente_id: number;
  tipo: 'whatsapp' | 'email';
  codigo: string;
  tentativas: number;
  max_tentativas: number;
  expira_em: string;
  verificado: boolean;
  criado_em: string;
}
