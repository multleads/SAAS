import { NextResponse } from 'next/server';

const BACKEND_PROXY = 'http://talkagents.br.com/public_html/api_proxy.php';

// GET - Check if a chat is paused
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const instanceName = searchParams.get('instance_name');
    const remoteJid = searchParams.get('remote_jid');
    
    if (!instanceName) {
      return NextResponse.json({ success: false, message: 'instance_name required' }, { status: 400 });
    }
    
    let url = `${BACKEND_PROXY}?path=paused-chats&instance_name=${encodeURIComponent(instanceName)}`;
    if (remoteJid) {
      url += `&remote_jid=${encodeURIComponent(remoteJid)}`;
    }
    
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST - Pause a chat
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_PROXY}?path=paused-chats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE - Resume a chat (remove pause)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const instanceName = searchParams.get('instance_name');
    const remoteJid = searchParams.get('remote_jid');
    
    if (!instanceName || !remoteJid) {
      return NextResponse.json({ success: false, message: 'instance_name and remote_jid required' }, { status: 400 });
    }
    
    const response = await fetch(
      `${BACKEND_PROXY}?path=paused-chats&instance_name=${encodeURIComponent(instanceName)}&remote_jid=${encodeURIComponent(remoteJid)}`,
      { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
    );
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
