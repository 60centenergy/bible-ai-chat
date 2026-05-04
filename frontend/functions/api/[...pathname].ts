/**
 * Cloudflare Pages Function - API Proxy
 * Routes all /api/* requests to the Render backend
 * Eliminates CORS issues by proxying server-to-server
 */

interface Env {
  BACKEND_URL?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  
  // Construct the backend URL
  const backendUrl = 'https://bible-ai-backend-3flg.onrender.com';
  const apiPath = url.pathname.replace('/api', '/api'); // Keep the /api prefix
  const queryString = url.search;
  
  const targetUrl = `${backendUrl}${apiPath}${queryString}`;
  
  // Forward the request to the backend
  const init: RequestInit = {
    method: request.method,
    headers: new Headers(request.headers),
  };
  
  // Copy request body if present
  if (request.body && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
    init.body = request.body;
  }
  
  try {
    const response = await fetch(targetUrl, init);
    
    // Create a new response with the backend's response
    const responseInit: ResponseInit = {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    };
    
    // Ensure CORS headers are set (though not strictly needed, good practice)
    responseInit.headers?.set('Access-Control-Allow-Origin', '*');
    
    return new Response(response.body, responseInit);
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Backend request failed', details: String(error) }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
