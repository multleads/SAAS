import { NextResponse } from 'next/server';

const EVOLUTION_URL = 'http://evo-e4sowokk4gkkkwwcs8oc8sgw.177.136.229.63.sslip.io';
const API_KEY = 'MsYV46hMRN5ITLAPMWlQDxLwRFESqWm8';

export async function POST(request: Request) {
  try {
    const { instance, remoteJid, media, caption } = await request.json();
    
    if (!instance || !remoteJid || !media) {
      return NextResponse.json({ success: false, message: 'Instance, remoteJid and media required' }, { status: 400 });
    }
    
    // Format number for Evolution API
    let number = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
    
    // Add Brazil country code if not present
    if (number.length === 11 && !number.startsWith('55')) {
      number = '55' + number;
    } else if (number.length === 10 && !number.startsWith('55')) {
      number = '55' + number;
    }
    
    console.log('Sending media to:', number, 'instance:', instance);
    
    // Evolution API v2 expects base64 in specific format
    // Extract just the base64 data without the data:image/... prefix
    let base64Data = media;
    let mimeType = 'image/jpeg';
    
    if (media.startsWith('data:')) {
      const matches = media.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        base64Data = matches[2];
      } else {
        base64Data = media.split(',')[1] || media;
      }
    }
    
    // Evolution API v2 sendMedia format
    const payload = {
      number,
      mediatype: 'image',
      mimetype: mimeType,
      caption: caption || '',
      media: base64Data
    };
    
    console.log('Payload number:', payload.number);
    console.log('Payload mediatype:', payload.mediatype);
    console.log('Payload mimetype:', payload.mimetype);
    console.log('Payload media length:', payload.media?.length);
    
    const response = await fetch(`${EVOLUTION_URL}/message/sendMedia/${instance}`, {
      method: 'POST',
      headers: { 
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    console.log('Evolution response status:', response.status);
    console.log('Evolution response:', responseText.substring(0, 300));
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }
    
    return NextResponse.json({ success: response.ok, data, status: response.status });
  } catch (error: any) {
    console.error('Send media error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
