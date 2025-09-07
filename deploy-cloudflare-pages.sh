#!/bin/bash

# Deployment script for Cloudflare Pages
echo "🚀 Starting deployment to Cloudflare Pages..."

# Build the Next.js application
echo "📦 Building Next.js application..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully!"

# Create deployment directory
echo "📁 Preparing deployment files..."
mkdir -p .cloudflare-pages

# Copy static files to deployment directory
cp -r .next/static .cloudflare-pages/_next/static
cp -r public/* .cloudflare-pages/ 2>/dev/null || true
cp _headers .cloudflare-pages/
cp _redirects .cloudflare-pages/

# Copy standalone server files if using output: 'standalone'
if [ -d ".next/standalone" ]; then
    cp -r .next/standalone/* .cloudflare-pages/
fi

echo "📝 Creating Cloudflare Pages configuration..."

# Create functions directory for API routes
mkdir -p functions/api

# Create a function to handle API routes
cat > functions/[[path]].js << 'EOF'
export async function onRequest(context) {
  const { request, env, params } = context;
  
  // Handle API routes
  if (request.url.includes('/api/')) {
    return new Response(JSON.stringify({ 
      message: 'API endpoint - connect to your database here',
      path: params.path 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // For non-API routes, serve the static files
  return env.ASSETS.fetch(request);
}
EOF

echo "✅ Deployment files ready!"
echo ""
echo "📌 Next steps:"
echo "1. Install Wrangler CLI: npm install -g wrangler"
echo "2. Login to Cloudflare: wrangler login"
echo "3. Deploy to Cloudflare Pages:"
echo "   wrangler pages publish .cloudflare-pages --project-name=gasah"
echo ""
echo "Or use the Cloudflare Dashboard:"
echo "1. Go to https://dash.cloudflare.com/"
echo "2. Select Pages"
echo "3. Create a new project or update existing 'gasah' project"
echo "4. Upload the .cloudflare-pages directory"
echo ""
echo "🔧 Environment variables to set in Cloudflare Pages:"
echo "- NEXT_PUBLIC_APP_URL=https://gasah.pages.dev"
echo "- NODE_ENV=production"
echo "- Add your database connection variables"