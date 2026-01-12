'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { WhatsAppInstance } from '@/types';
import toast from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  company_id: number;
  role: string;
}

export default function InstancesPage() {
  const { user: currentUser } = useAuthStore();
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [formData, setFormData] = useState({
    instance_name: '',
    phone: '',
    company_id: currentUser?.company_id || 0,
    user_id: null as number | null,
  });

  useEffect(() => {
    fetchInstances();
    fetchUsers();
  }, []);

  useEffect(() => {
    // Polling para verificar status da conexão quando modal QR está aberto
    let interval: NodeJS.Timeout | null = null;
    
    if (showQRModal && selectedInstance && selectedInstance.status !== 'connected') {
      interval = setInterval(() => {
        checkConnectionStatus(selectedInstance.id);
      }, 3000); // Verifica a cada 3 segundos
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showQRModal, selectedInstance]);

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
      toast.error('Erro ao carregar instâncias');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      let allUsers = response.data.data || [];
      
      // Filter by company
      if (currentUser?.role === 'admin_company') {
        allUsers = allUsers.filter((u: User) => u.company_id === currentUser.company_id);
      }
      
      setUsers(allUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <span className="text-green-500 text-xl">📶</span>;
      case 'connecting':
        return <span className="text-yellow-500 text-xl animate-pulse">📶</span>;
      default:
        return <span className="text-red-500 text-xl">📵</span>;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      connected: 'bg-green-100 text-green-800',
      connecting: 'bg-yellow-100 text-yellow-800',
      disconnected: 'bg-red-100 text-red-800',
      error: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.disconnected;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/whatsapp-instances', formData);
      toast.success('Instância criada com sucesso!');
      setShowModal(false);
      setFormData({
        instance_name: '',
        phone: '',
        company_id: currentUser?.company_id || 0,
        user_id: null,
      });
      fetchInstances();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar instância');
    }
  };

  const handleShowQR = (instance: WhatsAppInstance) => {
    setSelectedInstance(instance);
    setShowQRModal(true);
    if (instance.status !== 'connected') {
      generateQRCode(instance.id);
    }
  };

  const generateQRCode = async (instanceId: number) => {
    setQrLoading(true);
    try {
      // Get instance name first
      const instance = instances.find(i => i.id === instanceId);
      if (!instance) throw new Error('Instance not found');
      
      // Call direct PHP endpoint
      const response = await fetch(`http://talkagents.br.com/public_html/public/qrcode_direct.php?instance=${encodeURIComponent(instance.instance_name)}&action=connect`);
      const data = await response.json();
      
      if (data.success && data.data?.base64) {
        setQrCode(data.data.base64);
      } else {
        throw new Error('QR Code not found');
      }
    } catch (error: any) {
      toast.error('Erro ao gerar QR Code');
    } finally {
      setQrLoading(false);
    }
  };

  const checkConnectionStatus = async (instanceId: number) => {
    try {
      const response = await api.get(`/whatsapp-instances/${instanceId}/status`);
      if (response.data.success) {
        const status = response.data.data.status;
        
        // Atualiza o status da instância selecionada
        if (selectedInstance && selectedInstance.id === instanceId) {
          setSelectedInstance({ ...selectedInstance, status });
        }
        
        // Se conectou, atualiza a lista e fecha o modal
        if (status === 'connected') {
          toast.success('WhatsApp conectado com sucesso!');
          fetchInstances();
          setTimeout(() => {
            setShowQRModal(false);
            setQrCode(null);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  const handleDisconnect = async (instanceId: number) => {
    if (!confirm('Tem certeza que deseja desconectar esta instância?')) return;
    
    try {
      await api.post(`/whatsapp-instances/${instanceId}/disconnect`);
      toast.success('Instância desconectada com sucesso!');
      fetchInstances();
    } catch (error: any) {
      toast.error('Erro ao desconectar instância');
    }
  };

  const handleDelete = async (instanceId: number) => {
    if (!confirm('Tem certeza que deseja EXCLUIR esta instância? Esta ação não pode ser desfeita.')) return;
    
    try {
      await api.delete(`/whatsapp-instances?id=${instanceId}`);
      toast.success('Instância excluída com sucesso!');
      fetchInstances();
    } catch (error: any) {
      toast.error('Erro ao excluir instância');
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Instâncias WhatsApp</h1>
          <p className="text-gray-600">Gerencie suas conexões WhatsApp</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          ➕ Nova Instância
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instances.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl">📱</div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma instância</h3>
            <p className="mt-1 text-sm text-gray-500">
              Crie sua primeira instância WhatsApp para começar.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Criar Instância
            </button>
          </div>
        ) : (
          instances.map((instance) => (
            <div key={instance.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                    📱
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {instance.instance_name}
                    </h3>
                    {instance.phone && (
                      <p className="text-sm text-gray-500">{instance.phone}</p>
                    )}
                  </div>
                </div>
                {getStatusIcon(instance.status)}
              </div>

              <div className="mt-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    instance.status
                  )}`}
                >
                  {instance.status}
                </span>
              </div>

              {/* User Assignment */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Usuário Vinculado
                </label>
                <select
                  value={(instance as any).user_id || ''}
                  onChange={async (e) => {
                    try {
                      await api.put(`/whatsapp-instances/${instance.id}`, {
                        user_id: e.target.value || null,
                      });
                      toast.success('Usuário vinculado com sucesso!');
                      fetchInstances();
                    } catch (error) {
                      toast.error('Erro ao vincular usuário');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm text-gray-900"
                >
                  <option value="">Nenhum usuário</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              {instance.last_connected_at && (
                <p className="mt-4 text-xs text-gray-500">
                  Última conexão: {new Date(instance.last_connected_at).toLocaleString('pt-BR')}
                </p>
              )}

              <div className="mt-4 flex space-x-2">
                <button 
                  onClick={() => handleShowQR(instance)}
                  className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                >
                  {instance.status === 'connected' ? '✓ Conectado' : 'Conectar'}
                </button>
                {instance.status === 'connected' ? (
                  <button 
                    onClick={() => handleDisconnect(instance.id)}
                    className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                  >
                    Desconectar
                  </button>
                ) : (
                  <button 
                    onClick={() => handleDelete(instance.id)}
                    className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Criação */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Nova Instância WhatsApp
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Instância
                </label>
                <input
                  type="text"
                  required
                  value={formData.instance_name}
                  onChange={(e) => setFormData({ ...formData, instance_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  placeholder="Ex: WhatsApp Vendas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone (com DDI)
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  placeholder="5581999999999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vincular Usuário (Opcional)
                </label>
                <select
                  value={formData.user_id || ''}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                >
                  <option value="">Nenhum usuário</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Criar Instância
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de QR Code */}
      {showQRModal && selectedInstance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {selectedInstance.status === 'connected' ? '✓ Conectado' : 'Conectar WhatsApp'} - {selectedInstance.instance_name}
            </h2>
            <div className="bg-gray-50 rounded-lg p-8 flex items-center justify-center mb-4 min-h-[320px]">
              {selectedInstance.status === 'connected' ? (
                <div className="text-center">
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-green-600 font-medium text-lg">Conectado com sucesso!</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Telefone: {selectedInstance.phone}
                  </p>
                  {selectedInstance.last_connected_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      Conectado em: {new Date(selectedInstance.last_connected_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              ) : qrLoading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Gerando QR Code...</p>
                </div>
              ) : qrCode ? (
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg shadow-inner mb-4">
                    <img 
                      src={qrCode} 
                      alt="QR Code" 
                      className="w-64 h-64 mx-auto"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>1.</strong> Abra o WhatsApp no seu celular
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>2.</strong> Toque em Mais opções → Aparelhos conectados
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>3.</strong> Escaneie este código QR
                  </p>
                  <div className="mt-4 flex items-center justify-center text-yellow-600 text-sm">
                    <span className="animate-pulse mr-2">●</span>
                    Aguardando conexão...
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-6xl mb-4">📱</div>
                  <p className="text-gray-600 mb-4">Erro ao gerar QR Code</p>
                  <button
                    onClick={() => generateQRCode(selectedInstance.id)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              {selectedInstance.status !== 'connected' && qrCode && (
                <button
                  onClick={() => generateQRCode(selectedInstance.id)}
                  className="flex-1 px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
                >
                  Gerar Novo QR
                </button>
              )}
              <button
                onClick={() => {
                  setShowQRModal(false);
                  setQrCode(null);
                }}
                className={`${selectedInstance.status !== 'connected' && qrCode ? 'flex-1' : 'w-full'} px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700`}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
