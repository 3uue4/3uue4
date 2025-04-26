const { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');
const Settings = require('../models/Settings');

module.exports = {
    customId: 'embed_buttons',
    async execute(interaction) {
        const settings = await Settings.findOne({ guildId: interaction.guild.id }) || 
                        new Settings({ guildId: interaction.guild.id });

        // Create buttons with gray style
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_embed')
                    .setLabel('إنشاء إمبد جديد')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('edit_embed')
                    .setLabel('تعديل إمبد')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('preview_embed')
                    .setLabel('معاينة الإمبد')
                    .setStyle(ButtonStyle.Secondary)
            );

        // Create embed
        const embed = new EmbedBuilder()
            .setTitle('إدارة الإمبدات')
            .setDescription('استخدم الأزرار أدناه لإدارة الإمبدات')
            .setColor('#2b2d31');

        await interaction.update({
            embeds: [embed],
            components: [row]
        });
    }
}; 