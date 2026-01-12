'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Send, Users, Phone, Search, Upload, Download, User } from 'lucide-react';
import api from '@/lib/api';
import { User as UserType } from '@/types';

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags?: string[];
  notes?: string;
  assignedUserId?: number;
  assignedUserName?: string;
  createdAt: string;
}

export default function ClientsPage() {
  const { user } = useAuthStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMassMessageModal, setShowMassMessageModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [massMessage, setMassMessage] = useState('');
  const [sendingMass, setSendingMass] = useState(false);
  const [connectedInstance, setConnectedInstance] = useState<string | null>(null);
  const [companyUsers, setCompanyUsers] = useState<UserType[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    tags: '',
    notes: '',
    assignedUserId: ''
  });

  // Check if user is admin
  const isAdmin = user?.role === 'admin_master' || user?.role === 'admin_company' || user?.role === 'admin';

  useEffect(() => {
    loadClients();
    fetchConnectedInstance();
    fetchCompanyUsers();
  }, [user?.company_id]);

  const fetchCompanyUsers = async () => {
    try {
      const response = await api.get('/users');
      let users = response.data.data || [];
      // Filter by company
      if (user?.role !== 'admin_master') {
        users = users.filter((u: UserType) => u.company_id === user?.company_id);
      }
      setCompanyUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const loadClients = () => {
    // Load from localStorage (per company)
    const stored = localStorage.getItem(`clients_${user?.company_id}`);
    if (stored) {
      setClients(JSON.parse(stored));
    }
    setLoading(false);
  };

  const saveClients = (newClients: Client[]) => {
    localStorage.setItem(`clients_${user?.company_id}`, JSON.stringify(newClients));
    setClients(newClients);
  };

  const fetchConnectedInstance = async () => {
    try {
      const response = await fetch('/api/evolution?action=fetchInstances');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        for (const inst of data.data) {
          if (inst.connectionStatus === 'open') {
            setConnectedInstance(inst.name);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching instances:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }

    // Format phone number (remove non-digits)
    const phone = formData.phone.replace(/\D/g, '');
    if (phone.length < 10) {
      toast.error('Telefone inválido');
      return;
    }

    const assignedUser = formData.assignedUserId ? companyUsers.find(u => u.id === Number(formData.assignedUserId)) : null;
    
    const newClient: Client = {
      id: editingClient?.id || Date.now().toString(),
      name: formData.name,
      phone: phone,
      email: formData.email || undefined,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : undefined,
      notes: formData.notes || undefined,
      assignedUserId: assignedUser?.id,
      assignedUserName: assignedUser?.name,
      createdAt: editingClient?.createdAt || new Date().toISOString()
    };

    let newClients: Client[];
    if (editingClient) {
      newClients = clients.map(c => c.id === editingClient.id ? newClient : c);
      toast.success('Cliente atualizado!');
    } else {
      // Check for duplicate phone
      if (clients.some(c => c.phone === phone)) {
        toast.error('Já existe um cliente com este telefone');
        return;
      }
      newClients = [...clients, newClient];
      toast.success('Cliente cadastrado!');
    }

    saveClients(newClients);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', tags: '', notes: '', assignedUserId: '' });
    setEditingClient(null);
    setShowModal(false);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      email: client.email || '',
      tags: client.tags?.join(', ') || '',
      notes: client.notes || '',
      assignedUserId: client.assignedUserId?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      const newClients = clients.filter(c => c.id !== id);
      saveClients(newClients);
      toast.success('Cliente excluído!');
    }
  };

  const toggleSelectClient = (id: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedClients(newSelected);
  };

  const selectAll = () => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filteredClients.map(c => c.id)));
    }
  };

  const handleMassMessage = async () => {
    if (!massMessage.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    if (selectedClients.size === 0) {
      toast.error('Selecione pelo menos um cliente');
      return;
    }

    if (!connectedInstance) {
      toast.error('Nenhuma instância WhatsApp conectada');
      return;
    }

    setSendingMass(true);
    let sent = 0;
    let failed = 0;

    for (const clientId of selectedClients) {
      const client = clients.find(c => c.id === clientId);
      if (!client) continue;

      try {
        const remoteJid = `${client.phone}@s.whatsapp.net`;
        
        await fetch('/api/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instance: connectedInstance,
            remoteJid,
            message: massMessage
          })
        });

        sent++;
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        failed++;
        console.error('Error sending to', client.phone, error);
      }
    }

    setSendingMass(false);
    setShowMassMessageModal(false);
    setMassMessage('');
    setSelectedClients(new Set());

    if (failed === 0) {
      toast.success(`Mensagem enviada para ${sent} clientes!`);
    } else {
      toast.error(`Enviado: ${sent}, Falhou: ${failed}`);
    }
  };

  const exportClients = () => {
    const csv = [
      ['Nome', 'Telefone', 'Email', 'Tags', 'Notas', 'Data Cadastro'].join(','),
      ...clients.map(c => [
        c.name,
        c.phone,
        c.email || '',
        c.tags?.join(';') || '',
        c.notes || '',
        new Date(c.createdAt).toLocaleDateString('pt-BR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const importClients = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').slice(1); // Skip header
      
      let imported = 0;
      const newClients = [...clients];

      for (const line of lines) {
        const [name, phone, email, tags, notes] = line.split(',');
        if (!name || !phone) continue;

        const cleanPhone = phone.replace(/\D/g, '');
        if (newClients.some(c => c.phone === cleanPhone)) continue;

        newClients.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: name.trim(),
          phone: cleanPhone,
          email: email?.trim() || undefined,
          tags: tags ? tags.split(';').map(t => t.trim()) : undefined,
          notes: notes?.trim() || undefined,
          createdAt: new Date().toISOString()
        });
        imported++;
      }

      saveClients(newClients);
      toast.success(`${imported} clientes importados!`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Check permission
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Acesso Restrito</h2>
          <p className="text-gray-500 mt-2">Apenas administradores podem gerenciar clientes.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gerencie seus clientes para disparo em massa</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Importar CSV</span>
            <input type="file" accept=".csv" onChange={importClients} className="hidden" />
          </label>
          <button
            onClick={exportClients}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
            />
          </div>
          <span className="text-gray-500">{filteredClients.length} clientes</span>
        </div>
        
        {selectedClients.size > 0 && (
          <button
            onClick={() => setShowMassMessageModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Enviar para {selectedClients.size} selecionados</span>
          </button>
        )}
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedClients.size === filteredClients.length && filteredClients.length > 0}
                  onChange={selectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nome</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Telefone</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Atendente</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tags</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cadastro</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedClients.has(client.id)}
                      onChange={() => toggleSelectClient(client.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-medium">{client.name[0].toUpperCase()}</span>
                      </div>
                      <span className="font-medium text-gray-900">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{client.phone}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {client.assignedUserName ? (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{client.assignedUserName}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {client.tags?.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(client)}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900"
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900"
                  placeholder="5581999999999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900"
                  placeholder="vip, cliente, lead"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900"
                  rows={3}
                  placeholder="Observações sobre o cliente..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Atendente Responsável</label>
                <select
                  value={formData.assignedUserId}
                  onChange={(e) => setFormData({ ...formData, assignedUserId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900"
                >
                  <option value="">Sem atendente vinculado</option>
                  {companyUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingClient ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mass Message Modal */}
      {showMassMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Enviar Mensagem em Massa
            </h2>
            <p className="text-gray-600 mb-4">
              Enviando para <strong>{selectedClients.size}</strong> clientes selecionados
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
              <textarea
                value={massMessage}
                onChange={(e) => setMassMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900"
                rows={5}
                placeholder="Digite sua mensagem..."
              />
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ As mensagens serão enviadas com intervalo de 1 segundo para evitar bloqueios.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowMassMessageModal(false);
                  setMassMessage('');
                }}
                disabled={sendingMass}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleMassMessage}
                disabled={sendingMass || !massMessage.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center space-x-2"
              >
                {sendingMass ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
