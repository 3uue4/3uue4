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
const Settings = require('../models/Settings');
const logger = require('../utils/logger');
const storage = require('../database/storage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('إدارة الإمبدات المخصصة')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('إنشاء إمبد جديد')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('اسم الإمبد')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('عرض إمبد في روم معين')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('اسم الإمبد')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('الروم المراد إرسال الإمبد فيه')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('حذف إمبد')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('اسم الإمبد')
                        .setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            const name = interaction.options.getString('name');
            
            // التحقق من وجود الإمبد
            const existingEmbed = storage.getEmbed(name);
            if (existingEmbed) {
                return interaction.reply({
                    content: '❌ يوجد إمبد بهذا الاسم بالفعل!',
                    ephemeral: true
                });
            }

            // إنشاء إمبد جديد
            const embed = new EmbedBuilder()
                .setTitle('عنوان جديد')
                .setDescription('وصف جديد')
                .setColor('#2b2d31');

            // حفظ الإمبد
            storage.saveEmbed(name, {
                title: 'عنوان جديد',
                description: 'وصف جديد',
                color: '#2b2d31',
                author: null,
                authorIcon: null,
                footer: null,
                footerIcon: null,
                thumbnail: null,
                image: null
            });

            // إنشاء الأزرار
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`embed_basic_${name}`)
                        .setLabel('تعديل المعلومات الأساسية')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`embed_author_${name}`)
                        .setLabel('تعديل المؤلف')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`embed_footer_${name}`)
                        .setLabel('تعديل التذييل')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`embed_images_${name}`)
                        .setLabel('تعديل الصور')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.reply({
                content: `✅ تم إنشاء إمبد باسم: ${name}\nيمكنك الآن استخدام \`{embed:${name}}\` في رسالة الترحيب أو الرد التلقائي`,
                embeds: [embed],
                components: [row]
            });
        }
        else if (subcommand === 'show') {
            const name = interaction.options.getString('name');
            const channel = interaction.options.getChannel('channel');
            
            const embedData = storage.getEmbed(name);
            if (!embedData) {
                return interaction.reply({
                    content: '❌ لم يتم العثور على إمبد بهذا الاسم!',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(embedData.title)
                .setDescription(embedData.description)
                .setColor(embedData.color || '#2b2d31');

            if (embedData.author) {
                embed.setAuthor({ 
                    name: embedData.author,
                    iconURL: embedData.authorIcon
                });
            }

            if (embedData.footer) {
                embed.setFooter({
                    text: embedData.footer,
                    iconURL: embedData.footerIcon
                });
            }

            if (embedData.thumbnail) {
                embed.setThumbnail(embedData.thumbnail);
            }

            if (embedData.image) {
                embed.setImage(embedData.image);
            }

            await channel.send({ embeds: [embed] });
            await interaction.reply({
                content: `✅ تم إرسال الإمبد إلى ${channel}`,
                ephemeral: true
            });
        }
        else if (subcommand === 'delete') {
            const name = interaction.options.getString('name');
            
            if (!storage.getEmbed(name)) {
                return interaction.reply({
                    content: '❌ لم يتم العثور على إمبد بهذا الاسم!',
                    ephemeral: true
                });
            }

            storage.deleteEmbed(name);
            await interaction.reply({
                content: `✅ تم حذف الإمبد: ${name}`,
                ephemeral: true
            });
        }
    },

    async handleButton(interaction) {
        const settings = await Settings.findOne({ guildId: interaction.guild.id }) || 
                        new Settings({ guildId: interaction.guild.id });

        switch (interaction.customId) {
            case 'create_embed': {
                const modal = new ModalBuilder()
                    .setCustomId('create_embed_modal')
                    .setTitle('إنشاء إمبد جديد');

                const titleInput = new TextInputBuilder()
                    .setCustomId('title')
                    .setLabel('عنوان الإمبد')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('عنوان الإمبد')
                    .setRequired(true);

                const descriptionInput = new TextInputBuilder()
                    .setCustomId('description')
                    .setLabel('وصف الإمبد')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('وصف الإمبد')
                    .setRequired(true);

                const colorInput = new TextInputBuilder()
                    .setCustomId('color')
                    .setLabel('لون الإمبد (Hex)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('#0099ff')
                    .setRequired(true);

                const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
                const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);
                const thirdActionRow = new ActionRowBuilder().addComponents(colorInput);

                modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
                await interaction.showModal(modal);
                break;
            }

            case 'edit_embed': {
                if (!settings.embeds || Object.keys(settings.embeds).length === 0) {
                    return await interaction.reply({
                        content: '❌ لا توجد إمبدات متاحة للتعديل',
                        ephemeral: true
                    });
                }

                const modal = new ModalBuilder()
                    .setCustomId('edit_embed_modal')
                    .setTitle('تعديل الإمبد');

                const titleInput = new TextInputBuilder()
                    .setCustomId('title')
                    .setLabel('عنوان الإمبد')
                    .setStyle(TextInputStyle.Short)
                    .setValue(settings.embeds[0]?.title || '')
                    .setRequired(true);

                const descriptionInput = new TextInputBuilder()
                    .setCustomId('description')
                    .setLabel('وصف الإمبد')
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(settings.embeds[0]?.description || '')
                    .setRequired(true);

                const colorInput = new TextInputBuilder()
                    .setCustomId('color')
                    .setLabel('لون الإمبد (Hex)')
                    .setStyle(TextInputStyle.Short)
                    .setValue(settings.embeds[0]?.color || '#0099ff')
                    .setRequired(true);

                const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
                const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);
                const thirdActionRow = new ActionRowBuilder().addComponents(colorInput);

                modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
                await interaction.showModal(modal);
                break;
            }

            case 'preview_embed': {
                if (!settings.embeds || Object.keys(settings.embeds).length === 0) {
                    return await interaction.reply({
                        content: '❌ لا توجد إمبدات متاحة للمعاينة',
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder()
                    .setTitle(settings.embeds[0].title)
                    .setDescription(settings.embeds[0].description)
                    .setColor(settings.embeds[0].color)
                    .setTimestamp();

                await interaction.reply({
                    content: 'معاينة الإمبد:',
                    embeds: [embed],
                    ephemeral: true
                });
                break;
            }
        }
    },

    async handleModal(interaction) {
        const settings = await Settings.findOne({ guildId: interaction.guild.id }) || 
                        new Settings({ guildId: interaction.guild.id });

        const title = interaction.fields.getTextInputValue('title');
        const description = interaction.fields.getTextInputValue('description');
        const color = interaction.fields.getTextInputValue('color');

        // Validate color
        if (!/^#[0-9A-F]{6}$/i.test(color)) {
            return await interaction.reply({
                content: '❌ الرجاء إدخال لون صحيح بتنسيق Hex (مثال: #0099ff)',
                ephemeral: true
            });
        }

        if (!settings.embeds) {
            settings.embeds = [];
        }

        const newEmbed = {
            title,
            description,
            color
        };

        if (interaction.customId === 'create_embed_modal') {
            settings.embeds.push(newEmbed);
        } else {
            settings.embeds[0] = newEmbed;
        }

        await settings.save();

        await interaction.reply({
            content: '✅ تم حفظ الإمبد بنجاح',
            ephemeral: true
        });

        await logger.sendLog(interaction.client, {
            title: '🔄 تحديث الإمبد',
            description: `تم تحديث الإمبد بواسطة ${interaction.user}`,
            color: 0x0099ff
        });
    }
}; 