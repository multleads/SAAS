import { NextResponse } from 'next/server';

const EVOLUTION_URL = 'http://evo-e4sowokk4gkkkwwcs8oc8sgw.177.136.229.63.sslip.io';
const API_KEY = 'MsYV46hMRN5ITLAPMWlQDxLwRFESqWm8';

export async function POST(request: Request) {
  try {
    const { instance, webhookUrl } = await request.json();
    
    if (!instance || !webhookUrl) {
      return NextResponse.json({ success: false, message: 'Instance and webhookUrl required' }, { status: 400 });
    }
    
    // Configure webhook in Evolution API
    const response = await fetch(`${EVOLUTION_URL}/webhook/set/${instance}`, {
      method: 'POST',
      headers: { 
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: false,
        events: [
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'MESSAGES_DELETE',
          'SEND_MESSAGE',
          'CONNECTION_UPDATE'
        ]
      })
    });
    
    const data = await response.json();
    return NextResponse.json({ success: response.ok, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
