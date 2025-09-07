/**
 * Cloudflare Pages Function
 * Handles dynamic routes and API endpoints
 */

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  
  // Handle API routes
  if (url.pathname.startsWith('/api/')) {
    // CORS headers for API
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    // Handle OPTIONS request
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Return a placeholder response for now
    // In production, this would connect to your database
    return new Response(
      JSON.stringify({
        message: 'API endpoint ready for database connection',
        path: url.pathname,
        method: request.method,
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
  
  // For non-API routes, let Pages handle the static files
  return env.ASSETS.fetch(request);
}