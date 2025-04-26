const { 
    SlashCommandBuilder, 
    PermissionFlagsBits,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require('discord.js');
const { addBadWord, removeBadWord, getAllBadWords } = require('../models/BadWord');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('badwords')
        .setDescription('إدارة الكلمات المحظورة')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('إضافة كلمة محظورة')
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('الكلمة المحظورة')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('إزالة كلمة محظورة')
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('الكلمة المحظورة')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('عرض قائمة الكلمات المحظورة')),

    async execute(interaction) {
        if (!interaction.guild) {
            return await interaction.reply({ 
                content: '❌ هذا الأمر يمكن استخدامه فقط في السيرفر',
                flags: 64 // ephemeral
            });
        }

        try {
            await interaction.deferReply({ flags: 64 }); // ephemeral

            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.editReply({
                    content: '❌ عذراً، هذا الأمر متاح فقط للمشرفين',
                    flags: 64 // ephemeral
                });
            }

            const subcommand = interaction.options.getSubcommand();
            const word = interaction.options.getString('word');

            switch (subcommand) {
                case 'add':
                    if (addBadWord(word)) {
                        await interaction.editReply({
                            content: `✅ تمت إضافة الكلمة "${word}" إلى قائمة الكلمات المحظورة`,
                            flags: 64 // ephemeral
                        });
                        await logger.sendLog(interaction.client, {
                            title: '➕ إضافة كلمة محظورة',
                            description: `تم إضافة الكلمة المحظورة: ${word}\nبواسطة: ${interaction.user}`,
                            color: 0xFF0000
                        });
                    } else {
                        await interaction.editReply({
                            content: `❌ الكلمة "${word}" موجودة بالفعل في قائمة الكلمات المحظورة`,
                            flags: 64 // ephemeral
                        });
                    }
                    break;

                case 'remove':
                    if (removeBadWord(word)) {
                        await interaction.editReply({
                            content: `✅ تمت إزالة الكلمة "${word}" من قائمة الكلمات المحظورة`,
                            flags: 64 // ephemeral
                        });
                        await logger.sendLog(interaction.client, {
                            title: '➖ إزالة كلمة محظورة',
                            description: `تم إزالة الكلمة المحظورة: ${word}\nبواسطة: ${interaction.user}`,
                            color: 0x00FF00
                        });
                    } else {
                        await interaction.editReply({
                            content: `❌ الكلمة "${word}" غير موجودة في قائمة الكلمات المحظورة`,
                            flags: 64 // ephemeral
                        });
                    }
                    break;

                case 'list':
                    const badWords = getAllBadWords();
                    if (badWords.length === 0) {
                        await interaction.editReply({
                            content: '❌ لا توجد كلمات محظورة حالياً',
                            flags: 64 // ephemeral
                        });
                    } else {
                        await interaction.editReply({
                            content: `📝 قائمة الكلمات المحظورة:\n${badWords.map(word => `- ${word}`).join('\n')}`,
                            flags: 64 // ephemeral
                        });
                    }
                    break;
            }
        } catch (error) {
            console.error('Error in badwords command:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ حدث خطأ أثناء تنفيذ الأمر',
                    flags: 64 // ephemeral
                });
            } else {
                await interaction.editReply({
                    content: '❌ حدث خطأ أثناء تنفيذ الأمر',
                    flags: 64 // ephemeral
                });
            }
        }
    },
}; 