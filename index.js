require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, ActivityType } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');

// إنشاء خادم Express
const server = express();
server.all('/', (req, res) => {
    res.send('Bot is running!');
});

function keepAlive() {
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        console.log(`Server is ready on port ${port}.`);
    });
}

// الاتصال بقاعدة البيانات
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح!');
    } catch (error) {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', error);
    }
}

// إنشاء عميل Discord
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

// تشغيل خادم Keep Alive
keepAlive();

// الاتصال بقاعدة البيانات
connectDB();

// تهيئة Collection للأوامر
client.commands = new Collection();
const commands = [];

// تحميل الأوامر
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

// دالة للاتصال بالقناة الصوتية
async function connectToVoiceChannel() {
    try {
        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        const channel = await guild.channels.fetch(process.env.VOICE_CHANNEL_ID);
        
        if (channel) {
            const connection = await channel.join();
            console.log(`✅ تم الاتصال بالقناة الصوتية: ${channel.name}`);
            
            // إعادة الاتصال في حالة الانقطاع
            connection.on('disconnect', () => {
                console.log('❌ تم قطع الاتصال بالقناة الصوتية، جاري إعادة الاتصال...');
                setTimeout(connectToVoiceChannel, 5000);
            });
        }
    } catch (error) {
        console.error('❌ حدث خطأ أثناء الاتصال بالقناة الصوتية:', error);
        setTimeout(connectToVoiceChannel, 5000);
    }
}

// تسجيل دخول وخروج المستخدمين من القنوات الصوتية
client.on('voiceStateUpdate', async (oldState, newState) => {
    const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);
    
    if (!oldState.channelId && newState.channelId) {
        // المستخدم انضم إلى قناة صوتية
        logChannel.send({
            embeds: [{
                title: 'انضمام إلى قناة صوتية',
                description: `${newState.member.user.tag} انضم إلى ${newState.channel.name}`,
                color: 0x00ff00,
                timestamp: new Date(),
                thumbnail: {
                    url: newState.member.user.displayAvatarURL({ dynamic: true })
                }
            }]
        });
    } else if (oldState.channelId && !newState.channelId) {
        // المستخدم غادر قناة صوتية
        logChannel.send({
            embeds: [{
                title: 'مغادرة قناة صوتية',
                description: `${oldState.member.user.tag} غادر ${oldState.channel.name}`,
                color: 0xff0000,
                timestamp: new Date(),
                thumbnail: {
                    url: oldState.member.user.displayAvatarURL({ dynamic: true })
                }
            }]
        });
    }
});

// تسجيل دخول البوت
client.once('ready', async () => {
    console.log(`✅ تم تسجيل دخول البوت باسم: ${client.user.tag}`);
    
    // تعيين حالة البوت
    client.user.setPresence({
        status: process.env.BOT_STATUS || 'dnd',
        activities: [{
            name: process.env.BOT_ACTIVITY || 'Hollow Depth | نظام المساعدة',
            type: ActivityType.Streaming,
            url: 'https://twitch.tv/discord'
        }]
    });
    
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    
    try {
        console.log('🔄 جاري تحديث أوامر البوت...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('✅ تم تحديث أوامر البوت بنجاح!');
        
        // الاتصال بالقناة الصوتية بعد تسجيل الدخول
        await connectToVoiceChannel();
    } catch (error) {
        console.error('❌ حدث خطأ أثناء تحديث الأوامر:', error);
    }
});

// معالجة الأوامر
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ 
            content: '❌ حدث خطأ أثناء تنفيذ الأمر!', 
            ephemeral: true 
        });
    }
});

// تسجيل دخول البوت
client.login(process.env.TOKEN)
    .then(() => console.log('🚀 تم تشغيل البوت بنجاح!'))
    .catch(error => console.error('❌ فشل تسجيل دخول البوت:', error)); 