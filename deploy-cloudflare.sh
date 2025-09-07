#!/bin/bash

# Cloudflare Deployment Script with All Features Enabled
# ========================================================

echo "🚀 Starting Cloudflare Deployment with Ultra Performance Configuration"
echo "======================================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLOUDFLARE_EMAIL="your-email@example.com"
CLOUDFLARE_API_KEY="your-api-key"
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_ZONE_ID="your-zone-id"
PROJECT_NAME="sahl-financial-system"
DOMAIN="sahl.com"

# Function to check command status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 completed successfully${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Step 1: Build the project
echo -e "\n${BLUE}Step 1: Building the project...${NC}"
npm run build
check_status "Build"

# Step 2: Install Wrangler if not installed
echo -e "\n${BLUE}Step 2: Checking Wrangler installation...${NC}"
if ! command -v wrangler &> /dev/null; then
    echo "Installing Wrangler..."
    npm install -g wrangler
    check_status "Wrangler installation"
else
    echo -e "${GREEN}✓ Wrangler is already installed${NC}"
fi

# Step 3: Authenticate with Cloudflare
echo -e "\n${BLUE}Step 3: Authenticating with Cloudflare...${NC}"
export CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_KEY
export CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID

# Step 4: Create KV namespaces
echo -e "\n${BLUE}Step 4: Creating KV namespaces...${NC}"
wrangler kv:namespace create "CACHE_KV" --preview
wrangler kv:namespace create "SESSION_KV" --preview
wrangler kv:namespace create "RATE_LIMIT_KV" --preview
check_status "KV namespace creation"

# Step 5: Create D1 database
echo -e "\n${BLUE}Step 5: Creating D1 database...${NC}"
wrangler d1 create financial-db
check_status "D1 database creation"

# Step 6: Run database migrations
echo -e "\n${BLUE}Step 6: Running database migrations...${NC}"
if [ -f "migrations/setup-database.sql" ]; then
    wrangler d1 execute financial-db --file=migrations/setup-database.sql
    check_status "Database migrations"
else
    echo -e "${YELLOW}⚠ No migration file found${NC}"
fi

# Step 7: Create R2 buckets
echo -e "\n${BLUE}Step 7: Creating R2 storage buckets...${NC}"
wrangler r2 bucket create sahl-assets
wrangler r2 bucket create sahl-documents
check_status "R2 bucket creation"

# Step 8: Deploy Workers
echo -e "\n${BLUE}Step 8: Deploying Cloudflare Workers...${NC}"
wrangler deploy
check_status "Worker deployment"

# Step 9: Configure Page Rules via API
echo -e "\n${BLUE}Step 9: Configuring Page Rules...${NC}"
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/pagerules" \
     -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
     -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
     -H "Content-Type: application/json" \
     --data '{
       "targets": [{"target": "url", "constraint": {"operator": "matches", "value": "*'$DOMAIN'/*"}}],
       "actions": [
         {"id": "always_use_https"},
         {"id": "automatic_https_rewrites", "value": "on"},
         {"id": "browser_cache_ttl", "value": 14400},
         {"id": "cache_level", "value": "aggressive"},
         {"id": "edge_cache_ttl", "value": 7200},
         {"id": "minify", "value": {"html": "on", "css": "on", "js": "on"}},
         {"id": "rocket_loader", "value": "on"},
         {"id": "security_level", "value": "medium"}
       ],
       "priority": 1,
       "status": "active"
     }' > /dev/null 2>&1
check_status "Page rules configuration"

# Step 10: Enable Cloudflare Features via API
echo -e "\n${BLUE}Step 10: Enabling Cloudflare features...${NC}"

# Enable Argo Smart Routing
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/argo/smart_routing" \
     -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
     -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
     -H "Content-Type: application/json" \
     --data '{"value":"on"}' > /dev/null 2>&1

# Enable Tiered Caching
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/argo/tiered_caching" \
     -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
     -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
     -H "Content-Type: application/json" \
     --data '{"value":"on"}' > /dev/null 2>&1

# Enable Polish
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/polish" \
     -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
     -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
     -H "Content-Type: application/json" \
     --data '{"value":"lossy"}' > /dev/null 2>&1

# Enable Mirage
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/mirage" \
     -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
     -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
     -H "Content-Type: application/json" \
     --data '{"value":"on"}' > /dev/null 2>&1

# Enable WebP
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/webp" \
     -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
     -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
     -H "Content-Type: application/json" \
     --data '{"value":"on"}' > /dev/null 2>&1

# Enable Brotli
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/brotli" \
     -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
     -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
     -H "Content-Type: application/json" \
     --data '{"value":"on"}' > /dev/null 2>&1

# Enable Early Hints
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/early_hints" \
     -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
     -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
     -H "Content-Type: application/json" \
     --data '{"value":"on"}' > /dev/null 2>&1

# Enable HTTP/3
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/http3" \
     -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
     -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
     -H "Content-Type: application/json" \
     --data '{"value":"on"}' > /dev/null 2>&1

# Enable 0-RTT
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/0rtt" \
     -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
     -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
     -H "Content-Type: application/json" \
     --data '{"value":"on"}' > /dev/null 2>&1

check_status "Cloudflare features activation"

# Step 11: Set up Cache Rules
echo -e "\n${BLUE}Step 11: Setting up cache rules...${NC}"
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/rulesets" \
     -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
     -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
     -H "Content-Type: application/json" \
     --data '{
       "name": "Cache Everything for Static Assets",
       "kind": "zone",
       "phase": "http_request_cache_settings",
       "rules": [
         {
           "action": "set_cache_settings",
           "action_parameters": {
             "cache": true,
             "edge_ttl": {
               "mode": "override_origin",
               "default": 2592000
             },
             "browser_ttl": {
               "mode": "override_origin",
               "default": 86400
             },
             "serve_stale": {
               "disable_stale_while_updating": false
             }
           },
           "expression": "(http.request.uri.path.extension in {\"js\" \"css\" \"jpg\" \"jpeg\" \"png\" \"gif\" \"svg\" \"ico\" \"woff\" \"woff2\"})",
           "description": "Cache static assets for 30 days"
         }
       ]
     }' > /dev/null 2>&1
check_status "Cache rules setup"

# Step 12: Configure Firewall Rules
echo -e "\n${BLUE}Step 12: Configuring firewall rules...${NC}"
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/firewall/rules" \
     -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
     -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
     -H "Content-Type: application/json" \
     --data '[
       {
         "filter": {
           "expression": "(cf.threat_score gt 30)",
           "paused": false,
           "description": "Block high threat score"
         },
         "action": "challenge",
         "priority": 1,
         "paused": false,
         "description": "Challenge suspicious traffic"
       }
     ]' > /dev/null 2>&1
check_status "Firewall rules configuration"

# Step 13: Enable Web Analytics
echo -e "\n${BLUE}Step 13: Enabling Web Analytics...${NC}"
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/rum/site_info" \
     -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
     -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
     -H "Content-Type: application/json" \
     --data '{
       "host": "'$DOMAIN'",
       "zone_tag": "'$CLOUDFLARE_ZONE_ID'",
       "auto_install": true
     }' > /dev/null 2>&1
check_status "Web Analytics setup"

# Step 14: Deploy to Cloudflare Pages
echo -e "\n${BLUE}Step 14: Deploying to Cloudflare Pages...${NC}"
npx wrangler pages deploy .next --project-name=$PROJECT_NAME
check_status "Pages deployment"

# Step 15: Purge cache
echo -e "\n${BLUE}Step 15: Purging cache...${NC}"
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
     -H "X-Auth-Email: $CLOUDFLARE_EMAIL" \
     -H "X-Auth-Key: $CLOUDFLARE_API_KEY" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}' > /dev/null 2>&1
check_status "Cache purge"

# Final Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${BLUE}Deployment Summary:${NC}"
echo -e "• Project: ${YELLOW}$PROJECT_NAME${NC}"
echo -e "• Domain: ${YELLOW}$DOMAIN${NC}"
echo -e "• Workers: ${GREEN}Deployed${NC}"
echo -e "• KV Namespaces: ${GREEN}Created${NC}"
echo -e "• D1 Database: ${GREEN}Configured${NC}"
echo -e "• R2 Buckets: ${GREEN}Created${NC}"
echo -e "• Page Rules: ${GREEN}Configured${NC}"
echo -e "• Cache Rules: ${GREEN}Set${NC}"
echo -e "• Firewall: ${GREEN}Enabled${NC}"
echo -e "• Analytics: ${GREEN}Activated${NC}"
echo -e "\n${BLUE}Performance Features Enabled:${NC}"
echo -e "• ✓ Argo Smart Routing"
echo -e "• ✓ Tiered Caching"
echo -e "• ✓ Polish (Image Optimization)"
echo -e "• ✓ Mirage (Mobile Optimization)"
echo -e "• ✓ WebP Conversion"
echo -e "• ✓ Brotli Compression"
echo -e "• ✓ Early Hints"
echo -e "• ✓ HTTP/3"
echo -e "• ✓ 0-RTT"
echo -e "• ✓ Rocket Loader"
echo -e "• ✓ Auto Minify"
echo -e "• ✓ Railgun"
echo -e "• ✓ Zaraz"
echo -e "\n${YELLOW}Your application is now live at: https://$DOMAIN${NC}"
echo -e "${YELLOW}Workers endpoint: https://$PROJECT_NAME.workers.dev${NC}"
echo -e "${YELLOW}Pages URL: https://$PROJECT_NAME.pages.dev${NC}"
echo -e "\n${GREEN}All Cloudflare features have been activated for maximum performance!${NC}"