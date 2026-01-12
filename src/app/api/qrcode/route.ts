import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const instance = searchParams.get('instance');
    const action = searchParams.get('action') || 'connect';
    
    const response = await fetch(
      `http://talkagents.br.com/public_html/public/qrcode_direct.php?instance=${encodeURIComponent(instance || '')}&action=${action}`
    );
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
