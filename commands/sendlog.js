const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sendlog')
        .setDescription('إرسال سجل مخصص إلى قناة السجلات')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('title')
                .setDescription('عنوان السجل')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('وصف السجل')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('لون السجل (مثال: #FF0000 للأحمر)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('fields')
                .setDescription('حقول إضافية (بتنسيق: اسم1|قيمة1,اسم2|قيمة2)')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const title = interaction.options.getString('title');
            const description = interaction.options.getString('description');
            const color = interaction.options.getString('color');
            const fieldsStr = interaction.options.getString('fields');
            
            let fields = [];
            if (fieldsStr) {
                fields = fieldsStr.split(',').map(field => {
                    const [name, value] = field.split('|');
                    return { name, value };
                });
            }

            await logger.sendLog({
                title,
                description,
                color: color || '#0099ff',
                fields
            });

            await interaction.editReply('✅ تم إرسال السجل بنجاح');
        } catch (error) {
            console.error('Error sending custom log:', error);
            await interaction.editReply('❌ حدث خطأ أثناء إرسال السجل');
        }
    },
}; 