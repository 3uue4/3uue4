const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    StringSelectMenuBuilder,
    PermissionFlagsBits,
    ChannelType,
    UserSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
const fs = require('fs');
const path = require('path');

// قراءة ملف التكوين
function getConfig() {
    const configPath = path.join(__dirname, '..', 'config.json');
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return { adminRoleId: null };
}

// استخراج معرف المستخدم من اسم القناة
function getUserIdFromChannelName(channelName) {
    const match = channelName.match(/ticket-(\d+)/);
    return match ? match[1] : null;
}

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isUserSelect() && !interaction.isModalSubmit()) return;

        const config = getConfig();
        const isAdmin = interaction.member.roles.cache.has(config.adminRoleId);

        // معالجة إنشاء التذكرة
        if (interaction.customId === 'create_ticket') {
            const existingTicket = interaction.guild.channels.cache.find(
                channel => channel.name === `ticket-${interaction.user.id}`
            );

            if (existingTicket) {
                return interaction.reply({
                    content: '❌ لديك تذكرة مفتوحة بالفعل!',
                    ephemeral: true
                });
            }

            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.id}`,
                type: ChannelType.GuildText,
                parent: interaction.channel.parent,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                        ],
                    },
                    {
                        id: config.adminRoleId,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.ManageChannels,
                        ],
                    },
                ],
            });

            const welcomeEmbed = new EmbedBuilder()
                .setTitle('Hollow Depth ⌁ Staff')
                .setDescription('استخدم القائمة بالأسفل لتحديد نوع المساعدة المطلوبة')
                .setColor('#2b2d31')
                .setTimestamp()
                .setFooter({ text: 'Hollow Depth' });

            // إنشاء قائمة الاختيارات للمستخدمين العاديين
            const userOptions = [
                {
                    label: 'مطالبة',
                    value: 'claim',
                    emoji: '📝'
                }
            ];

            // إضافة خيارات الأدمن
            const adminOptions = [
                {
                    label: 'إضافة عضو',
                    value: 'add_member',
                    emoji: '👥'
                },
                {
                    label: 'إغلاق التذكرة',
                    value: 'close_ticket',
                    emoji: '🔒'
                }
            ];

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('ticket_options')
                .setPlaceholder('اختر الإجراء المطلوب');

            if (isAdmin) {
                selectMenu.addOptions([...userOptions, ...adminOptions]);
            } else {
                selectMenu.addOptions(userOptions);
            }

            const row = new ActionRowBuilder()
                .addComponents(selectMenu);

            await ticketChannel.send({
                content: `<@${interaction.user.id}> مرحباً بك`,
                embeds: [welcomeEmbed],
                components: [row]
            });

            await interaction.reply({
                content: `✅ تم إنشاء تذكرتك في ${ticketChannel}`,
                ephemeral: true
            });
        }

        // معالجة اختيارات القائمة
        if (interaction.customId === 'ticket_options') {
            const selection = interaction.values[0];

            switch (selection) {
                case 'add_member':
                    if (!isAdmin) {
                        return interaction.reply({
                            content: '❌ هذا الخيار متاح فقط للإدارة',
                            ephemeral: true
                        });
                    }
                    const userSelect = new UserSelectMenuBuilder()
                        .setCustomId('add_user_to_ticket')
                        .setPlaceholder('اختر العضو المراد إضافته');

                    const userSelectRow = new ActionRowBuilder()
                        .addComponents(userSelect);

                    await interaction.reply({
                        content: 'اختر العضو الذي تريد إضافته للتذكرة:',
                        components: [userSelectRow],
                        ephemeral: true
                    });
                    break;

                case 'close_ticket':
                    if (!isAdmin) {
                        return interaction.reply({
                            content: '❌ هذا الخيار متاح فقط للإدارة',
                            ephemeral: true
                        });
                    }
                    const modal = new ModalBuilder()
                        .setCustomId('close_ticket_modal')
                        .setTitle('إغلاق التذكرة');

                    const reasonInput = new TextInputBuilder()
                        .setCustomId('close_reason')
                        .setLabel('سبب الإغلاق')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true);

                    const modalRow = new ActionRowBuilder().addComponents(reasonInput);
                    modal.addComponents(modalRow);

                    await interaction.showModal(modal);
                    break;

                case 'claim':
                    const claimEmbed = new EmbedBuilder()
                        .setTitle('📝 مطالبة جديدة')
                        .setDescription('الرجاء وصف مطالبتك بالتفصيل')
                        .setColor('#2b2d31')
                        .setTimestamp();

                    await interaction.reply({ embeds: [claimEmbed] });
                    break;
            }
        }

        // معالجة إضافة عضو للتذكرة
        if (interaction.customId === 'add_user_to_ticket') {
            if (!isAdmin) return;

            const selectedUser = interaction.users.first();
            await interaction.channel.permissionOverwrites.create(selectedUser, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });

            await interaction.reply({
                content: `✅ تم إضافة ${selectedUser} إلى التذكرة`,
                ephemeral: true
            });
        }

        // معالجة إغلاق التذكرة
        if (interaction.customId === 'close_ticket_modal') {
            if (!isAdmin) return;

            const reason = interaction.fields.getTextInputValue('close_reason');
            const userId = getUserIdFromChannelName(interaction.channel.name);
            
            if (userId) {
                // إزالة صلاحيات العضو من التذكرة
                await interaction.channel.permissionOverwrites.edit(userId, {
                    ViewChannel: false,
                    SendMessages: false,
                    ReadMessageHistory: false
                });

                const closeEmbed = new EmbedBuilder()
                    .setTitle('🔒 تم إغلاق التذكرة')
                    .setDescription(`تم إغلاق التذكرة بواسطة ${interaction.user.tag}\nالسبب: ${reason}`)
                    .setColor('#ff0000')
                    .setTimestamp();

                // إضافة زر حذف التذكرة
                const deleteButton = new ButtonBuilder()
                    .setCustomId('delete_ticket')
                    .setLabel('حذف التذكرة')
                    .setStyle(ButtonStyle.Danger);

                const row = new ActionRowBuilder()
                    .addComponents(deleteButton);

                await interaction.reply({ 
                    embeds: [closeEmbed],
                    components: [row]
                });
            }
        }

        // معالجة حذف التذكرة
        if (interaction.customId === 'delete_ticket') {
            if (!isAdmin) {
                return interaction.reply({
                    content: '❌ هذا الخيار متاح فقط للإدارة',
                    ephemeral: true
                });
            }

            await interaction.reply({ 
                content: '⚠️ جاري حذف التذكرة...',
                ephemeral: true 
            });
            
            setTimeout(() => interaction.channel.delete(), 5000);
        }
    },
}; 