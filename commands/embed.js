const { 
    SlashCommandBuilder, 
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');
const fs = require('fs');
const path = require('path');

// وظيفة لتحميل الإيمبدات
function loadEmbeds() {
    const embedsPath = path.join(__dirname, '..', 'data', 'embeds.json');
    if (!fs.existsSync(embedsPath)) {
        fs.writeFileSync(embedsPath, JSON.stringify({ embeds: {} }, null, 4));
        return { embeds: {} };
    }
    return JSON.parse(fs.readFileSync(embedsPath, 'utf8'));
}

// وظيفة لحفظ الإيمبدات
function saveEmbeds(data) {
    const embedsPath = path.join(__dirname, '..', 'data', 'embeds.json');
    fs.writeFileSync(embedsPath, JSON.stringify(data, null, 4));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('إدارة الإيمبدات')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('إنشاء إيمبد جديد')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('اسم الإيمبد')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('تعديل إيمبد')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('اسم الإيمبد')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('عرض إيمبد')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('اسم الإيمبد')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('الروم المراد إرسال الإيمبد إليه')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('حذف إيمبد')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('اسم الإيمبد')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const name = interaction.options.getString('name');
        const embedData = loadEmbeds();

        switch (subcommand) {
            case 'create':
                if (embedData.embeds[name]) {
                    return interaction.reply({
                        content: '❌ يوجد إيمبد بهذا الاسم بالفعل!',
                        ephemeral: true
                    });
                }

                embedData.embeds[name] = {
                    title: '',
                    description: '',
                    color: null,
                    author: {
                        name: '',
                        icon_url: ''
                    },
                    footer: {
                        text: '',
                        icon_url: ''
                    },
                    image: {
                        url: ''
                    },
                    thumbnail: {
                        url: ''
                    }
                };

                saveEmbeds(embedData);

                await interaction.reply({
                    content: `✅ تم إنشاء إيمبد باسم: ${name}\n` +
                            'يمكنك الآن استخدام الإيمبد في الرسائل التلقائية أو رسائل الترحيب/المغادرة\n' +
                            `للاستخدام: \`{embed:${name}}\`\n` +
                            'يمكنك تعديل الإيمبد باستخدام الأزرار أدناه',
                    ephemeral: true
                });
                break;

            case 'edit':
                if (!embedData.embeds[name]) {
                    return interaction.reply({
                        content: '❌ لا يوجد إيمبد بهذا الاسم!',
                        ephemeral: true
                    });
                }

                // سيتم التعامل مع التعديل في ملف منفصل للأحداث
                await interaction.reply({
                    content: `تعديل الإيمبد: ${name}`,
                    ephemeral: true
                });
                break;

            case 'show':
                if (!embedData.embeds[name]) {
                    return interaction.reply({
                        content: '❌ لا يوجد إيمبد بهذا الاسم!',
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder();
                const data = embedData.embeds[name];

                if (data.title) embed.setTitle(data.title);
                if (data.description) embed.setDescription(data.description);
                if (data.color) embed.setColor(data.color);
                if (data.author.name) embed.setAuthor({ 
                    name: data.author.name, 
                    iconURL: data.author.icon_url || null 
                });
                if (data.footer.text) embed.setFooter({ 
                    text: data.footer.text, 
                    iconURL: data.footer.icon_url || null 
                });
                if (data.image.url) embed.setImage(data.image.url);
                if (data.thumbnail.url) embed.setThumbnail(data.thumbnail.url);

                const channel = interaction.options.getChannel('channel');
                if (channel) {
                    await channel.send({ embeds: [embed] });
                    await interaction.reply({
                        content: `✅ تم إرسال الإيمبد إلى ${channel}`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                }
                break;

            case 'delete':
                if (!embedData.embeds[name]) {
                    return interaction.reply({
                        content: '❌ لا يوجد إيمبد بهذا الاسم!',
                        ephemeral: true
                    });
                }

                delete embedData.embeds[name];
                saveEmbeds(embedData);

                await interaction.reply({
                    content: `✅ تم حذف الإيمبد: ${name}`,
                    ephemeral: true
                });
                break;
        }
    },
}; 