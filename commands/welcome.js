const { 
    SlashCommandBuilder, 
    PermissionFlagsBits,
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
const Settings = require('../models/Settings');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('إدارة رسالة الترحيب')
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
                        .setCustomId('edit_welcome')
                        .setLabel('تعديل رسالة الترحيب')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('create_welcome')
                        .setLabel('إنشاء رسالة ترحيب جديدة')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('preview_welcome')
                        .setLabel('معاينة رسالة الترحيب')
                        .setStyle(ButtonStyle.Secondary)
                );

            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('إدارة رسالة الترحيب')
                .setDescription('استخدم الأزرار أدناه لإدارة رسالة الترحيب')
                .setColor('#0099ff')
                .addFields(
                    { name: 'الحالة', value: settings.welcomeEnabled ? '✅ مفعل' : '❌ معطل' },
                    { name: 'القناة', value: settings.welcomeChannel ? `<#${settings.welcomeChannel}>` : '❌ غير مضبوطة' }
                );

            await interaction.editReply({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in welcome command:', error);
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
            case 'edit_welcome': {
                const modal = new ModalBuilder()
                    .setCustomId('edit_welcome_modal')
                    .setTitle('تعديل رسالة الترحيب');

                const titleInput = new TextInputBuilder()
                    .setCustomId('title')
                    .setLabel('عنوان الرسالة')
                    .setStyle(TextInputStyle.Short)
                    .setValue(settings.welcomeEmbed?.title || 'مرحباً بك في السيرفر!')
                    .setRequired(true);

                const descriptionInput = new TextInputBuilder()
                    .setCustomId('description')
                    .setLabel('وصف الرسالة')
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(settings.welcomeEmbed?.description || 'نتمنى لك وقتاً ممتعاً معنا!')
                    .setRequired(true);

                const colorInput = new TextInputBuilder()
                    .setCustomId('color')
                    .setLabel('لون الإمبد (Hex)')
                    .setStyle(TextInputStyle.Short)
                    .setValue(settings.welcomeEmbed?.color || '#0099ff')
                    .setRequired(true);

                const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
                const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);
                const thirdActionRow = new ActionRowBuilder().addComponents(colorInput);

                modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
                await interaction.showModal(modal);
                break;
            }

            case 'create_welcome': {
                const modal = new ModalBuilder()
                    .setCustomId('create_welcome_modal')
                    .setTitle('إنشاء رسالة ترحيب جديدة');

                const titleInput = new TextInputBuilder()
                    .setCustomId('title')
                    .setLabel('عنوان الرسالة')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('مرحباً بك في السيرفر!')
                    .setRequired(true);

                const descriptionInput = new TextInputBuilder()
                    .setCustomId('description')
                    .setLabel('وصف الرسالة')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('نتمنى لك وقتاً ممتعاً معنا!')
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

            case 'preview_welcome': {
                if (!settings.welcomeEmbed) {
                    return await interaction.reply({
                        content: '❌ لا توجد رسالة ترحيب مضبوطة',
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder()
                    .setTitle(settings.welcomeEmbed.title)
                    .setDescription(settings.welcomeEmbed.description)
                    .setColor(settings.welcomeEmbed.color)
                    .setTimestamp();

                await interaction.reply({
                    content: 'معاينة رسالة الترحيب:',
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

        settings.welcomeEmbed = {
            title,
            description,
            color
        };

        await settings.save();

        await interaction.reply({
            content: '✅ تم حفظ إعدادات رسالة الترحيب بنجاح',
            ephemeral: true
        });

        await logger.sendLog(interaction.client, {
            title: '🔄 تحديث رسالة الترحيب',
            description: `تم تحديث رسالة الترحيب بواسطة ${interaction.user}`,
            color: 0x0099ff
        });
    }
}; 