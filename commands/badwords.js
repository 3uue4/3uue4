const { 
    SlashCommandBuilder, 
    PermissionFlagsBits,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require('discord.js');
const Settings = require('../models/Settings');
const logger = require('../utils/logger');
const BadWord = require('../models/BadWord');
require('../utils/database'); // Ensure database connection is initialized

module.exports = {
    data: new SlashCommandBuilder()
        .setName('badwords')
        .setDescription('إدارة الكلمات المحظورة')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('إضافة كلمة محظورة')
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('الكلمة المراد حظرها')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('إزالة كلمة محظورة')
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('الكلمة المراد إزالة حظرها')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('عرض قائمة الكلمات المحظورة')),

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
            let settings = await Settings.findOne({ guildId: interaction.guild.id });

            if (!settings) {
                settings = new Settings({ guildId: interaction.guild.id });
            }

            switch (subcommand) {
                case 'add': {
                    const word = interaction.options.getString('word').toLowerCase();
                    
                    try {
                        await BadWord.create({
                            guildId: interaction.guild.id,
                            word: word,
                            addedBy: interaction.user.id
                        });
                        
                        await interaction.editReply({
                            content: `✅ تمت إضافة الكلمة \`${word}\` إلى قائمة الكلمات المحظورة`,
                            ephemeral: true
                        });
                        await logger.sendLog(interaction.client, {
                            title: '➕ إضافة كلمة محظورة',
                            description: `تم إضافة الكلمة المحظورة: ${word}\nبواسطة: ${interaction.user}`,
                            color: 0xFF0000
                        });
                    } catch (error) {
                        if (error.code === 11000) { // Duplicate key error
                            await interaction.editReply({
                                content: `❌ الكلمة \`${word}\` موجودة بالفعل في قائمة الكلمات المحظورة`,
                                ephemeral: true
                            });
                        } else {
                            throw error;
                        }
                    }
                    break;
                }

                case 'remove': {
                    const word = interaction.options.getString('word').toLowerCase();
                    
                    const result = await BadWord.findOneAndDelete({
                        guildId: interaction.guild.id,
                        word: word
                    });

                    if (result) {
                        await interaction.editReply({
                            content: `✅ تمت إزالة الكلمة \`${word}\` من قائمة الكلمات المحظورة`,
                            ephemeral: true
                        });
                        await logger.sendLog(interaction.client, {
                            title: '➖ إزالة كلمة محظورة',
                            description: `تم إزالة الكلمة المحظورة: ${word}\nبواسطة: ${interaction.user}`,
                            color: 0x00FF00
                        });
                    } else {
                        await interaction.editReply({
                            content: `❌ الكلمة \`${word}\` غير موجودة في قائمة الكلمات المحظورة`,
                            ephemeral: true
                        });
                    }
                    break;
                }

                case 'list': {
                    const badWords = await BadWord.find({ guildId: interaction.guild.id });
                    
                    if (badWords.length === 0) {
                        await interaction.editReply({
                            content: '📝 لا توجد كلمات محظورة في هذا السيرفر',
                            ephemeral: true
                        });
                    } else {
                        const wordsList = badWords.map(bw => `\`${bw.word}\``).join(', ');
                        try {
                            await interaction.user.send({
                                content: `📝 قائمة الكلمات المحظورة في السيرفر:\n${wordsList}`
                            });
                            await interaction.editReply({
                                content: '✅ تم إرسال قائمة الكلمات المحظورة في الخاص',
                                ephemeral: true
                            });
                        } catch (error) {
                            await interaction.editReply({
                                content: '❌ لم أتمكن من إرسال رسالة خاصة. الرجاء التأكد من فتح الرسائل الخاصة',
                                ephemeral: true
                            });
                        }
                    }
                    break;
                }
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