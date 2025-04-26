const { 
    SlashCommandBuilder, 
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('جعل البوت يقول شيئاً')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption(option =>
            option.setName('message')
                .setDescription('الرسالة التي تريد إرسالها')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('الروم الذي تريد إرسال الرسالة فيه')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('embed')
                .setDescription('هل تريد إرسال الرسالة في إطار؟')
                .setRequired(false)),

    async execute(interaction) {
        const message = interaction.options.getString('message');
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const useEmbed = interaction.options.getBoolean('embed') || false;

        // حذف الرد على الأمر فوراً
        await interaction.deferReply({ ephemeral: true });

        try {
            if (useEmbed) {
                await channel.send({
                    embeds: [{
                        description: message,
                        color: 0x2b2d31
                    }]
                });
            } else {
                await channel.send(message);
            }

            await interaction.editReply({
                content: '✅ تم إرسال الرسالة',
                ephemeral: true
            });
        } catch (error) {
            await interaction.editReply({
                content: '❌ حدث خطأ أثناء إرسال الرسالة',
                ephemeral: true
            });
        }
    },
}; 