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

        await interaction.reply({
            embeds: [mainEmbed],
            components: [row],
            ephemeral: true
        });
    }
}; 