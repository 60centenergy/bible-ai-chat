/**
 * Cloudflare Pages Function - Simple API Proxy
 * Routes /api/* requests to backend with API key forwarding
 * Uses x-api-key header authentication (no body complexity)
 */

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  
  // Backend URL
  const backendUrl = 'https://bible-ai-backend-3flg.onrender.com';
  const apiPath = url.pathname.replace('/api', '/api');
  const queryString = url.search;
  const targetUrl = `${backendUrl}${apiPath}${queryString}`;
  
  // Clone headers and pass through
  const headers = new Headers(request.headers);
  
  // Construct request init
  const init: RequestInit = {
    method: request.method,
    headers,
  };
  
  // Forward body for non-GET requests
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const cloned = request.clone();
    if (cloned.body) {
      const buffer = await cloned.arrayBuffer();
      init.body = buffer;
    }
  }
  
  try {
    const response = await fetch(targetUrl, init);
    const responseBody = await response.text();
    
    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
