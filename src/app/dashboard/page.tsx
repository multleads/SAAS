'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { DashboardStats } from '@/types';
import { MessageSquare, Users, Smartphone, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectedInstances, setConnectedInstances] = useState<any[]>([]);
  const [whatsappChats, setWhatsappChats] = useState<number>(0);

  useEffect(() => {
    fetchStats();
    fetchRealData();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard');
      setStats(response.data.data);
    } catch (error: any) {
      // Silent fail - will use real data from Evolution API
    } finally {
      setLoading(false);
    }
  };

  const fetchRealData = async () => {
    try {
      // Fetch instances
      const instancesRes = await api.get('/whatsapp-instances');
      const instances = instancesRes.data.data || [];
      
      // Check real status from Evolution API
      const connected: any[] = [];
      let totalChats = 0;
      
      for (const inst of instances) {
        try {
          const statusRes = await fetch(`/api/status?instance=${encodeURIComponent(inst.instance_name)}`);
          const statusData = await statusRes.json();
          const state = statusData.data?.state || statusData.data?.instance?.state;
          
          if (state === 'open') {
            connected.push(inst);
            
            // Fetch chats count for connected instance
            const chatsRes = await fetch(`/api/messages?instance=${encodeURIComponent(inst.instance_name)}`);
            const chatsData = await chatsRes.json();
            if (chatsData.success && Array.isArray(chatsData.data)) {
              totalChats += chatsData.data.length;
            }
          }
        } catch (e) {
          console.error('Error checking instance:', e);
        }
      }
      
      setConnectedInstances(connected);
      setWhatsappChats(totalChats);
    } catch (error) {
      console.error('Error fetching real data:', error);
    }
  };

  const statCards = [
    {
      label: 'Conversas WhatsApp',
      value: whatsappChats || stats?.active_conversations || 0,
      icon: MessageSquare,
      color: 'bg-blue-500',
    },
    {
      label: 'Contatos',
      value: stats?.total_contacts || whatsappChats,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      label: 'Instâncias Conectadas',
      value: connectedInstances.length || stats?.total_instances || 0,
      icon: Smartphone,
      color: 'bg-purple-500',
    },
    {
      label: 'Tempo Médio',
      value: `${stats?.avg_response_time || 0}s`,
      icon: Clock,
      color: 'bg-orange-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Instâncias Conectadas</h2>
          <div className="space-y-4">
            {connectedInstances.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhuma instância conectada</p>
            ) : (
              connectedInstances.map((inst) => (
                <div key={inst.id} className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-900 font-medium">{inst.instance_name}</span>
                  <span className="text-green-600">Conectado</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/dashboard/instances')}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Nova Instância WhatsApp
            </button>
            <button 
              onClick={() => router.push('/dashboard/conversations')}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Ver Todas Conversas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
