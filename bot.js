const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember]
});

client.commands = new Collection();
const commands = [];

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    }
}

// Room logging functionality
client.on('voiceStateUpdate', async (oldState, newState) => {
    const logChannelId = 'YOUR_LOG_CHANNEL_ID'; // Replace with your log channel ID
    const logChannel = await client.channels.fetch(logChannelId);
    
    if (!oldState.channelId && newState.channelId) {
        // User joined a voice channel
        logChannel.send({
            embeds: [{
                title: 'Voice Channel Join',
                description: `${newState.member.user.tag} joined ${newState.channel.name}`,
                color: 0x00ff00,
                timestamp: new Date(),
                thumbnail: {
                    url: newState.member.user.displayAvatarURL({ dynamic: true })
                }
            }]
        });
    } else if (oldState.channelId && !newState.channelId) {
        // User left a voice channel
        logChannel.send({
            embeds: [{
                title: 'Voice Channel Leave',
                description: `${oldState.member.user.tag} left ${oldState.channel.name}`,
                color: 0xff0000,
                timestamp: new Date(),
                thumbnail: {
                    url: oldState.member.user.displayAvatarURL({ dynamic: true })
                }
            }]
        });
    }
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ 
            content: 'There was an error while executing this command!', 
            ephemeral: true 
        });
    }
});

client.login(process.env.TOKEN); 