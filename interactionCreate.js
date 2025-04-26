const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isChatInputCommand() && !interaction.isStringSelectMenu()) return;

        // Handle select menu interactions
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'help_menu') {
                const selectedValue = interaction.values[0];
                let commandsEmbed = new EmbedBuilder()
                    .setColor('#2b2d31')
                    .setFooter({ text: 'Hollow Depth | نظام المساعدة' })
                    .setTimestamp();

                switch (selectedValue) {
                    case 'admin':
                        commandsEmbed
                            .setTitle('👑 أوامر الإدارة')
                            .setDescription('قائمة أوامر الإدارة المتاحة:')
                            .addFields(
                                { name: '/help', value: 'عرض قائمة الأوامر المتاحة' },
                                { name: '/voice', value: 'التحكم في القنوات الصوتية' }
                            );
                        break;
                    case 'moderation':
                        commandsEmbed
                            .setTitle('🛡️ أوامر التعديل')
                            .setDescription('قائمة أوامر التعديل المتاحة:')
                            .addFields(
                                { name: '/kick', value: 'طرد عضو من السيرفر' },
                                { name: '/ban', value: 'حظر عضو من السيرفر' },
                                { name: '/timeout', value: 'إيقاف عضو مؤقتاً' },
                                { name: '/clear', value: 'مسح عدد معين من الرسائل' }
                            );
                        break;
                }

                await interaction.update({
                    embeds: [commandsEmbed],
                    components: interaction.message.components
                });
            }
            return;
        }

        // Handle slash commands
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'حدث خطأ أثناء تنفيذ الأمر!',
                ephemeral: true
            });
        }
    }
}; 