# تعليمات استخدام Z.AI API مع JavaScript

## 1. إعداد بيئة العمل

### تثبيت المكتبات المطلوبة
قم بتثبيت مكتبة Axios و dotenv باستخدام npm:
```bash
npm install axios dotenv
```

### إنشاء ملف .env
قم بإنشاء ملف `.env` في جذر المشروع وأضف مفتاح API الخاص بك:
```env
ZAI_API_KEY=your_actual_api_key_here
ZAI_BASE_URL=https://api.z.ai
```

**⚠️ تحذير أمني:** لا تقم مطلقاً برفع ملف `.env` إلى مستودع Git. تأكد من إضافة `.env` إلى ملف `.gitignore`.

## 2. الحصول على مفتاح API
- قم بإنشاء حساب على موقع [z.ai](https://z.ai)
- بعد تسجيل الدخول، انتقل إلى قسم API
- احصل على مفتاح API الخاص بك
- انسخ المفتاح واحفظه بأمان في ملف `.env`

## 3. مثال برمجي شامل بلغة JavaScript

### استخدام Axios مع dotenv
```javascript
// استيراد المكتبات المطلوبة
const axios = require('axios');
require('dotenv').config();

// إعداد العميل (Client)
const zaiClient = axios.create({
  baseURL: process.env.ZAI_BASE_URL || 'https://api.z.ai',
  headers: {
    'Authorization': `Bearer ${process.env.ZAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 ثوان
});

// مثال على استدعاء API
async function callZaiAPI() {
  try {
    // التحقق من وجود مفتاح API
    if (!process.env.ZAI_API_KEY) {
      throw new Error('مفتاح API غير موجود في ملف .env');
    }

    // استدعاء API
    const response = await zaiClient.get('/your-endpoint');
    
    console.log('نجح الاستدعاء:', response.data);
    return response.data;
    
  } catch (error) {
    if (error.response) {
      // الخادم رد بخطأ
      console.error('خطأ من الخادم:', error.response.status, error.response.data);
    } else if (error.request) {
      // لم يتم الرد من الخادم
      console.error('لم يتم الرد من الخادم:', error.message);
    } else {
      // خطأ في الإعدادات
      console.error('خطأ في الإعداد:', error.message);
    }
    throw error;
  }
}

// مثال على استدعاء API مع بيانات POST
async function postToZaiAPI(data) {
  try {
    const response = await zaiClient.post('/your-endpoint', data);
    console.log('تم إرسال البيانات بنجاح:', response.data);
    return response.data;
  } catch (error) {
    console.error('فشل في إرسال البيانات:', error.message);
    throw error;
  }
}

// استخدام الدوال
callZaiAPI()
  .then(data => {
    console.log('البيانات المستلمة:', data);
  })
  .catch(error => {
    console.error('حدث خطأ:', error.message);
  });

module.exports = {
  zaiClient,
  callZaiAPI,
  postToZaiAPI
};
```

## 4. أفضل الممارسات الأمنية

### حماية مفتاح API
1. **لا تكشف المفتاح أبداً في الكود المصدري**
2. **استخدم ملف .env لتخزين المفتاح**
3. **أضف .env إلى .gitignore**
4. **استخدم متغيرات البيئة في الإنتاج**

### مثال على .gitignore
```gitignore
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Dependencies
node_modules/
```

## 5. معالجة الأخطاء المتقدمة

```javascript
const axios = require('axios');
require('dotenv').config();

// إعداد عميل محسّن مع معالجة الأخطاء
const createZaiClient = () => {
  const client = axios.create({
    baseURL: process.env.ZAI_BASE_URL || 'https://api.z.ai',
    timeout: 10000
  });

  // Interceptor للطلبات
  client.interceptors.request.use(
    (config) => {
      config.headers.Authorization = `Bearer ${process.env.ZAI_API_KEY}`;
      console.log(`إرسال طلب إلى: ${config.url}`);
      return config;
    },
    (error) => {
      console.error('خطأ في إعداد الطلب:', error);
      return Promise.reject(error);
    }
  );

  // Interceptor للردود
  client.interceptors.response.use(
    (response) => {
      console.log(`تم الرد بنجاح من: ${response.config.url}`);
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        console.error('مفتاح API غير صحيح أو منتهي الصلاحية');
      } else if (error.response?.status === 429) {
        console.error('تم تجاوز حد الطلبات المسموح');
      }
      return Promise.reject(error);
    }
  );

  return client;
};

const zaiClient = createZaiClient();
module.exports = zaiClient;
```