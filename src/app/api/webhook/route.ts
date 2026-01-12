import { NextResponse } from 'next/server';

// In-memory storage for messages (in production, use a database)
const messagesStore: Map<string, any[]> = new Map();

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
      
      if (remoteJid) {
        const key = `${instance}_${remoteJid}`;
        const existing = messagesStore.get(key) || [];
        existing.push(message);
        // Keep only last 100 messages per chat
        if (existing.length > 100) existing.shift();
        messagesStore.set(key, existing);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const instance = searchParams.get('instance');
    const remoteJid = searchParams.get('remoteJid');
    
    if (instance && remoteJid) {
      const key = `${instance}_${remoteJid}`;
      const messages = messagesStore.get(key) || [];
      return NextResponse.json({ success: true, data: messages });
    }
    
    // Return all stored messages count for debugging
    const stats: any = {};
    messagesStore.forEach((msgs, key) => {
      stats[key] = msgs.length;
    });
    
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
