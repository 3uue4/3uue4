const fs = require('fs');
const path = require('path');

// تأكد من وجود مجلد للتخزين
const STORAGE_DIR = path.join(process.env.RENDER_STORAGE || './storage');
const EMBEDS_FILE = path.join(STORAGE_DIR, 'embeds.json');

// إنشاء المجلد إذا لم يكن موجوداً
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// إنشاء ملف الإمبدات إذا لم يكن موجوداً
if (!fs.existsSync(EMBEDS_FILE)) {
    fs.writeFileSync(EMBEDS_FILE, '{}', 'utf8');
}

// قراءة الإمبدات
function readEmbeds() {
    try {
        const data = fs.readFileSync(EMBEDS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading embeds:', error);
        return {};
    }
}

// حفظ الإمبدات
function writeEmbeds(embeds) {
    try {
        fs.writeFileSync(EMBEDS_FILE, JSON.stringify(embeds, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing embeds:', error);
    }
}

module.exports = {
    // حفظ إمبد جديد
    saveEmbed: function(name, embedData) {
        const embeds = readEmbeds();
        embeds[name] = embedData;
        writeEmbeds(embeds);
    },

    // الحصول على إمبد
    getEmbed: function(name) {
        const embeds = readEmbeds();
        return embeds[name];
    },

    // حذف إمبد
    deleteEmbed: function(name) {
        const embeds = readEmbeds();
        delete embeds[name];
        writeEmbeds(embeds);
    },

    // تحديث إمبد
    updateEmbed: function(name, updates) {
        const embeds = readEmbeds();
        if (embeds[name]) {
            embeds[name] = { ...embeds[name], ...updates };
            writeEmbeds(embeds);
            return true;
        }
        return false;
    },

    // الحصول على جميع الإمبدات
    getAllEmbeds: function() {
        return readEmbeds();
    }
}; 