import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// File path for storing AI settings (in /tmp for Vercel compatibility)
const SETTINGS_FILE = '/tmp/ai_settings.json';

async function loadSettings(): Promise<Record<string, any>> {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveSettings(settings: Record<string, any>): Promise<void> {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// GET - Retrieve AI settings for an instance
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const instance = searchParams.get('instance');
    
    if (!instance) {
      return NextResponse.json({ success: false, message: 'Instance required' }, { status: 400 });
    }
    
    const settings = await loadSettings();
    const instanceSettings = settings[instance] || null;
    
    return NextResponse.json({ success: true, data: instanceSettings });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST - Save AI settings for an instance
export async function POST(request: Request) {
  try {
    const { instance, openai_api_key, model, auto_ai_response, knowledge_base } = await request.json();
    
    if (!instance) {
      return NextResponse.json({ success: false, message: 'Instance required' }, { status: 400 });
    }
    
    const settings = await loadSettings();
    settings[instance] = {
      openai_api_key,
      model: model || 'gpt-4',
      auto_ai_response: auto_ai_response !== false,
      knowledge_base: knowledge_base || [],
      updated_at: new Date().toISOString()
    };
    
    await saveSettings(settings);
    console.log('AI settings saved for instance:', instance);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
