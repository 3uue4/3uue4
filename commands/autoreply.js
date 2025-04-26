const { 
    SlashCommandBuilder, 
    PermissionFlagsBits,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require('discord.js');
const Settings = require('../models/Settings');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autoreply')
        .setDescription('إدارة الردود التلقائية')
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('إضافة رد تلقائي')
                .addStringOption(option =>
                    option.setName('trigger')
                        .setDescription('الكلمة التي ستشغل الرد')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('response')
                        .setDescription('الرد التلقائي')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setDescription('إزالة رد تلقائي')
                .addStringOption(option =>
                    option.setName('trigger')
                        .setDescription('الكلمة التي تشغل الرد')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('list')
                .setDescription('عرض قائمة الردود التلقائية'))
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

            const subcommand = interaction.options.getSubcommand();
            const trigger = interaction.options.getString('trigger');
            const response = interaction.options.getString('response');

            switch (subcommand) {
                case 'add':
                    // إضافة رد تلقائي
                    await interaction.editReply({
                        content: `✅ تم إضافة الرد التلقائي:\nالكلمة: ${trigger}\nالرد: ${response}`,
                        ephemeral: true
                    });
                    await logger.sendLog(interaction.client, {
                        title: '➕ إضافة رد تلقائي',
                        description: `تم إضافة رد تلقائي جديد\nالكلمة: ${trigger}\nالرد: ${response}\nبواسطة: ${interaction.user}`,
                        color: 0x00FF00
                    });
                    break;

                case 'remove':
                    // إزالة رد تلقائي
                    await interaction.editReply({
                        content: `✅ تم إزالة الرد التلقائي للكلمة: ${trigger}`,
                        ephemeral: true
                    });
                    await logger.sendLog(interaction.client, {
                        title: '➖ إزالة رد تلقائي',
                        description: `تم إزالة الرد التلقائي للكلمة: ${trigger}\nبواسطة: ${interaction.user}`,
                        color: 0xFF0000
                    });
                    break;

                case 'list':
                    // عرض قائمة الردود التلقائية مع قائمة اختيار
                    const settings = await Settings.findOne({ guildId: interaction.guild.id });
                    if (!settings || !settings.autoReplies || Object.keys(settings.autoReplies).length === 0) {
                        return await interaction.editReply({
                            content: '❌ لا توجد ردود تلقائية في السيرفر',
                            ephemeral: true
                        });
                    }

                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('autoreplies_list')
                        .setPlaceholder('اختر رد تلقائي لعرض تفاصيله')
                        .addOptions(
                            Object.entries(settings.autoReplies).map(([trigger, response]) => ({
                                label: trigger,
                                value: trigger,
                                description: response.substring(0, 50) + (response.length > 50 ? '...' : '')
                            }))
                        );

                    const row = new ActionRowBuilder()
                        .addComponents(selectMenu);

                    await interaction.editReply({
                        content: '📋 اختر رد تلقائي لعرض تفاصيله:',
                        components: [row],
                        ephemeral: true
                    });

                    // معالجة اختيار القائمة
                    const filter = i => i.customId === 'autoreplies_list' && i.user.id === interaction.user.id;
                    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

                    collector.on('collect', async i => {
                        const selectedTrigger = i.values[0];
                        const selectedResponse = settings.autoReplies[selectedTrigger];
                        await i.update({
                            content: `📝 تفاصيل الرد التلقائي:\nالكلمة: ${selectedTrigger}\nالرد: ${selectedResponse}\nتم إضافته في: ${settings.autoRepliesAddedAt[selectedTrigger] || 'غير معروف'}`,
                            components: [],
                            ephemeral: true
                        });
                    });

                    collector.on('end', collected => {
                        if (collected.size === 0) {
                            interaction.editReply({
                                content: '⏱️ انتهت مهلة الاختيار',
                                components: [],
                                ephemeral: true
                            });
                        }
                    });
                    break;
            }
        } catch (error) {
            console.error('Error in autoreply command:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ حدث خطأ أثناء تنفيذ الأمر',
                    ephemeral: true
                });
            } else {
                await interaction.editReply({
                    content: '❌ حدث خطأ أثناء تنفيذ الأمر',
                    ephemeral: true
                });
            }
        }
    },
}; 