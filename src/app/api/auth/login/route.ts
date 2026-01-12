import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Mock login temporário
    if (body.email === 'admin@multleads.com' && body.password === 'admin123') {
      return NextResponse.json({
        success: true,
        data: {
          token: 'mock_token_' + Date.now(),
          user: {
            id: 1,
            name: 'Administrador Master',
            email: 'admin@multleads.com',
            role: 'admin_master',
            company: { id: 1, name: 'MultLeads' }
          }
        }
      });
    }

    try {
      const response = await fetch('http://talkagents.br.com/public_html/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) return NextResponse.json(data, { status: response.status });
    } catch (e) {}

    return NextResponse.json({ success: false, message: 'Credenciais inválidas' }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
