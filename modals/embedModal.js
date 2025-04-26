const { 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js');
const Settings = require('../models/Settings');
const logger = require('../utils/logger');

module.exports = {
    customId: 'embed_modal',
    async execute(interaction) {
        const settings = await Settings.findOne({ guildId: interaction.guild.id }) || 
                        new Settings({ guildId: interaction.guild.id });

        const title = interaction.fields.getTextInputValue('title');
        const description = interaction.fields.getTextInputValue('description');
        const color = interaction.fields.getTextInputValue('color');

        // Validate color
        if (!/^#[0-9A-F]{6}$/i.test(color)) {
            return await interaction.reply({
                content: '❌ الرجاء إدخال لون صحيح بتنسيق Hex (مثال: #0099ff)',
                ephemeral: true
            });
        }

        if (!settings.embeds) {
            settings.embeds = [];
        }

        const newEmbed = {
            title,
            description,
            color
        };

        if (interaction.customId === 'create_embed_modal') {
            settings.embeds.push(newEmbed);
        } else {
            settings.embeds[0] = newEmbed;
        }

        await settings.save();

        await interaction.reply({
            content: '✅ تم حفظ الإمبد بنجاح',
            ephemeral: true
        });

        await logger.sendLog(interaction.client, {
            title: '🔄 تحديث الإمبد',
            description: `تم تحديث الإمبد بواسطة ${interaction.user}`,
            color: 0x0099ff
        });
    }
}; 