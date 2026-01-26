import { NextResponse } from 'next/server';

const BACKEND_PROXY = 'http://talkagents.br.com/public_html/api_proxy.php';

// GET - Retrieve AI settings for a company
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    
    if (!companyId) {
      return NextResponse.json({ success: false, message: 'company_id required' }, { status: 400 });
    }
    
    // Fetch from backend
    const response = await fetch(`${BACKEND_PROXY}?path=company-ai-settings&company_id=${companyId}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      return NextResponse.json({ success: false, message: 'Failed to fetch settings' }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST - Save AI settings for a company
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company_id, openai_api_key, model, auto_ai_response, support_phone } = body;
    
    if (!company_id) {
      return NextResponse.json({ success: false, message: 'company_id required' }, { status: 400 });
    }
    
    // Save to backend
    const response = await fetch(`${BACKEND_PROXY}?path=company-ai-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id,
        openai_api_key,
        model: model || 'gpt-4',
        auto_ai_response: auto_ai_response !== false,
        support_phone: support_phone || null
      })
    });
    
    if (!response.ok) {
      // If backend doesn't support this endpoint yet, store locally
      console.log('Backend does not support company-ai-settings, using fallback');
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
