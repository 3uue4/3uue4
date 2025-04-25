const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('إنشاء رسالة نظام التذاكر'),

    async execute(interaction) {
        // التحقق من الصلاحيات
        if (!interaction.member.permissions.has('ManageChannels')) {
            return interaction.reply({
                content: '❌ ليس لديك صلاحية لاستخدام هذا الأمر',
                ephemeral: true
            });
        }

        // إنشاء الإمبد
        const embed = new EmbedBuilder()
            .setTitle('✫ تذكرة المساعدة')
            .setDescription('-\n\n-\n**✧༝˚اضغط على الزر بالاسفل للتواصل مع الادارة˚༝✧**')
            .setColor('#2b2d31')
            .setTimestamp();

        // إنشاء الزر
        const button = new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('إنشاء تذكرة')
            .setEmoji('📩')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder()
            .addComponents(button);

        // إرسال الرسالة
        await interaction.channel.send({
            embeds: [embed],
            components: [row]
        });

        await interaction.reply({
            content: '✅ تم إنشاء نظام التذاكر بنجاح',
            ephemeral: true
        });
    },
}; 