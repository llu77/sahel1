# تعليمات استخدام مفتاح Z.AI API

## 1. كيفية إعداد بيئة العمل
- تأكد من أنك قد قمت بتثبيت Python 3.6 أو أعلى على جهازك.
- قم بتثبيت المكتبات المطلوبة باستخدام الأمر التالي:
  ```bash
  pip install requests
  ```

## 2. خطوات استخدام المفتاح
- قم بإنشاء حساب على موقع z.ai.
- بعد تسجيل الدخول، انتقل إلى قسم API للحصول على مفتاح API الخاص بك.
- قم بنسخ مفتاح API واحفظه في مكان آمن.

## 3. مثال برمجي بلغة Python
```python
import requests

API_KEY = 'YOUR_API_KEY_HERE'
url = 'https://api.z.ai/your_endpoint'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

response = requests.get(url, headers=headers)

if response.status_code == 200:
    data = response.json()
    print(data)
else:
    print(f'Error: {response.status_code}')
```