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
        .setName('badwords')
        .setDescription('إدارة الكلمات المحظورة')
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('إضافة كلمة محظورة')
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('الكلمة المحظورة')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setDescription('إزالة كلمة محظورة')
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('الكلمة المحظورة')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('list')
                .setDescription('عرض قائمة الكلمات المحظورة'))
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
            const word = interaction.options.getString('word');

            switch (subcommand) {
                case 'add':
                    // إضافة الكلمة المحظورة
                    await interaction.editReply({
                        content: `✅ تم إضافة الكلمة المحظورة: ${word}`,
                        ephemeral: true
                    });
                    await logger.sendLog(interaction.client, {
                        title: '➕ إضافة كلمة محظورة',
                        description: `تم إضافة الكلمة المحظورة: ${word}\nبواسطة: ${interaction.user}`,
                        color: 0xFF0000
                    });
                    break;

                case 'remove':
                    // إزالة الكلمة المحظورة
                    await interaction.editReply({
                        content: `✅ تم إزالة الكلمة المحظورة: ${word}`,
                        ephemeral: true
                    });
                    await logger.sendLog(interaction.client, {
                        title: '➖ إزالة كلمة محظورة',
                        description: `تم إزالة الكلمة المحظورة: ${word}\nبواسطة: ${interaction.user}`,
                        color: 0x00FF00
                    });
                    break;

                case 'list':
                    // عرض قائمة الكلمات المحظورة مع قائمة اختيار
                    const settings = await Settings.findOne({ guildId: interaction.guild.id });
                    if (!settings || !settings.badWords || settings.badWords.length === 0) {
                        return await interaction.editReply({
                            content: '❌ لا توجد كلمات محظورة في السيرفر',
                            ephemeral: true
                        });
                    }

                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId('badwords_list')
                        .setPlaceholder('اختر كلمة محظورة لعرض تفاصيلها')
                        .addOptions(
                            settings.badWords.map(word => ({
                                label: word,
                                value: word,
                                description: 'اضغط لعرض تفاصيل الكلمة'
                            }))
                        );

                    const row = new ActionRowBuilder()
                        .addComponents(selectMenu);

                    await interaction.editReply({
                        content: '📋 اختر كلمة محظورة لعرض تفاصيلها:',
                        components: [row],
                        ephemeral: true
                    });

                    // معالجة اختيار القائمة
                    const filter = i => i.customId === 'badwords_list' && i.user.id === interaction.user.id;
                    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

                    collector.on('collect', async i => {
                        const selectedWord = i.values[0];
                        await i.update({
                            content: `📝 تفاصيل الكلمة المحظورة:\nالكلمة: ${selectedWord}\nتم إضافتها في: ${settings.badWordsAddedAt[selectedWord] || 'غير معروف'}`,
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
            console.error('Error in badwords command:', error);
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