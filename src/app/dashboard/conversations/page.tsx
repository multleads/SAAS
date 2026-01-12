'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Conversation } from '@/types';
import toast from 'react-hot-toast';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchConversations();
  }, [filter]);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/conversations', {
        params: { status: filter !== 'all' ? filter : undefined },
      });
      setConversations(response.data.data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      waiting: 'bg-yellow-100 text-yellow-800',
      ai: 'bg-blue-100 text-blue-800',
      human: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || colors.closed;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-gray-500',
      normal: 'text-blue-500',
      high: 'text-orange-500',
      urgent: 'text-red-500',
    };
    return colors[priority as keyof typeof colors] || colors.normal;
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
          <h1 className="text-2xl font-bold text-gray-900">Conversas</h1>
          <p className="text-gray-600">Gerencie todas as conversas ativas</p>
        </div>
        <div className="flex space-x-2">
          {['all', 'waiting', 'ai', 'human', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status === 'all' ? 'Todas' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {conversations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma conversa</h3>
            <p className="mt-1 text-sm text-gray-500">
              Não há conversas {filter !== 'all' ? `com status ${filter}` : ''} no momento.
            </p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="text-primary-600" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {conversation.contact?.name || conversation.contact?.whatsapp}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {conversation.contact?.whatsapp}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      🕐
                      <span>
                        {new Date(conversation.last_message_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {conversation.assigned_user && (
                      <div className="flex items-center space-x-1">
                        👤
                        <span>{conversation.assigned_user.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      conversation.status
                    )}`}
                  >
                    {conversation.status}
                  </span>
                  <span className={`text-xs font-medium ${getPriorityColor(conversation.priority)}`}>
                    {conversation.priority}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
