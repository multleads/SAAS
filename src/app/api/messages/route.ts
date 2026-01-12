import { NextResponse } from 'next/server';

const EVOLUTION_URL = 'http://evo-e4sowokk4gkkkwwcs8oc8sgw.177.136.229.63.sslip.io';
const API_KEY = 'MsYV46hMRN5ITLAPMWlQDxLwRFESqWm8';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const instance = searchParams.get('instance');
    
    if (!instance) {
      return NextResponse.json({ success: false, message: 'Instance required' }, { status: 400 });
    }
    
    // Try multiple endpoints to find chats
    const endpoints = [
      `${EVOLUTION_URL}/chat/findChats/${instance}`,
      `${EVOLUTION_URL}/chat/fetchChats/${instance}`,
      `${EVOLUTION_URL}/instance/fetchInstances`
    ];
    
    let allData: any[] = [];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: endpoint.includes('findChats') || endpoint.includes('fetchChats') ? 'POST' : 'GET',
          headers: { 
            'apikey': API_KEY,
            'Content-Type': 'application/json'
          },
          body: endpoint.includes('findChats') || endpoint.includes('fetchChats') ? JSON.stringify({}) : undefined
        });
        
        const data = await response.json();
        console.log(`Endpoint ${endpoint}:`, data);
        
        if (Array.isArray(data) && data.length > 0) {
          allData = data;
          break;
        }
      } catch (e) {
        console.log(`Failed endpoint ${endpoint}`);
      }
    }
    
    return NextResponse.json({ success: true, data: allData });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
