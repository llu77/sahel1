# PowerShell Script for Cloudflare Pages Deployment
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   نشر نظام سهل على Cloudflare Pages" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan

# تسجيل الدخول إلى Cloudflare
Write-Host "`n[1/7] تسجيل الدخول إلى Cloudflare..." -ForegroundColor Green
wrangler login

# إنشاء قاعدة البيانات D1
Write-Host "`n[2/7] إنشاء قاعدة البيانات D1..." -ForegroundColor Green
wrangler d1 create sahl-database --location weur

# تنفيذ مخطط قاعدة البيانات
Write-Host "`n[3/7] إنشاء الجداول في قاعدة البيانات..." -ForegroundColor Green
wrangler d1 execute sahl-database --file=./schema.sql

# إدخال البيانات الأولية
Write-Host "`n[4/7] إدخال البيانات الأولية..." -ForegroundColor Green
wrangler d1 execute sahl-database --file=./seed-data.sql

# بناء المشروع
Write-Host "`n[5/7] بناء المشروع للإنتاج..." -ForegroundColor Green
$env:NODE_ENV = "production"
npm run build

# إنشاء مشروع Pages
Write-Host "`n[6/7] إنشاء مشروع Cloudflare Pages..." -ForegroundColor Green
wrangler pages project create sahl-system --production-branch main

# نشر المشروع
Write-Host "`n[7/7] نشر المشروع..." -ForegroundColor Green
wrangler pages deploy out --project-name=sahl-system

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "   تم النشر بنجاح!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan

# عرض معلومات المشروع
Write-Host "`n📌 معلومات المشروع:" -ForegroundColor Yellow
Write-Host "   - اسم المشروع: sahl-system" -ForegroundColor White
Write-Host "   - قاعدة البيانات: sahl-database" -ForegroundColor White
Write-Host "   - رابط المشروع: https://sahl-system.pages.dev" -ForegroundColor White

Write-Host "`n⚙️  إعدادات إضافية مطلوبة:" -ForegroundColor Yellow
Write-Host "   1. اذهب إلى Cloudflare Dashboard" -ForegroundColor White
Write-Host "   2. اختر المشروع sahl-system" -ForegroundColor White
Write-Host "   3. اذهب إلى Settings > Functions" -ForegroundColor White
Write-Host "   4. اربط قاعدة البيانات D1 (sahl-database)" -ForegroundColor White
Write-Host "   5. أضف متغيرات البيئة التالية:" -ForegroundColor White
Write-Host "      - JWT_SECRET" -ForegroundColor Gray
Write-Host "      - NODE_ENV=production" -ForegroundColor Gray

Write-Host "`n✅ مزايا Cloudflare المفعلة تلقائياً:" -ForegroundColor Green
Write-Host "   ✓ SSL مجاني" -ForegroundColor White
Write-Host "   ✓ CDN عالمي" -ForegroundColor White
Write-Host "   ✓ DDoS Protection" -ForegroundColor White
Write-Host "   ✓ Web Analytics" -ForegroundColor White
Write-Host "   ✓ Auto Minify" -ForegroundColor White
Write-Host "   ✓ Brotli Compression" -ForegroundColor White
Write-Host "   ✓ HTTP/3 Support" -ForegroundColor White
Write-Host "   ✓ Edge Caching" -ForegroundColor White

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')