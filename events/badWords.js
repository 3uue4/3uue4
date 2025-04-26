const { Events } = require('discord.js');
const Settings = require('../models/Settings');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // تجاهل رسائل البوت
        if (message.author.bot) return;

        try {
            // جلب إعدادات السيرفر
            const settings = await Settings.findOne({ guildId: message.guild.id });
            if (!settings || !settings.badWords || settings.badWords.length === 0) return;

            // التحقق من وجود كلمات محظورة
            const content = message.content.toLowerCase();
            for (const word of settings.badWords) {
                if (content.includes(word.toLowerCase())) {
                    // حذف الرسالة
                    await message.delete();
                    
                    // إرسال تحذير للعضو
                    const warning = await message.channel.send({
                        content: `⚠️ ${message.author}, يمنع استخدام الكلمات المحظورة!`,
                    });

                    // حذف رسالة التحذير بعد 5 ثوانٍ
                    setTimeout(() => {
                        warning.delete().catch(console.error);
                    }, 5000);

                    break;
                }
            }
        } catch (error) {
            console.error('Error in bad words filter:', error);
        }
    },
}; 