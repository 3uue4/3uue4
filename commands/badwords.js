const { 
    SlashCommandBuilder, 
    PermissionFlagsBits
} = require('discord.js');
const Settings = require('../models/Settings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('badwords')
        .setDescription('إدارة الكلمات المحظورة')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
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
                        .setDescription('الكلمة المراد إزالتها')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('عرض قائمة الكلمات المحظورة')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        let settings = await Settings.findOne({ guildId: interaction.guild.id });
        
        if (!settings) {
            settings = new Settings({ guildId: interaction.guild.id });
        }

        switch (subcommand) {
            case 'add':
                const word = interaction.options.getString('word').toLowerCase();
                
                if (settings.badWords.includes(word)) {
                    return interaction.reply({
                        content: '❌ هذه الكلمة موجودة بالفعل في قائمة الكلمات المحظورة!',
                        ephemeral: true
                    });
                }

                settings.badWords.push(word);
                await settings.save();
                
                await interaction.reply({
                    content: `✅ تم إضافة الكلمة "${word}" إلى قائمة الكلمات المحظورة`,
                    ephemeral: true
                });
                break;

            case 'remove':
                const removeWord = interaction.options.getString('word').toLowerCase();
                const index = settings.badWords.indexOf(removeWord);
                
                if (index === -1) {
                    return interaction.reply({
                        content: '❌ هذه الكلمة غير موجودة في قائمة الكلمات المحظورة!',
                        ephemeral: true
                    });
                }

                settings.badWords.splice(index, 1);
                await settings.save();

                await interaction.reply({
                    content: `✅ تم إزالة الكلمة "${removeWord}" من قائمة الكلمات المحظورة`,
                    ephemeral: true
                });
                break;

            case 'list':
                if (settings.badWords.length === 0) {
                    return interaction.reply({
                        content: '❌ لا توجد كلمات محظورة في القائمة!',
                        ephemeral: true
                    });
                }

                const wordList = settings.badWords
                    .map(word => `• ${word}`)
                    .join('\n');

                await interaction.reply({
                    content: `📋 قائمة الكلمات المحظورة:\n${wordList}`,
                    ephemeral: true
                });
                break;
        }
    },
}; 