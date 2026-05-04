/**
 * Cloudflare Pages Function - Secure Groq API Proxy
 * Keeps API key server-side, never exposed to frontend
 */

interface GroqRequest {
  messages: Array<{ role: string; content: string }>;
  system?: string;
}

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Only handle POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get Groq API key from environment (set in Cloudflare Pages)
    const groqApiKey = context.env.GROQ_API_KEY;
    const groqModel = context.env.GROQ_MODEL || 'mixtral-8x7b-32768';

    if (!groqApiKey) {
      console.error('❌ GROQ_API_KEY not set in Cloudflare environment');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API configuration error',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Parse incoming request
    const body = (await request.json()) as GroqRequest;
    const { messages, system } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ success: false, error: 'messages array required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log(`📤 Proxying to Groq (${messages.length} messages)`);

    // Build Groq API request with Bible AI system prompt
    const bibleSystemPrompt = `Role & Purpose:
You are a Bible Assistant, dedicated to answering questions exclusively from Scripture using the ESV translation. Always reply in clear, natural English. Do not mention details about the translation unless the user specifically asks. 

Your answers must be grounded solely in the text of Scripture. When a user's question or the passage being discussed directly relates to any of the core beliefs listed below, incorporate and emphasize those beliefs with relevant Scripture. However, do not insert or reference the core beliefs when the question or passage does not address them. Stay strictly on topic.

Core Beliefs (Non-Negotiable Framework – Apply Only When Relevant to the Question or Passage):

• Unity in Christ, Not Denominational Divisions:  
  The Church is one body under Christ (Ephesians 4:4-6). Avoid endorsing man-made divisions (1 Corinthians 1:10). Focus on New Testament teachings as the sole authority for doctrine and practice (Philippians 2:2). Keep the unity of the Spirit in the bond of peace only when directly addressing unity.`;

    const groqMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: system || bibleSystemPrompt },
    ];

    // Add user messages
    groqMessages.push(...messages);

    const groqRequest = {
      model: groqModel,
      messages: groqMessages,
      temperature: 0.7,
      max_tokens: 2000,
    };

    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(groqRequest),
    });

    // Check response status
    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error(`❌ Groq API error (${groqResponse.status}):`, errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Groq API error: ${groqResponse.status}`,
          details: errorText,
        }),
        {
          status: groqResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const groqData = (await groqResponse.json()) as any;
    const assistantMessage = groqData.choices?.[0]?.message?.content || '';

    if (!assistantMessage) {
      console.error('❌ No response from Groq');
      return new Response(
        JSON.stringify({ success: false, error: 'No response from AI model' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log(`✅ Groq response received (${assistantMessage.length} chars)`);

    // Return response to frontend
    return new Response(
      JSON.stringify({
        success: true,
        message: assistantMessage,
        usage: groqData.usage,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('❌ Groq proxy error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};
