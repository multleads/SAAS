import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization');
    
    // Mock data temporário
    if (token && token.includes('mock_token')) {
      return NextResponse.json({
        success: true,
        data: {
          total_conversations: 0,
          active_conversations: 0,
          waiting_conversations: 0,
          total_contacts: 0,
          new_contacts_today: 0,
          total_instances: 0,
          connected_instances: 0,
          average_response_time: 0,
        }
      });
    }

    // Tentar backend real
    const response = await fetch('http://talkagents.br.com/public_html/api/dashboard', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token || '',
      },
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
