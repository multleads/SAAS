import { NextResponse } from 'next/server';
import { ensureSession, fetchQRCode } from '@/lib/evolution';

async function resolveInstanceName(id: string) {
  // Fetch instance list and resolve by id (api_proxy fallback)
  try {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://talkagents.br.com/public_html';
    const res = await fetch(`${base}/api_proxy.php?path=whatsapp-instances`, { cache: 'no-store' });
    const data = await res.json();
    const inst = (data?.data || []).find((x: any) => String(x.id) === String(id));
    if (!inst) return null;
    // Prefer a deterministic session name
    return inst.instance_name || `instance_${inst.company_id}_${inst.id}`;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Instance ID is required' },
        { status: 400 }
      );
    }

    // Try Evolution API if configured
    const instanceName = await resolveInstanceName(id);
    if (instanceName) {
      try {
        await ensureSession(instanceName);
        const qr = await fetchQRCode(instanceName);
        if (qr) {
          return NextResponse.json({
            success: true,
            data: { qrcode: qr, instance_id: id, status: 'pending', expires_in: 60 },
          });
        }
      } catch {}
    }

    // Fallback: simulated QR Code SVG
    const qrCodeSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
        <rect width="256" height="256" fill="white"/>
        <!-- QR Code pattern simplificado -->
        <rect x="10" y="10" width="30" height="30" fill="black"/>
        <rect x="50" y="10" width="30" height="30" fill="black"/>
        <rect x="90" y="10" width="30" height="30" fill="black"/>
        <rect x="130" y="10" width="30" height="30" fill="black"/>
        <rect x="170" y="10" width="30" height="30" fill="black"/>
        <rect x="210" y="10" width="30" height="30" fill="black"/>
        
        <rect x="10" y="50" width="30" height="30" fill="black"/>
        <rect x="210" y="50" width="30" height="30" fill="black"/>
        
        <rect x="10" y="90" width="30" height="30" fill="black"/>
        <rect x="210" y="90" width="30" height="30" fill="black"/>
        
        <rect x="10" y="130" width="30" height="30" fill="black"/>
        <rect x="210" y="130" width="30" height="30" fill="black"/>
        
        <rect x="50" y="210" width="30" height="30" fill="black"/>
        <rect x="90" y="210" width="30" height="30" fill="black"/>
        <rect x="130" y="210" width="30" height="30" fill="black"/>
        <rect x="170" y="210" width="30" height="30" fill="black"/>
        
        <!-- Centro -->
        <rect x="110" y="110" width="36" height="36" fill="black"/>
        <rect x="115" y="115" width="26" height="26" fill="white"/>
        <rect x="120" y="120" width="16" height="16" fill="black"/>
        
        <text x="128" y="240" text-anchor="middle" font-size="10" fill="gray">ID: ${id}</text>
      </svg>
    `;

    const qrCodeBase64 = 'data:image/svg+xml;base64,' + Buffer.from(qrCodeSvg).toString('base64');

    return NextResponse.json({ success: true, data: { qrcode: qrCodeBase64, instance_id: id, status: 'pending', expires_in: 60 } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
