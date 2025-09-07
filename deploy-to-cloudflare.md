# نشر التطبيق على Cloudflare Pages

## الخطوات المطلوبة:

### 1. إنشاء مستودع GitHub
```bash
# إنشاء مستودع جديد على GitHub
git init
git add .
git commit -m "Initial commit - GASAH Financial System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gasah.git
git push -u origin main
```

### 2. الذهاب إلى Cloudflare Dashboard
1. افتح https://dash.cloudflare.com/
2. اختر "Pages" من القائمة الجانبية
3. اضغط على "Create a project"
4. اختر "Connect to Git"

### 3. ربط GitHub Repository
1. اختر "GitHub" 
2. قم بتسجيل الدخول وامنح الصلاحيات
3. اختر المستودع "gasah"

### 4. إعدادات البناء (Build Configuration)
```
Framework preset: Next.js
Build command: npm run build
Build output directory: .next
Root directory: /
```

### 5. متغيرات البيئة (Environment Variables)
أضف هذه المتغيرات في Cloudflare Pages:

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://gasah.pages.dev

# قاعدة البيانات (اختياري - يمكن استخدام JSON files في البداية)
DATABASE_URL=your_database_url
DATABASE_AUTH_TOKEN=your_auth_token

# المصادقة
JWT_SECRET=your-very-long-secret-key-change-this-in-production
NEXTAUTH_URL=https://gasah.pages.dev
NEXTAUTH_SECRET=another-very-long-secret-key

# API Keys
API_KEY=your-api-key-if-needed
```

### 6. النشر
1. اضغط على "Save and Deploy"
2. انتظر حتى يكتمل البناء (3-5 دقائق)
3. ستحصل على رابط: https://gasah.pages.dev

### 7. إضافة النطاق المخصص (gasah.com)
1. اذهب إلى إعدادات المشروع
2. اختر "Custom domains"
3. أضف "gasah.com" و "www.gasah.com"
4. Cloudflare سيقوم بإعداد DNS تلقائياً

### 8. تفعيل مزايا Cloudflare

#### الأداء (Performance)
- ✅ Auto Minify (JavaScript, CSS, HTML)
- ✅ Brotli Compression
- ✅ HTTP/2 & HTTP/3
- ✅ Early Hints
- ✅ Rocket Loader
- ✅ Argo Smart Routing
- ✅ Tiered Cache

#### الأمان (Security)
- ✅ SSL/TLS: Full (strict)
- ✅ Always Use HTTPS
- ✅ WAF (Web Application Firewall)
- ✅ Bot Fight Mode
- ✅ DDoS Protection

#### الصور (Images)
- ✅ Polish: Lossy
- ✅ WebP conversion
- ✅ Mirage for mobile

### 9. اختبار التطبيق
- تحقق من: https://gasah.pages.dev
- اختبر تسجيل الدخول
- تحقق من جميع الصفحات
- اختبر الطباعة
- تحقق من الأداء

### 10. المراقبة
في Cloudflare Dashboard:
- Web Analytics
- Real User Monitoring
- Error tracking
- Performance insights

## ملاحظات مهمة:
- التطبيق يعمل حالياً مع ملفات JSON محلية
- يمكن ترقيته لاحقاً لاستخدام قاعدة بيانات D1 أو Supabase
- جميع البيانات محفوظة ومشفرة
- النسخ الاحتياطي تلقائي

## الدعم:
Symbol AI Co. - جميع الحقوق محفوظة © 2024