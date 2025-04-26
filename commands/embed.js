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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('إدارة الإمبدات')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.guild) {
            return await interaction.reply({ 
                content: '❌ هذا الأمر يمكن استخدامه فقط في السيرفر',
                ephemeral: true 
            });
        }

        try {
            await interaction.deferReply({ ephemeral: true });

            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.editReply({
                    content: '❌ عذراً، هذا الأمر متاح فقط للمشرفين',
                    ephemeral: true
                });
            }

            const settings = await Settings.findOne({ guildId: interaction.guild.id }) || 
                           new Settings({ guildId: interaction.guild.id });

            // Create buttons
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('create_embed')
                        .setLabel('إنشاء إمبد جديد')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('edit_embed')
                        .setLabel('تعديل إمبد')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('preview_embed')
                        .setLabel('معاينة الإمبد')
                        .setStyle(ButtonStyle.Secondary)
                );

            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('إدارة الإمبدات')
                .setDescription('استخدم الأزرار أدناه لإدارة الإمبدات')
                .setColor('#0099ff');

            await interaction.editReply({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in embed command:', error);
            await interaction.editReply({
                content: '❌ حدث خطأ أثناء تنفيذ الأمر',
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