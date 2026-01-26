'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Send, Users, Image, X, CheckCircle, AlertCircle, Clock, Play, Pause } from 'lucide-react';
import api from '@/lib/api';

interface Client {
  id: string;
  name: string;
  phone: string;
  tags?: string[];
  assignedUserId?: number;
  assignedUserName?: string;
}

interface Product {
  id: string;
  name: string;
  imageUrl: string;
}

interface Catalog {
  id: string;
  name: string;
  products: Product[];
}

interface ConnectedInstance {
  instanceName: string;
  isConnected: boolean;
}

interface Campaign {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

export default function CampaignsPage() {
  const { user } = useAuthStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [connectedInstance, setConnectedInstance] = useState<ConnectedInstance | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Campaign form
  const [campaignName, setCampaignName] = useState('');
  const [audience, setAudience] = useState<'all' | 'category'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCatalogs, setSelectedCatalogs] = useState<string[]>([]);
  const [messageText, setMessageText] = useState('');
  const [extraImage, setExtraImage] = useState<string | null>(null);
  
  // Campaign execution
  const [isSending, setIsSending] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [campaignHistory, setCampaignHistory] = useState<Campaign[]>([]);
  const [unsubscribedPhones, setUnsubscribedPhones] = useState<string[]>([]);
  const abortRef = useRef(false);

  const isAdmin = user?.role === 'admin_master' || user?.role === 'admin_company' || user?.role === 'admin';

  // Get unique tags from clients
  const allTags = [...new Set(clients.flatMap(c => c.tags || []))];

  useEffect(() => {
    loadData();
  }, [user?.company_id]);

  const loadData = async () => {
    setLoading(true);
    
    // Load clients
    const storedClients = localStorage.getItem(`clients_${user?.company_id}`);
    if (storedClients) {
      setClients(JSON.parse(storedClients));
    }
    
    // Load catalogs
    const storedCatalogs = localStorage.getItem(`catalogs_${user?.company_id}`);
    if (storedCatalogs) {
      setCatalogs(JSON.parse(storedCatalogs));
    }
    
    // Load campaign history
    const storedHistory = localStorage.getItem(`campaign_history_${user?.company_id}`);
    if (storedHistory) {
      setCampaignHistory(JSON.parse(storedHistory));
    }
    
    // Load unsubscribed phones
    const storedUnsubscribed = localStorage.getItem(`unsubscribed_${user?.company_id}`);
    if (storedUnsubscribed) {
      setUnsubscribedPhones(JSON.parse(storedUnsubscribed));
    }
    
    // Load connected instance
    await loadConnectedInstance();
    
    setLoading(false);
  };

  const loadConnectedInstance = async () => {
    try {
      // Get all instances from company (same approach as conversations page)
      const instancesResponse = await api.get('/whatsapp-instances');
      let instances = instancesResponse.data.data || [];
      console.log('All instances:', instances);
      console.log('User company_id:', user?.company_id);
      
      // Filter by company for non-admin_master users
      if (user?.role !== 'admin_master') {
        instances = instances.filter((i: any) => i.company_id === user?.company_id);
      }
      console.log('Filtered instances for company:', instances);

      // Find first connected instance using /api/status endpoint (same as conversations page)
      for (const inst of instances) {
        if (!inst.instance_name) continue;
        
        try {
          console.log('Checking instance:', inst.instance_name);
          const statusRes = await fetch(`/api/status?instance=${encodeURIComponent(inst.instance_name)}`);
          const statusData = await statusRes.json();
          const state = statusData.data?.state || statusData.data?.instance?.state;
          console.log('Instance status:', inst.instance_name, state, statusData);
          
          if (state === 'open') {
            console.log('Found connected instance:', inst.instance_name);
            setConnectedInstance({
              instanceName: inst.instance_name,
              isConnected: true
            });
            return;
          }
        } catch (e) {
          console.log('Error checking instance:', inst.instance_name, e);
          continue;
        }
      }
      
      console.log('No connected instance found');
      setConnectedInstance(null);
    } catch (error) {
      console.error('Error loading instances:', error);
      setConnectedInstance(null);
    }
  };

  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        toast.error('Apenas imagens JPG ou PNG são permitidas');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Imagem deve ter no máximo 10MB');
        return;
      }
      
      const loadingToast = toast.loading('Processando imagem...');
      try {
        const compressed = await compressImage(file);
        setExtraImage(compressed);
        toast.dismiss(loadingToast);
        toast.success('Imagem adicionada!');
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error('Erro ao processar imagem');
      }
    }
  };

  const getFilteredClients = (): Client[] => {
    if (audience === 'all') {
      return clients;
    }
    return clients.filter(c => 
      c.tags && c.tags.some(tag => selectedTags.includes(tag))
    );
  };

  const hasConnectedInstance = (): boolean => {
    return connectedInstance !== null && connectedInstance.isConnected;
  };

  const canStartCampaign = (): { canStart: boolean; reason?: string } => {
    if (!campaignName.trim()) {
      return { canStart: false, reason: 'Nome da campanha é obrigatório' };
    }
    if (!messageText.trim() && selectedCatalogs.length === 0 && !extraImage) {
      return { canStart: false, reason: 'Adicione uma mensagem, catálogo ou imagem' };
    }
    
    const filtered = getFilteredClients();
    if (filtered.length === 0) {
      return { canStart: false, reason: 'Nenhum cliente encontrado para o público selecionado' };
    }
    
    if (!hasConnectedInstance()) {
      return { 
        canStart: false, 
        reason: 'Nenhuma instância WhatsApp conectada' 
      };
    }
    
    return { canStart: true };
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const isPhoneUnsubscribed = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    return unsubscribedPhones.includes(cleanPhone);
  };

  const sendMessageToClient = async (client: Client, instanceName: string): Promise<boolean> => {
    try {
      const phone = client.phone.replace(/\D/g, '');
      const remoteJid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;

      // Check if client is unsubscribed
      console.log('Checking if unsubscribed:', phone, 'List:', unsubscribedPhones);
      if (isPhoneUnsubscribed(phone)) {
        console.log('Skipping unsubscribed client:', client.name, phone);
        return true; // Return true to not count as failure
      }
      console.log('Client is NOT unsubscribed, proceeding with send');

      // Send text message if exists
      if (messageText.trim()) {
        const personalizedMessage = messageText
          .replace(/{nome}/g, client.name)
          .replace(/{telefone}/g, client.phone);

        console.log('Sending text to:', phone, 'remoteJid:', remoteJid, 'instance:', instanceName);
        
        const textResponse = await fetch('/api/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instance: instanceName,
            remoteJid,
            message: personalizedMessage
          })
        });
        const textData = await textResponse.json();
        console.log('Text message response:', textData);
        
        if (!textData.success) {
          console.error('Failed to send text:', textData);
          throw new Error('Failed to send text message');
        }
        await delay(300); // Faster delay for registered clients
      }

      // Send extra image if exists
      if (extraImage) {
        const mediaResponse = await fetch('/api/send-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instance: instanceName,
            remoteJid,
            media: extraImage,
            mediatype: 'image',
            caption: ''
          })
        });
        const mediaData = await mediaResponse.json();
        console.log('Extra image sent:', mediaData);
        await delay(500); // Faster delay
      }

      // Send catalog products
      console.log('Selected catalogs:', selectedCatalogs);
      console.log('Available catalogs:', catalogs);
      
      for (const catalogId of selectedCatalogs) {
        const catalog = catalogs.find(c => c.id === catalogId);
        console.log('Processing catalog:', catalogId, 'Found:', catalog);
        
        if (catalog && catalog.products && catalog.products.length > 0) {
          console.log('Catalog products:', catalog.products);
          
          for (const product of catalog.products) {
            console.log('Processing product:', product.name, 'Has image:', !!product.imageUrl);
            
            if (product.imageUrl) {
              const productResponse = await fetch('/api/send-media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  instance: instanceName,
                  remoteJid,
                  media: product.imageUrl,
                  mediatype: 'image',
                  caption: product.name
                })
              });
              const productData = await productResponse.json();
              console.log('Product image sent:', product.name, productData);
              await delay(500); // Fast delay for registered clients
            }
          }
        } else {
          console.log('Catalog not found or has no products:', catalogId);
        }
      }

      // Send unsubscribe link after all images
      if (selectedCatalogs.length > 0 || extraImage || messageText.trim()) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://frontend-iota-flax-21.vercel.app';
        const unsubscribeLink = `${baseUrl}/unsubscribe/${encodeURIComponent(phone)}?c=${user?.company_id || '1'}`;
        const unsubscribeMessage = `\n\n_Para não receber mais mensagens promocionais, clique aqui:_\n${unsubscribeLink}`;
        
        await fetch('/api/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instance: instanceName,
            remoteJid,
            message: unsubscribeMessage
          })
        });
        await delay(200);
      }

      return true;
    } catch (error) {
      console.error('Error sending message to client:', client.name, error);
      return false;
    }
  };

  const startCampaign = async () => {
    const { canStart, reason } = canStartCampaign();
    if (!canStart) {
      toast.error(reason || 'Não é possível iniciar a campanha');
      return;
    }

    const filtered = getFilteredClients();
    abortRef.current = false;
    setIsSending(true);
    setIsPaused(false);

    const campaign: Campaign = {
      id: Date.now().toString(),
      name: campaignName,
      status: 'running',
      totalRecipients: filtered.length,
      sentCount: 0,
      failedCount: 0,
      createdAt: new Date().toISOString()
    };
    setCurrentCampaign(campaign);

    toast.success(`Iniciando campanha para ${filtered.length} clientes...`);

    console.log('Starting campaign for', filtered.length, 'clients');
    console.log('Filtered clients:', filtered);
    
    for (let i = 0; i < filtered.length; i++) {
      console.log(`Processing client ${i + 1}/${filtered.length}:`, filtered[i].name);
      
      // Check if paused or aborted
      while (isPaused && !abortRef.current) {
        await delay(500);
      }
      
      if (abortRef.current) {
        campaign.status = 'paused';
        break;
      }

      const client = filtered[i];
      
      if (connectedInstance?.instanceName) {
        console.log('Sending to client:', client.name, 'phone:', client.phone);
        const success = await sendMessageToClient(client, connectedInstance.instanceName);
        console.log('Send result for', client.name, ':', success);
        if (success) {
          campaign.sentCount++;
        } else {
          campaign.failedCount++;
        }
      } else {
        console.log('No connected instance for client:', client.name);
        campaign.failedCount++;
      }

      setCurrentCampaign({ ...campaign });
      
      // Fast delay between clients (500ms-1s)
      await delay(500 + Math.random() * 500);
    }

    if (!abortRef.current) {
      campaign.status = campaign.failedCount === 0 ? 'completed' : 'completed';
    }

    // Save to history
    const newHistory = [campaign, ...campaignHistory].slice(0, 20);
    setCampaignHistory(newHistory);
    localStorage.setItem(`campaign_history_${user?.company_id}`, JSON.stringify(newHistory));

    setCurrentCampaign(campaign);
    setIsSending(false);
    
    if (campaign.status === 'completed') {
      toast.success(`Campanha finalizada! ${campaign.sentCount} enviados, ${campaign.failedCount} falhas`);
    }
  };

  const pauseCampaign = () => {
    setIsPaused(true);
    toast('Campanha pausada', { icon: '⏸️' });
  };

  const resumeCampaign = () => {
    setIsPaused(false);
    toast('Campanha retomada', { icon: '▶️' });
  };

  const stopCampaign = () => {
    abortRef.current = true;
    setIsPaused(false);
    toast('Campanha interrompida', { icon: '⏹️' });
  };

  const resetForm = () => {
    setCampaignName('');
    setAudience('all');
    setSelectedTags([]);
    setSelectedCatalogs([]);
    setMessageText('');
    setExtraImage(null);
    setCurrentCampaign(null);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Acesso Restrito</h2>
          <p className="text-gray-500">Apenas administradores podem gerenciar campanhas.</p>
        </div>
      </div>
    );
  }

  const filteredClients = getFilteredClients();
  const { canStart, reason } = canStartCampaign();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campanhas de Disparo</h1>
          <p className="text-gray-600">Envie mensagens em massa para seus clientes</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações da Campanha</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Campanha *
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900"
                    placeholder="Ex: Black Friday 2025"
                    disabled={isSending}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Público
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as 'all' | 'category')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900"
                    disabled={isSending}
                  >
                    <option value="all">Todos os clientes ({clients.length})</option>
                    <option value="category">Por categoria/tag</option>
                  </select>
                </div>

                {audience === 'category' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecione as categorias
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allTags.length === 0 ? (
                        <p className="text-sm text-gray-500">Nenhuma categoria encontrada nos clientes</p>
                      ) : (
                        allTags.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (selectedTags.includes(tag)) {
                                setSelectedTags(selectedTags.filter(t => t !== tag));
                              } else {
                                setSelectedTags([...selectedTags, tag]);
                              }
                            }}
                            className={`px-3 py-1 rounded-full text-sm ${
                              selectedTags.includes(tag)
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            disabled={isSending}
                          >
                            {tag}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catálogos (opcional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {catalogs.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum catálogo criado</p>
                    ) : (
                      catalogs.map(catalog => (
                        <button
                          key={catalog.id}
                          type="button"
                          onClick={() => {
                            if (selectedCatalogs.includes(catalog.id)) {
                              setSelectedCatalogs(selectedCatalogs.filter(c => c !== catalog.id));
                            } else {
                              setSelectedCatalogs([...selectedCatalogs, catalog.id]);
                            }
                          }}
                          className={`px-3 py-1 rounded-full text-sm ${
                            selectedCatalogs.includes(catalog.id)
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          disabled={isSending}
                        >
                          {catalog.name} ({catalog.products.length} produtos)
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Mensagem</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagem avulsa (opcional)
                  </label>
                  <div className="flex items-center gap-4">
                    {extraImage ? (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                        <img src={extraImage} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setExtraImage(null)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          disabled={isSending}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-gray-50">
                        <Image className="w-6 h-6 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">Adicionar</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handleImageChange}
                          className="hidden"
                          disabled={isSending}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Texto da mensagem
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Variáveis disponíveis: <span className="text-primary-600">{'{nome}'}</span>, <span className="text-primary-600">{'{telefone}'}</span>
                  </p>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900"
                    placeholder="Olá {nome}! Temos uma oferta especial para você..."
                    disabled={isSending}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              {!isSending ? (
                <>
                  <button
                    onClick={startCampaign}
                    disabled={!canStart}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium ${
                      canStart
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                    Iniciar Disparo ({filteredClients.length} clientes)
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Limpar
                  </button>
                </>
              ) : (
                <>
                  {isPaused ? (
                    <button
                      onClick={resumeCampaign}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Play className="w-5 h-5" />
                      Retomar
                    </button>
                  ) : (
                    <button
                      onClick={pauseCampaign}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                    >
                      <Pause className="w-5 h-5" />
                      Pausar
                    </button>
                  )}
                  <button
                    onClick={stopCampaign}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Parar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status/Info Panel */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700">Envio com delay para segurança</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700">Use variáveis para personalizar</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700">Catálogos enviados como imagens</span>
                </div>
              </div>
            </div>

            {/* Validation Errors */}
            {!canStart && reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Atenção</span>
                </div>
                <p className="text-sm text-red-600 mt-2">{reason}</p>
              </div>
            )}

            {/* Progress */}
            {currentCampaign && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Progresso</h3>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{currentCampaign.sentCount + currentCampaign.failedCount} de {currentCampaign.totalRecipients}</span>
                    <span>{Math.round(((currentCampaign.sentCount + currentCampaign.failedCount) / currentCampaign.totalRecipients) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${((currentCampaign.sentCount + currentCampaign.failedCount) / currentCampaign.totalRecipients) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-green-600">{currentCampaign.sentCount}</p>
                    <p className="text-xs text-green-700">Enviados</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-red-600">{currentCampaign.failedCount}</p>
                    <p className="text-xs text-red-700">Falhas</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2">
                  {currentCampaign.status === 'running' && !isPaused && (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      <span className="text-sm text-gray-600">Enviando...</span>
                    </>
                  )}
                  {isPaused && (
                    <>
                      <Pause className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-600">Pausado</span>
                    </>
                  )}
                  {currentCampaign.status === 'completed' && (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">Concluído</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
              <div className="bg-gray-100 rounded-lg p-4 min-h-[100px]">
                {messageText || extraImage || selectedCatalogs.length > 0 ? (
                  <div className="space-y-2">
                    {extraImage && (
                      <div className="w-full aspect-video bg-gray-200 rounded overflow-hidden">
                        <img src={extraImage} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    {messageText && (
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {messageText.replace(/{nome}/g, 'João').replace(/{telefone}/g, '11999999999')}
                      </p>
                    )}
                    {selectedCatalogs.length > 0 && (
                      <p className="text-xs text-gray-500 italic">
                        + {selectedCatalogs.reduce((acc, cId) => {
                          const cat = catalogs.find(c => c.id === cId);
                          return acc + (cat?.products.length || 0);
                        }, 0)} imagens de produtos
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center">
                    Sua mensagem aparecerá aqui...
                  </p>
                )}
              </div>
            </div>

            {/* History */}
            {campaignHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {campaignHistory.slice(0, 5).map(camp => (
                    <div key={camp.id} className="border-b border-gray-100 pb-2 last:border-0">
                      <p className="font-medium text-gray-900 text-sm">{camp.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(camp.createdAt).toLocaleDateString('pt-BR')}
                        <span className="text-green-600">{camp.sentCount} ✓</span>
                        {camp.failedCount > 0 && (
                          <span className="text-red-600">{camp.failedCount} ✗</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
