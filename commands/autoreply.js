const { 
    SlashCommandBuilder, 
    PermissionFlagsBits
} = require('discord.js');
const Settings = require('../models/Settings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autoreply')
        .setDescription('إدارة الردود التلقائية')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('إضافة رد تلقائي')
                .addStringOption(option =>
                    option.setName('trigger')
                        .setDescription('الكلمة التي سيتم الرد عليها')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('response')
                        .setDescription('الرد الذي سيتم إرساله')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('إزالة رد تلقائي')
                .addStringOption(option =>
                    option.setName('trigger')
                        .setDescription('الكلمة المراد إزالتها')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('عرض قائمة الردود التلقائية')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        let settings = await Settings.findOne({ guildId: interaction.guild.id });
        
        if (!settings) {
            settings = new Settings({ guildId: interaction.guild.id });
        }

        switch (subcommand) {
            case 'add':
                const trigger = interaction.options.getString('trigger').toLowerCase();
                const response = interaction.options.getString('response');

                settings.autoReplies.set(trigger, response);
                await settings.save();
                
                await interaction.reply({
                    content: `✅ تم إضافة رد تلقائي جديد\nالكلمة: ${trigger}\nالرد: ${response}`,
                    ephemeral: true
                });
                break;

            case 'remove':
                const removeTrigger = interaction.options.getString('trigger').toLowerCase();
                
                if (!settings.autoReplies.has(removeTrigger)) {
                    return interaction.reply({
                        content: '❌ هذه الكلمة غير موجودة في قائمة الردود التلقائية!',
                        ephemeral: true
                    });
                }

                settings.autoReplies.delete(removeTrigger);
                await settings.save();

                await interaction.reply({
                    content: `✅ تم إزالة الرد التلقائي للكلمة: ${removeTrigger}`,
                    ephemeral: true
                });
                break;

            case 'list':
                const autoReplies = Array.from(settings.autoReplies.entries());
                
                if (autoReplies.length === 0) {
                    return interaction.reply({
                        content: '❌ لا توجد ردود تلقائية مضافة!',
                        ephemeral: true
                    });
                }

                const replyList = autoReplies
                    .map(([trigger, response]) => `**${trigger}** → ${response}`)
                    .join('\n');

                await interaction.reply({
                    content: `📋 قائمة الردود التلقائية:\n${replyList}`,
                    ephemeral: true
                });
                break;
        }
    },
}; 