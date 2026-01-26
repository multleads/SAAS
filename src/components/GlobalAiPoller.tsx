'use client';

// DISABLED: AI responses are now handled by the webhook server-side
// This component is kept for backwards compatibility but does nothing
// The webhook at /api/webhook handles all AI responses 24/7

export default function GlobalAiPoller() {
  // Webhook handles all AI responses now - no frontend polling needed
  return null;
}

/* ORIGINAL CODE BELOW - DISABLED TO PREVENT DUPLICATE RESPONSES

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

interface ProcessedMessage {
  remoteJid: string;
  messageId: string;
  timestamp: number;
}

// Helper to get/set processed messages from localStorage
const PROCESSED_KEY = 'ai_processed_messages';
const MAX_PROCESSED = 500; // Keep last 500 processed messages

const getProcessedMessages = (): Set<string> => {
  try {
    const stored = localStorage.getItem(PROCESSED_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch (e) {}
  return new Set();
};

const addProcessedMessage = (key: string) => {
  try {
    const processed = getProcessedMessages();
    processed.add(key);
    // Keep only last MAX_PROCESSED to avoid localStorage bloat
    const arr = Array.from(processed);
    if (arr.length > MAX_PROCESSED) {
      arr.splice(0, arr.length - MAX_PROCESSED);
    }
    localStorage.setItem(PROCESSED_KEY, JSON.stringify(arr));
  } catch (e) {}
};

const isMessageProcessed = (key: string): boolean => {
  return getProcessedMessages().has(key);
};

export default function GlobalAiPoller() {
  const { user } = useAuthStore();
  const [isActive, setIsActive] = useState(false);
  const [connectedInstance, setConnectedInstance] = useState<string | null>(null);
  const isProcessingRef = useRef(false);

  // Load AI settings
  const getAiSettings = () => {
    if (!user?.company_id) return null;
    const saved = localStorage.getItem(`ai_settings_${user.company_id}`);
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

  // Check if within working hours
  const isWithinWorkingHours = (settings: any) => {
    if (!settings?.auto_ai_during_hours) return true;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = (settings.working_hours_start || '09:00').split(':').map(Number);
    const [endH, endM] = (settings.working_hours_end || '18:00').split(':').map(Number);
    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;
    
    return currentTime >= startTime && currentTime <= endTime;
  };

  // Check if AI is paused for a specific chat (per user + remoteJid)
  const isChatAiPaused = (remoteJid: string) => {
    if (!user?.id || !remoteJid) return false;
    const isPaused = localStorage.getItem(`ai_paused_${user.id}_${remoteJid}`) === 'true';
    if (isPaused) {
      console.log('GlobalAiPoller: Chat is paused by user:', remoteJid);
    }
    return isPaused;
  };

  // Fetch connected instance
  useEffect(() => {
    const fetchInstance = async () => {
      try {
        const response = await api.get('/whatsapp-instances');
        const instances = response.data.data || [];
        
        for (const inst of instances) {
          // Filter by company if not admin_master
          if (user?.role !== 'admin_master' && inst.company_id !== user?.company_id) {
            continue;
          }
          
          const statusRes = await fetch(`/api/status?instance=${encodeURIComponent(inst.instance_name)}`);
          const statusData = await statusRes.json();
          const state = statusData.data?.state || statusData.data?.instance?.state;
          if (state === 'open') {
            setConnectedInstance(inst.instance_name);
            break;
          }
        }
      } catch (error) {
        console.error('GlobalAiPoller: Error fetching instances:', error);
      }
    };

    if (user) {
      fetchInstance();
    }
  }, [user]);

  // Check if AI should be active and sync settings to server for webhook
  useEffect(() => {
    const settings = getAiSettings();
    const shouldBeActive = settings?.auto_ai_response && 
                          settings?.openai_api_key && 
                          isWithinWorkingHours(settings);
    setIsActive(shouldBeActive);
    
    // Sync settings to server for webhook background processing
    if (connectedInstance && settings?.openai_api_key) {
      fetch('/api/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance: connectedInstance,
          openai_api_key: settings.openai_api_key,
          model: settings.model || 'gpt-4',
          auto_ai_response: settings.auto_ai_response,
          knowledge_base: getKnowledgeBase()
        })
      })
      .then(res => res.json())
      .then(data => console.log('GlobalAiPoller: Settings synced to server:', data.success))
      .catch(err => console.log('Failed to sync settings to server:', err));
    }
  }, [user, connectedInstance]);

  // Global polling for new messages
  useEffect(() => {
    if (!isActive || !connectedInstance || !user) return;

    console.log('GlobalAiPoller: Starting global polling for instance:', connectedInstance, 'isActive:', isActive);

    const pollForMessages = async () => {
      if (isProcessingRef.current) return;
      
      // Check working hours
      const settings = getAiSettings();
      if (settings && !isWithinWorkingHours(settings)) {
        return;
      }
      
      try {
        // Fetch all chats
        const chatsResponse = await fetch(`/api/messages?instance=${encodeURIComponent(connectedInstance)}`);
        const chatsData = await chatsResponse.json();
        
        if (!chatsData.success || !Array.isArray(chatsData.data)) return;

        // Check each chat for new messages
        for (const chat of chatsData.data.slice(0, 10)) { // Limit to 10 most recent chats
          const remoteJid = chat.remoteJid;
          if (!remoteJid) continue;

          // Per-chat pause: skip only this chat if user is in control
          if (isChatAiPaused(remoteJid)) {
            continue;
          }

          // Fetch messages for this chat
          const messagesResponse = await fetch(`/api/chat-messages?instance=${encodeURIComponent(connectedInstance)}&remoteJid=${encodeURIComponent(remoteJid)}`);
          const messagesData = await messagesResponse.json();

          if (!messagesData.success || !Array.isArray(messagesData.data)) continue;

          const messages = messagesData.data;
          if (messages.length === 0) continue;

          // Find ALL unprocessed received messages (not from us)
          const receivedMessages = messages.filter((msg: any) => !msg.key?.fromMe);
          
          for (const lastMessage of receivedMessages.slice(-5)) { // Check last 5 received messages
            // Skip if already processed (using localStorage for persistence)
            const messageKey = `${remoteJid}_${lastMessage.key?.id || lastMessage.messageTimestamp}`;
            if (isMessageProcessed(messageKey)) {
              continue;
            }

            // Skip old messages (older than 3 minutes)
            const messageAge = Date.now() / 1000 - (lastMessage.messageTimestamp || 0);
            if (messageAge > 180) {
              continue;
            }

            // Mark as processed immediately (persist to localStorage)
            addProcessedMessage(messageKey);

            // Get message text
            const messageText = lastMessage.message?.conversation || 
                               lastMessage.message?.extendedTextMessage?.text;
            
            // Check if it's an audio message
            const isAudio = lastMessage.messageType === 'audioMessage' || 
                           lastMessage.message?.audioMessage;
            
            // Check if it's an image/video/document
            const isMedia = lastMessage.messageType === 'imageMessage' || 
                           lastMessage.messageType === 'videoMessage' ||
                           lastMessage.messageType === 'documentMessage' ||
                           lastMessage.message?.imageMessage ||
                           lastMessage.message?.videoMessage ||
                           lastMessage.message?.documentMessage;

            console.log('GlobalAiPoller: Processing message type:', lastMessage.messageType, 'isAudio:', isAudio);

            // Handle audio messages - transcribe and respond
            if (isAudio) {
              const audioMessageId = lastMessage.key?.id;
              console.log('🎤 GlobalAiPoller: AUDIO MESSAGE DETECTED from', remoteJid, 'messageId:', audioMessageId);
              if (audioMessageId) {
                isProcessingRef.current = true;
                try {
                  console.log('🎤 GlobalAiPoller: Starting audio transcription...');
                  await processAudioMessage(remoteJid, audioMessageId, messages);
                  console.log('🎤 GlobalAiPoller: Audio processing completed');
                } catch (audioError) {
                  console.error('🎤 GlobalAiPoller: Audio processing error:', audioError);
                } finally {
                  isProcessingRef.current = false;
                }
              }
              continue;
            }

            // Skip media without text
            if (isMedia && !messageText) {
              console.log('GlobalAiPoller: Media message without text from', remoteJid);
              continue;
            }
            
            if (!messageText) continue;

            console.log('GlobalAiPoller: New text message from', remoteJid, ':', messageText.slice(0, 50));

            // Generate AI response
            isProcessingRef.current = true;
            try {
              await generateAndSendAiResponse(remoteJid, messageText, messages);
            } finally {
              isProcessingRef.current = false;
            }
          }
        }
      } catch (error) {
        console.error('GlobalAiPoller: Error polling messages:', error);
      }
    };

    const interval = setInterval(pollForMessages, 5000); // Poll every 5 seconds
    pollForMessages(); // Initial poll

    return () => clearInterval(interval);
  }, [isActive, connectedInstance, user]);

  const processAudioMessage = async (remoteJid: string, messageId: string, conversationHistory: any[]) => {
    const settings = getAiSettings();
    if (!settings?.openai_api_key) {
      console.log('GlobalAiPoller: No API key for audio transcription');
      return;
    }

    try {
      console.log('GlobalAiPoller: Transcribing audio message:', messageId);
      
      // Transcribe the audio
      const transcribeResponse = await fetch('/api/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          instance: connectedInstance,
          openaiApiKey: settings.openai_api_key
        })
      });

      const transcribeData = await transcribeResponse.json();
      
      if (!transcribeData.success || !transcribeData.text) {
        console.log('GlobalAiPoller: Failed to transcribe audio, sending fallback message');
        // Fallback: ask for text message
        await fetch('/api/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instance: connectedInstance,
            remoteJid,
            message: "Desculpe, não consegui processar seu áudio. 🎧 Poderia me enviar sua mensagem por texto? Assim consigo te ajudar melhor! 😊"
          })
        });
        return;
      }

      const transcribedText = transcribeData.text;
      console.log('GlobalAiPoller: Audio transcribed:', transcribedText.slice(0, 50));

      // Generate AI response based on transcribed text
      await generateAndSendAiResponse(remoteJid, transcribedText, conversationHistory);
      
    } catch (error) {
      console.error('GlobalAiPoller: Error processing audio:', error);
      // Fallback message
      await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance: connectedInstance,
          remoteJid,
          message: "Desculpe, tive um problema ao processar seu áudio. 🎧 Poderia me enviar sua mensagem por texto? 😊"
        })
      });
    }
  };

  const generateAndSendAiResponse = async (remoteJid: string, userMessage: string, conversationHistory: any[]) => {
    const settings = getAiSettings();
    if (!settings?.openai_api_key) return;

    try {
      // Generate AI response
      const aiResponse = await fetch('/api/chat-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          apiKey: settings.openai_api_key,
          model: settings.model || 'gpt-4',
          knowledgeBase: getKnowledgeBase(),
          conversationHistory: conversationHistory.slice(-10)
        })
      });

      const aiData = await aiResponse.json();
      if (!aiData.success || !aiData.response) {
        console.error('GlobalAiPoller: AI response failed:', aiData.message);
        return;
      }

      console.log('GlobalAiPoller: Sending AI response to', remoteJid);

      // Send the response
      await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance: connectedInstance,
          remoteJid,
          message: aiData.response
        })
      });

      console.log('GlobalAiPoller: AI response sent successfully');
    } catch (error) {
      console.error('GlobalAiPoller: Error generating/sending AI response:', error);
    }
  };

  // This component doesn't render anything visible
  return null;
}

*/
