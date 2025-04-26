const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a member')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('minutes')
                .setDescription('Duration in minutes')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(40320)) // 28 days
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for timeout')
                .setRequired(false)),
    
    async execute(interaction) {
        if (!interaction.member.permissions.has('ModerateMembers')) {
            return interaction.reply({ 
                content: 'You do not have permission to use this command!', 
                ephemeral: true 
            });
        }

        const user = interaction.options.getUser('user');
        const member = interaction.guild.members.cache.get(user.id);
        const minutes = interaction.options.getInteger('minutes');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!member) {
            return interaction.reply({ 
                content: 'That user is not in this server!', 
                ephemeral: true 
            });
        }

        if (!member.moderatable) {
            return interaction.reply({ 
                content: 'I cannot timeout that user!', 
                ephemeral: true 
            });
        }

        try {
            await member.timeout(minutes * 60 * 1000, reason);
            return interaction.reply({ 
                content: `Successfully timed out ${user.tag} for ${minutes} minutes. Reason: ${reason}`,
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
            return interaction.reply({ 
                content: 'There was an error while timing out that user!', 
                ephemeral: true 
            });
        }
    },
}; 