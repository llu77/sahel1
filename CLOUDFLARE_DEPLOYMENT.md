# Cloudflare Pages Deployment Guide for GASAH

## 🚀 Deployment Steps

### 1. Prerequisites
- Cloudflare account with Pages enabled
- Domain gasah.com configured in Cloudflare
- Git repository (GitHub/GitLab) or direct upload capability

### 2. Build Configuration

**Build command:**
```bash
npm run build
```

**Build output directory:**
```
.next
```

**Node version:**
```
18.x or higher
```

### 3. Environment Variables

Add these in Cloudflare Pages dashboard:

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://gasah.pages.dev

# Database (if using external database)
DATABASE_URL=your_database_url
DATABASE_AUTH_TOKEN=your_auth_token

# Authentication
JWT_SECRET=your-secret-key-change-in-production
NEXTAUTH_URL=https://gasah.pages.dev
NEXTAUTH_SECRET=your-nextauth-secret

# API Keys (if needed)
API_KEY=your-api-key
```

### 4. Deployment via Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Pages
3. Click "Create a project"
4. Choose deployment method:
   - **Git Integration**: Connect GitHub/GitLab repository
   - **Direct Upload**: Upload the built project

5. Configure build settings:
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`

6. Add environment variables from step 3

7. Click "Save and Deploy"

### 5. Deployment via Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy to Pages
wrangler pages publish .next --project-name=gasah

# Or use npm script
npm run deploy:cloudflare
```

### 6. Custom Domain Setup

1. In Cloudflare Pages dashboard, go to your project
2. Navigate to "Custom domains"
3. Add domain: `gasah.com`
4. Add subdomain: `www.gasah.com`
5. Cloudflare will automatically configure DNS

### 7. Database Migration

Since we're moving from local JSON to a proper database, run:

```bash
# If using D1 (Cloudflare's database)
wrangler d1 create gasah-db
wrangler d1 execute gasah-db --file=./migrations/init.sql

# If using external database (Supabase, PlanetScale, etc.)
npm run db:migrate
```

### 8. Cloudflare Features Configuration

Enable these features in Cloudflare dashboard:

#### Performance
- ✅ Auto Minify (JavaScript, CSS, HTML)
- ✅ Brotli Compression
- ✅ HTTP/2 & HTTP/3
- ✅ Early Hints
- ✅ Rocket Loader
- ✅ Argo Smart Routing
- ✅ Tiered Cache
- ✅ Cache Level: Standard
- ✅ Browser Cache TTL: 4 hours

#### Security
- ✅ SSL/TLS: Full (strict)
- ✅ Always Use HTTPS
- ✅ Automatic HTTPS Rewrites
- ✅ TLS 1.3
- ✅ Web Application Firewall (WAF)
- ✅ Bot Fight Mode
- ✅ Challenge Passage: 30 minutes

#### Images
- ✅ Polish: Lossy
- ✅ WebP conversion
- ✅ Image Resizing
- ✅ Mirage (mobile optimization)

#### Network
- ✅ IPv6 Compatibility
- ✅ WebSockets
- ✅ gRPC
- ✅ Pseudo IPv4

#### Workers & Pages
- ✅ Custom Headers (via _headers file)
- ✅ Redirects (via _redirects file)
- ✅ Functions for API routes

### 9. Page Rules

Create these page rules in Cloudflare:

1. **Cache Everything for Static Assets**
   - URL: `*gasah.com/_next/static/*`
   - Settings: 
     - Cache Level: Cache Everything
     - Edge Cache TTL: 1 month
     - Browser Cache TTL: 1 year

2. **Bypass Cache for API**
   - URL: `*gasah.com/api/*`
   - Settings:
     - Cache Level: Bypass
     - Disable Performance

3. **Force HTTPS**
   - URL: `http://*gasah.com/*`
   - Settings:
     - Always Use HTTPS

### 10. Monitoring & Analytics

Enable in Cloudflare dashboard:
- Web Analytics
- Real User Monitoring (RUM)
- Error tracking
- Performance insights

### 11. Backup & Rollback

Cloudflare Pages keeps deployment history:
- Access previous deployments in dashboard
- Instant rollback capability
- Preview deployments for branches

### 12. Post-Deployment Checklist

- [ ] Verify all pages load correctly
- [ ] Test authentication flow
- [ ] Check API endpoints
- [ ] Verify database connections
- [ ] Test print functionality
- [ ] Check mobile responsiveness
- [ ] Verify SSL certificate
- [ ] Test form submissions
- [ ] Check error pages (404, 500)
- [ ] Monitor performance metrics

## 🔧 Troubleshooting

### Build Failures
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### API Routes Not Working
- Ensure Functions directory is properly configured
- Check environment variables are set
- Verify database connections

### Slow Performance
- Enable Argo Smart Routing
- Configure proper cache headers
- Use Cloudflare's CDN effectively

## 📞 Support

For issues specific to:
- **Cloudflare Pages**: [Cloudflare Community](https://community.cloudflare.com/)
- **Application**: Symbol AI Co. Support
- **Database**: Check respective provider documentation

## 🔄 Continuous Deployment

Set up automatic deployments:
1. Connect Git repository
2. Configure build triggers
3. Set up preview deployments for branches
4. Enable automatic deployments on push to main

---
*Symbol AI Co. - جميع الحقوق محفوظة © 2024*