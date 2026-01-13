import { NextResponse } from 'next/server';

const EVOLUTION_URL = 'http://evo-e4sowokk4gkkkwwcs8oc8sgw.177.136.229.63.sslip.io';
const API_KEY = 'MsYV46hMRN5ITLAPMWlQDxLwRFESqWm8';

export async function POST(request: Request) {
  try {
    const { instance, remoteJid, media, caption, mediatype } = await request.json();
    
    if (!instance || !remoteJid || !media) {
      return NextResponse.json({ success: false, message: 'Instance, remoteJid and media required' }, { status: 400 });
    }
    
    // Format number for Evolution API
    const number = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
    
    const response = await fetch(`${EVOLUTION_URL}/message/sendMedia/${instance}`, {
      method: 'POST',
      headers: { 
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number,
        mediatype: mediatype || 'image',
        media,
        caption: caption || ''
      })
    });
    
    const data = await response.json();
    return NextResponse.json({ success: response.ok, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
