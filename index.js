require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// الاتصال بقاعدة البيانات
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح!');
    } catch (error) {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', error);
    }
}

// إنشاء عميل Discord جديد
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// تخزين الأوامر
client.commands = new Collection();

// تحميل الأوامر
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// دالة للاتصال بالقناة الصوتية
async function connectToVoiceChannel() {
    try {
        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        const channel = await guild.channels.fetch(process.env.VOICE_CHANNEL_ID);
        
        if (channel) {
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });
            
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

// حدث عند تسجيل الدخول
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
    
    // الاتصال بالقناة الصوتية بعد تسجيل الدخول
    await connectToVoiceChannel();
});

// معالجة الأوامر
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

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

// الاتصال بقاعدة البيانات قبل تسجيل دخول البوت
connectDB();

// تسجيل الدخول باستخدام التوكن من ملف .env
client.login(process.env.TOKEN)
    .then(() => console.log('🚀 تم تشغيل البوت بنجاح!'))
    .catch(error => console.error('❌ فشل تسجيل دخول البوت:', error)); 