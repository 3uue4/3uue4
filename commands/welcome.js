const { 
    SlashCommandBuilder, 
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');

// وظيفة لتحميل إعدادات الترحيب
function loadWelcomeSettings() {
    const settingsPath = path.join(__dirname, '..', 'data', 'welcome.json');
    if (!fs.existsSync(settingsPath)) {
        const defaultSettings = {
            enabled: false,
            channelId: null,
            embedName: null
        };
        fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 4));
        return defaultSettings;
    }
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
}

// وظيفة لحفظ إعدادات الترحيب
function saveWelcomeSettings(settings) {
    const settingsPath = path.join(__dirname, '..', 'data', 'welcome.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4));
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
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('إعدادات الترحيب')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('إعداد نظام الترحيب')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('روم الترحيب')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('embed')
                        .setDescription('اسم الإيمبد المستخدم للترحيب')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('اختبار رسالة الترحيب'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('تعطيل نظام الترحيب')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const settings = loadWelcomeSettings();

        switch (subcommand) {
            case 'setup':
                const channel = interaction.options.getChannel('channel');
                const embedName = interaction.options.getString('embed');
                
                // التحقق من وجود الإيمبد
                const embedData = loadEmbeds();
                if (!embedData.embeds[embedName]) {
                    return interaction.reply({
                        content: '❌ الإيمبد المحدد غير موجود! الرجاء إنشاء الإيمبد أولاً باستخدام أمر `/embed create`',
                        ephemeral: true
                    });
                }

                settings.enabled = true;
                settings.channelId = channel.id;
                settings.embedName = embedName;
                saveWelcomeSettings(settings);

                await interaction.reply({
                    content: `✅ تم إعداد نظام الترحيب:\nروم الترحيب: ${channel}\nالإيمبد: \`${embedName}\`\n\nيمكنك اختبار الرسالة باستخدام \`/welcome test\``,
                    ephemeral: true
                });
                break;

            case 'test':
                if (!settings.enabled) {
                    return interaction.reply({
                        content: '❌ نظام الترحيب غير مفعل! قم بإعداده أولاً باستخدام `/welcome setup`',
                        ephemeral: true
                    });
                }

                const testChannel = interaction.guild.channels.cache.get(settings.channelId);
                if (!testChannel) {
                    return interaction.reply({
                        content: '❌ لم يتم العثور على روم الترحيب! الرجاء إعادة إعداد النظام',
                        ephemeral: true
                    });
                }

                const embeds = loadEmbeds();
                const welcomeEmbed = embeds.embeds[settings.embedName];
                if (!welcomeEmbed) {
                    return interaction.reply({
                        content: '❌ لم يتم العثور على الإيمبد! الرجاء إعادة إعداد النظام',
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder();
                if (welcomeEmbed.title) embed.setTitle(welcomeEmbed.title);
                if (welcomeEmbed.description) {
                    const desc = welcomeEmbed.description
                        .replace('{user}', interaction.user)
                        .replace('{server}', interaction.guild.name)
                        .replace('{memberCount}', interaction.guild.memberCount);
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

                await testChannel.send({ embeds: [embed] });
                await interaction.reply({
                    content: '✅ تم إرسال رسالة الترحيب التجريبية',
                    ephemeral: true
                });
                break;

            case 'disable':
                settings.enabled = false;
                saveWelcomeSettings(settings);

                await interaction.reply({
                    content: '✅ تم تعطيل نظام الترحيب',
                    ephemeral: true
                });
                break;
        }
    },
}; 