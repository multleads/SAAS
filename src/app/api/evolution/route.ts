import { NextResponse } from 'next/server';

const EVOLUTION_URL = 'http://evo-e4sowokk4gkkkwwcs8oc8sgw.177.136.229.63.sslip.io';
const API_KEY = 'MsYV46hMRN5ITLAPMWlQDxLwRFESqWm8';

export async function POST(request: Request) {
  try {
    const { action, instanceName } = await request.json();
    
    let url = '';
    let method = 'GET';
    let body = null;
    
    switch (action) {
      case 'create':
        url = `${EVOLUTION_URL}/instance/create`;
        method = 'POST';
        body = JSON.stringify({
          instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        });
        break;
      case 'connect':
        url = `${EVOLUTION_URL}/instance/connect/${instanceName}`;
        break;
      case 'status':
        url = `${EVOLUTION_URL}/instance/connectionState/${instanceName}`;
        break;
      case 'delete':
        url = `${EVOLUTION_URL}/instance/delete/${instanceName}`;
        method = 'DELETE';
        break;
      case 'logout':
        url = `${EVOLUTION_URL}/instance/logout/${instanceName}`;
        method = 'DELETE';
        break;
      default:
        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY
      },
      body
    });
    
    const data = await response.json();
    return NextResponse.json({ success: response.ok, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
