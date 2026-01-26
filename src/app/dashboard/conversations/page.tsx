'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { Conversation } from '@/types';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface WhatsAppChat {
  id?: string;
  remoteJid?: string;
  name?: string;
  pushName?: string;
  lastMessage?: any;
  unreadCount?: number;
}

export default function ConversationsPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [whatsappChats, setWhatsappChats] = useState<WhatsAppChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [connectedInstance, setConnectedInstance] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<WhatsAppChat | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [autoAiPaused, setAutoAiPaused] = useState(false);
  const [lastProcessedTimestamp, setLastProcessedTimestamp] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getChatRemoteJid = (chat: WhatsAppChat | null): string => {
    if (!chat) return '';
    let remoteJid = chat.remoteJid || '';
    if (!remoteJid && chat.id && /^\d+/.test(chat.id)) {
      remoteJid = chat.id.includes('@') ? chat.id : `${chat.id}@s.whatsapp.net`;
    }
    return remoteJid;
  };

  // Computed value for AI active state
  const isAiActive = aiEnabled && !autoAiPaused;

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load AI settings and auto-response state
  useEffect(() => {
    const settings = localStorage.getItem(`ai_settings_${user?.company_id}`);
    if (settings) {
      const parsed = JSON.parse(settings);
      setAiEnabled(parsed.auto_ai_response || false);
    }
  }, [user?.company_id, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const remoteJid = getChatRemoteJid(selectedChat);
    if (!remoteJid) {
      setAutoAiPaused(false);
      return;
    }
    const paused = localStorage.getItem(`ai_paused_${user.id}_${remoteJid}`);
    setAutoAiPaused(paused === 'true');
  }, [selectedChat?.remoteJid, selectedChat?.id, user?.id]);

  useEffect(() => {
    fetchConnectedInstance();
  }, []);

  // Poll for new messages when chat is open - fetch directly from Evolution API
  // Note: Auto-AI response is handled by GlobalAiPoller to avoid duplicates
  useEffect(() => {
    if (!selectedChat || !connectedInstance) return;
    
    const interval = setInterval(async () => {
      try {
        // Use remoteJid from selectedChat
        let remoteJid = selectedChat.remoteJid || '';
        if (!remoteJid && selectedChat.id && /^\d+/.test(selectedChat.id)) {
          remoteJid = selectedChat.id.includes('@') ? selectedChat.id : `${selectedChat.id}@s.whatsapp.net`;
        }
        
        if (!remoteJid) return;
        
        // Fetch messages directly from Evolution API
        const response = await fetch(`/api/chat-messages?instance=${encodeURIComponent(connectedInstance)}&remoteJid=${encodeURIComponent(remoteJid)}`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setMessages(prev => {
            const newMsgs = data.data.filter((msg: any) => 
              !prev.some((p: any) => 
                p.messageTimestamp === msg.messageTimestamp || 
                (p.key?.id && msg.key?.id && p.key.id === msg.key.id)
              )
            );
            
            if (newMsgs.length > 0) {
              const merged = [...prev, ...newMsgs].sort((a, b) => (a.messageTimestamp || 0) - (b.messageTimestamp || 0));
              return merged;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 1500); // Poll every 1.5 seconds for faster message delivery
    
    return () => clearInterval(interval);
  }, [selectedChat, connectedInstance]);

  useEffect(() => {
    if (connectedInstance) {
      fetchWhatsAppChats();
    }
    fetchConversations();
  }, [filter, connectedInstance]);

  const fetchConnectedInstance = async () => {
    try {
      const response = await api.get('/whatsapp-instances');
      const instances = response.data.data || [];
      
      // Check each instance status
      for (const inst of instances) {
        const statusRes = await fetch(`/api/status?instance=${encodeURIComponent(inst.instance_name)}`);
        const statusData = await statusRes.json();
        const state = statusData.data?.state || statusData.data?.instance?.state;
        if (state === 'open') {
          setConnectedInstance(inst.instance_name);
          break;
        }
      }
    } catch (error) {
      console.error('Error fetching instances:', error);
    }
  };

  const fetchWhatsAppChats = async () => {
    if (!connectedInstance) return;
    
    try {
      const response = await fetch(`/api/messages?instance=${encodeURIComponent(connectedInstance)}`);
      const data = await response.json();
      console.log('WhatsApp chats response:', data);
      
      if (data.success) {
        // Handle different response formats
        const chats = Array.isArray(data.data) ? data.data : [];
        setWhatsappChats(chats);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp chats:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await api.get('/conversations', {
        params: { status: filter !== 'all' ? filter : undefined },
      });
      setConversations(response.data.data || []);
    } catch (error: any) {
      // Silent fail - will show WhatsApp chats instead
    } finally {
      setLoading(false);
    }
  };

  const openChat = async (chat: WhatsAppChat) => {
    setSelectedChat(chat);
    setLoadingMessages(true);
    setMessages([]);
    
    try {
      // Use remoteJid from chat, it should already have @s.whatsapp.net
      let remoteJid = chat.remoteJid || '';
      
      // If no remoteJid, try to build from id (phone number)
      if (!remoteJid && chat.id) {
        // Check if id is a phone number (not a database id)
        if (/^\d+/.test(chat.id)) {
          remoteJid = chat.id.includes('@') ? chat.id : `${chat.id}@s.whatsapp.net`;
        }
      }
      
      console.log('Opening chat with remoteJid:', remoteJid, 'from chat:', chat);
      
      if (!remoteJid) {
        console.error('No valid remoteJid found');
        setLoadingMessages(false);
        return;
      }
      
      // Try Evolution API
      const response = await fetch(`/api/chat-messages?instance=${encodeURIComponent(connectedInstance || '')}&remoteJid=${encodeURIComponent(remoteJid)}`);
      const data = await response.json();
      console.log('Messages API response:', data);
      
      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const setupWebhook = async () => {
    if (!connectedInstance) return;
    
    try {
      const webhookUrl = `${window.location.origin}/api/webhook`;
      const response = await fetch('/api/setup-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance: connectedInstance, webhookUrl })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Webhook configurado com sucesso!');
      } else {
        toast.error('Erro ao configurar webhook');
      }
    } catch (error) {
      toast.error('Erro ao configurar webhook');
    }
  };

  const getAiSettings = () => {
    const saved = localStorage.getItem(`ai_settings_${user?.company_id}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  };

  const getKnowledgeBase = () => {
    const stored = localStorage.getItem('knowledge_base');
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  };

  const generateAiResponse = async (userMessage: string) => {
    const settings = getAiSettings();
    if (!settings?.openai_api_key) {
      toast.error('Configure a chave da API OpenAI nas configurações');
      return null;
    }

    setAiProcessing(true);
    try {
      const response = await fetch('/api/chat-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          apiKey: settings.openai_api_key,
          model: settings.model || 'gpt-4',
          knowledgeBase: getKnowledgeBase(),
          conversationHistory: messages.slice(-10)
        })
      });

      const data = await response.json();
      if (data.success) {
        return data.response;
      } else {
        toast.error(data.message || 'Erro ao gerar resposta da IA');
        return null;
      }
    } catch (error) {
      toast.error('Erro ao conectar com a IA');
      return null;
    } finally {
      setAiProcessing(false);
    }
  };

  // Auto-respond with AI (called from polling)
  const autoRespondWithAi = async (userMessage: string) => {
    const settings = getAiSettings();
    if (!settings?.openai_api_key) {
      console.log('Auto AI: No API key configured');
      return;
    }

    // Check working hours if enabled
    if (settings.auto_ai_during_hours) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = (settings.working_hours_start || '09:00').split(':').map(Number);
      const [endH, endM] = (settings.working_hours_end || '18:00').split(':').map(Number);
      const startTime = startH * 60 + startM;
      const endTime = endH * 60 + endM;
      
      if (currentTime < startTime || currentTime > endTime) {
        console.log('Auto AI: Outside working hours');
        return;
      }
    }

    console.log('Auto AI: Generating response for:', userMessage);
    const aiResponse = await generateAiResponse(userMessage);
    if (aiResponse && selectedChat && connectedInstance) {
      // Send the AI response
      const remoteJid = selectedChat.remoteJid || selectedChat.id;
      
      // Add to UI
      const tempMessage = {
        key: { fromMe: true, remoteJid },
        message: { conversation: aiResponse },
        messageTimestamp: Math.floor(Date.now() / 1000)
      };
      setMessages(prev => [...prev, tempMessage]);
      
      // Send via API
      try {
        await fetch('/api/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instance: connectedInstance,
            remoteJid,
            message: aiResponse
          })
        });
        console.log('Auto AI: Response sent successfully');
      } catch (error) {
        console.error('Auto AI: Error sending response:', error);
      }
    }
  };

  const sendMessage = async (messageToSend?: string) => {
    const messageText = messageToSend || newMessage;
    if (!messageText.trim() || !selectedChat || !connectedInstance) return;
    
    if (!messageToSend) setNewMessage('');
    
    // Add message to UI immediately
    const tempMessage = {
      key: { fromMe: true, remoteJid: selectedChat.remoteJid || selectedChat.id },
      message: { conversation: messageText },
      messageTimestamp: Math.floor(Date.now() / 1000)
    };
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      const remoteJid = selectedChat.remoteJid || selectedChat.id;
      await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance: connectedInstance,
          remoteJid,
          message: messageText
        })
      });
      toast.success('Mensagem enviada!');
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    }
  };

  const handleAiResponse = async () => {
    // Get last received message
    const lastReceivedMsg = [...messages].reverse().find(m => !m.key?.fromMe);
    if (!lastReceivedMsg) {
      toast.error('Nenhuma mensagem recebida para responder');
      return;
    }

    const userMessage = lastReceivedMsg.message?.conversation || 
                        lastReceivedMsg.message?.extendedTextMessage?.text || '';
    
    if (!userMessage) {
      toast.error('Mensagem não contém texto');
      return;
    }

    const aiResponse = await generateAiResponse(userMessage);
    if (aiResponse) {
      await sendMessage(aiResponse);
    }
  };

  const toggleAutoAi = async () => {
    if (!user?.id) return;
    const remoteJid = getChatRemoteJid(selectedChat);
    if (!remoteJid || !connectedInstance) {
      toast.error('Selecione uma conversa para alternar o controle');
      return;
    }

    const newState = !autoAiPaused;
    setAutoAiPaused(newState);
    
    // Save to localStorage (for frontend)
    if (newState) {
      localStorage.setItem(`ai_paused_${user.id}_${remoteJid}`, 'true');
    } else {
      localStorage.removeItem(`ai_paused_${user.id}_${remoteJid}`);
    }
    
    // Save to backend (for webhook)
    try {
      if (newState) {
        await fetch('/api/paused-chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instance_name: connectedInstance,
            remote_jid: remoteJid,
            company_id: user.company_id,
            paused_by: user.id
          })
        });
      } else {
        await fetch(`/api/paused-chats?instance_name=${encodeURIComponent(connectedInstance)}&remote_jid=${encodeURIComponent(remoteJid)}`, {
          method: 'DELETE'
        });
      }
    } catch (error) {
      console.log('Error syncing pause state to backend:', error);
    }
    
    if (newState) {
      toast.success('IA pausada - você assumiu a conversa');
    } else {
      toast.success('IA reativada - respostas automáticas habilitadas');
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

      {/* WhatsApp Chats from Evolution API */}
      {whatsappChats.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">WhatsApp - {connectedInstance} ({whatsappChats.length} conversas)</h2>
            <button onClick={setupWebhook} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
              Configurar Webhook
            </button>
          </div>
          <div className="grid gap-3">
            {whatsappChats.map((chat, index) => {
              const chatId = chat.id || chat.remoteJid || `chat-${index}`;
              const chatName = chat.name || chat.pushName || chat.remoteJid?.split('@')[0] || 'Contato';
              const initial = chatName?.[0]?.toUpperCase() || '?';
              
              return (
                <div key={chatId} onClick={() => openChat(chat)} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 cursor-pointer border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold">{initial}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{chatName}</h3>
                        <p className="text-sm text-gray-500">{chat.remoteJid?.split('@')[0]}</p>
                      </div>
                    </div>
                    {chat.unreadCount && chat.unreadCount > 0 && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">{chat.unreadCount}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {conversations.length === 0 && whatsappChats.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma conversa</h3>
            <p className="mt-1 text-sm text-gray-500">
              {connectedInstance ? 'Não há conversas no momento.' : 'Conecte uma instância WhatsApp para ver as conversas.'}
            </p>
          </div>
        ) : null}
      </div>

      {/* Chat Modal */}
      {selectedChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-green-600 text-white rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">
                    {(selectedChat.name || selectedChat.pushName || selectedChat.remoteJid)?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{selectedChat.name || selectedChat.pushName || selectedChat.remoteJid?.split('@')[0]}</h3>
                  <p className="text-sm text-green-100">{selectedChat.remoteJid?.split('@')[0]}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {/* AI Toggle */}
                {aiEnabled && (
                  <button
                    onClick={toggleAutoAi}
                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 transition-colors ${
                      isAiActive 
                        ? 'bg-blue-500 text-white hover:bg-blue-600' 
                        : 'bg-yellow-500 text-white hover:bg-yellow-600'
                    }`}
                  >
                    <span>{isAiActive ? '🤖' : '👤'}</span>
                    <span>{isAiActive ? 'IA Ativa' : 'Você no controle'}</span>
                  </button>
                )}
                <button onClick={() => setSelectedChat(null)} className="text-white hover:text-green-200">
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-100">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhuma mensagem encontrada</p>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.key?.fromMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-lg shadow ${msg.key?.fromMe ? 'bg-green-500 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}>
                        <p>{msg.message?.conversation || msg.message?.extendedTextMessage?.text || '[Mídia]'}</p>
                        <p className={`text-xs mt-1 ${msg.key?.fromMe ? 'text-green-100' : 'text-gray-500'}`}>
                          {msg.messageTimestamp ? new Date(msg.messageTimestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-center space-x-2 mb-2">
                <button
                  onClick={handleAiResponse}
                  disabled={aiProcessing}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 ${
                    aiProcessing 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <span>{aiProcessing ? '🔄' : '🤖'}</span>
                  <span>{aiProcessing ? 'Gerando resposta...' : 'Responder com IA'}</span>
                </button>
                <span className="text-xs text-gray-500">
                  Gera resposta automática baseada na última mensagem recebida
                </span>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                />
                <button
                  onClick={() => sendMessage()}
                  className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
