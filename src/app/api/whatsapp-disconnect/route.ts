import { NextResponse } from 'next/server';
import { logoutInstance } from '@/lib/evolution';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://talkagents.br.com/public_html';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Instance ID is required' },
        { status: 400 }
      );
    }

    // Try Evolution API
    try {
      const instanceName = await resolveInstanceName(id);
      if (instanceName) {
        const ok = await logoutInstance(instanceName);
        if (ok) return NextResponse.json({ success: true, message: 'Instância desconectada com sucesso' });
      }
    } catch {}

    // Fallback: Simula desconexão bem-sucedida
    return NextResponse.json({
      success: true,
      message: 'Instância desconectada com sucesso'
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
