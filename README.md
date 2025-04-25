# Discord Bot

بوت ديسكورد متعدد الوظائف مع نظام تذاكر، ترحيب، وأكثر.

## المميزات

- نظام تذاكر
- نظام ترحيب
- نظام الردود التلقائية
- أوامر الإدارة (حظر، طرد، إلخ)
- تسجيل الأحداث
- نظام الأذكار
- وأكثر...

## المتطلبات

- Node.js v18 أو أحدث
- MongoDB
- توكن بوت Discord

## التثبيت

1. انسخ المستودع:
```bash
git clone [رابط المستودع]
cd [اسم المجلد]
```

2. قم بتثبيت الاعتمادات:
```bash
npm install
```

3. قم بإنشاء ملف `.env` وأضف المتغيرات المطلوبة:
```env
# Discord Bot Token
TOKEN=your_token_here

# MongoDB Connection String
MONGODB_URI=your_mongodb_uri

# Server Configuration
GUILD_ID=your_guild_id
VOICE_CHANNEL_ID=your_voice_channel_id

# Ticket System
TICKET_CATEGORY_ID=your_category_id
TICKET_LOG_CHANNEL_ID=your_log_channel_id
TICKET_SUPPORT_ROLE_ID=your_role_id

# Welcome System
WELCOME_CHANNEL_ID=your_channel_id

# Bot Configuration
BOT_PREFIX=!
BOT_STATUS=dnd
BOT_ACTIVITY=your_activity_here
```

4. تشغيل البوت:
```bash
npm start
```

## النشر على Render

1. قم بإنشاء حساب على [Render](https://render.com)
2. اربط حسابك بـ GitHub
3. أنشئ خدمة جديدة واختر "Web Service"
4. اختر المستودع الخاص بك
5. قم بتعيين المتغيرات البيئية في إعدادات Render
6. انشر التطبيق

## المساهمة

نرحب بالمساهمات! يرجى إنشاء fork للمستودع وإرسال pull request.

## الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE). 