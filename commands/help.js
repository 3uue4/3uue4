const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('عرض قائمة الأوامر المتاحة')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // إنشاء الإمبد الرئيسي
        const mainEmbed = new EmbedBuilder()
            .setTitle('📚 قائمة الأوامر')
            .setDescription('اختر فئة الأوامر التي تريد عرضها من القائمة أدناه')
            .setColor('#2b2d31')
            .setFooter({ text: 'Hollow Depth | نظام المساعدة' })
            .setTimestamp();

        // إنشاء قائمة الاختيارات
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_menu')
            .setPlaceholder('اختر فئة الأوامر')
            .addOptions([
                {
                    label: 'أوامر الإدارة',
                    description: 'عرض أوامر الإدارة المتاحة',
                    value: 'admin',
                    emoji: '👑'
                },
                {
                    label: 'أوامر التعديل',
                    description: 'عرض أوامر التعديل المتاحة',
                    value: 'moderation',
                    emoji: '🛡️'
                },
                {
                    label: 'أوامر التذاكر',
                    description: 'عرض أوامر نظام التذاكر',
                    value: 'ticket',
                    emoji: '🎫'
                },
                {
                    label: 'أوامر الترحيب',
                    description: 'عرض أوامر نظام الترحيب',
                    value: 'welcome',
                    emoji: '👋'
                },
                {
                    label: 'أوامر الرد التلقائي',
                    description: 'عرض أوامر الرد التلقائي',
                    value: 'autoreply',
                    emoji: '🤖'
                }
            ]);

        const row = new ActionRowBuilder()
            .addComponents(selectMenu);

        const response = await interaction.reply({
            embeds: [mainEmbed],
            components: [row],
            ephemeral: true
        });

        // إنشاء مجموعة الأوامر
        const commands = {
            admin: {
                title: '👑 أوامر الإدارة',
                description: '```\n' +
                    '/ban - حظر عضو من السيرفر\n' +
                    '/kick - طرد عضو من السيرفر\n' +
                    '/clear - مسح الرسائل\n' +
                    '/timeout - إعطاء مهلة لعضو\n' +
                    '/say - جعل البوت يقول شيئاً\n' +
                    '```'
            },
            moderation: {
                title: '🛡️ أوامر التعديل',
                description: '```\n' +
                    '/warn - تحذير عضو\n' +
                    '/badwords - إدارة الكلمات المحظورة\n' +
                    '/autorespond - إعدادات الردود التلقائية\n' +
                    '```'
            },
            ticket: {
                title: '🎫 أوامر التذاكر',
                description: '```\n' +
                    '/ticket - إنشاء نظام التذاكر\n' +
                    '```'
            },
            welcome: {
                title: '👋 أوامر الترحيب',
                description: '```\n' +
                    '/welcome setup - إعداد نظام الترحيب\n' +
                    '/welcome test - اختبار رسالة الترحيب\n' +
                    '/welcome disable - تعطيل نظام الترحيب\n' +
                    '```'
            },
            autoreply: {
                title: '🤖 أوامر الرد التلقائي',
                description: '```\n' +
                    '/autoreply add - إضافة رد تلقائي\n' +
                    '/autoreply remove - إزالة رد تلقائي\n' +
                    '/autoreply list - عرض قائمة الردود التلقائية\n' +
                    '```'
            }
        };

        // معالجة اختيار القائمة
        const collector = response.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 60000
        });

        collector.on('collect', async i => {
            if (i.customId === 'help_menu') {
                const category = i.values[0];
                const categoryData = commands[category];

                const categoryEmbed = new EmbedBuilder()
                    .setTitle(categoryData.title)
                    .setDescription(categoryData.description)
                    .setColor('#2b2d31')
                    .setFooter({ text: 'Hollow Depth | نظام المساعدة' })
                    .setTimestamp();

                await i.update({
                    embeds: [categoryEmbed],
                    components: [row]
                });
            }
        });

        collector.on('end', () => {
            const endedEmbed = new EmbedBuilder()
                .setTitle('📚 قائمة الأوامر')
                .setDescription('انتهت مهلة التفاعل. استخدم الأمر مرة أخرى لعرض القائمة.')
                .setColor('#2b2d31')
                .setFooter({ text: 'Hollow Depth | نظام المساعدة' })
                .setTimestamp();

            interaction.editReply({
                embeds: [endedEmbed],
                components: []
            });
        });
    }
}; 