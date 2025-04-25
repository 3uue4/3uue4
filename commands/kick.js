const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kicks a member from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for kicking')
                .setRequired(false)),
    
    async execute(interaction) {
        if (!interaction.member.permissions.has('KickMembers')) {
            return interaction.reply({ 
                content: 'You do not have permission to use this command!', 
                ephemeral: true 
            });
        }

        const user = interaction.options.getUser('user');
        const member = interaction.guild.members.cache.get(user.id);
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!member) {
            return interaction.reply({ 
                content: 'That user is not in this server!', 
                ephemeral: true 
            });
        }

        if (!member.kickable) {
            return interaction.reply({ 
                content: 'I cannot kick that user!', 
                ephemeral: true 
            });
        }

        try {
            await member.kick(reason);
            return interaction.reply({ 
                content: `Successfully kicked ${user.tag} for: ${reason}`,
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
            return interaction.reply({ 
                content: 'There was an error while kicking that user!', 
                ephemeral: true 
            });
        }
    },
}; 