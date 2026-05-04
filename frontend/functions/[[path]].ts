/**
 * Cloudflare Pages Function - Root Catch-All
 * Handles all requests and routes /api/* to backend
 */

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;
  const url = new URL(request.url);

  // Only proxy API requests to backend
  if (!url.pathname.startsWith('/api/')) {
    // For non-API requests, return a 404 or let Cloudflare handle it
    return context.next();
  }

  try {
    const backendUrl = 'https://bible-ai-backend-3flg.onrender.com';
    const targetUrl = `${backendUrl}${url.pathname}${url.search}`;

    // Prepare fetch options
    const fetchInit: RequestInit = {
      method: request.method,
      headers: request.headers,
    };

    // Handle request body for POST/PATCH/PUT
    if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
      if (request.body) {
        const bodyText = await request.text();
        fetchInit.body = bodyText;
      }
    }

    // Make request to backend
    const response = await fetch(targetUrl, fetchInit);

    // Return the response from backend
    const body = await response.text();
    
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error('API proxy error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'API proxy error: ' + (error instanceof Error ? error.message : String(error))
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
