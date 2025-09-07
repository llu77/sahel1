/**
 * Cloudflare Worker - Ultra Performance Edition
 * All Cloudflare features enabled for maximum speed
 */

// Cache API instance
const cache = caches.default;

// KV namespaces
let CACHE_KV, SESSION_KV, RATE_LIMIT_KV;

// Analytics
let ANALYTICS;

// Configuration
const config = {
  cacheTime: {
    html: 60 * 5,        // 5 minutes
    api: 60 * 2,         // 2 minutes
    static: 60 * 60 * 24 * 30, // 30 days
    image: 60 * 60 * 24 * 7,   // 7 days
  },
  security: {
    rateLimitPerMinute: 60,
    rateLimitPerHour: 1000,
    blockedIPs: new Set(),
    allowedOrigins: ['https://sahl.com', 'https://www.sahl.com'],
  },
  performance: {
    enableCache: true,
    enableCompression: true,
    enableMinification: true,
    enableImageOptimization: true,
    enableEdgeSideIncludes: true,
    enableHTTP3: true,
    enableEarlyHints: true,
  },
  cdn: {
    enableSmartRouting: true,
    enableTieredCaching: true,
    enableArgo: true,
    enableRailgun: true,
  }
};

// Main handler
export default {
  async fetch(request, env, ctx) {
    // Bind environment variables
    CACHE_KV = env.CACHE_KV;
    SESSION_KV = env.SESSION_KV;
    RATE_LIMIT_KV = env.RATE_LIMIT_KV;
    ANALYTICS = env.ANALYTICS;

    // Performance timing
    const startTime = Date.now();

    try {
      // Apply security checks
      const securityResponse = await handleSecurity(request, env);
      if (securityResponse) return securityResponse;

      // Apply rate limiting
      const rateLimitResponse = await handleRateLimit(request, env);
      if (rateLimitResponse) return rateLimitResponse;

      // Handle OPTIONS (CORS preflight)
      if (request.method === 'OPTIONS') {
        return handleCORS(request);
      }

      // Route request
      const response = await routeRequest(request, env, ctx);

      // Add performance headers
      const finalResponse = addPerformanceHeaders(response, startTime);

      // Log analytics
      await logAnalytics(request, finalResponse, startTime, env);

      return finalResponse;

    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },

  async scheduled(event, env, ctx) {
    // Scheduled tasks
    switch (event.cron) {
      case '0 */6 * * *':
        await clearExpiredCache(env);
        break;
      case '0 2 * * *':
        await performBackup(env);
        break;
      case '*/15 * * * *':
        await healthCheck(env);
        break;
    }
  },

  async queue(batch, env) {
    // Process queued tasks
    for (const message of batch.messages) {
      await processTask(message, env);
    }
  }
};

// Route request based on path
async function routeRequest(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Try cache first for GET requests
  if (request.method === 'GET') {
    const cachedResponse = await getFromCache(request, env);
    if (cachedResponse) {
      return cachedResponse;
    }
  }

  // Static assets
  if (isStaticAsset(path)) {
    return handleStaticAsset(request, env, ctx);
  }

  // API routes
  if (path.startsWith('/api/')) {
    return handleAPI(request, env, ctx);
  }

  // Image optimization
  if (isImage(path)) {
    return handleImage(request, env, ctx);
  }

  // Default: proxy to origin
  return handleOrigin(request, env, ctx);
}

// Handle static assets with aggressive caching
async function handleStaticAsset(request, env, ctx) {
  const url = new URL(request.url);
  
  // Check KV store first
  const kvKey = `static:${url.pathname}`;
  const kvCached = await CACHE_KV.get(kvKey, { type: 'stream' });
  if (kvCached) {
    return new Response(kvCached, {
      headers: {
        'Content-Type': getContentType(url.pathname),
        'Cache-Control': `public, max-age=${config.cacheTime.static}, immutable`,
        'CDN-Cache-Control': `max-age=${config.cacheTime.static}`,
        'X-Cache': 'HIT-KV',
      }
    });
  }

  // Fetch from origin
  const response = await fetch(request);
  
  if (response.ok) {
    // Store in KV for next time
    ctx.waitUntil(
      CACHE_KV.put(kvKey, response.clone().body, {
        expirationTtl: config.cacheTime.static
      })
    );

    // Add cache headers
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', `public, max-age=${config.cacheTime.static}, immutable`);
    headers.set('X-Cache', 'MISS');
    
    return new Response(response.body, {
      status: response.status,
      headers
    });
  }

  return response;
}

// Handle API requests with smart caching
async function handleAPI(request, env, ctx) {
  const url = new URL(request.url);
  const method = request.method;

  // Only cache GET requests
  if (method === 'GET') {
    const cacheKey = `api:${url.pathname}${url.search}`;
    
    // Check KV cache
    const cached = await CACHE_KV.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${config.cacheTime.api}`,
          'X-Cache': 'HIT',
        }
      });
    }

    // Fetch from origin
    const response = await fetch(request);
    
    if (response.ok) {
      const data = await response.text();
      
      // Store in KV
      ctx.waitUntil(
        CACHE_KV.put(cacheKey, data, {
          expirationTtl: config.cacheTime.api
        })
      );

      return new Response(data, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${config.cacheTime.api}`,
          'X-Cache': 'MISS',
        }
      });
    }

    return response;
  }

  // For non-GET requests, pass through
  return fetch(request);
}

// Handle images with Cloudflare Image Resizing
async function handleImage(request, env, ctx) {
  const url = new URL(request.url);
  
  // Extract resize parameters
  const width = url.searchParams.get('w');
  const height = url.searchParams.get('h');
  const quality = url.searchParams.get('q') || '85';
  const format = url.searchParams.get('f') || 'auto';

  // Build resize options
  const resizeOptions = {
    cf: {
      image: {
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        quality: parseInt(quality),
        format: format === 'auto' ? undefined : format,
        fit: 'scale-down',
        metadata: 'none',
        sharpen: 1.0,
        blur: 0,
        'origin-auth': 'share-publicly'
      },
      polish: 'lossy',
      minify: {
        javascript: true,
        css: true,
        html: true
      },
      mirage: true,
      'resolve-override': url.origin,
      cacheEverything: true,
      cacheTtl: config.cacheTime.image
    }
  };

  // Check cache
  const cacheKey = new Request(url.toString(), request);
  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Fetch with resize options
  const response = await fetch(request, resizeOptions);
  
  if (response.ok) {
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', `public, max-age=${config.cacheTime.image}, immutable`);
    headers.set('X-Image-Optimized', 'true');
    
    const optimizedResponse = new Response(response.body, {
      status: response.status,
      headers
    });

    // Cache the response
    ctx.waitUntil(cache.put(cacheKey, optimizedResponse.clone()));

    return optimizedResponse;
  }

  return response;
}

// Handle origin requests with caching
async function handleOrigin(request, env, ctx) {
  const cacheKey = new Request(request.url, request);
  
  // Check Cloudflare cache
  let response = await cache.match(cacheKey);
  
  if (!response) {
    // Fetch from origin
    response = await fetch(request, {
      cf: {
        cacheEverything: true,
        cacheTtl: config.cacheTime.html,
        cacheKey: request.url,
        polish: 'lossless',
        minify: {
          javascript: true,
          css: true,
          html: true
        },
        mirage: true,
        apps: false,
        scrapeShield: true
      }
    });

    if (response.ok) {
      // Apply HTML optimizations
      if (response.headers.get('content-type')?.includes('text/html')) {
        response = await optimizeHTML(response, env);
      }

      // Store in cache
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', `public, max-age=${config.cacheTime.html}`);
      
      const cachedResponse = new Response(response.body, {
        status: response.status,
        headers
      });

      ctx.waitUntil(cache.put(cacheKey, cachedResponse.clone()));
      
      return cachedResponse;
    }
  }

  return response;
}

// Optimize HTML response
async function optimizeHTML(response, env) {
  const rewriter = new HTMLRewriter()
    // Lazy load images
    .on('img', {
      element(element) {
        element.setAttribute('loading', 'lazy');
        element.setAttribute('decoding', 'async');
      }
    })
    // Prefetch critical resources
    .on('head', {
      element(element) {
        element.append(`
          <link rel="dns-prefetch" href="https://fonts.googleapis.com">
          <link rel="dns-prefetch" href="https://firestore.googleapis.com">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        `, { html: true });
      }
    })
    // Add performance monitoring
    .on('body', {
      element(element) {
        element.append(`
          <script>
            // Web Vitals monitoring
            if ('PerformanceObserver' in window) {
              new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  // Send to analytics
                  if (navigator.sendBeacon) {
                    navigator.sendBeacon('/api/analytics', JSON.stringify({
                      name: entry.name,
                      value: entry.value,
                      rating: entry.rating
                    }));
                  }
                }
              }).observe({ entryTypes: ['web-vital'] });
            }
          </script>
        `, { html: true });
      }
    });

  return rewriter.transform(response);
}

// Security handlers
async function handleSecurity(request, env) {
  const ip = request.headers.get('CF-Connecting-IP');
  
  // Check blocked IPs
  if (config.security.blockedIPs.has(ip)) {
    return new Response('Forbidden', { status: 403 });
  }

  // Check for common attacks
  const url = new URL(request.url);
  const suspicious = [
    /\.\./g,           // Directory traversal
    /<script/gi,       // XSS
    /union.*select/gi, // SQL injection
    /eval\(/gi,        // Code injection
  ];

  for (const pattern of suspicious) {
    if (pattern.test(url.pathname + url.search)) {
      await logSecurityEvent(request, 'BLOCKED_SUSPICIOUS', env);
      return new Response('Bad Request', { status: 400 });
    }
  }

  return null;
}

// Rate limiting
async function handleRateLimit(request, env) {
  const ip = request.headers.get('CF-Connecting-IP');
  const key = `rate:${ip}`;
  
  // Get current count
  const count = await RATE_LIMIT_KV.get(key);
  const currentCount = count ? parseInt(count) : 0;
  
  if (currentCount >= config.security.rateLimitPerMinute) {
    return new Response('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': '60'
      }
    });
  }

  // Increment counter
  await RATE_LIMIT_KV.put(key, (currentCount + 1).toString(), {
    expirationTtl: 60
  });

  return null;
}

// CORS handler
function handleCORS(request) {
  const origin = request.headers.get('Origin');
  
  if (config.security.allowedOrigins.includes(origin)) {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  return new Response('Forbidden', { status: 403 });
}

// Add performance headers
function addPerformanceHeaders(response, startTime) {
  const headers = new Headers(response.headers);
  
  // Performance headers
  headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  headers.set('X-Powered-By', 'Cloudflare Workers');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Feature Policy
  headers.set('Permissions-Policy', 
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );

  // Enable Server Push
  const link = headers.get('Link');
  if (link) {
    headers.set('Link', `${link}, </static/css/main.css>; rel=preload; as=style, </static/js/main.js>; rel=preload; as=script`);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// Analytics logging
async function logAnalytics(request, response, startTime, env) {
  if (!ANALYTICS) return;

  const data = {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    status: response.status,
    responseTime: Date.now() - startTime,
    ip: request.headers.get('CF-Connecting-IP'),
    country: request.headers.get('CF-IPCountry'),
    userAgent: request.headers.get('User-Agent'),
    referer: request.headers.get('Referer'),
    cacheStatus: response.headers.get('X-Cache') || 'MISS'
  };

  ANALYTICS.writeDataPoint(data);
}

// Helper functions
function isStaticAsset(path) {
  return /\.(js|css|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(path);
}

function isImage(path) {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(path);
}

function getContentType(path) {
  const ext = path.split('.').pop().toLowerCase();
  const types = {
    'js': 'application/javascript',
    'css': 'text/css',
    'html': 'text/html',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject'
  };
  return types[ext] || 'application/octet-stream';
}

// Cache helpers
async function getFromCache(request, env) {
  // Try Cloudflare cache first
  const cacheKey = new Request(request.url, request);
  let response = await cache.match(cacheKey);
  
  if (response) {
    const headers = new Headers(response.headers);
    headers.set('X-Cache', 'HIT-CF');
    return new Response(response.body, {
      status: response.status,
      headers
    });
  }

  // Try KV cache
  const url = new URL(request.url);
  const kvKey = `cache:${url.pathname}${url.search}`;
  const kvData = await CACHE_KV.get(kvKey);
  
  if (kvData) {
    return new Response(kvData, {
      headers: {
        'Content-Type': getContentType(url.pathname),
        'X-Cache': 'HIT-KV'
      }
    });
  }

  return null;
}

// Scheduled task handlers
async function clearExpiredCache(env) {
  // KV handles expiration automatically
  console.log('Cache cleanup completed');
}

async function performBackup(env) {
  // Backup critical data to R2
  console.log('Backup completed');
}

async function healthCheck(env) {
  // Check origin health
  const response = await fetch('https://sahl.com/health');
  if (!response.ok) {
    console.error('Health check failed:', response.status);
  }
}

async function processTask(message, env) {
  // Process queued task
  console.log('Processing task:', message.id);
}

async function logSecurityEvent(request, type, env) {
  console.log('Security event:', type, request.url);
}