const { 
    SlashCommandBuilder, 
    EmbedBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const { loadEmbeds, saveEmbeds } = require('../utils/embeds');

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

                // إنشاء أزرار التحكم
                const editButton = new ButtonBuilder()
                    .setCustomId(`edit_embed_${name}`)
                    .setLabel('تعديل الإيمبد')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('✏️');

                const sendButton = new ButtonBuilder()
                    .setCustomId(`send_embed_${name}`)
                    .setLabel('إرسال للروم')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('📤');

                const deleteButton = new ButtonBuilder()
                    .setCustomId(`delete_embed_${name}`)
                    .setLabel('حذف الإيمبد')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🗑️');

                const row = new ActionRowBuilder()
                    .addComponents(editButton, sendButton, deleteButton);

                const embed = new EmbedBuilder()
                    .setTitle('إيمبد جديد')
                    .setDescription(`تم إنشاء إيمبد جديد باسم: ${name}`)
                    .setColor('#2b2d31')
                    .setFooter({ text: 'استخدم الأزرار أدناه للتحكم بالإيمبد' });

                await interaction.reply({
                    embeds: [embed],
                    components: [row],
                    ephemeral: true
                });

                // معالجة الأزرار
                const filter = i => i.user.id === interaction.user.id;
                const collector = interaction.channel.createMessageComponentCollector({ filter, time: 300000 });

                collector.on('collect', async i => {
                    if (i.customId === `edit_embed_${name}`) {
                        // إنشاء مودال التعديل
                        const modal = new ModalBuilder()
                            .setCustomId(`edit_embed_modal_${name}`)
                            .setTitle('تعديل الإيمبد');

                        const titleInput = new TextInputBuilder()
                            .setCustomId('title')
                            .setLabel('العنوان')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                            .setValue(embedData.embeds[name].title || '');

                        const descriptionInput = new TextInputBuilder()
                            .setCustomId('description')
                            .setLabel('الوصف')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(false)
                            .setValue(embedData.embeds[name].description || '');

                        const colorInput = new TextInputBuilder()
                            .setCustomId('color')
                            .setLabel('اللون (مثال: #2b2d31)')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                            .setValue(embedData.embeds[name].color || '#2b2d31');

                        const imageInput = new TextInputBuilder()
                            .setCustomId('image')
                            .setLabel('رابط الصورة')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                            .setValue(embedData.embeds[name].image?.url || '');

                        const footerInput = new TextInputBuilder()
                            .setCustomId('footer')
                            .setLabel('نص التذييل')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                            .setValue(embedData.embeds[name].footer?.text || '');

                        modal.addComponents(
                            new ActionRowBuilder().addComponents(titleInput),
                            new ActionRowBuilder().addComponents(descriptionInput),
                            new ActionRowBuilder().addComponents(colorInput),
                            new ActionRowBuilder().addComponents(imageInput),
                            new ActionRowBuilder().addComponents(footerInput)
                        );

                        await i.showModal(modal);
                    } else if (i.customId === `send_embed_${name}`) {
                        // إنشاء قائمة اختيار الروم
                        const channels = interaction.guild.channels.cache
                            .filter(c => c.type === 0) // Text channels only
                            .map(c => ({
                                label: c.name,
                                value: c.id,
                                description: `إرسال الإيمبد إلى #${c.name}`
                            }));

                        const selectMenu = new StringSelectMenuBuilder()
                            .setCustomId(`send_embed_channel_${name}`)
                            .setPlaceholder('اختر الروم')
                            .addOptions(channels);

                        const selectRow = new ActionRowBuilder()
                            .addComponents(selectMenu);

                        await i.update({
                            content: 'اختر الروم الذي تريد إرسال الإيمبد إليه:',
                            components: [selectRow]
                        });
                    } else if (i.customId === `delete_embed_${name}`) {
                        delete embedData.embeds[name];
                        saveEmbeds(embedData);
                        await i.update({
                            content: `✅ تم حذف الإيمبد ${name}`,
                            embeds: [],
                            components: []
                        });
                    } else if (i.customId.startsWith(`send_embed_channel_${name}`)) {
                        const channelId = i.values[0];
                        const channel = interaction.guild.channels.cache.get(channelId);
                        
                        if (channel) {
                            const embedToSend = new EmbedBuilder();
                            const embedConfig = embedData.embeds[name];

                            if (embedConfig.title) embedToSend.setTitle(embedConfig.title);
                            if (embedConfig.description) embedToSend.setDescription(embedConfig.description);
                            if (embedConfig.color) embedToSend.setColor(embedConfig.color);
                            if (embedConfig.author.name) embedToSend.setAuthor({
                                name: embedConfig.author.name,
                                iconURL: embedConfig.author.icon_url
                            });
                            if (embedConfig.footer.text) embedToSend.setFooter({
                                text: embedConfig.footer.text,
                                iconURL: embedConfig.footer.icon_url
                            });
                            if (embedConfig.image.url) embedToSend.setImage(embedConfig.image.url);
                            if (embedConfig.thumbnail.url) embedToSend.setThumbnail(embedConfig.thumbnail.url);

                            await channel.send({ embeds: [embedToSend] });
                            await i.update({
                                content: `✅ تم إرسال الإيمبد إلى ${channel}`,
                                embeds: [],
                                components: []
                            });
                        }
                    }
                });

                collector.on('end', () => {
                    interaction.editReply({
                        content: '⏱️ انتهت مهلة التفاعل',
                        components: []
                    });
                });
                break;

            case 'edit':
                // التحقق من وجود الإيمبد
                if (!embedData.embeds[name]) {
                    return interaction.reply({
                        content: '❌ لم يتم العثور على الإيمبد!',
                        ephemeral: true
                    });
                }

                // عرض الإيمبد الحالي مع أزرار التعديل
                const currentEmbed = new EmbedBuilder();
                const currentConfig = embedData.embeds[name];

                if (currentConfig.title) currentEmbed.setTitle(currentConfig.title);
                if (currentConfig.description) currentEmbed.setDescription(currentConfig.description);
                if (currentConfig.color) currentEmbed.setColor(currentConfig.color);
                if (currentConfig.author.name) currentEmbed.setAuthor({
                    name: currentConfig.author.name,
                    iconURL: currentConfig.author.icon_url
                });
                if (currentConfig.footer.text) currentEmbed.setFooter({
                    text: currentConfig.footer.text,
                    iconURL: currentConfig.footer.icon_url
                });
                if (currentConfig.image.url) currentEmbed.setImage(currentConfig.image.url);
                if (currentConfig.thumbnail.url) currentEmbed.setThumbnail(currentConfig.thumbnail.url);

                const editButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`edit_embed_${name}`)
                            .setLabel('تعديل')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji('✏️'),
                        new ButtonBuilder()
                            .setCustomId(`send_embed_${name}`)
                            .setLabel('إرسال')
                            .setStyle(ButtonStyle.Success)
                            .setEmoji('📤'),
                        new ButtonBuilder()
                            .setCustomId(`delete_embed_${name}`)
                            .setLabel('حذف')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji('🗑️')
                    );

                await interaction.reply({
                    content: `الإيمبد الحالي: ${name}`,
                    embeds: [currentEmbed],
                    components: [editButtons],
                    ephemeral: true
                });

                // إعادة استخدام نفس معالج الأزرار من الإنشاء
                const editFilter = i => i.user.id === interaction.user.id;
                const editCollector = interaction.channel.createMessageComponentCollector({ editFilter, time: 300000 });

                editCollector.on('collect', async i => {
                    // نفس المنطق السابق لمعالجة الأزرار
                });

                editCollector.on('end', () => {
                    interaction.editReply({
                        content: '⏱️ انتهت مهلة التفاعل',
                        components: []
                    });
                });
                break;

            case 'show':
                if (!embedData.embeds[name]) {
                    return interaction.reply({
                        content: '❌ لم يتم العثور على الإيمبد!',
                        ephemeral: true
                    });
                }

                const channel = interaction.options.getChannel('channel');
                const showEmbed = new EmbedBuilder();
                const showConfig = embedData.embeds[name];

                if (showConfig.title) showEmbed.setTitle(showConfig.title);
                if (showConfig.description) showEmbed.setDescription(showConfig.description);
                if (showConfig.color) showEmbed.setColor(showConfig.color);
                if (showConfig.author.name) showEmbed.setAuthor({
                    name: showConfig.author.name,
                    iconURL: showConfig.author.icon_url
                });
                if (showConfig.footer.text) showEmbed.setFooter({
                    text: showConfig.footer.text,
                    iconURL: showConfig.footer.icon_url
                });
                if (showConfig.image.url) showEmbed.setImage(showConfig.image.url);
                if (showConfig.thumbnail.url) showEmbed.setThumbnail(showConfig.thumbnail.url);

                if (channel) {
                    await channel.send({ embeds: [showEmbed] });
                    await interaction.reply({
                        content: `✅ تم إرسال الإيمبد إلى ${channel}`,
                        ephemeral: true
                    });
                } else {
                    const showButtons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`edit_embed_${name}`)
                                .setLabel('تعديل')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('✏️'),
                            new ButtonBuilder()
                                .setCustomId(`send_embed_${name}`)
                                .setLabel('إرسال')
                                .setStyle(ButtonStyle.Success)
                                .setEmoji('📤')
                        );

                    await interaction.reply({
                        embeds: [showEmbed],
                        components: [showButtons],
                        ephemeral: true
                    });
                }
                break;

            case 'delete':
                if (!embedData.embeds[name]) {
                    return interaction.reply({
                        content: '❌ لم يتم العثور على الإيمبد!',
                        ephemeral: true
                    });
                }

                delete embedData.embeds[name];
                saveEmbeds(embedData);

                await interaction.reply({
                    content: `✅ تم حذف الإيمبد ${name}`,
                    ephemeral: true
                });
                break;
        }
    },
}; 