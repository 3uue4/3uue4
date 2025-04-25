const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voice')
        .setDescription('Voice channel commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('join')
                .setDescription('Join a voice channel')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('The voice channel to join')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave')
                .setDescription('Leave the current voice channel')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Connect),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'join') {
            const channel = interaction.options.getChannel('channel');
            
            if (!channel.isVoiceBased()) {
                return interaction.reply({ content: 'Please select a voice channel!', ephemeral: true });
            }
            
            try {
                const connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                });
                
                await interaction.reply({ content: `Joined ${channel.name}!`, ephemeral: true });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'Failed to join the voice channel!', ephemeral: true });
            }
        } else if (subcommand === 'leave') {
            const connection = interaction.guild.voiceAdapterCreator;
            if (connection) {
                connection.destroy();
                await interaction.reply({ content: 'Left the voice channel!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'I am not in a voice channel!', ephemeral: true });
            }
        }
    },
}; 