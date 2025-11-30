// backend/src/services/SupabaseService.ts
import { supabase, Admin, Empresa, Produto, Cliente, Verificacao } from '../config/supabase';

export class SupabaseService {
  // ============================================
  // ADMIN OPERATIONS
  // ============================================

  static async loginAdmin(email: string, senha: string) {
    const { data, error } = await supabase
      .from('admin')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      throw new Error('Admin não encontrado');
    }

    // Validar senha (use bcryptjs em produção)
    // const senhaValida = await bcrypt.compare(senha, data.senha);
    // if (!senhaValida) throw new Error('Senha inválida');

    return data;
  }

  static async criarAdmin(admin: Omit<Admin, 'id' | 'criado_em' | 'atualizado_em'>) {
    const { data, error } = await supabase
      .from('admin')
      .insert([admin])
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar admin: ${error.message}`);
    return data;
  }

  // ============================================
  // EMPRESA OPERATIONS
  // ============================================

  static async loginEmpresa(email: string, senha: string) {
    const { data, error } = await supabase
      .from('empresa')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      throw new Error('Empresa não encontrada');
    }

    // Validar senha
    // const senhaValida = await bcrypt.compare(senha, data.senha);
    // if (!senhaValida) throw new Error('Senha inválida');

    return data;
  }

  static async listarEmpresas(ativo?: boolean) {
    let query = supabase.from('empresa').select('*');

    if (ativo !== undefined) {
      query = query.eq('ativo', ativo);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Erro ao listar empresas: ${error.message}`);
    return data;
  }

  static async criarEmpresa(empresa: Omit<Empresa, 'id' | 'criado_em' | 'atualizado_em'>) {
    const { data, error } = await supabase
      .from('empresa')
      .insert([empresa])
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar empresa: ${error.message}`);
    return data;
  }

  static async obterEmpresa(id: number) {
    const { data, error } = await supabase
      .from('empresa')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Erro ao obter empresa: ${error.message}`);
    return data;
  }

  static async editarEmpresa(id: number, updates: Partial<Empresa>) {
    const { data, error } = await supabase
      .from('empresa')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Erro ao editar empresa: ${error.message}`);
    return data;
  }

  static async deletarEmpresa(id: number) {
    const { error } = await supabase
      .from('empresa')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Erro ao deletar empresa: ${error.message}`);
  }

  // ============================================
  // PRODUTO OPERATIONS
  // ============================================

  static async listarProdutos(empresaId: number) {
    const { data, error } = await supabase
      .from('produto')
      .select('*')
      .eq('empresa_id', empresaId);

    if (error) throw new Error(`Erro ao listar produtos: ${error.message}`);
    return data;
  }

  static async criarProduto(produto: Omit<Produto, 'id' | 'criado_em' | 'atualizado_em'>) {
    const { data, error } = await supabase
      .from('produto')
      .insert([produto])
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar produto: ${error.message}`);
    return data;
  }

  static async obterProduto(id: number) {
    const { data, error } = await supabase
      .from('produto')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Erro ao obter produto: ${error.message}`);
    return data;
  }

  static async editarProduto(id: number, updates: Partial<Produto>) {
    const { data, error } = await supabase
      .from('produto')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Erro ao editar produto: ${error.message}`);
    return data;
  }

  static async deletarProduto(id: number) {
    const { error } = await supabase
      .from('produto')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Erro ao deletar produto: ${error.message}`);
  }

  // ============================================
  // CLIENTE OPERATIONS
  // ============================================

  static async listarClientes(filtros?: { produtoId?: number; verificado?: boolean }) {
    let query = supabase.from('cliente').select('*');

    if (filtros?.produtoId) {
      query = query.eq('produto_id', filtros.produtoId);
    }

    if (filtros?.verificado !== undefined) {
      query = query.eq('verificado', filtros.verificado);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Erro ao listar clientes: ${error.message}`);
    return data;
  }

  static async criarCliente(cliente: Omit<Cliente, 'id' | 'criado_em' | 'atualizado_em'>) {
    const { data, error } = await supabase
      .from('cliente')
      .insert([cliente])
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar cliente: ${error.message}`);
    return data;
  }

  static async obterCliente(id: number) {
    const { data, error } = await supabase
      .from('cliente')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Erro ao obter cliente: ${error.message}`);
    return data;
  }

  static async editarCliente(id: number, updates: Partial<Cliente>) {
    const { data, error } = await supabase
      .from('cliente')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Erro ao editar cliente: ${error.message}`);
    return data;
  }

  static async deletarCliente(id: number) {
    const { error } = await supabase
      .from('cliente')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Erro ao deletar cliente: ${error.message}`);
  }

  // ============================================
  // VERIFICACAO OPERATIONS
  // ============================================

  static async criarVerificacao(verificacao: Omit<Verificacao, 'id' | 'criado_em'>) {
    const { data, error } = await supabase
      .from('verificacao')
      .insert([verificacao])
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar verificação: ${error.message}`);
    return data;
  }

  static async obterVerificacao(clienteId: number, tipo: string) {
    const { data, error } = await supabase
      .from('verificacao')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('tipo', tipo)
      .order('criado_em', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  }

  static async validarCodigo(clienteId: number, codigo: string) {
    const { data, error } = await supabase
      .from('verificacao')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('codigo', codigo)
      .eq('verificado', false)
      .gt('expira_em', new Date().toISOString())
      .single();

    if (error) {
      throw new Error('Código inválido ou expirado');
    }

    // Marcar como verificado
    await supabase
      .from('verificacao')
      .update({ verificado: true })
      .eq('id', data.id);

    // Atualizar cliente como verificado
    await this.editarCliente(clienteId, { verificado: true });

    return data;
  }

  // ============================================
  // STORAGE OPERATIONS (arquivos)
  // ============================================

  static async uploadArquivo(bucket: string, caminho: string, arquivo: Buffer) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(caminho, arquivo, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw new Error(`Erro ao upload: ${error.message}`);
    return data;
  }

  static async obterURLPublica(bucket: string, caminho: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(caminho);

    return data.publicUrl;
  }

  static async deletarArquivo(bucket: string, caminho: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([caminho]);

    if (error) throw new Error(`Erro ao deletar arquivo: ${error.message}`);
  }
}
