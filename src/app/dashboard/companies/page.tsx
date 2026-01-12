'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Company } from '@/types';
import toast from 'react-hot-toast';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    plan: 'basic',
    max_instances: 1,
    max_users: 5,
    status: 'active',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data.data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      email: company.email,
      phone: company.phone || '',
      plan: company.plan,
      max_instances: company.max_instances,
      max_users: company.max_users,
      status: company.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;
    
    try {
      await api.delete(`/companies?id=${id}`);
      toast.success('Empresa excluída com sucesso!');
      fetchCompanies();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir empresa');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await api.put('/companies', { id: editingCompany.id, ...formData });
        toast.success('Empresa atualizada com sucesso!');
      } else {
        await api.post('/companies', formData);
        toast.success('Empresa criada com sucesso!');
      }
      setShowModal(false);
      setEditingCompany(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        plan: 'basic',
        max_instances: 1,
        max_users: 5,
        status: 'active',
      });
      fetchCompanies();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar empresa');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCompany(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      plan: 'basic',
      max_instances: 1,
      max_users: 5,
      status: 'active',
    });
  };

  const getPlanBadge = (plan: string) => {
    const badges = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      professional: 'bg-green-100 text-green-800',
      enterprise: 'bg-purple-100 text-purple-800',
    };
    return badges[plan as keyof typeof badges] || badges.free;
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
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="text-gray-600">Gerencie as empresas cadastradas</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          ➕ Nova Empresa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div
            key={company.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-2xl">
                  🏢
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{company.name}</h3>
                  <p className="text-sm text-gray-500">{company.email}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Plano:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanBadge(
                    company.plan
                  )}`}
                >
                  {company.plan}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    company.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {company.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Instâncias:</span>
                <span className="font-medium">{company.max_instances}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Usuários:</span>
                <span className="font-medium">{company.max_users}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
              <button 
                onClick={() => handleEdit(company)}
                className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
              >
                Editar
              </button>
              <button 
                onClick={() => handleDelete(company.id)}
                className="px-3 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm"
              >
                Excluir
              </button>
            </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  placeholder="Digite o nome da empresa"
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
                  placeholder="contato@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plano
                </label>
                <select
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                >
                  <option value="free">Gratuito</option>
                  <option value="basic">Básico</option>
                  <option value="professional">Profissional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máximo de Instâncias
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.max_instances}
                  onChange={(e) => setFormData({ ...formData, max_instances: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máximo de Usuários
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.max_users}
                  onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                >
                  <option value="active">Ativa</option>
                  <option value="inactive">Inativa</option>
                  <option value="suspended">Suspensa</option>
                </select>
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
                  {editingCompany ? 'Atualizar' : 'Criar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
          </div>
        ))}
      </div>
    </div>
  );
}
