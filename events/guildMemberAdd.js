const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// وظيفة لتحميل إعدادات الترحيب
function loadWelcomeSettings() {
    const settingsPath = path.join(__dirname, '..', 'data', 'welcome.json');
    if (!fs.existsSync(settingsPath)) {
        return { enabled: false };
    }
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
}

// وظيفة لتحميل الإيمبدات
function loadEmbeds() {
    const embedsPath = path.join(__dirname, '..', 'data', 'embeds.json');
    if (!fs.existsSync(embedsPath)) {
        return { embeds: {} };
    }
    return JSON.parse(fs.readFileSync(embedsPath, 'utf8'));
}

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        const settings = loadWelcomeSettings();
        
        // التحقق من تفعيل نظام الترحيب
        if (!settings.enabled || !settings.channelId || !settings.embedName) return;

        // الحصول على روم الترحيب
        const welcomeChannel = member.guild.channels.cache.get(settings.channelId);
        if (!welcomeChannel) return;

        // الحصول على الإيمبد
        const embedData = loadEmbeds();
        const welcomeEmbed = embedData.embeds[settings.embedName];
        if (!welcomeEmbed) return;

        // إنشاء الإيمبد
        const embed = new EmbedBuilder();
        if (welcomeEmbed.title) embed.setTitle(welcomeEmbed.title);
        if (welcomeEmbed.description) {
            const desc = welcomeEmbed.description
                .replace('{user}', member.user)
                .replace('{server}', member.guild.name)
                .replace('{memberCount}', member.guild.memberCount);
            embed.setDescription(desc);
        }
        if (welcomeEmbed.color) embed.setColor(welcomeEmbed.color);
        if (welcomeEmbed.author.name) embed.setAuthor({
            name: welcomeEmbed.author.name,
            iconURL: welcomeEmbed.author.icon_url || null
        });
        if (welcomeEmbed.footer.text) embed.setFooter({
            text: welcomeEmbed.footer.text,
            iconURL: welcomeEmbed.footer.icon_url || null
        });
        if (welcomeEmbed.image.url) embed.setImage(welcomeEmbed.image.url);
        if (welcomeEmbed.thumbnail.url) embed.setThumbnail(welcomeEmbed.thumbnail.url);

        // إرسال رسالة الترحيب
        await welcomeChannel.send({ embeds: [embed] });
    },
}; 