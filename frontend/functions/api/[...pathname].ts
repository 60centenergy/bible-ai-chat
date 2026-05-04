/**
 * Cloudflare Pages Function - API Proxy
 * Routes /api/* requests to backend and forwards all headers/body
 */

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;
  
  try {
    const url = new URL(request.url);
    const backendUrl = 'https://bible-ai-backend-3flg.onrender.com';
    
    // Build target URL - preserve the /api path
    const apiPath = url.pathname; // Already includes /api
    const queryString = url.search;
    const targetUrl = `${backendUrl}${apiPath}${queryString}`;
    
    // Prepare request options
    const fetchInit: RequestInit = {
      method: request.method,
      headers: request.headers,
    };
    
    // Handle request body for POST/PATCH/PUT
    if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
      // Clone and read body
      const contentType = request.headers.get('content-type');
      if (contentType && request.body) {
        const bodyText = await request.text();
        fetchInit.body = bodyText;
      }
    }
    
    // Make request to backend
    const response = await fetch(targetUrl, fetchInit);
    
    // Clone response and return
    const clonedResponse = response.clone();
    const body = await clonedResponse.text();
    
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Proxy error: ' + (error instanceof Error ? error.message : String(error))
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
