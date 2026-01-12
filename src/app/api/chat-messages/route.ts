import { NextResponse } from 'next/server';

const EVOLUTION_URL = 'http://evo-e4sowokk4gkkkwwcs8oc8sgw.177.136.229.63.sslip.io';
const API_KEY = 'MsYV46hMRN5ITLAPMWlQDxLwRFESqWm8';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const instance = searchParams.get('instance');
    const remoteJid = searchParams.get('remoteJid');
    
    if (!instance || !remoteJid) {
      return NextResponse.json({ success: false, message: 'Instance and remoteJid required' }, { status: 400 });
    }
    
    console.log('Fetching messages for instance:', instance, 'remoteJid:', remoteJid);
    
    // Fetch messages from Evolution API
    const response = await fetch(`${EVOLUTION_URL}/chat/findMessages/${instance}`, {
      method: 'POST',
      headers: { 
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        where: { key: { remoteJid: remoteJid } },
        limit: 50
      }),
      cache: 'no-store'
    });
    
    const responseText = await response.text();
    console.log('Evolution API response status:', response.status, 'body:', responseText.slice(0, 500));
    
    if (!response.ok) {
      return NextResponse.json({ success: false, message: `Failed to fetch messages: ${responseText}` }, { status: 500 });
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json({ success: false, message: 'Invalid JSON response' }, { status: 500 });
    }
    
    // Handle different response formats
    let messages: any[] = [];
    if (Array.isArray(data)) {
      messages = data;
    } else if (data.messages?.records && Array.isArray(data.messages.records)) {
      messages = data.messages.records;
    } else if (Array.isArray(data.messages)) {
      messages = data.messages;
    } else if (Array.isArray(data.data)) {
      messages = data.data;
    }
    
    // Sort by timestamp (oldest first)
    if (messages.length > 0) {
      messages.sort((a, b) => (a.messageTimestamp || 0) - (b.messageTimestamp || 0));
    }
    
    return NextResponse.json({ 
      success: true, 
      data: messages,
      count: messages.length,
      timestamp: Date.now()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
