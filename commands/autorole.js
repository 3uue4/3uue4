const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Settings = require('../models/Settings');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('إدارة الرتب التلقائية للأعضاء الجدد')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('تعيين رتبة تلقائية للأعضاء الجدد')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('الرتبة التي سيتم إضافتها تلقائياً')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('إزالة الرتبة التلقائية'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('عرض حالة الرتبة التلقائية'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const settings = await Settings.findOne({ guildId: interaction.guild.id }) || 
                        new Settings({ guildId: interaction.guild.id });

        switch (subcommand) {
            case 'set': {
                const role = interaction.options.getRole('role');
                
                if (role.position >= interaction.guild.members.me.roles.highest.position) {
                    return interaction.reply({
                        content: '❌ لا يمكنني إضافة رتبة أعلى من رتبتي!',
                        ephemeral: true
                    });
                }

                settings.autoRole = role.id;
                await settings.save();

                await interaction.reply({
                    content: `✅ تم تعيين الرتبة ${role} كرتبة تلقائية للأعضاء الجدد`,
                    ephemeral: true
                });

                await logger.sendLog(interaction.client, {
                    title: '🔄 تحديث الرتبة التلقائية',
                    description: `تم تعيين الرتبة ${role} كرتبة تلقائية بواسطة ${interaction.user}`,
                    color: 0x0099ff
                });
                break;
            }

            case 'remove': {
                if (!settings.autoRole) {
                    return interaction.reply({
                        content: '❌ لم يتم تعيين رتبة تلقائية!',
                        ephemeral: true
                    });
                }

                settings.autoRole = null;
                await settings.save();

                await interaction.reply({
                    content: '✅ تم إزالة الرتبة التلقائية',
                    ephemeral: true
                });

                await logger.sendLog(interaction.client, {
                    title: '🔄 إزالة الرتبة التلقائية',
                    description: `تم إزالة الرتبة التلقائية بواسطة ${interaction.user}`,
                    color: 0x0099ff
                });
                break;
            }

            case 'status': {
                if (!settings.autoRole) {
                    return interaction.reply({
                        content: '❌ لم يتم تعيين رتبة تلقائية!',
                        ephemeral: true
                    });
                }

                const role = interaction.guild.roles.cache.get(settings.autoRole);
                if (!role) {
                    settings.autoRole = null;
                    await settings.save();
                    return interaction.reply({
                        content: '❌ الرتبة المحددة لم تعد موجودة!',
                        ephemeral: true
                    });
                }

                await interaction.reply({
                    content: `✅ الرتبة التلقائية الحالية: ${role}`,
                    ephemeral: true
                });
                break;
            }
        }
    }
}; 