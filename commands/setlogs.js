const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlogs')
        .setDescription('تحديد قناة السجلات')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('القناة التي سيتم إرسال السجلات إليها')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
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

            const channel = interaction.options.getChannel('channel');
            
            if (!channel || channel.type !== ChannelType.GuildText) {
                return await interaction.editReply({
                    content: '❌ الرجاء اختيار قناة نصية صالحة',
                    ephemeral: true
                });
            }

            logger.setLogsChannel(channel.id);
            
            await interaction.editReply({
                content: `✅ تم تحديد قناة السجلات إلى ${channel}`,
                ephemeral: true
            });

            // إرسال سجل تجريبي للتأكد من عمل النظام
            await logger.sendLog(interaction.client, {
                title: '✅ تم تفعيل نظام السجلات',
                description: `تم تحديد قناة السجلات إلى ${channel}\nتم التفعيل بواسطة ${interaction.user}`
            });
        } catch (error) {
            console.error('Error in setlogs command:', error);
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