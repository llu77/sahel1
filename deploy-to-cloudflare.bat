@echo off
echo ========================================================
echo         نشر GASAH على Cloudflare Pages
echo         Symbol AI Co. - جميع الحقوق محفوظة
echo ========================================================
echo.

echo [1] جاري التحقق من Wrangler...
wrangler --version
if %errorlevel% neq 0 (
    echo تثبيت Wrangler...
    npm install -g wrangler
)

echo.
echo [2] جاري البناء للإنتاج...
call npm run build

echo.
echo [3] جاري تسجيل الدخول إلى Cloudflare...
echo سيتم فتح المتصفح لتسجيل الدخول
wrangler login

echo.
echo [4] جاري النشر على Cloudflare Pages...
wrangler pages deploy .next --project-name=gasah --compatibility-date=2024-01-01

echo.
echo ========================================================
echo تم النشر بنجاح!
echo.
echo موقعك: https://gasah.pages.dev
echo.
echo بيانات الدخول:
echo - admin@gasah.com / 123456
echo ========================================================
pause