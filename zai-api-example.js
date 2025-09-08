// استيراد المكتبات المطلوبة
require('dotenv').config();
const axios = require('axios');

// تكوين Z.ai API
const ZAI_API_KEY = process.env.ZAI_API_KEY;
const ZAI_API_BASE_URL = process.env.ZAI_API_BASE_URL || 'https://api.z.ai/v1';

// التحقق من وجود مفتاح API
if (!ZAI_API_KEY) {
  console.error('خطأ: مفتاح Z.ai API غير موجود في متغيرات البيئة');
  console.error('يرجى إضافة ZAI_API_KEY إلى ملف .env');
  process.exit(1);
}

// إنشاء instance من axios مع التكوين الأساسي
const zaiClient = axios.create({
  baseURL: ZAI_API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${ZAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 ثانية كحد أقصى للطلب
});

// معالجة الأخطاء العامة
zaiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // الخادم استجاب بحالة خطأ
      console.error('خطأ في الخادم:', error.response.status, error.response.data);
    } else if (error.request) {
      // تم إرسال الطلب ولكن لم يتم استلام استجابة
      console.error('لم يتم استلام استجابة من الخادم:', error.message);
    } else {
      // حدث خطأ في إعداد الطلب
      console.error('خطأ في إعداد الطلب:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * إرسال طلب محادثة إلى Z.ai API
 * @param {Array} messages - مصفوفة الرسائل
 * @param {Object} options - خيارات إضافية
 * @returns {Promise} - وعد بالاستجابة
 */
async function sendChatCompletion(messages, options = {}) {
  try {
    const defaultOptions = {
      temperature: 0.7,
      max_tokens: 1000,
      model: 'zai-gpt-3.5-turbo',
    };

    const finalOptions = { ...defaultOptions, ...options };

    const response = await zaiClient.post('/chat/completions', {
      messages,
      ...finalOptions,
    });

    return response.data;
  } catch (error) {
    console.error('فشل في إرسال طلب المحادثة:', error.message);
    throw error;
  }
}

/**
 * إنشاء صورة باستخدام Z.ai API
 * @param {string} prompt - وصف الصورة المطلوبة
 * @param {Object} options - خيارات إضافية
 * @returns {Promise} - وعد بالاستجابة
 */
async function generateImage(prompt, options = {}) {
  try {
    const defaultOptions = {
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    };

    const finalOptions = { ...defaultOptions, ...options };

    const response = await zaiClient.post('/images/generations', {
      prompt,
      ...finalOptions,
    });

    return response.data;
  } catch (error) {
    console.error('فشل في إنشاء الصورة:', error.message);
    throw error;
  }
}

/**
 * البحث على الويب باستخدام Z.ai API
 * @param {string} query - نص البحث
 * @param {Object} options - خيارات إضافية
 * @returns {Promise} - وعد بالاستجابة
 */
async function webSearch(query, options = {}) {
  try {
    const defaultOptions = {
      num: 10,
      language: 'ar',
    };

    const finalOptions = { ...defaultOptions, ...options };

    const response = await zaiClient.post('/functions/web_search', {
      query,
      ...finalOptions,
    });

    return response.data;
  } catch (error) {
    console.error('فشل في البحث على الويب:', error.message);
    throw error;
  }
}

// أمثلة الاستخدام

async function main() {
  console.log('=== اختبار Z.ai API Integration ===\n');

  try {
    // مثال 1: محادثة مع Z.ai
    console.log('1. مثال المحادثة:');
    const chatMessages = [
      { role: 'system', content: 'أنت مساعد مفيد ومحترف.' },
      { role: 'user', content: 'مرحباً، كيف يمكنني استخدام Z.ai API في تطوير الويب؟' },
    ];

    const chatResponse = await sendChatCompletion(chatMessages);
    console.log('رد Z.ai:', chatResponse.choices[0].message.content);
    console.log('---\n');

    // مثال 2: إنشاء صورة
    console.log('2. مثال إنشاء الصورة:');
    const imagePrompt = 'قطة جميلة تلعب في حديقة';
    const imageResponse = await generateImage(imagePrompt, { size: '512x512' });
    console.log('تم إنشاء الصورة بنجاح!');
    console.log('حجم الصورة:', imageResponse.data[0].size);
    console.log('---\n');

    // مثال 3: البحث على الويب
    console.log('3. مثال البحث على الويب:');
    const searchQuery = 'أفضل ممارسات تطوير الويب 2024';
    const searchResponse = await webSearch(searchQuery, { num: 5 });
    console.log('تم العثور على', searchResponse.results.length, 'نتيجة');
    searchResponse.results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.name}`);
      console.log(`   ${result.url}`);
    });

  } catch (error) {
    console.error('حدث خطأ في التنفيذ:', error.message);
    process.exit(1);
  }
}

// تشغيل البرنامج
if (require.main === module) {
  main();
}

// تصدير الدوال للاستخدام في وحدات أخرى
module.exports = {
  sendChatCompletion,
  generateImage,
  webSearch,
  zaiClient,
};
