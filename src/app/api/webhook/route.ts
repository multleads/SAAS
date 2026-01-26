import { NextResponse } from 'next/server';

const EVOLUTION_URL = 'http://evo-e4sowokk4gkkkwwcs8oc8sgw.177.136.229.63.sslip.io';
const API_KEY = 'MsYV46hMRN5ITLAPMWlQDxLwRFESqWm8';

// OpenAI API Key from environment variable (set in Vercel dashboard)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'gpt-4';

// Simple in-memory cache for processed messages (to avoid duplicates within same instance)
const recentlyProcessed = new Set<string>();

// Clean old processed IDs periodically
setInterval(() => {
  recentlyProcessed.clear();
}, 60000); // Clear every minute

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Webhook received:', JSON.stringify(data).slice(0, 500));
    
    // Handle different event types from Evolution API
    const event = data.event;
    const instance = data.instance;
    
    if (event === 'messages.upsert' && data.data) {
      const message = data.data;
      const remoteJid = message.key?.remoteJid;
      const fromMe = message.key?.fromMe;
      const messageId = message.key?.id;
      
      // Skip if from us or already processed
      if (fromMe || !messageId || recentlyProcessed.has(messageId)) {
        return NextResponse.json({ success: true });
      }
      
      // Mark as processed
      recentlyProcessed.add(messageId);
      
      // Skip group messages
      if (remoteJid?.includes('@g.us')) {
        return NextResponse.json({ success: true });
      }
      
      // Get message text or audio
      let messageText = message.message?.conversation || 
                         message.message?.extendedTextMessage?.text;
      
      // Check for audio message
      const audioMessage = message.message?.audioMessage;
      if (audioMessage && !messageText) {
        console.log('Webhook: Audio message detected, transcribing...');
        // Get API key first for transcription
        const settings = await getAiSettingsFromBackend(instance);
        if (settings?.openai_api_key) {
          messageText = await transcribeAudio(instance, messageId, settings.openai_api_key);
        }
      }
      
      if (!messageText) {
        return NextResponse.json({ success: true });
      }
      
      console.log('Webhook: New message from', remoteJid, ':', messageText.slice(0, 50));
      
      // Check if this chat is paused (attendant is responding manually)
      const isPaused = await isChatPaused(instance, remoteJid);
      if (isPaused) {
        console.log('Webhook: Chat is paused, skipping AI response for', remoteJid);
        return NextResponse.json({ success: true });
      }
      
      // Fetch AI settings from backend for the instance's company
      const settings = await getAiSettingsFromBackend(instance);
      
      if (settings?.auto_ai_response && settings?.openai_api_key) {
        // Generate and send AI response
        await generateAiResponse(instance, remoteJid, messageText, settings);
      } else {
        console.log('Webhook: AI not enabled or no API key for instance:', instance);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

async function transcribeAudio(instance: string, messageId: string, openaiApiKey: string): Promise<string | null> {
  try {
    const baseUrl = 'https://frontend-iota-flax-21.vercel.app';
    
    // Call transcribe-audio API with correct parameters
    const transcribeRes = await fetch(`${baseUrl}/api/transcribe-audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        messageId: messageId,
        instance: instance,
        openaiApiKey: openaiApiKey
      })
    });
    
    if (!transcribeRes.ok) {
      const errorText = await transcribeRes.text();
      console.log('Webhook: Transcription failed:', errorText);
      return null;
    }
    
    const transcribeData = await transcribeRes.json();
    if (transcribeData.success && transcribeData.text) {
      console.log('Webhook: Audio transcribed:', transcribeData.text.slice(0, 50));
      return transcribeData.text;
    }
    
    console.log('Webhook: Transcription returned no text');
    return null;
  } catch (error) {
    console.log('Webhook: Error transcribing audio:', error);
    return null;
  }
}

async function getCompanyKnowledgeBase(companyId: number): Promise<any[]> {
  try {
    const response = await fetch(
      `http://talkagents.br.com/public_html/api_proxy.php?path=knowledge-base&company_id=${companyId}`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        console.log('Webhook: Loaded', data.data.length, 'knowledge base items');
        return data.data;
      }
    }
  } catch (error) {
    console.log('Webhook: Error fetching knowledge base:', error);
  }
  return [];
}

async function isChatPaused(instanceName: string, remoteJid: string): Promise<boolean> {
  try {
    const response = await fetch(
      `http://talkagents.br.com/public_html/api_proxy.php?path=paused-chats&instance_name=${encodeURIComponent(instanceName)}&remote_jid=${encodeURIComponent(remoteJid)}`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.paused === true;
    }
  } catch (error) {
    console.log('Webhook: Error checking paused status:', error);
  }
  return false;
}

async function getAiSettingsFromBackend(instanceName: string): Promise<any> {
  try {
    // First, try to get company-specific settings from backend
    const instancesRes = await fetch('http://talkagents.br.com/public_html/api_proxy.php?path=whatsapp-instances', {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (instancesRes.ok) {
      const instancesData = await instancesRes.json();
      const instances = instancesData.data || [];
      const instance = instances.find((i: any) => i.instance_name === instanceName);
      
      if (instance?.company_id) {
        console.log('Webhook: Found instance for company:', instance.company_id);
        
        // Try to get company AI settings
        const settingsRes = await fetch(`http://talkagents.br.com/public_html/api_proxy.php?path=company-ai-settings&company_id=${instance.company_id}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.success && settingsData.data?.openai_api_key) {
            console.log('Webhook: Using company-specific API key');
            console.log('Webhook: support_phone from DB:', settingsData.data.support_phone);
            
            // Fetch knowledge base for this company
            const knowledgeBase = await getCompanyKnowledgeBase(instance.company_id);
            
            return {
              auto_ai_response: settingsData.data.auto_ai_response !== false,
              openai_api_key: settingsData.data.openai_api_key,
              model: settingsData.data.model || 'gpt-4',
              knowledge_base: knowledgeBase,
              support_phone: settingsData.data.support_phone || null
            };
          }
        }
      }
    }
  } catch (error) {
    console.log('Webhook: Error fetching company settings:', error);
  }
  
  // Fallback to environment variable
  if (OPENAI_API_KEY) {
    console.log('Webhook: Using OpenAI API key from environment variable (fallback)');
    return {
      auto_ai_response: true,
      openai_api_key: OPENAI_API_KEY,
      model: AI_MODEL,
      knowledge_base: []
    };
  }
  
  console.log('Webhook: No API key found');
  return null;
}

// Check if user wants to talk to a human
function wantsHumanSupport(message: string): boolean {
  const humanKeywords = [
    'falar com humano',
    'falar com atendente',
    'falar com pessoa',
    'atendente humano',
    'pessoa real',
    'quero falar com alguém',
    'quero falar com alguem',
    'atendimento humano',
    'falar com um humano',
    'preciso de ajuda humana',
    'quero um atendente',
    'transferir para atendente',
    'transferir para humano',
    'não quero falar com robô',
    'nao quero falar com robo',
    'não quero ia',
    'nao quero ia',
    'quero suporte',
    'falar com suporte',
    'humano',
    'atendente',
    'pessoa de verdade',
    'alguem real',
    'alguém real'
  ];
  
  const lowerMessage = message.toLowerCase();
  const wants = humanKeywords.some(keyword => lowerMessage.includes(keyword));
  if (wants) {
    console.log('Webhook: User wants human support, detected keyword in:', lowerMessage);
  }
  return wants;
}

// Send notification to support phone when customer wants human
async function notifySupportPhone(instance: string, supportPhone: string, customerPhone: string, customerMessage: string) {
  try {
    const notification = `🔔 *Solicitação de Atendimento Humano*\n\n` +
      `📱 *Cliente:* ${customerPhone}\n` +
      `💬 *Mensagem:* ${customerMessage}\n\n` +
      `O cliente solicitou falar com um atendente humano.`;
    
    await fetch(`${EVOLUTION_URL}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: supportPhone,
        text: notification
      })
    });
    
    console.log('Webhook: Support notification sent to', supportPhone);
  } catch (error) {
    console.error('Webhook: Error sending support notification:', error);
  }
}

async function generateAiResponse(instance: string, remoteJid: string, userMessage: string, settings: any) {
  try {
    const baseUrl = 'https://frontend-iota-flax-21.vercel.app';
    
    // Check if user wants human support
    if (wantsHumanSupport(userMessage)) {
      console.log('Webhook: User wants human support!');
      
      // Format customer number
      let customerNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
      let number = customerNumber;
      if (number.length === 11 && !number.startsWith('55')) {
        number = '55' + number;
      }
      
      // ALWAYS pause the chat so AI stops responding
      try {
        await fetch('http://talkagents.br.com/public_html/api_proxy.php?path=paused-chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instance_name: instance,
            remote_jid: remoteJid,
            paused_by: 'system_human_request'
          })
        });
        console.log('Webhook: Chat paused for human support:', remoteJid);
      } catch (pauseError) {
        console.error('Webhook: Failed to pause chat:', pauseError);
      }
      
      // Notify support phone if configured
      if (settings.support_phone) {
        console.log('Webhook: Notifying support phone:', settings.support_phone);
        await notifySupportPhone(instance, settings.support_phone, customerNumber, userMessage);
      } else {
        console.log('Webhook: No support_phone configured, chat paused but no notification sent');
      }
      
      // Send confirmation to customer
      await fetch(`${EVOLUTION_URL}/message/sendText/${instance}`, {
        method: 'POST',
        headers: { 
          'apikey': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number,
          text: 'Entendi! Um atendente humano será notificado e entrará em contato com você em breve. Por favor, aguarde. 🙂'
        })
      });
      
      console.log('Webhook: Human support confirmation sent to customer');
      return;
    }
    
    // Generate AI response
    console.log('Webhook: Generating AI response for message:', userMessage.slice(0, 50));
    const aiResponse = await fetch(`${baseUrl}/api/chat-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        apiKey: settings.openai_api_key,
        model: settings.model || 'gpt-4',
        knowledgeBase: settings.knowledge_base || [],
        conversationHistory: []
      })
    });

    const aiData = await aiResponse.json();
    if (!aiData.success || !aiData.response) {
      console.error('Webhook: AI response failed:', aiData.message);
      return;
    }

    console.log('Webhook: Sending AI response to', remoteJid);

    // Format number
    let number = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
    if (number.length === 11 && !number.startsWith('55')) {
      number = '55' + number;
    }

    // Send the response via Evolution API
    await fetch(`${EVOLUTION_URL}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number,
        text: aiData.response
      })
    });

    console.log('Webhook: AI response sent successfully');
  } catch (error) {
    console.error('Webhook: Error generating/sending AI response:', error);
  }
}

// GET endpoint for debugging
export async function GET(request: Request) {
  try {
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook is active',
      recentlyProcessedCount: recentlyProcessed.size
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
