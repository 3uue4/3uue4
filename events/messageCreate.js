const fs = require('fs');
const path = require('path');

// وظيفة لتحميل الإعدادات
function loadSettings() {
    const settingsPath = path.join(__dirname, '..', 'data', 'autoRespond.json');
    if (!fs.existsSync(settingsPath)) {
        return {
            gifChannels: [],
            reactionChannels: {}
        };
    }
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
}

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // تجاهل رسائل البوت
        if (message.author.bot) return;

        const settings = loadSettings();

        // التحقق من الرد التلقائي بالـ GIF
        if (settings.gifChannels.includes(message.channel.id)) {
            await message.reply('https://media.wickdev.me/a61784123b.gif');
        }

        // التحقق من التفاعلات التلقائية
        const channelReactions = settings.reactionChannels[message.channel.id];
        if (channelReactions) {
            try {
                for (const emoji of channelReactions) {
                    await message.react(emoji);
                }
            } catch (error) {
                console.error('خطأ في إضافة التفاعل:', error);
            }
        }
    },
}; 