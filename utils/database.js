const fs = require('fs-extra');
const path = require('path');

// مسار مجلد التخزين
const STORAGE_DIR = path.join(__dirname, '..', 'data');

// إنشاء مجلد التخزين إذا لم يكن موجوداً
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// دالة للتحقق من اتصال التخزين
async function connectToDatabase() {
    try {
        // التحقق من وجود مجلد التخزين
        if (!fs.existsSync(STORAGE_DIR)) {
            fs.mkdirSync(STORAGE_DIR, { recursive: true });
        }
        console.log('✅ تم الاتصال بنظام التخزين المحلي بنجاح!');
        return true;
    } catch (error) {
        console.error('❌ فشل الاتصال بنظام التخزين المحلي:', error);
        return false;
    }
}

module.exports = connectToDatabase; 