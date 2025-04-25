const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
const fs = require('fs');
const path = require('path');

// وظيفة لتحميل الإيمبدات
function loadEmbeds() {
    const embedsPath = path.join(__dirname, '..', 'data', 'embeds.json');
    return JSON.parse(fs.readFileSync(embedsPath, 'utf8'));
}

// وظيفة لحفظ الإيمبدات
function saveEmbeds(data) {
    const embedsPath = path.join(__dirname, '..', 'data', 'embeds.json');
    fs.writeFileSync(embedsPath, JSON.stringify(data, null, 4));
}

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isButton() && !interaction.isModalSubmit()) return;

        // التعامل مع أزرار تعديل الإيمبد
        if (interaction.customId.startsWith('edit_embed_')) {
            const [, , name, type] = interaction.customId.split('_');
            const embedData = loadEmbeds();
            const embed = embedData.embeds[name];

            if (!embed) {
                return interaction.reply({
                    content: '❌ لم يتم العثور على الإيمبد!',
                    ephemeral: true
                });
            }

            const modal = new ModalBuilder()
                .setCustomId(`embed_modal_${name}_${type}`)
                .setTitle(`تعديل ${type}`);

            switch (type) {
                case 'basic':
                    modal.addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('title')
                                .setLabel('العنوان')
                                .setStyle(TextInputStyle.Short)
                                .setValue(embed.title || '')
                                .setRequired(false)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('description')
                                .setLabel('الوصف')
                                .setStyle(TextInputStyle.Paragraph)
                                .setValue(embed.description || '')
                                .setRequired(false)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('color')
                                .setLabel('اللون (Hex)')
                                .setStyle(TextInputStyle.Short)
                                .setValue(embed.color || '')
                                .setRequired(false)
                        )
                    );
                    break;

                case 'author':
                    modal.addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('author_name')
                                .setLabel('اسم الكاتب')
                                .setStyle(TextInputStyle.Short)
                                .setValue(embed.author.name || '')
                                .setRequired(false)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('author_icon')
                                .setLabel('رابط صورة الكاتب')
                                .setStyle(TextInputStyle.Short)
                                .setValue(embed.author.icon_url || '')
                                .setRequired(false)
                        )
                    );
                    break;

                case 'footer':
                    modal.addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('footer_text')
                                .setLabel('نص التذييل')
                                .setStyle(TextInputStyle.Short)
                                .setValue(embed.footer.text || '')
                                .setRequired(false)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('footer_icon')
                                .setLabel('رابط صورة التذييل')
                                .setStyle(TextInputStyle.Short)
                                .setValue(embed.footer.icon_url || '')
                                .setRequired(false)
                        )
                    );
                    break;

                case 'images':
                    modal.addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('image')
                                .setLabel('رابط الصورة الرئيسية')
                                .setStyle(TextInputStyle.Short)
                                .setValue(embed.image.url || '')
                                .setRequired(false)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('thumbnail')
                                .setLabel('رابط الصورة المصغرة')
                                .setStyle(TextInputStyle.Short)
                                .setValue(embed.thumbnail.url || '')
                                .setRequired(false)
                        )
                    );
                    break;
            }

            await interaction.showModal(modal);
        }

        // التعامل مع نتائج النموذج
        if (interaction.customId.startsWith('embed_modal_')) {
            const [, , name, type] = interaction.customId.split('_');
            const embedData = loadEmbeds();
            const embed = embedData.embeds[name];

            switch (type) {
                case 'basic':
                    embed.title = interaction.fields.getTextInputValue('title');
                    embed.description = interaction.fields.getTextInputValue('description');
                    embed.color = interaction.fields.getTextInputValue('color') || null;
                    break;

                case 'author':
                    embed.author.name = interaction.fields.getTextInputValue('author_name');
                    embed.author.icon_url = interaction.fields.getTextInputValue('author_icon');
                    break;

                case 'footer':
                    embed.footer.text = interaction.fields.getTextInputValue('footer_text');
                    embed.footer.icon_url = interaction.fields.getTextInputValue('footer_icon');
                    break;

                case 'images':
                    embed.image.url = interaction.fields.getTextInputValue('image');
                    embed.thumbnail.url = interaction.fields.getTextInputValue('thumbnail');
                    break;
            }

            saveEmbeds(embedData);

            const editButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`edit_embed_${name}_basic`)
                        .setLabel('تعديل المعلومات الأساسية')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`edit_embed_${name}_author`)
                        .setLabel('تعديل الكاتب')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`edit_embed_${name}_footer`)
                        .setLabel('تعديل التذييل')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`edit_embed_${name}_images`)
                        .setLabel('تعديل الصور')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.reply({
                content: '✅ تم تحديث الإيمبد بنجاح!',
                components: [editButtons],
                ephemeral: true
            });
        }
    },
}; 