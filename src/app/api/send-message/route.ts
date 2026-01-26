import { NextResponse } from 'next/server';

const EVOLUTION_URL = 'http://evo-e4sowokk4gkkkwwcs8oc8sgw.177.136.229.63.sslip.io';
const API_KEY = 'MsYV46hMRN5ITLAPMWlQDxLwRFESqWm8';

export async function POST(request: Request) {
  try {
    const { instance, remoteJid, message } = await request.json();
    
    if (!instance || !remoteJid || !message) {
      return NextResponse.json({ success: false, message: 'Instance, remoteJid and message required' }, { status: 400 });
    }
    
    // Format number for Evolution API - remove @ suffix and ensure country code
    let number = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
    
    // Add Brazil country code if not present (for numbers starting with DDD)
    if (number.length === 11 && !number.startsWith('55')) {
      number = '55' + number;
    } else if (number.length === 10 && !number.startsWith('55')) {
      number = '55' + number;
    }
    
    console.log('Sending message to:', number, 'via instance:', instance);
    
    const response = await fetch(`${EVOLUTION_URL}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number,
        text: message
      })
    });
    
    const data = await response.json();
    console.log('Evolution API response:', data);
    return NextResponse.json({ success: response.ok, data });
  } catch (error: any) {
    console.error('Send message error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
