const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear messages from a channel')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to clear')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)),
    
    async execute(interaction) {
        if (!interaction.member.permissions.has('ManageMessages')) {
            return interaction.reply({ 
                content: 'You do not have permission to use this command!', 
                ephemeral: true 
            });
        }

        const amount = interaction.options.getInteger('amount');

        try {
            await interaction.channel.bulkDelete(amount);
            const reply = await interaction.reply({ 
                content: `Successfully cleared ${amount} messages!`,
                ephemeral: true
            });
            
            // Delete the success message after 5 seconds
            setTimeout(() => {
                reply.delete().catch(console.error);
            }, 5000);
        } catch (error) {
            console.error(error);
            return interaction.reply({ 
                content: 'There was an error while clearing messages!', 
                ephemeral: true 
            });
        }
    },
}; 