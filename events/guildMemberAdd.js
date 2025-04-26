const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const Settings = require('../models/Settings');
const logger = require('../utils/logger');

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
        try {
            const settings = await Settings.findOne({ guildId: member.guild.id });
            if (!settings || !settings.autoRole) return;

            const role = member.guild.roles.cache.get(settings.autoRole);
            if (!role) {
                settings.autoRole = null;
                await settings.save();
                return;
            }

            await member.roles.add(role);
            
            // إنشاء إمبد الترحيب
            const welcomeEmbed = new EmbedBuilder()
                .setTitle(`Welcome ${member.user.username} ♡︎`)
                .setDescription(`
┌─────────────────────────────────────────────────┐
│         Welcome to Old Horizon Community       │
└─────────────────────────────────────────────────┘

  A realm of avatars, epic game nights, and true camaraderie.

  • Customize your [avatar](https://discord.com/channels/1281429066339188786/1361772504141533387) and shape your legend.
  • Participate in exclusive game nights and community challenges.
  • Connect and [celebrate](https://discord.com/channels/1281429066339188786/1361848754273124611) with fellow adventurers.

  You did not simply join…  
  You claimed your place in the greatest guild.

───────────────────────────────────────────────────
                `)
                .setImage('https://media.wickdev.me/a61784123b.gif')
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }))
                .setAuthor({
                    name: member.guild.name,
                    iconURL: member.guild.iconURL({ dynamic: true, size: 1024 })
                })
                .setFooter({
                    text: member.guild.name,
                    iconURL: member.guild.iconURL({ dynamic: true, size: 1024 })
                })
                .setColor('#2b2d31');

            // إرسال رسالة الترحيب
            const welcomeChannel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
            if (welcomeChannel) {
                await welcomeChannel.send({ embeds: [welcomeEmbed] });
            }

            await logger.sendLog(member.client, {
                title: '👋 عضو جديد',
                description: `${member} انضم إلى السيرفر وحصل على الرتبة ${role}`,
                color: 0x00ff00
            });
        } catch (error) {
            console.error('Error in guildMemberAdd event:', error);
            await logger.sendLog(member.client, {
                title: '❌ خطأ في إضافة الرتبة التلقائية',
                description: `حدث خطأ أثناء محاولة إضافة الرتبة لعضو جديد: ${error.message}`,
                color: 0xff0000
            });
        }
    },
}; 