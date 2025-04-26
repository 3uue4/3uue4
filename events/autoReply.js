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
            if (!settings || !settings.autoReplies) return;

            // البحث عن رد تلقائي مطابق
            const content = message.content.toLowerCase();
            for (const [trigger, response] of Object.entries(settings.autoReplies)) {
                if (content.includes(trigger.toLowerCase())) {
                    await message.reply(response);
                    break;
                }
            }
        } catch (error) {
            console.error('Error in auto-reply:', error);
        }
    },
}; 