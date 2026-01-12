'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [aiSettings, setAiSettings] = useState({
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 500,
    auto_transfer: true,
    working_hours_start: '09:00',
    working_hours_end: '18:00',
    openai_api_key: '',
    auto_ai_response: false,
    auto_ai_during_hours: true,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking');
  const [availableModels, setAvailableModels] = useState<string[]>(['gpt-4', 'gpt-3.5-turbo']);
  const [loadingModels, setLoadingModels] = useState(false);

  // Load saved settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`ai_settings_${user?.company_id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setAiSettings(prev => ({ ...prev, ...parsed }));
      // Check API connection if key exists
      if (parsed.openai_api_key) {
        checkApiConnection(parsed.openai_api_key);
      } else {
        setApiStatus('disconnected');
      }
    } else {
      setApiStatus('disconnected');
    }
  }, [user?.company_id]);

  const checkApiConnection = async (apiKey: string) => {
    if (!apiKey || !apiKey.startsWith('sk-')) {
      setApiStatus('disconnected');
      return;
    }
    
    setApiStatus('checking');
    setLoadingModels(true);
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      if (response.ok) {
        setApiStatus('connected');
        const data = await response.json();
        // Filter only GPT models for chat
        const gptModels = data.data
          .filter((m: any) => m.id.includes('gpt'))
          .map((m: any) => m.id)
          .sort((a: string, b: string) => {
            // Sort by version (higher first)
            if (a.includes('gpt-4') && !b.includes('gpt-4')) return -1;
            if (!a.includes('gpt-4') && b.includes('gpt-4')) return 1;
            return b.localeCompare(a);
          });
        
        if (gptModels.length > 0) {
          setAvailableModels(gptModels);
        }
      } else {
        setApiStatus('error');
      }
    } catch (error) {
      setApiStatus('error');
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem(`ai_settings_${user?.company_id}`, JSON.stringify(aiSettings));
    toast.success('Configurações salvas com sucesso!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Configure o comportamento da IA e do sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações de IA */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">🤖</span>
            <h2 className="text-lg font-semibold text-gray-900">Inteligência Artificial</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modelo
              </label>
              <select
                value={aiSettings.model}
                onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                disabled={loadingModels}
              >
                {loadingModels ? (
                  <option>Carregando modelos...</option>
                ) : (
                  availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))
                )}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {availableModels.length > 2 ? `${availableModels.length} modelos disponíveis` : 'Conecte a API para carregar todos os modelos'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperatura: {aiSettings.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={aiSettings.temperature}
                onChange={(e) =>
                  setAiSettings({ ...aiSettings, temperature: parseFloat(e.target.value) })
                }
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Controla a criatividade das respostas (0 = conservador, 1 = criativo)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Máximo de Tokens
              </label>
              <input
                type="number"
                value={aiSettings.max_tokens}
                onChange={(e) =>
                  setAiSettings({ ...aiSettings, max_tokens: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Limita o tamanho das respostas da IA
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto_transfer"
                checked={aiSettings.auto_transfer}
                onChange={(e) =>
                  setAiSettings({ ...aiSettings, auto_transfer: e.target.checked })
                }
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="auto_transfer" className="ml-2 text-sm text-gray-700">
                Transferir automaticamente para humano quando necessário
              </label>
            </div>
          </div>
        </div>

        {/* Conexão OpenAI */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">🔑</span>
            <h2 className="text-lg font-semibold text-gray-900">Conexão ChatGPT / OpenAI</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Importante:</strong> Cada empresa precisa configurar sua própria chave de API da OpenAI para usar os recursos de IA.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chave de API da OpenAI
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={aiSettings.openai_api_key}
                  onChange={(e) => setAiSettings({ ...aiSettings, openai_api_key: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                >
                  {showApiKey ? '🙈 Ocultar' : '👁️ Mostrar'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Obtenha sua chave em: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">platform.openai.com/api-keys</a>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${aiSettings.openai_api_key ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {aiSettings.openai_api_key ? 'Chave configurada' : 'Chave não configurada'}
              </span>
            </div>

            {/* Status da Conexão */}
            <div className="mt-4 p-4 rounded-lg border" style={{ borderColor: apiStatus === 'connected' ? '#22c55e' : apiStatus === 'error' ? '#ef4444' : '#d1d5db', backgroundColor: apiStatus === 'connected' ? '#f0fdf4' : apiStatus === 'error' ? '#fef2f2' : '#f9fafb' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${apiStatus === 'connected' ? 'bg-green-500' : apiStatus === 'error' ? 'bg-red-500' : apiStatus === 'checking' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className={`text-sm font-medium ${apiStatus === 'connected' ? 'text-green-700' : apiStatus === 'error' ? 'text-red-700' : 'text-gray-600'}`}>
                    {apiStatus === 'connected' && '✅ API Conectada'}
                    {apiStatus === 'disconnected' && '⚪ API Desconectada'}
                    {apiStatus === 'error' && '❌ Erro na Conexão'}
                    {apiStatus === 'checking' && '🔄 Verificando...'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => checkApiConnection(aiSettings.openai_api_key)}
                  className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                >
                  Testar Conexão
                </button>
              </div>
              {apiStatus === 'error' && (
                <p className="text-xs text-red-600 mt-2">Verifique se a chave está correta e tem créditos disponíveis.</p>
              )}
            </div>
          </div>
        </div>

        {/* Resposta Automática com IA */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">🤖</span>
            <h2 className="text-lg font-semibold text-gray-900">Resposta Automática com IA</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Quando habilitado, a IA responderá automaticamente às mensagens recebidas. Os atendentes podem desabilitar temporariamente para assumir a conversa.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Habilitar Resposta Automática</p>
                <p className="text-sm text-gray-500">A IA responderá automaticamente às mensagens</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiSettings.auto_ai_response}
                  onChange={(e) => setAiSettings({ ...aiSettings, auto_ai_response: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Apenas no Horário de Funcionamento</p>
                <p className="text-sm text-gray-500">IA responde apenas dentro do horário configurado</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiSettings.auto_ai_during_hours}
                  onChange={(e) => setAiSettings({ ...aiSettings, auto_ai_during_hours: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className={`flex items-center space-x-2 p-3 rounded-lg ${aiSettings.auto_ai_response ? 'bg-green-50 border border-green-200' : 'bg-gray-100'}`}>
              <div className={`w-3 h-3 rounded-full ${aiSettings.auto_ai_response ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className={`text-sm font-medium ${aiSettings.auto_ai_response ? 'text-green-700' : 'text-gray-600'}`}>
                {aiSettings.auto_ai_response ? '✅ Resposta automática ATIVADA' : '⚪ Resposta automática DESATIVADA'}
              </span>
            </div>
          </div>
        </div>

        {/* Horário de Funcionamento */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">🕐</span>
            <h2 className="text-lg font-semibold text-gray-900">Horário de Funcionamento</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horário de Início
              </label>
              <input
                type="time"
                value={aiSettings.working_hours_start}
                onChange={(e) =>
                  setAiSettings({ ...aiSettings, working_hours_start: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horário de Término
              </label>
              <input
                type="time"
                value={aiSettings.working_hours_end}
                onChange={(e) =>
                  setAiSettings({ ...aiSettings, working_hours_end: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
              />
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Fora do horário de funcionamento, o sistema enviará mensagem automática
                informando que o atendimento está fechado.
              </p>
            </div>
          </div>
        </div>

        {/* Base de Conhecimento */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">💬</span>
            <h2 className="text-lg font-semibold text-gray-900">Base de Conhecimento</h2>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Adicione perguntas e respostas frequentes para melhorar as respostas da IA.
            </p>
            <button 
              onClick={() => router.push('/dashboard/knowledge-base')}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Gerenciar Base de Conhecimento
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          💾 Salvar Configurações
        </button>
      </div>
    </div>
  );
}
