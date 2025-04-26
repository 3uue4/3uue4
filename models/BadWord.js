const fs = require('fs-extra');
const path = require('path');

const BAD_WORDS_FILE = path.join(__dirname, '..', 'data', 'badwords.json');

// إنشاء ملف الكلمات المحظورة إذا لم يكن موجوداً
if (!fs.existsSync(BAD_WORDS_FILE)) {
    fs.writeFileSync(BAD_WORDS_FILE, '{"badWords": []}', 'utf8');
}

// قراءة الكلمات المحظورة
function readBadWords() {
    try {
        const data = fs.readFileSync(BAD_WORDS_FILE, 'utf8');
        return JSON.parse(data).badWords;
    } catch (error) {
        console.error('Error reading bad words:', error);
        return [];
    }
}

// حفظ الكلمات المحظورة
function writeBadWords(badWords) {
    try {
        fs.writeFileSync(BAD_WORDS_FILE, JSON.stringify({ badWords }, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing bad words:', error);
        return false;
    }
}

// إضافة كلمة محظورة
function addBadWord(word) {
    const badWords = readBadWords();
    if (!badWords.includes(word)) {
        badWords.push(word);
        return writeBadWords(badWords);
    }
    return false;
}

// حذف كلمة محظورة
function removeBadWord(word) {
    const badWords = readBadWords();
    const index = badWords.indexOf(word);
    if (index !== -1) {
        badWords.splice(index, 1);
        return writeBadWords(badWords);
    }
    return false;
}

// التحقق من وجود كلمة محظورة
function isBadWord(word) {
    const badWords = readBadWords();
    return badWords.includes(word);
}

// الحصول على جميع الكلمات المحظورة
function getAllBadWords() {
    return readBadWords();
}

module.exports = {
    addBadWord,
    removeBadWord,
    isBadWord,
    getAllBadWords
}; 