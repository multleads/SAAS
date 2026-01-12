import { NextResponse } from 'next/server';

const EVOLUTION_URL = 'http://evo-e4sowokk4gkkkwwcs8oc8sgw.177.136.229.63.sslip.io';
const EVOLUTION_API_KEY = 'MsYV46hMRN5ITLAPMWlQDxLwRFESqWm8';

export async function POST(request: Request) {
  try {
    const { messageId, instance, openaiApiKey } = await request.json();
    
    if (!messageId || !instance || !openaiApiKey) {
      return NextResponse.json({ 
        success: false, 
        message: 'messageId, instance and openaiApiKey are required' 
      }, { status: 400 });
    }

    console.log('Transcribing audio for message:', messageId, 'instance:', instance);

    // Get the audio from Evolution API
    // First, try to get the media URL from the message
    const mediaResponse = await fetch(`${EVOLUTION_URL}/chat/getBase64FromMediaMessage/${instance}`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          key: {
            id: messageId
          }
        },
        convertToMp4: false
      })
    });

    if (!mediaResponse.ok) {
      const errorText = await mediaResponse.text();
      console.error('Failed to get media:', errorText);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to get audio from WhatsApp' 
      }, { status: 500 });
    }

    const mediaData = await mediaResponse.json();
    console.log('Media response:', JSON.stringify(mediaData).slice(0, 200));

    // Get base64 audio data
    const base64Audio = mediaData.base64 || mediaData.data?.base64;
    const mimeType = mediaData.mimetype || mediaData.data?.mimetype || 'audio/ogg';

    if (!base64Audio) {
      return NextResponse.json({ 
        success: false, 
        message: 'No audio data found in message' 
      }, { status: 400 });
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    // Create form data for OpenAI Whisper API
    const formData = new FormData();
    
    // Determine file extension based on mime type
    let extension = 'ogg';
    if (mimeType.includes('mp3')) extension = 'mp3';
    else if (mimeType.includes('mp4') || mimeType.includes('m4a')) extension = 'm4a';
    else if (mimeType.includes('wav')) extension = 'wav';
    else if (mimeType.includes('webm')) extension = 'webm';
    
    // Create a Blob from the buffer
    const audioBlob = new Blob([audioBuffer], { type: mimeType });
    formData.append('file', audioBlob, `audio.${extension}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

    // Send to OpenAI Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: formData
    });

    if (!whisperResponse.ok) {
      const error = await whisperResponse.json();
      console.error('Whisper API error:', error);
      return NextResponse.json({ 
        success: false, 
        message: error.error?.message || 'Failed to transcribe audio' 
      }, { status: whisperResponse.status });
    }

    const transcription = await whisperResponse.json();
    console.log('Transcription result:', transcription.text?.slice(0, 100));

    return NextResponse.json({ 
      success: true, 
      text: transcription.text,
      language: transcription.language || 'pt'
    });

  } catch (error: any) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 });
  }
}
