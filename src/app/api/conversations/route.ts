import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization');
    
    const response = await fetch('http://talkagents.br.com/public_html/api/conversations', {
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
