const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    PermissionFlagsBits,
    ChannelType
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('إنشاء رسالة نظام التذاكر'),

    async execute(interaction) {
        // التحقق من الصلاحيات
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
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
        const message = await interaction.channel.send({
            embeds: [embed],
            components: [row]
        });

        // إنشاء معالج التفاعل مع الزر
        const collector = message.createMessageComponentCollector({
            filter: i => i.customId === 'create_ticket',
            time: 0 // لا وقت محدد للانتهاء
        });

        collector.on('collect', async i => {
            // التحقق من عدم وجود تذكرة مفتوحة للعضو
            const existingTicket = interaction.guild.channels.cache.find(
                channel => channel.name === `ticket-${i.user.id}`
            );

            if (existingTicket) {
                return i.reply({
                    content: '❌ لديك تذكرة مفتوحة بالفعل!',
                    ephemeral: true
                });
            }

            try {
                // إنشاء التذكرة
                const ticketChannel = await interaction.guild.channels.create({
                    name: `ticket-${i.user.id}`,
                    type: ChannelType.GuildText,
                    parent: interaction.channel.parent,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: i.user.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory
                            ]
                        },
                        {
                            id: interaction.client.user.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory,
                                PermissionFlagsBits.ManageChannels
                            ]
                        }
                    ]
                });

                // إنشاء أزرار التحكم في التذكرة
                const closeButton = new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('إغلاق التذكرة')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Danger);

                const claimButton = new ButtonBuilder()
                    .setCustomId('claim_ticket')
                    .setLabel('استلام التذكرة')
                    .setEmoji('✋')
                    .setStyle(ButtonStyle.Success);

                const ticketRow = new ActionRowBuilder()
                    .addComponents(closeButton, claimButton);

                // إرسال رسالة الترحيب في التذكرة
                const ticketEmbed = new EmbedBuilder()
                    .setTitle('✫ تذكرة جديدة')
                    .setDescription(`مرحباً ${i.user}!\n\nسيقوم أحد أعضاء الإدارة بالرد عليك قريباً.\nيرجى وصف مشكلتك أو استفسارك بالتفصيل.`)
                    .setColor('#2b2d31')
                    .setTimestamp();

                await ticketChannel.send({
                    content: `${i.user} | <@&${interaction.guild.roles.cache.find(r => r.name === 'Admin')?.id || ''}>`,
                    embeds: [ticketEmbed],
                    components: [ticketRow]
                });

                // إنشاء معالج أزرار التذكرة
                const ticketCollector = ticketChannel.createMessageComponentCollector({
                    filter: i => ['close_ticket', 'claim_ticket'].includes(i.customId),
                    time: 0
                });

                ticketCollector.on('collect', async i => {
                    if (i.customId === 'close_ticket') {
                        // التحقق من الصلاحيات
                        if (!i.member.permissions.has(PermissionFlagsBits.ManageChannels) && 
                            i.user.id !== ticketChannel.name.split('-')[1]) {
                            return i.reply({
                                content: '❌ لا يمكنك إغلاق هذه التذكرة',
                                ephemeral: true
                            });
                        }

                        const closeEmbed = new EmbedBuilder()
                            .setTitle('🔒 إغلاق التذكرة')
                            .setDescription('سيتم إغلاق التذكرة خلال 5 ثوانٍ...')
                            .setColor('#ff0000')
                            .setTimestamp();

                        await i.reply({ embeds: [closeEmbed] });

                        setTimeout(() => {
                            ticketChannel.delete()
                                .catch(console.error);
                        }, 5000);
                    } else if (i.customId === 'claim_ticket') {
                        // التحقق من الصلاحيات
                        if (!i.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                            return i.reply({
                                content: '❌ لا يمكنك استلام هذه التذكرة',
                                ephemeral: true
                            });
                        }

                        const claimEmbed = new EmbedBuilder()
                            .setTitle('✋ تم استلام التذكرة')
                            .setDescription(`تم استلام التذكرة بواسطة ${i.user}`)
                            .setColor('#00ff00')
                            .setTimestamp();

                        await i.reply({ embeds: [claimEmbed] });
                    }
                });

                // إخبار العضو بإنشاء التذكرة
                await i.reply({
                    content: `✅ تم إنشاء تذكرتك في ${ticketChannel}`,
                    ephemeral: true
                });
            } catch (error) {
                console.error('Error creating ticket:', error);
                await i.reply({
                    content: '❌ حدث خطأ أثناء إنشاء التذكرة',
                    ephemeral: true
                });
            }
        });

        await interaction.reply({
            content: '✅ تم إنشاء نظام التذاكر بنجاح',
            ephemeral: true
        });
    },
}; 