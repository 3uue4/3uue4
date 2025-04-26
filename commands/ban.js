const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bans a member from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for banning')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Number of days of messages to delete')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(7)),
    
    async execute(interaction) {
        if (!interaction.member.permissions.has('BanMembers')) {
            return interaction.reply({ 
                content: 'You do not have permission to use this command!', 
                ephemeral: true 
            });
        }

        const user = interaction.options.getUser('user');
        const member = interaction.guild.members.cache.get(user.id);
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const days = interaction.options.getInteger('days') || 0;

        if (!member) {
            return interaction.reply({ 
                content: 'That user is not in this server!', 
                ephemeral: true 
            });
        }

        if (!member.bannable) {
            return interaction.reply({ 
                content: 'I cannot ban that user!', 
                ephemeral: true 
            });
        }

        try {
            await member.ban({ 
                reason: reason,
                deleteMessageDays: days
            });
            return interaction.reply({ 
                content: `Successfully banned ${user.tag} for: ${reason}`,
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
            return interaction.reply({ 
                content: 'There was an error while banning that user!', 
                ephemeral: true 
            });
        }
    },
}; 