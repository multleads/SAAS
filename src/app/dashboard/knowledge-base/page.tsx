'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface KnowledgeItem {
  id: number;
  question: string;
  answer: string;
  category?: string;
  created_at: string;
}

export default function KnowledgeBasePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await api.get('/knowledge-base');
      setItems(response.data.data || []);
    } catch (error) {
      // If API doesn't exist, use local storage
      const stored = localStorage.getItem('knowledge_base');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  };

  const saveToLocalStorage = (newItems: KnowledgeItem[]) => {
    localStorage.setItem('knowledge_base', JSON.stringify(newItems));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        // Update existing
        const updated = items.map(item => 
          item.id === editingItem.id 
            ? { ...item, ...formData }
            : item
        );
        setItems(updated);
        saveToLocalStorage(updated);
        toast.success('Item atualizado com sucesso!');
      } else {
        // Create new
        const newItem: KnowledgeItem = {
          id: Date.now(),
          ...formData,
          created_at: new Date().toISOString(),
        };
        const newItems = [...items, newItem];
        setItems(newItems);
        saveToLocalStorage(newItems);
        toast.success('Item adicionado com sucesso!');
      }
      
      setShowModal(false);
      setEditingItem(null);
      setFormData({ question: '', answer: '', category: '' });
    } catch (error) {
      toast.error('Erro ao salvar item');
    }
  };

  const handleEdit = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormData({
      question: item.question,
      answer: item.answer,
      category: item.category || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      const filtered = items.filter(item => item.id !== id);
      setItems(filtered);
      saveToLocalStorage(filtered);
      toast.success('Item excluído com sucesso!');
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
          <button 
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700 mb-2"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Base de Conhecimento</h1>
          <p className="text-gray-600">Gerencie perguntas e respostas para a IA</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setFormData({ question: '', answer: '', category: '' });
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          ➕ Adicionar Item
        </button>
      </div>

      {/* Items List */}
      <div className="grid gap-4">
        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900">Nenhum item cadastrado</h3>
            <p className="text-gray-500 mt-2">
              Adicione perguntas e respostas para melhorar as respostas da IA.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Adicionar Primeiro Item
            </button>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {item.category && (
                    <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mb-2">
                      {item.category}
                    </span>
                  )}
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    ❓ {item.question}
                  </h3>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    💬 {item.answer}
                  </p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(item)}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingItem ? 'Editar Item' : 'Novo Item'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria (opcional)
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Preços, Horários, Produtos..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pergunta *
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Ex: Qual o horário de funcionamento?"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resposta *
                </label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Ex: Nosso horário de funcionamento é de segunda a sexta, das 9h às 18h."
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingItem ? 'Salvar Alterações' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
