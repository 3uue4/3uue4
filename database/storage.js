const fs = require('fs-extra');
const path = require('path');

// مسار مجلد التخزين
const STORAGE_DIR = path.join(__dirname, '..', 'data');
const EMBEDS_FILE = path.join(STORAGE_DIR, 'embeds.json');
const SETTINGS_FILE = path.join(STORAGE_DIR, 'settings.json');

// إنشاء مجلد التخزين إذا لم يكن موجوداً
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// إنشاء ملف الإمبدات إذا لم يكن موجوداً
if (!fs.existsSync(EMBEDS_FILE)) {
    fs.writeFileSync(EMBEDS_FILE, '{}', 'utf8');
}

// إنشاء ملف الإعدادات إذا لم يكن موجوداً
if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, '{}', 'utf8');
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

// قراءة الإعدادات
async function readSettings() {
    try {
        const data = await fs.readJson(SETTINGS_FILE);
        return data;
    } catch (error) {
        console.error('Error reading settings:', error);
        return {};
    }
}

// حفظ الإعدادات
async function writeSettings(settings) {
    try {
        await fs.writeJson(SETTINGS_FILE, settings, { spaces: 2 });
        return true;
    } catch (error) {
        console.error('Error writing settings:', error);
        return false;
    }
}

// حفظ الإمبد
async function saveEmbed(name, embedData) {
    const embeds = await readEmbeds() || { embeds: {} };
    embeds.embeds[name] = embedData;
    return await writeEmbeds(embeds);
}

// الحصول على الإمبد
async function getEmbed(name) {
    const embeds = await readEmbeds() || { embeds: {} };
    return embeds.embeds[name];
}

// حذف الإمبد
async function deleteEmbed(name) {
    const embeds = await readEmbeds() || { embeds: {} };
    delete embeds.embeds[name];
    return await writeEmbeds(embeds);
}

// تحديث الإمبد
async function updateEmbed(name, embedData) {
    return await saveEmbed(name, embedData);
}

// الحصول على جميع الإمبدات
async function getAllEmbeds() {
    const embeds = await readEmbeds() || { embeds: {} };
    return embeds.embeds;
}

// حفظ الإعدادات
async function saveSettings(guildId, settings) {
    const allSettings = await readSettings() || {};
    allSettings[guildId] = settings;
    return await writeSettings(allSettings);
}

// الحصول على الإعدادات
async function getSettings(guildId) {
    const allSettings = await readSettings() || {};
    return allSettings[guildId];
}

// تحديث الإعدادات
async function updateSettings(guildId, settings) {
    return await saveSettings(guildId, settings);
}

module.exports = {
    saveEmbed,
    getEmbed,
    deleteEmbed,
    updateEmbed,
    getAllEmbeds,
    saveSettings,
    getSettings,
    updateSettings
}; 