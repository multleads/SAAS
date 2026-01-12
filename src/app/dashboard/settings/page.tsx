'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [aiSettings, setAiSettings] = useState({
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 500,
    auto_transfer: true,
    working_hours_start: '09:00',
    working_hours_end: '18:00',
  });

  const handleSave = () => {
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
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
