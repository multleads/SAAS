import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const instance = searchParams.get('instance');
    
    const response = await fetch(
      `http://evo-e4sowokk4gkkkwwcs8oc8sgw.177.136.229.63.sslip.io/instance/connectionState/${instance}`,
      { headers: { 'apikey': 'MsYV46hMRN5ITLAPMWlQDxLwRFESqWm8' } }
    );
    
    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
