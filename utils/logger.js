const { EmbedBuilder } = require('discord.js');
const storage = require('../database/storage');

class Logger {
    constructor() {
        this.logsChannelId = null;
    }

    setLogsChannel(channelId) {
        this.logsChannelId = channelId;
        storage.set('logsChannelId', channelId);
    }

    async sendLog(client, options) {
        if (!this.logsChannelId) {
            this.logsChannelId = storage.get('logsChannelId');
        }

        if (!this.logsChannelId) return;

        const channel = await client.channels.fetch(this.logsChannelId).catch(() => null);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(options.title || 'سجل النظام')
            .setDescription(options.description)
            .setTimestamp();

        if (options.fields) {
            embed.addFields(options.fields);
        }

        return channel.send({ embeds: [embed] });
    }

    async sendServerStats(client) {
        const guild = client.guilds.cache.first();
        if (!guild) return;

        const botPing = client.ws.ping;
        const memberCount = guild.memberCount;
        const channelCount = guild.channels.cache.size;

        // Get Render.com stats
        const stats = {
            usedStorage: process.env.RENDER_DISK_USAGE || 'غير متوفر',
            totalStorage: process.env.RENDER_DISK_QUOTA || 'غير متوفر',
        };

        await this.sendLog(client, {
            title: '📊 إحصائيات السيرفر',
            fields: [
                { name: '🏓 بنج البوت', value: `${botPing}ms`, inline: true },
                { name: '👥 عدد الأعضاء', value: memberCount.toString(), inline: true },
                { name: '📺 عدد القنوات', value: channelCount.toString(), inline: true },
                { name: '💾 المساحة المستخدمة', value: stats.usedStorage, inline: true },
                { name: '💿 المساحة الكلية', value: stats.totalStorage, inline: true }
            ]
        });
    }
}

module.exports = new Logger(); 