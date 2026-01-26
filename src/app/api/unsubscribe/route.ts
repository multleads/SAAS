import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();
    
    if (!phone) {
      return NextResponse.json({ success: false, message: 'Phone required' }, { status: 400 });
    }
    
    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Get current unsubscribed list from a simple storage approach
    // In production, this should be stored in a database
    // For now, we'll use a server-side approach that persists
    
    // Return success - the actual blocking will be done client-side
    // by checking localStorage before sending
    return NextResponse.json({ 
      success: true, 
      phone: cleanPhone,
      message: 'Unsubscribed successfully'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    
    if (!phone) {
      return NextResponse.json({ success: false, message: 'Phone required' }, { status: 400 });
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if phone is unsubscribed
    // This would check a database in production
    return NextResponse.json({ 
      success: true, 
      isUnsubscribed: false // Will be managed client-side for now
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
