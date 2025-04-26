const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// إنشاء أزرار التحكم الرئيسية
function createMainButtons() {
    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('edit_title')
                .setLabel('عنوان')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('edit_description')
                .setLabel('وصف')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('edit_color')
                .setLabel('لون')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('edit_thumbnail')
                .setLabel('صورة مصغرة')
                .setStyle(ButtonStyle.Primary)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('edit_author')
                .setLabel('المؤلف')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('edit_footer')
                .setLabel('التذييل')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('edit_image')
                .setLabel('صورة')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('edit_fields')
                .setLabel('حقول')
                .setStyle(ButtonStyle.Secondary)
        );

    const row3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('save_embed')
                .setLabel('حفظ')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('cancel_edit')
                .setLabel('إلغاء')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('preview_embed')
                .setLabel('معاينة')
                .setStyle(ButtonStyle.Primary)
        );

    return [row1, row2, row3];
}

// أزرار تحرير الحقول
function createFieldButtons() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('add_field')
                .setLabel('إضافة حقل')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('remove_field')
                .setLabel('حذف حقل')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('edit_field')
                .setLabel('تعديل حقل')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('back_to_main')
                .setLabel('رجوع')
                .setStyle(ButtonStyle.Secondary)
        );
}

// أزرار تأكيد العملية
function createConfirmButtons() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_yes')
                .setLabel('نعم')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('confirm_no')
                .setLabel('لا')
                .setStyle(ButtonStyle.Danger)
        );
}

module.exports = {
    createMainButtons,
    createFieldButtons,
    createConfirmButtons
}; 