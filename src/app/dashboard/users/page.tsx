'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { User } from '@/types';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company_id: currentUser?.company_id || 13,
    role: 'atendente',
    active: true,
    whatsapp_instance_id: null as number | null,
  });

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
    fetchInstances();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data.data || []);
    } catch (error: any) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const fetchInstances = async () => {
    try {
      const response = await api.get('/whatsapp-instances');
      let allInstances = response.data.data || [];
      
      // Filter by company for admin_company
      if (currentUser?.role === 'admin_company') {
        allInstances = allInstances.filter((inst: any) => inst.company_id === currentUser.company_id);
      }
      
      setInstances(allInstances);
    } catch (error: any) {
      console.error('Erro ao carregar instâncias:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      let allUsers = response.data.data || [];
      
      // Se for admin_company, filtra apenas usuários da sua empresa
      if (currentUser?.role === 'admin_company') {
        allUsers = allUsers.filter((u: User) => u.company_id === currentUser.company_id);
      }
      
      setUsers(allUsers);
    } catch (error: any) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Não preenche a senha ao editar
      company_id: user.company_id || 13,
      role: user.role,
      active: user.active !== undefined ? user.active : true,
      whatsapp_instance_id: (user as any).whatsapp_instance_id || null,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    
    try {
      await api.delete(`/users?id=${id}`);
      toast.success('Usuário excluído com sucesso!');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir usuário');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Se não preencheu senha, não envia
        const updateData = { ...formData };
        if (!updateData.password) {
          delete (updateData as any).password;
        }
        await api.put('/users', { id: editingUser.id, ...updateData });
        toast.success('Usuário atualizado com sucesso!');
      } else {
        await api.post('/users', formData);
        toast.success('Usuário criado com sucesso!');
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        company_id: 13,
        role: 'atendente',
        active: true,        whatsapp_instance_id: null,      });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar usuário');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      company_id: 13,
      role: 'atendente',
      active: true,      whatsapp_instance_id: null,    });
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      admin_master: 'bg-purple-100 text-purple-800',
      admin_company: 'bg-blue-100 text-blue-800',
      atendente: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      admin_master: 'Admin Master',
      admin_company: 'Administrador',
      atendente: 'Atendente',
    };
    return {
      class: badges[role as keyof typeof badges] || badges.atendente,
      label: labels[role as keyof typeof labels] || role,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600">Gerencie os usuários do sistema</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          ➕ Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Função
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Último Login
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              const roleBadge = getRoleBadge(user.role);
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      📧 {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleBadge.class}`}>
                      {roleBadge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleString('pt-BR')
                      : 'Nunca'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleEdit(user)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              );
            })}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  placeholder="Digite o nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  placeholder="email@exemplo.com"
                />
              </div>

              {/* Só mostra seleção de empresa para admin_master */}
              {currentUser?.role === 'admin_master' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa
                  </label>
                  <select
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    required
                  >
                    <option value="">Selecione uma empresa</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha {editingUser && '(deixe em branco para não alterar)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Função
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                >
                  <option value="atendente">Atendente</option>
                  <option value="admin_company">Administrador da Empresa</option>
                  {currentUser?.role === 'admin_master' && (
                    <option value="admin_master">Admin Master</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instância WhatsApp (Opcional)
                </label>
                <select
                  value={formData.whatsapp_instance_id || ''}
                  onChange={(e) => setFormData({ ...formData, whatsapp_instance_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                >
                  <option value="">Nenhuma instância</option>
                  {instances.map((instance) => (
                    <option key={instance.id} value={instance.id}>
                      {instance.instance_name} {instance.phone ? `(${instance.phone})` : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Vincule o usuário a uma instância WhatsApp específica
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Usuário ativo
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingUser ? 'Atualizar' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
