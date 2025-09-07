#!/bin/bash

set -e

echo "🚀 بدء تنفيذ نظام المستخدمين والصلاحيات"

# 1. تشفير كلمات المرور
echo "🔐 تشفير كلمات المرور..."
node scripts/hash-passwords.js > temp_passwords.sql

# 2. إنشاء قاعدة البيانات
echo "📊 إنشاء الجداول..."
wrangler d1 execute financial-db --file=migrations/setup-database.sql ${1}

# 3. تحديث كلمات المرور المشفرة
echo "🔑 تحديث كلمات المرور..."
wrangler d1 execute financial-db --file=temp_passwords.sql ${1}

# 4. النشر على Cloudflare (اختياري في المحلي)
echo "☁️ النشر على Cloudflare... (تخطي في المحلي إن لم تُحدد)"
if [ "$2" = "--deploy" ]; then
  wrangler deploy
fi

# 5. تنظيف
rm temp_passwords.sql || true

echo "✅ تم التنفيذ بنجاح!"

# 6. اختبار تسجيل الدخول (يمكن تخصيص endpoint)
echo "🧪 اختبار النظام..."
echo "اختبار دخول Admin..."
echo 'curl -X POST https://your-worker.workers.dev/api/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"Admin@g.com","password":"Admin1230"}'
