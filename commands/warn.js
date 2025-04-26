const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('تحذير عضو')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('العضو المراد تحذيره')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('سبب التحذير')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        if (!interaction.guild) {
            return await interaction.reply({ 
                content: '❌ هذا الأمر يمكن استخدامه فقط في السيرفر',
                ephemeral: true 
            });
        }

        try {
            await interaction.deferReply({ ephemeral: true });

            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return await interaction.editReply({
                    content: '❌ عذراً، هذا الأمر متاح فقط للمشرفين',
                    ephemeral: true
                });
            }

            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason');
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            if (!targetMember) {
                return await interaction.editReply({
                    content: '❌ لم يتم العثور على العضو في السيرفر',
                    ephemeral: true
                });
            }

            if (targetMember.id === interaction.user.id) {
                return await interaction.editReply({
                    content: '❌ لا يمكنك تحذير نفسك',
                    ephemeral: true
                });
            }

            if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                return await interaction.editReply({
                    content: '❌ لا يمكنك تحذير عضو لديه رتبة أعلى منك أو مساوية لرتبتك',
                    ephemeral: true
                });
            }

            // إرسال رسالة خاصة للعضو المحذر
            try {
                await targetUser.send({
                    content: `⚠️ لقد تم تحذيرك في سيرفر ${interaction.guild.name}\nالسبب: ${reason}\nبواسطة: ${interaction.user.tag}`
                });
            } catch (error) {
                console.log(`Couldn't send DM to ${targetUser.tag}`);
            }

            await interaction.editReply({
                content: `✅ تم تحذير ${targetUser} بنجاح\nالسبب: ${reason}`,
                ephemeral: true
            });

            // إرسال السجل
            await logger.sendLog(interaction.client, {
                title: '⚠️ تحذير عضو',
                description: `تم تحذير ${targetUser}\nالسبب: ${reason}\nبواسطة: ${interaction.user}`,
                color: 0xFFA500 // برتقالي
            });

        } catch (error) {
            console.error('Error in warn command:', error);
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