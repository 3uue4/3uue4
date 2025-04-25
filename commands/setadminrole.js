const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setadminrole')
        .setDescription('تعيين رتبة الأدمن للتذاكر')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('رتبة الأدمن')
                .setRequired(true)),

    async execute(interaction) {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({
                content: '❌ يجب أن تكون مسؤول السيرفر لاستخدام هذا الأمر',
                ephemeral: true
            });
        }

        const role = interaction.options.getRole('role');
        
        // حفظ معرف الرتبة في ملف التكوين
        const config = {
            adminRoleId: role.id
        };

        const configPath = path.join(__dirname, '..', 'config.json');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

        await interaction.reply({
            content: `✅ تم تعيين ${role} كرتبة أدمن للتذاكر`,
            ephemeral: true
        });
    },
}; 