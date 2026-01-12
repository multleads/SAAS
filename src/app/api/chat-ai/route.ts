import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, apiKey, model, knowledgeBase, conversationHistory } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json({ success: false, message: 'API key não configurada' }, { status: 400 });
    }
    
    if (!message) {
      return NextResponse.json({ success: false, message: 'Mensagem não fornecida' }, { status: 400 });
    }

    // Build system prompt with knowledge base
    let systemPrompt = `Você é um assistente virtual de atendimento ao cliente simpático e acolhedor.

INSTRUÇÕES DE COMPORTAMENTO:
- Seja sempre cordial, amigável e caloroso nas respostas
- Use um tom conversacional e humano, como se estivesse conversando com um amigo
- Termine suas respostas com: "Precisa que te auxilie em algo mais?"
- Evite respostas secas ou muito curtas
- Use emojis com moderação quando apropriado (😊, 👍, ✨)
- Responda sempre em português brasileiro
- Seja prestativo e proativo, oferecendo informações adicionais quando relevante

EXEMPLO DE TOM IDEAL:
Pergunta: "Vocês são fabricantes?"
Resposta: "Sim! Nós fabricamos etiquetas com chips NFC, QR Code e demais aviamentos para roupas. Precisa que te auxilie em algo mais? 😊"`;
    
    if (knowledgeBase && knowledgeBase.length > 0) {
      systemPrompt += `\n\nBASE DE CONHECIMENTO DA EMPRESA:\n`;
      knowledgeBase.forEach((item: any) => {
        systemPrompt += `\nPergunta: ${item.question}\nResposta: ${item.answer}\n`;
      });
      systemPrompt += `\nUse essas informações para responder perguntas relacionadas, sempre mantendo o tom amigável e acolhedor.`;
    }

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history for context (last 10 messages)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      recentHistory.forEach((msg: any) => {
        const role = msg.key?.fromMe ? 'assistant' : 'user';
        const content = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
        if (content) {
          messages.push({ role, content });
        }
      });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'gpt-4',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI error:', error);
      return NextResponse.json({ 
        success: false, 
        message: error.error?.message || 'Erro na API OpenAI' 
      }, { status: response.status });
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || '';

    return NextResponse.json({ 
      success: true, 
      response: aiResponse,
      usage: data.usage
    });

  } catch (error: any) {
    console.error('Error in chat-ai:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
