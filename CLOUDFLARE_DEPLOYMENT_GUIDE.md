# 📘 دليل نشر نظام سهل على Cloudflare Pages

## 🚀 خطوات النشر السريع

### 1️⃣ المتطلبات الأساسية
- حساب Cloudflare (مجاني)
- Node.js 18+ مثبت على جهازك
- Git مثبت على جهازك

### 2️⃣ إعداد حساب Cloudflare
1. اذهب إلى [Cloudflare Dashboard](https://dash.cloudflare.com)
2. سجل دخولك أو أنشئ حساب جديد
3. احصل على Account ID من الإعدادات

### 3️⃣ تثبيت Wrangler CLI
```bash
npm install -g wrangler
```

### 4️⃣ تسجيل الدخول إلى Cloudflare
```bash
wrangler login
```

### 5️⃣ إنشاء قاعدة البيانات D1
```bash
# إنشاء قاعدة البيانات
wrangler d1 create sahl-database --location weur

# تنفيذ مخطط الجداول
wrangler d1 execute sahl-database --file=./schema.sql --remote

# إدخال البيانات الأولية
wrangler d1 execute sahl-database --file=./seed-data.sql --remote
```

### 6️⃣ إعداد المشروع للنشر
```bash
# تعيين متغيرات البيئة
set NODE_ENV=production

# بناء المشروع
npm run build
```

### 7️⃣ إنشاء ونشر مشروع Pages
```bash
# إنشاء مشروع Pages
wrangler pages project create sahl-system --production-branch main

# نشر المشروع
wrangler pages deploy out --project-name=sahl-system
```

## ⚙️ الإعدادات المطلوبة في Cloudflare Dashboard

### 🔗 ربط قاعدة البيانات D1
1. اذهب إلى **Pages** > **sahl-system** > **Settings**
2. انقر على **Functions** > **D1 database bindings**
3. أضف binding جديد:
   - Variable name: `DB`
   - Database: `sahl-database`

### 🔐 متغيرات البيئة
اذهب إلى **Settings** > **Environment variables** وأضف:

| المتغير | القيمة | الوصف |
|---------|--------|-------|
| `JWT_SECRET` | `your-secret-key-here` | مفتاح تشفير JWT (اختر مفتاح قوي) |
| `NODE_ENV` | `production` | بيئة الإنتاج |
| `NEXT_PUBLIC_API_URL` | `https://sahl-system.pages.dev` | رابط API |

## 🎯 المزايا المفعلة تلقائياً

### ✅ مزايا الأمان
- **SSL/TLS**: شهادة SSL مجانية
- **DDoS Protection**: حماية من هجمات DDoS
- **WAF**: جدار حماية تطبيقات الويب
- **Bot Protection**: حماية من البوتات الضارة

### ⚡ مزايا الأداء
- **Global CDN**: شبكة توزيع محتوى عالمية
- **Auto Minify**: ضغط تلقائي للملفات
- **Brotli Compression**: ضغط متقدم
- **HTTP/3**: بروتوكول سريع
- **Edge Caching**: تخزين مؤقت على الحافة
- **Image Optimization**: تحسين الصور تلقائياً

### 📊 مزايا المراقبة
- **Web Analytics**: إحصائيات مجانية
- **Real User Monitoring**: مراقبة الأداء الفعلي
- **Error Tracking**: تتبع الأخطاء

## 🔧 إعدادات إضافية موصى بها

### 1. Page Rules
أضف قواعد الصفحات التالية:
- `/*` - Cache Level: Standard, Edge Cache TTL: 1 hour
- `/api/*` - Cache Level: Bypass
- `/admin/*` - Cache Level: Bypass

### 2. Custom Domain
1. اذهب إلى **Custom domains**
2. أضف نطاقك المخصص
3. اتبع تعليمات DNS

### 3. Access Policy
لحماية إضافية، يمكنك إضافة Cloudflare Access:
1. اذهب إلى **Zero Trust** > **Access**
2. أنشئ Application جديد
3. حدد القواعد المطلوبة

## 📝 الأوامر المفيدة

### عرض السجلات
```bash
wrangler pages tail sahl-system
```

### تحديث قاعدة البيانات
```bash
wrangler d1 execute sahl-database --file=./updates.sql --remote
```

### نشر تحديث جديد
```bash
npm run build
wrangler pages deploy out --project-name=sahl-system
```

### معاينة النشر
```bash
wrangler pages dev out --compatibility-date=2024-01-01
```

## 🆘 حل المشاكل الشائعة

### مشكلة: Database not configured
**الحل**: تأكد من ربط قاعدة البيانات D1 في إعدادات Functions

### مشكلة: 401 Unauthorized
**الحل**: تحقق من متغير JWT_SECRET في Environment variables

### مشكلة: CORS errors
**الحل**: تأكد من أن Functions تعيد headers CORS الصحيحة

### مشكلة: Build failed
**الحل**: تأكد من تعيين `NODE_ENV=production` قبل البناء

## 📞 الدعم

للمساعدة، يمكنك:
- مراجعة [وثائق Cloudflare Pages](https://developers.cloudflare.com/pages/)
- مراجعة [وثائق D1 Database](https://developers.cloudflare.com/d1/)
- فتح issue على GitHub

## 🎉 مبروك!

تم نشر نظام سهل بنجاح على Cloudflare Pages! 

🔗 **رابط التطبيق**: https://sahl-system.pages.dev

📧 **بيانات الدخول الافتراضية**:
- البريد: admin@sahl.com
- كلمة المرور: Admin1230

---

تم الإنشاء بواسطة نظام سهل - نظام إدارة مالي متكامل 🚀