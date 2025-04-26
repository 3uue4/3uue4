const { 
    SlashCommandBuilder, 
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');
const fs = require('fs');
const path = require('path');

// وظيفة لتحميل الإعدادات
function loadSettings() {
    const settingsPath = path.join(__dirname, '..', 'data', 'autoRespond.json');
    if (!fs.existsSync(settingsPath)) {
        const defaultSettings = {
            gifChannels: [],
            reactionChannels: {}
        };
        fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 4));
        return defaultSettings;
    }
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
}

// وظيفة لحفظ الإعدادات
function saveSettings(settings) {
    const settingsPath = path.join(__dirname, '..', 'data', 'autoRespond.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autorespond')
        .setDescription('إعدادات الردود التلقائية')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommandGroup(group =>
            group
                .setName('gif')
                .setDescription('إعدادات الرد التلقائي بالـ GIF')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('add')
                        .setDescription('إضافة روم للرد التلقائي بالـ GIF')
                        .addChannelOption(option =>
                            option.setName('channel')
                                .setDescription('الروم المراد إضافته')
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription('إزالة روم من الرد التلقائي بالـ GIF')
                        .addChannelOption(option =>
                            option.setName('channel')
                                .setDescription('الروم المراد إزالته')
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('list')
                        .setDescription('عرض قائمة الرومات المفعل فيها الرد التلقائي بالـ GIF')))
        .addSubcommandGroup(group =>
            group
                .setName('reactions')
                .setDescription('إعدادات التفاعلات التلقائية')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('add')
                        .setDescription('إضافة روم للتفاعل التلقائي')
                        .addChannelOption(option =>
                            option.setName('channel')
                                .setDescription('الروم المراد إضافته')
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName('emojis')
                                .setDescription('الإيموجيات مفصولة بمسافة')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('remove')
                        .setDescription('إزالة روم من التفاعل التلقائي')
                        .addChannelOption(option =>
                            option.setName('channel')
                                .setDescription('الروم المراد إزالته')
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('list')
                        .setDescription('عرض قائمة الرومات والتفاعلات التلقائية'))),

    async execute(interaction) {
        const group = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();
        const settings = loadSettings();

        if (group === 'gif') {
            switch (subcommand) {
                case 'add':
                    const gifChannel = interaction.options.getChannel('channel');
                    if (settings.gifChannels.includes(gifChannel.id)) {
                        return interaction.reply({
                            content: '❌ هذا الروم مضاف بالفعل!',
                            ephemeral: true
                        });
                    }
                    settings.gifChannels.push(gifChannel.id);
                    saveSettings(settings);
                    await interaction.reply({
                        content: `✅ تم إضافة ${gifChannel} لقائمة الرومات التي سيتم الرد فيها تلقائياً بالـ GIF`,
                        ephemeral: true
                    });
                    break;

                case 'remove':
                    const removeGifChannel = interaction.options.getChannel('channel');
                    const gifIndex = settings.gifChannels.indexOf(removeGifChannel.id);
                    if (gifIndex === -1) {
                        return interaction.reply({
                            content: '❌ هذا الروم غير موجود في القائمة!',
                            ephemeral: true
                        });
                    }
                    settings.gifChannels.splice(gifIndex, 1);
                    saveSettings(settings);
                    await interaction.reply({
                        content: `✅ تم إزالة ${removeGifChannel} من قائمة الرومات`,
                        ephemeral: true
                    });
                    break;

                case 'list':
                    if (settings.gifChannels.length === 0) {
                        return interaction.reply({
                            content: '❌ لا توجد رومات في القائمة!',
                            ephemeral: true
                        });
                    }
                    const gifChannels = settings.gifChannels.map(id => `<#${id}>`).join('\n');
                    await interaction.reply({
                        content: `📋 الرومات المفعل فيها الرد التلقائي بالـ GIF:\n${gifChannels}`,
                        ephemeral: true
                    });
                    break;
            }
        } else if (group === 'reactions') {
            switch (subcommand) {
                case 'add':
                    const reactionChannel = interaction.options.getChannel('channel');
                    const emojis = interaction.options.getString('emojis').trim().split(/\s+/);
                    
                    settings.reactionChannels[reactionChannel.id] = emojis;
                    saveSettings(settings);
                    await interaction.reply({
                        content: `✅ تم إضافة التفاعلات التلقائية في ${reactionChannel}\nالإيموجيات: ${emojis.join(' ')}`,
                        ephemeral: true
                    });
                    break;

                case 'remove':
                    const removeReactionChannel = interaction.options.getChannel('channel');
                    if (!settings.reactionChannels[removeReactionChannel.id]) {
                        return interaction.reply({
                            content: '❌ هذا الروم غير موجود في القائمة!',
                            ephemeral: true
                        });
                    }
                    delete settings.reactionChannels[removeReactionChannel.id];
                    saveSettings(settings);
                    await interaction.reply({
                        content: `✅ تم إزالة ${removeReactionChannel} من قائمة الرومات`,
                        ephemeral: true
                    });
                    break;

                case 'list':
                    if (Object.keys(settings.reactionChannels).length === 0) {
                        return interaction.reply({
                            content: '❌ لا توجد رومات في القائمة!',
                            ephemeral: true
                        });
                    }
                    const reactionList = Object.entries(settings.reactionChannels)
                        .map(([channelId, emojis]) => `<#${channelId}>: ${emojis.join(' ')}`)
                        .join('\n');
                    await interaction.reply({
                        content: `📋 الرومات والتفاعلات التلقائية:\n${reactionList}`,
                        ephemeral: true
                    });
                    break;
            }
        }
    },
}; 