import { NextResponse } from 'next/server';

const BACKEND_PROXY = 'http://talkagents.br.com/public_html/api_proxy.php';

// GET - Retrieve products for a catalog
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const catalogId = searchParams.get('catalog_id');
    
    if (!catalogId) {
      return NextResponse.json({ success: false, message: 'catalog_id required' }, { status: 400 });
    }
    
    const response = await fetch(`${BACKEND_PROXY}?path=catalog-products&catalog_id=${catalogId}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST - Create a new product
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_PROXY}?path=catalog-products`, {
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

// PUT - Update a product
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });
    }
    
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_PROXY}?path=catalog-products&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE - Delete a product
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });
    }
    
    const response = await fetch(`${BACKEND_PROXY}?path=catalog-products&id=${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
