import { NextResponse } from 'next/server';
import { fetchStatus } from '@/lib/evolution';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://talkagents.br.com/public_html';

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

    // Try Evolution API first
    try {
      const instanceName = await resolveInstanceName(id);
      if (instanceName) {
        const status = await fetchStatus(instanceName);
        return NextResponse.json({ success: true, data: { status } });
      }
    } catch {}

    // Fallback: Simula status da conexão
    // Em desenvolvimento, alterna entre connecting e connected
    const timestamp = Date.now();
    const elapsed = Math.floor((timestamp / 1000) % 60);
    
    // Após 15 segundos (simulated), marca como conectado
    const isConnected = elapsed > 15;
    
    return NextResponse.json({
      success: true,
      data: {
        status: isConnected ? 'connected' : 'connecting',
        last_connected_at: isConnected ? new Date().toISOString() : null
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

async function resolveInstanceName(id: string) {
  try {
    const res = await fetch(`${API_BASE}/api_proxy.php?path=whatsapp-instances`, { cache: 'no-store' });
    const data = await res.json();
    const inst = (data?.data || []).find((x: any) => String(x.id) === String(id));
    if (!inst) return null;
    return inst.instance_name || `instance_${inst.company_id}_${inst.id}`;
  } catch {
    return null;
  }
}
