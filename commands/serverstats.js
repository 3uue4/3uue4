const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverstats')
        .setDescription('عرض إحصائيات السيرفر')
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

            await logger.sendServerStats(interaction.client);
            await interaction.editReply({
                content: '✅ تم إرسال إحصائيات السيرفر إلى قناة السجلات',
                ephemeral: true
            });
        } catch (error) {
            console.error('Error in serverstats command:', error);
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