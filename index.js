require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ActivityType, Partials } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const keepAlive = require('./utils/keepAlive');
const connectToDatabase = require('./utils/database');
const logger = require('./utils/logger');
const storage = require('./database/storage');
const { Client: RenderClient } = require('@render/client');

// الاتصال بقاعدة البيانات
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح!');
    } catch (error) {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', error);
    }
}

// إنشاء عميل Discord جديد
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// تهيئة عميل Render
const render = new RenderClient({
    apiKey: process.env.RENDER_API_KEY
});

// تخزين الأوامر
client.commands = new Collection();
client.buttons = new Collection();
client.modals = new Collection();

// تحميل الأوامر
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Load buttons
const buttonsPath = path.join(__dirname, 'buttons');
const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));

for (const file of buttonFiles) {
    const filePath = path.join(buttonsPath, file);
    const button = require(filePath);
    client.buttons.set(button.customId, button);
}

// Load modals
const modalsPath = path.join(__dirname, 'modals');
const modalFiles = fs.readdirSync(modalsPath).filter(file => file.endsWith('.js'));

for (const file of modalFiles) {
    const filePath = path.join(modalsPath, file);
    const modal = require(filePath);
    client.modals.set(modal.customId, modal);
}

// تحميل الأحداث
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// دالة للاتصال بالقناة الصوتية
async function connectToVoiceChannel() {
    try {
        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        const channel = await guild.channels.fetch(process.env.VOICE_CHANNEL_ID);
        
        if (channel) {
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });
            
            console.log(`✅ تم الاتصال بالقناة الصوتية: ${channel.name}`);
            
            // إعادة الاتصال في حالة الانقطاع
            connection.on('disconnect', () => {
                console.log('❌ تم قطع الاتصال بالقناة الصوتية، جاري إعادة الاتصال...');
                setTimeout(connectToVoiceChannel, 5000);
            });
        }
    } catch (error) {
        console.error('❌ حدث خطأ أثناء الاتصال بالقناة الصوتية:', error);
        setTimeout(connectToVoiceChannel, 5000);
    }
}

// حدث عند تسجيل الدخول
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} is online!`);
    
    // تعيين حالة البوت
    client.user.setPresence({
        status: process.env.BOT_STATUS || 'dnd',
        activities: [{
            name: process.env.BOT_ACTIVITY || 'Hollow Depth | نظام المساعدة',
            type: ActivityType.Streaming,
            url: 'https://twitch.tv/discord'
        }]
    });
    
    // الاتصال بالقناة الصوتية بعد تسجيل الدخول
    await connectToVoiceChannel();
    await connectToDatabase();
    keepAlive();
});

// معالجة الأوامر
client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'حدث خطأ أثناء تنفيذ هذا الأمر!',
                ephemeral: true
            });
        }
    } else if (interaction.isButton()) {
        const button = client.buttons.get(interaction.customId);
        if (!button) return;

        try {
            await button.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'حدث خطأ أثناء تنفيذ هذا الأمر!',
                ephemeral: true
            });
        }
    } else if (interaction.isModalSubmit()) {
        const modal = client.modals.get(interaction.customId);
        if (!modal) return;

        try {
            await modal.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'حدث خطأ أثناء تنفيذ هذا الأمر!',
                ephemeral: true
            });
        }
    }
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    const userId = newState.id;
    const username = newState.member?.user?.tag || oldState.member?.user?.tag || 'مستخدم';
    // دخول روم صوتي
    if (!oldState.channelId && newState.channelId) {
        storage.setVoiceTime(userId, Date.now());
        await logger.sendLog(client, {
            title: 'دخول عضو روم صوتي',
            description: `**${username}** دخل الروم الصوتي <#${newState.channelId}>`,
            fields: [
                { name: 'الوقت', value: `<t:${Math.floor(Date.now()/1000)}:f>`, inline: true }
            ]
        });
    }
    // خروج أو انتقال من روم صوتي
    if (oldState.channelId && (!newState.channelId || oldState.channelId !== newState.channelId)) {
        const joinTime = storage.getVoiceTime(userId);
        let duration = 'غير معروف';
        if (joinTime) {
            const diffMs = Date.now() - joinTime;
            const seconds = Math.floor(diffMs / 1000) % 60;
            const minutes = Math.floor(diffMs / (1000 * 60)) % 60;
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            duration = `${hours} ساعة ${minutes} دقيقة ${seconds} ثانية`;
            storage.deleteVoiceTime(userId);
        }
        await logger.sendLog(client, {
            title: 'خروج عضو من روم صوتي',
            description: `**${username}** خرج من الروم الصوتي <#${oldState.channelId}>`,
            fields: [
                { name: 'المدة', value: duration, inline: true },
                { name: 'الوقت', value: `<t:${Math.floor(Date.now()/1000)}:f>`, inline: true }
            ]
        });
    }
});

// لوج حذف رسالة
client.on('messageDelete', async (message) => {
    if (message.partial || !message.guild || message.author?.bot) return;
    await logger.sendLog(client, {
        title: '🗑️ تم حذف رسالة',
        description: `**${message.author.tag}** حذف رسالة في <#${message.channel.id}>`,
        fields: [
            { name: 'المحتوى', value: message.content || 'رسالة بدون نص', inline: false },
            { name: 'الوقت', value: `<t:${Math.floor(Date.now()/1000)}:f>`, inline: true }
        ]
    });
});

// لوج تعديل رسالة
client.on('messageUpdate', async (oldMsg, newMsg) => {
    if (oldMsg.partial || newMsg.partial || !oldMsg.guild || oldMsg.author?.bot) return;
    if (oldMsg.content === newMsg.content) return;
    await logger.sendLog(client, {
        title: '✏️ تم تعديل رسالة',
        description: `**${oldMsg.author.tag}** عدل رسالة في <#${oldMsg.channel.id}>`,
        fields: [
            { name: 'قبل التعديل', value: oldMsg.content || 'بدون نص', inline: false },
            { name: 'بعد التعديل', value: newMsg.content || 'بدون نص', inline: false },
            { name: 'الوقت', value: `<t:${Math.floor(Date.now()/1000)}:f>`, inline: true }
        ]
    });
});

// لوج حذف مجموعة رسائل
client.on('messageDeleteBulk', async (messages) => {
    const channel = messages.first()?.channel;
    await logger.sendLog(client, {
        title: '🗑️ حذف مجموعة رسائل',
        description: `تم حذف ${messages.size} رسالة في <#${channel?.id}>`,
        fields: [
            { name: 'الوقت', value: `<t:${Math.floor(Date.now()/1000)}:f>`, inline: true }
        ]
    });
});

// لوج تحديث صلاحيات روم
client.on('channelUpdate', async (oldChannel, newChannel) => {
    if (oldChannel.type !== newChannel.type) return;
    if (oldChannel.permissionOverwrites.cache.size !== newChannel.permissionOverwrites.cache.size) {
        await logger.sendLog(client, {
            title: '🔒 تحديث صلاحيات روم',
            description: `تم تحديث صلاحيات الروم <#${newChannel.id}>`,
            fields: [
                { name: 'الوقت', value: `<t:${Math.floor(Date.now()/1000)}:f>`, inline: true }
            ]
        });
    }
});

// لوج حظر/إزالة حظر/طرد عضو
client.on('guildBanAdd', async (ban) => {
    await logger.sendLog(client, {
        title: '🚫 تم حظر عضو',
        description: `تم حظر **${ban.user.tag}** من السيرفر`,
        fields: [
            { name: 'الوقت', value: `<t:${Math.floor(Date.now()/1000)}:f>`, inline: true }
        ]
    });
});
client.on('guildBanRemove', async (ban) => {
    await logger.sendLog(client, {
        title: '✅ تم إزالة الحظر عن عضو',
        description: `تم إزالة الحظر عن **${ban.user.tag}**`,
        fields: [
            { name: 'الوقت', value: `<t:${Math.floor(Date.now()/1000)}:f>`, inline: true }
        ]
    });
});
client.on('guildMemberRemove', async (member) => {
    await logger.sendLog(client, {
        title: '👋 خروج عضو',
        description: `**${member.user.tag}** غادر السيرفر`,
        fields: [
            { name: 'الوقت', value: `<t:${Math.floor(Date.now()/1000)}:f>`, inline: true }
        ]
    });
});

// لوج تحديث إعدادات السيرفر
client.on('guildUpdate', async (oldGuild, newGuild) => {
    await logger.sendLog(client, {
        title: '⚙️ تحديث إعدادات السيرفر',
        description: `تم تحديث إعدادات السيرفر **${newGuild.name}**`,
        fields: [
            { name: 'الوقت', value: `<t:${Math.floor(Date.now()/1000)}:f>`, inline: true }
        ]
    });
});

// لوج تحديث/إضافة/حذف رتبة
client.on('roleCreate', async (role) => {
    await logger.sendLog(client, {
        title: '➕ إضافة رتبة',
        description: `تمت إضافة رتبة جديدة: **${role.name}**`,
        fields: [
            { name: 'الوقت', value: `<t:${Math.floor(Date.now()/1000)}:f>`, inline: true }
        ]
    });
});
client.on('roleDelete', async (role) => {
    await logger.sendLog(client, {
        title: '➖ حذف رتبة',
        description: `تم حذف رتبة: **${role.name}**`,
        fields: [
            { name: 'الوقت', value: `<t:${Math.floor(Date.now()/1000)}:f>`, inline: true }
        ]
    });
});
client.on('roleUpdate', async (oldRole, newRole) => {
    await logger.sendLog(client, {
        title: '✏️ تحديث رتبة',
        description: `تم تحديث رتبة: **${oldRole.name}**`,
        fields: [
            { name: 'الوقت', value: `<t:${Math.floor(Date.now()/1000)}:f>`, inline: true }
        ]
    });
});

// لوج تحديث/إضافة/حذف إيموجي أو ملصق
client.on('emojiCreate', async (emoji) => {
    await logger.sendLog(client, {
        title: '➕ إضافة إيموجي',
        description: `تمت إضافة إيموجي جديد: <:${emoji.name}:${emoji.id}>`,
        fields: [
            { name: 'الوقت', value: `<t:${Math.floor(Date.now()/1000)}:f>`, inline: true }
        ]
    });
});
client.on('emojiDelete', async (emoji) => {
    await logger.sendLog(client, {
        title: '➖ حذف إيموجي',
        description: `تم حذف إيموجي: ${emoji.name}`,
        fields: [
            { name: 'الوقت', value: `<t:${Math.floor(Date.now()/1000)}:f>`, inline: true }
        ]
    });
});
client.on('emojiUpdate', async (oldEmoji, newEmoji) => {
    await logger.sendLog(client, {
        title: '✏️ تحديث إيموجي',
        description: `تم تحديث إيموجي: ${oldEmoji.name}`,
        fields: [
            { name: 'الوقت', value: `<t:${Math.floor(Date.now()/1000)}:f>`, inline: true }
        ]
    });
});

// لوج تايم أوت
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) {
        if (newMember.communicationDisabledUntilTimestamp) {
            await logger.sendLog(client, {
                title: '⏳ تم إعطاء تايم أوت',
                description: `تم إعطاء تايم أوت لـ **${newMember.user.tag}** حتى <t:${Math.floor(newMember.communicationDisabledUntilTimestamp/1000)}:f>`,
                fields: [
                    { name: 'الوقت', value: `<t:${Math.floor(Date.now()/1000)}:f>`, inline: true }
                ]
            });
        } else {
            await logger.sendLog(client, {
                title: '✅ تم إزالة التايم أوت',
                description: `تمت إزالة التايم أوت عن **${newMember.user.tag}**`,
                fields: [
                    { name: 'الوقت', value: `<t:${Math.floor(Date.now()/1000)}:f>`, inline: true }
                ]
            });
        }
    }
    if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
        await logger.sendLog(client, {
            title: '🔄 تحديث رتب عضو',
            description: `تم تحديث رتب العضو **${newMember.user.tag}**`,
            fields: [
                { name: 'الوقت', value: `<t:${Math.floor(Date.now()/1000)}:f>`, inline: true }
            ]
        });
    }
});

// الاتصال بقاعدة البيانات قبل تسجيل دخول البوت
connectDB();

// تسجيل الدخول باستخدام التوكن من ملف .env
client.login(process.env.TOKEN)
    .then(() => console.log('🚀 تم تشغيل البوت بنجاح!'))
    .catch(error => console.error('❌ فشل تسجيل دخول البوت:', error)); 