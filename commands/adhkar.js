const { SlashCommandBuilder } = require('discord.js');
const adhkar = require('../data/adhkar');

let adhkarChannel = null;
let adhkarInterval = null;

function getCurrentAdhkar() {
    const now = new Date();
    const hour = now.getHours();
    
    // تحديد نوع الأذكار حسب الوقت
    if (hour >= 5 && hour <= 10) {
        return { type: 'morning', adhkar: adhkar.morning, title: '🌅 أذكار الصباح', color: 0xFFD700 };
    } else if (hour >= 11 && hour <= 14) {
        return { type: 'noon', adhkar: adhkar.noon, title: '☀️ أذكار الظهيرة', color: 0xFFA500 };
    } else if (hour >= 15 && hour <= 20) {
        return { type: 'evening', adhkar: adhkar.evening, title: '🌆 أذكار المساء', color: 0xFF4500 };
    } else {
        return { type: 'night', adhkar: adhkar.night, title: '🌙 أذكار الليل', color: 0x000080 };
    }
}

function sendAdhkar(channel) {
    const { type, adhkar: currentAdhkar, title, color } = getCurrentAdhkar();
    const randomAdhkar = currentAdhkar[Math.floor(Math.random() * currentAdhkar.length)];
    
    const embed = {
        title: title,
        description: randomAdhkar.text,
        color: color,
        timestamp: new Date(),
        footer: {
            text: `أذكار ${type === 'morning' ? 'الصباح' : 
                  type === 'noon' ? 'الظهر' : 
                  type === 'evening' ? 'المساء' : 'الليل'}`
        }
    };
    
    channel.send({ embeds: [embed] });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('adhkar')
        .setDescription('إعداد قناة الأذكار')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('القناة التي سيتم إرسال الأذكار فيها')
                .setRequired(true)),
    
    async execute(interaction) {
        if (!interaction.member.permissions.has('ManageChannels')) {
            return interaction.reply({ 
                content: '❌ ليس لديك الصلاحية لإعداد الأذكار!', 
                ephemeral: true 
            });
        }

        const channel = interaction.options.getChannel('channel');
        
        if (channel.type !== 0) { // 0 is GUILD_TEXT
            return interaction.reply({ 
                content: '❌ يجب تحديد قناة نصية!', 
                ephemeral: true 
            });
        }

        adhkarChannel = channel;
        
        // إيقاف أي فاصل زمني سابق
        if (adhkarInterval) {
            clearInterval(adhkarInterval);
        }

        // إرسال الأذكار كل ساعة
        adhkarInterval = setInterval(() => {
            sendAdhkar(channel);
        }, 60 * 60 * 1000); // كل ساعة

        // إرسال الأذكار مباشرة
        sendAdhkar(channel);

        return interaction.reply({ 
            content: `✅ تم إعداد قناة الأذكار في ${channel}`, 
            ephemeral: true 
        });
    },
}; 