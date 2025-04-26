require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ActivityType, Partials, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const keepAlive = require('./utils/keepAlive');
const connectToDatabase = require('./utils/database');
const logger = require('./utils/logger');
const storage = require('./database/storage');

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
                content: '❌ حدث خطأ أثناء تنفيذ الأمر',
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
                content: '❌ حدث خطأ أثناء تنفيذ الأمر',
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
                content: '❌ حدث خطأ أثناء تنفيذ الأمر',
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

// ===== تهيئة التخزين =====
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

// ===== وظائف التخزين =====
function readEmbeds() {
    try {
        const data = fs.readFileSync(EMBEDS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading embeds:', error);
        return {};
    }
}

function writeEmbeds(embeds) {
    try {
        fs.writeFileSync(EMBEDS_FILE, JSON.stringify(embeds, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing embeds:', error);
    }
}

// ===== وظائف إدارة الإمبدات =====
const storage = {
    saveEmbed: function(name, embedData) {
        const embeds = readEmbeds();
        embeds[name] = embedData;
        writeEmbeds(embeds);
    },

    getEmbed: function(name) {
        const embeds = readEmbeds();
        return embeds[name];
    },

    deleteEmbed: function(name) {
        const embeds = readEmbeds();
        delete embeds[name];
        writeEmbeds(embeds);
    },

    updateEmbed: function(name, updates) {
        const embeds = readEmbeds();
        if (embeds[name]) {
            embeds[name] = { ...embeds[name], ...updates };
            writeEmbeds(embeds);
            return true;
        }
        return false;
    },

    getAllEmbeds: function() {
        return readEmbeds();
    }
};

// ===== وظائف إدارة الإمبدات =====
const storage = {
    saveEmbed: function(name, embedData) {
        const embeds = readEmbeds();
        embeds[name] = embedData;
        writeEmbeds(embeds);
    },

    getEmbed: function(name) {
        const embeds = readEmbeds();
        return embeds[name];
    },

    deleteEmbed: function(name) {
        const embeds = readEmbeds();
        delete embeds[name];
        writeEmbeds(embeds);
    },

    updateEmbed: function(name, updates) {
        const embeds = readEmbeds();
        if (embeds[name]) {
            embeds[name] = { ...embeds[name], ...updates };
            writeEmbeds(embeds);
            return true;
        }
        return false;
    },

    getAllEmbeds: function() {
        return readEmbeds();
    }
};

// ===== إنشاء الأزرار =====
function createMainButtons() {
    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('edit_title')
                .setLabel('عنوان')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('edit_description')
                .setLabel('وصف')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('edit_color')
                .setLabel('لون')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('edit_thumbnail')
                .setLabel('صورة مصغرة')
                .setStyle(ButtonStyle.Primary)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('edit_author')
                .setLabel('المؤلف')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('edit_footer')
                .setLabel('التذييل')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('edit_image')
                .setLabel('صورة')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('edit_fields')
                .setLabel('حقول')
                .setStyle(ButtonStyle.Secondary)
        );

    const row3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('save_embed')
                .setLabel('حفظ')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('cancel_edit')
                .setLabel('إلغاء')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('preview_embed')
                .setLabel('معاينة')
                .setStyle(ButtonStyle.Primary)
        );

    return [row1, row2, row3];
}

function createFieldButtons() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('add_field')
                .setLabel('إضافة حقل')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('remove_field')
                .setLabel('حذف حقل')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('edit_field')
                .setLabel('تعديل حقل')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('back_to_main')
                .setLabel('رجوع')
                .setStyle(ButtonStyle.Secondary)
        );
}

function createConfirmButtons() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_yes')
                .setLabel('نعم')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('confirm_no')
                .setLabel('لا')
                .setStyle(ButtonStyle.Danger)
        );
}

// ===== معالج الأزرار =====
let currentEmbed = {};
let isEditing = false;

async function handleButton(interaction) {
    const customId = interaction.customId;

    // التحقق من حالة التحرير
    if (!isEditing && !customId.startsWith('confirm_')) {
        await interaction.reply({ content: 'لم يتم بدء عملية التحرير بعد', ephemeral: true });
        return;
    }

    switch (customId) {
        // أزرار التحرير الرئيسية
        case 'edit_title':
            await handleTitleEdit(interaction);
            break;
        case 'edit_description':
            await handleDescriptionEdit(interaction);
            break;
        case 'edit_color':
            await handleColorEdit(interaction);
            break;
        case 'edit_thumbnail':
            await handleThumbnailEdit(interaction);
            break;
        case 'edit_author':
            await handleAuthorEdit(interaction);
            break;
        case 'edit_footer':
            await handleFooterEdit(interaction);
            break;
        case 'edit_image':
            await handleImageEdit(interaction);
            break;
        case 'edit_fields':
            await handleFieldsEdit(interaction);
            break;

        // أزرار الحقول
        case 'add_field':
            await handleAddField(interaction);
            break;
        case 'remove_field':
            await handleRemoveField(interaction);
            break;
        case 'edit_field':
            await handleEditField(interaction);
            break;
        case 'back_to_main':
            await showMainMenu(interaction);
            break;

        // أزرار العمليات
        case 'save_embed':
            await handleSaveEmbed(interaction);
            break;
        case 'cancel_edit':
            await handleCancelEdit(interaction);
            break;
        case 'preview_embed':
            await handlePreviewEmbed(interaction);
            break;

        // أزرار التأكيد
        case 'confirm_yes':
            await handleConfirmYes(interaction);
            break;
        case 'confirm_no':
            await handleConfirmNo(interaction);
            break;
    }
}

// ===== وظائف معالجة التحرير =====
async function handleTitleEdit(interaction) {
    await interaction.reply({ 
        content: 'الرجاء إدخال العنوان الجديد:',
        ephemeral: true 
    });
    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async m => {
        currentEmbed.title = m.content;
        await m.delete();
        await interaction.followUp({ 
            content: 'تم تحديث العنوان بنجاح!',
            ephemeral: true 
        });
    });
}

async function handleDescriptionEdit(interaction) {
    await interaction.reply({ 
        content: 'الرجاء إدخال الوصف الجديد:',
        ephemeral: true 
    });
    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async m => {
        currentEmbed.description = m.content;
        await m.delete();
        await interaction.followUp({ 
            content: 'تم تحديث الوصف بنجاح!',
            ephemeral: true 
        });
    });
}

async function handleColorEdit(interaction) {
    await interaction.reply({ 
        content: 'الرجاء إدخال اللون الجديد (بتنسيق HEX مثل #FF0000):',
        ephemeral: true 
    });
    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async m => {
        if (/^#[0-9A-F]{6}$/i.test(m.content)) {
            currentEmbed.color = parseInt(m.content.replace('#', ''), 16);
            await m.delete();
            await interaction.followUp({ 
                content: 'تم تحديث اللون بنجاح!',
                ephemeral: true 
            });
        } else {
            await interaction.followUp({ 
                content: 'تنسيق اللون غير صحيح. الرجاء استخدام تنسيق HEX (مثل #FF0000)',
                ephemeral: true 
            });
        }
    });
}

async function handleThumbnailEdit(interaction) {
    await interaction.reply({ 
        content: 'الرجاء إدخال رابط الصورة المصغرة:',
        ephemeral: true 
    });
    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async m => {
        if (isValidUrl(m.content)) {
            currentEmbed.thumbnail = { url: m.content };
            await m.delete();
            await interaction.followUp({ 
                content: 'تم تحديث الصورة المصغرة بنجاح!',
                ephemeral: true 
            });
        } else {
            await interaction.followUp({ 
                content: 'الرابط غير صالح. الرجاء إدخال رابط صحيح.',
                ephemeral: true 
            });
        }
    });
}

async function handleAuthorEdit(interaction) {
    await interaction.reply({ 
        content: 'الرجاء إدخال اسم المؤلف:',
        ephemeral: true 
    });
    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async m => {
        currentEmbed.author = { name: m.content };
        await m.delete();
        await interaction.followUp({ 
            content: 'تم تحديث معلومات المؤلف بنجاح!',
            ephemeral: true 
        });
    });
}

async function handleFooterEdit(interaction) {
    await interaction.reply({ 
        content: 'الرجاء إدخال نص التذييل:',
        ephemeral: true 
    });
    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async m => {
        currentEmbed.footer = { text: m.content };
        await m.delete();
        await interaction.followUp({ 
            content: 'تم تحديث التذييل بنجاح!',
            ephemeral: true 
        });
    });
}

async function handleImageEdit(interaction) {
    await interaction.reply({ 
        content: 'الرجاء إدخال رابط الصورة:',
        ephemeral: true 
    });
    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async m => {
        if (isValidUrl(m.content)) {
            currentEmbed.image = { url: m.content };
            await m.delete();
            await interaction.followUp({ 
                content: 'تم تحديث الصورة بنجاح!',
                ephemeral: true 
            });
        } else {
            await interaction.followUp({ 
                content: 'الرابط غير صالح. الرجاء إدخال رابط صحيح.',
                ephemeral: true 
            });
        }
    });
}

// ===== وظائف معالجة الحقول =====
async function handleFieldsEdit(interaction) {
    const buttons = createFieldButtons();
    await interaction.update({ 
        content: 'اختر عملية الحقول:',
        components: buttons 
    });
}

async function handleAddField(interaction) {
    await interaction.reply({ 
        content: 'الرجاء إدخال عنوان الحقل:',
        ephemeral: true 
    });
    
    const filter = m => m.author.id === interaction.user.id;
    let fieldName, fieldValue;
    
    const nameCollector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });
    
    nameCollector.on('collect', async m => {
        fieldName = m.content;
        await m.delete();
        
        await interaction.followUp({ 
            content: 'الرجاء إدخال قيمة الحقل:',
            ephemeral: true 
        });
        
        const valueCollector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });
        
        valueCollector.on('collect', async m2 => {
            fieldValue = m2.content;
            await m2.delete();
            
            if (!currentEmbed.fields) {
                currentEmbed.fields = [];
            }
            
            currentEmbed.fields.push({
                name: fieldName,
                value: fieldValue,
                inline: false
            });
            
            await interaction.followUp({ 
                content: 'تم إضافة الحقل بنجاح!',
                ephemeral: true 
            });
        });
    });
}

async function handleRemoveField(interaction) {
    if (!currentEmbed.fields || currentEmbed.fields.length === 0) {
        await interaction.reply({ 
            content: 'لا توجد حقول لإزالتها.',
            ephemeral: true 
        });
        return;
    }

    const fieldOptions = currentEmbed.fields.map((field, index) => 
        `${index + 1}. ${field.name}`
    ).join('\n');

    await interaction.reply({ 
        content: `الرجاء إدخال رقم الحقل الذي تريد إزالته:\n${fieldOptions}`,
        ephemeral: true 
    });

    const filter = m => m.author.id === interaction.user.id && !isNaN(m.content);
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async m => {
        const index = parseInt(m.content) - 1;
        if (index >= 0 && index < currentEmbed.fields.length) {
            currentEmbed.fields.splice(index, 1);
            await m.delete();
            await interaction.followUp({ 
                content: 'تم إزالة الحقل بنجاح!',
                ephemeral: true 
            });
        } else {
            await interaction.followUp({ 
                content: 'رقم الحقل غير صالح.',
                ephemeral: true 
            });
        }
    });
}

async function handleEditField(interaction) {
    if (!currentEmbed.fields || currentEmbed.fields.length === 0) {
        await interaction.reply({ 
            content: 'لا توجد حقول لتحريرها.',
            ephemeral: true 
        });
        return;
    }

    const fieldOptions = currentEmbed.fields.map((field, index) => 
        `${index + 1}. ${field.name}`
    ).join('\n');

    await interaction.reply({ 
        content: `الرجاء إدخال رقم الحقل الذي تريد تحريره:\n${fieldOptions}`,
        ephemeral: true 
    });

    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async m => {
        const index = parseInt(m.content) - 1;
        if (index >= 0 && index < currentEmbed.fields.length) {
            await m.delete();
            await handleFieldEdit(interaction, index);
        } else {
            await interaction.followUp({ 
                content: 'رقم الحقل غير صالح.',
                ephemeral: true 
            });
        }
    });
}

async function handleFieldEdit(interaction, fieldIndex) {
    await interaction.followUp({ 
        content: 'الرجاء إدخال عنوان الحقل الجديد:',
        ephemeral: true 
    });

    const filter = m => m.author.id === interaction.user.id;
    let newName, newValue;

    const nameCollector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    nameCollector.on('collect', async m => {
        newName = m.content;
        await m.delete();

        await interaction.followUp({ 
            content: 'الرجاء إدخال قيمة الحقل الجديدة:',
            ephemeral: true 
        });

        const valueCollector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

        valueCollector.on('collect', async m2 => {
            newValue = m2.content;
            await m2.delete();

            currentEmbed.fields[fieldIndex] = {
                name: newName,
                value: newValue,
                inline: currentEmbed.fields[fieldIndex].inline
            };

            await interaction.followUp({ 
                content: 'تم تحديث الحقل بنجاح!',
                ephemeral: true 
            });
        });
    });
}

// ===== وظائف المساعدة =====
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

async function showMainMenu(interaction) {
    const buttons = createMainButtons();
    await interaction.update({ 
        components: buttons
    });
}

// ===== وظائف معالجة العمليات =====
async function handleSaveEmbed(interaction) {
    try {
        await storage.saveEmbed(currentEmbed.name, currentEmbed);
        isEditing = false;
        await interaction.reply({ 
            content: 'تم حفظ الإمبد بنجاح!',
            ephemeral: true 
        });
    } catch (error) {
        await interaction.reply({ 
            content: 'حدث خطأ أثناء حفظ الإمبد',
            ephemeral: true 
        });
    }
}

async function handleCancelEdit(interaction) {
    isEditing = false;
    currentEmbed = {};
    await interaction.reply({ 
        content: 'تم إلغاء التحرير',
        ephemeral: true 
    });
}

async function handlePreviewEmbed(interaction) {
    const embed = new EmbedBuilder()
        .setTitle(currentEmbed.title)
        .setDescription(currentEmbed.description)
        .setColor(currentEmbed.color);

    if (currentEmbed.author) {
        embed.setAuthor(currentEmbed.author);
    }
    if (currentEmbed.footer) {
        embed.setFooter(currentEmbed.footer);
    }
    if (currentEmbed.thumbnail) {
        embed.setThumbnail(currentEmbed.thumbnail.url);
    }
    if (currentEmbed.image) {
        embed.setImage(currentEmbed.image.url);
    }
    if (currentEmbed.fields) {
        embed.addFields(currentEmbed.fields);
    }

    await interaction.reply({ 
        embeds: [embed],
        ephemeral: true 
    });
}

// ===== تصدير الوظائف =====
module.exports = {
    handleButton,
    currentEmbed,
    isEditing,
    storage,
    createMainButtons,
    createFieldButtons,
    createConfirmButtons
}; 