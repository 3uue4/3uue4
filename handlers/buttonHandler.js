const { saveEmbed, getEmbed, updateEmbed, deleteEmbed } = require('../database/storage');
const { createMainButtons, createFieldButtons, createConfirmButtons } = require('../components/embedButtons');

// حالة الإمبد الحالية
let currentEmbed = {};
let isEditing = false;

async function handleButton(interaction) {
    const customId = interaction.customId;

    // التحقق من حالة التحرير
    if (!isEditing && !customId.startsWith('confirm_')) {
        await interaction.reply({ content: 'لم يتم بدء عملية التحرير بعد', ephemeral: true });
        return;
    }

    switch (customId) {
        // أزرار التحرير الرئيسية
        case 'edit_title':
            await handleTitleEdit(interaction);
            break;
        case 'edit_description':
            await handleDescriptionEdit(interaction);
            break;
        case 'edit_color':
            await handleColorEdit(interaction);
            break;
        case 'edit_thumbnail':
            await handleThumbnailEdit(interaction);
            break;
        case 'edit_author':
            await handleAuthorEdit(interaction);
            break;
        case 'edit_footer':
            await handleFooterEdit(interaction);
            break;
        case 'edit_image':
            await handleImageEdit(interaction);
            break;
        case 'edit_fields':
            await handleFieldsEdit(interaction);
            break;

        // أزرار الحقول
        case 'add_field':
            await handleAddField(interaction);
            break;
        case 'remove_field':
            await handleRemoveField(interaction);
            break;
        case 'edit_field':
            await handleEditField(interaction);
            break;
        case 'back_to_main':
            await showMainMenu(interaction);
            break;

        // أزرار العمليات
        case 'save_embed':
            await handleSaveEmbed(interaction);
            break;
        case 'cancel_edit':
            await handleCancelEdit(interaction);
            break;
        case 'preview_embed':
            await handlePreviewEmbed(interaction);
            break;

        // أزرار التأكيد
        case 'confirm_yes':
            await handleConfirmYes(interaction);
            break;
        case 'confirm_no':
            await handleConfirmNo(interaction);
            break;
    }
}

// وظائف معالجة التحرير
async function handleTitleEdit(interaction) {
    await interaction.reply({ 
        content: 'الرجاء إدخال العنوان الجديد:',
        ephemeral: true 
    });
    // إعداد جامع الرسائل للعنوان
    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async m => {
        currentEmbed.title = m.content;
        await m.delete();
        await interaction.followUp({ 
            content: 'تم تحديث العنوان بنجاح!',
            ephemeral: true 
        });
    });
}

async function handleDescriptionEdit(interaction) {
    await interaction.reply({ 
        content: 'الرجاء إدخال الوصف الجديد:',
        ephemeral: true 
    });
    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async m => {
        currentEmbed.description = m.content;
        await m.delete();
        await interaction.followUp({ 
            content: 'تم تحديث الوصف بنجاح!',
            ephemeral: true 
        });
    });
}

async function handleColorEdit(interaction) {
    await interaction.reply({ 
        content: 'الرجاء إدخال اللون الجديد (بتنسيق HEX مثل #FF0000):',
        ephemeral: true 
    });
    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async m => {
        if (/^#[0-9A-F]{6}$/i.test(m.content)) {
            currentEmbed.color = parseInt(m.content.replace('#', ''), 16);
            await m.delete();
            await interaction.followUp({ 
                content: 'تم تحديث اللون بنجاح!',
                ephemeral: true 
            });
        } else {
            await interaction.followUp({ 
                content: 'تنسيق اللون غير صحيح. الرجاء استخدام تنسيق HEX (مثل #FF0000)',
                ephemeral: true 
            });
        }
    });
}

async function handleThumbnailEdit(interaction) {
    await interaction.reply({ 
        content: 'الرجاء إدخال رابط الصورة المصغرة:',
        ephemeral: true 
    });
    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async m => {
        if (isValidUrl(m.content)) {
            currentEmbed.thumbnail = { url: m.content };
            await m.delete();
            await interaction.followUp({ 
                content: 'تم تحديث الصورة المصغرة بنجاح!',
                ephemeral: true 
            });
        } else {
            await interaction.followUp({ 
                content: 'الرابط غير صالح. الرجاء إدخال رابط صحيح.',
                ephemeral: true 
            });
        }
    });
}

async function handleAuthorEdit(interaction) {
    await interaction.reply({ 
        content: 'الرجاء إدخال اسم المؤلف:',
        ephemeral: true 
    });
    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async m => {
        currentEmbed.author = { name: m.content };
        await m.delete();
        await interaction.followUp({ 
            content: 'تم تحديث معلومات المؤلف بنجاح!',
            ephemeral: true 
        });
    });
}

async function handleFooterEdit(interaction) {
    await interaction.reply({ 
        content: 'الرجاء إدخال نص التذييل:',
        ephemeral: true 
    });
    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async m => {
        currentEmbed.footer = { text: m.content };
        await m.delete();
        await interaction.followUp({ 
            content: 'تم تحديث التذييل بنجاح!',
            ephemeral: true 
        });
    });
}

async function handleImageEdit(interaction) {
    await interaction.reply({ 
        content: 'الرجاء إدخال رابط الصورة:',
        ephemeral: true 
    });
    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async m => {
        if (isValidUrl(m.content)) {
            currentEmbed.image = { url: m.content };
            await m.delete();
            await interaction.followUp({ 
                content: 'تم تحديث الصورة بنجاح!',
                ephemeral: true 
            });
        } else {
            await interaction.followUp({ 
                content: 'الرابط غير صالح. الرجاء إدخال رابط صحيح.',
                ephemeral: true 
            });
        }
    });
}

async function handleFieldsEdit(interaction) {
    const buttons = createFieldButtons();
    await interaction.update({ 
        content: 'اختر عملية الحقول:',
        components: buttons 
    });
}

async function handleAddField(interaction) {
    await interaction.reply({ 
        content: 'الرجاء إدخال عنوان الحقل:',
        ephemeral: true 
    });
    
    const filter = m => m.author.id === interaction.user.id;
    let fieldName, fieldValue;
    
    // جامع عنوان الحقل
    const nameCollector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });
    
    nameCollector.on('collect', async m => {
        fieldName = m.content;
        await m.delete();
        
        await interaction.followUp({ 
            content: 'الرجاء إدخال قيمة الحقل:',
            ephemeral: true 
        });
        
        // جامع قيمة الحقل
        const valueCollector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });
        
        valueCollector.on('collect', async m2 => {
            fieldValue = m2.content;
            await m2.delete();
            
            if (!currentEmbed.fields) {
                currentEmbed.fields = [];
            }
            
            currentEmbed.fields.push({
                name: fieldName,
                value: fieldValue,
                inline: false
            });
            
            await interaction.followUp({ 
                content: 'تم إضافة الحقل بنجاح!',
                ephemeral: true 
            });
        });
    });
}

async function handleRemoveField(interaction) {
    if (!currentEmbed.fields || currentEmbed.fields.length === 0) {
        await interaction.reply({ 
            content: 'لا توجد حقول لإزالتها.',
            ephemeral: true 
        });
        return;
    }

    const fieldOptions = currentEmbed.fields.map((field, index) => 
        `${index + 1}. ${field.name}`
    ).join('\n');

    await interaction.reply({ 
        content: `الرجاء إدخال رقم الحقل الذي تريد إزالته:\n${fieldOptions}`,
        ephemeral: true 
    });

    const filter = m => m.author.id === interaction.user.id && !isNaN(m.content);
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async m => {
        const index = parseInt(m.content) - 1;
        if (index >= 0 && index < currentEmbed.fields.length) {
            currentEmbed.fields.splice(index, 1);
            await m.delete();
            await interaction.followUp({ 
                content: 'تم إزالة الحقل بنجاح!',
                ephemeral: true 
            });
        } else {
            await interaction.followUp({ 
                content: 'رقم الحقل غير صالح.',
                ephemeral: true 
            });
        }
    });
}

async function handleEditField(interaction) {
    if (!currentEmbed.fields || currentEmbed.fields.length === 0) {
        await interaction.reply({ 
            content: 'لا توجد حقول لتحريرها.',
            ephemeral: true 
        });
        return;
    }

    const fieldOptions = currentEmbed.fields.map((field, index) => 
        `${index + 1}. ${field.name}`
    ).join('\n');

    await interaction.reply({ 
        content: `الرجاء إدخال رقم الحقل الذي تريد تحريره:\n${fieldOptions}`,
        ephemeral: true 
    });

    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async m => {
        const index = parseInt(m.content) - 1;
        if (index >= 0 && index < currentEmbed.fields.length) {
            await m.delete();
            await handleFieldEdit(interaction, index);
        } else {
            await interaction.followUp({ 
                content: 'رقم الحقل غير صالح.',
                ephemeral: true 
            });
        }
    });
}

async function handleFieldEdit(interaction, fieldIndex) {
    await interaction.followUp({ 
        content: 'الرجاء إدخال عنوان الحقل الجديد:',
        ephemeral: true 
    });

    const filter = m => m.author.id === interaction.user.id;
    let newName, newValue;

    // جامع العنوان الجديد
    const nameCollector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    nameCollector.on('collect', async m => {
        newName = m.content;
        await m.delete();

        await interaction.followUp({ 
            content: 'الرجاء إدخال قيمة الحقل الجديدة:',
            ephemeral: true 
        });

        // جامع القيمة الجديدة
        const valueCollector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

        valueCollector.on('collect', async m2 => {
            newValue = m2.content;
            await m2.delete();

            currentEmbed.fields[fieldIndex] = {
                name: newName,
                value: newValue,
                inline: currentEmbed.fields[fieldIndex].inline
            };

            await interaction.followUp({ 
                content: 'تم تحديث الحقل بنجاح!',
                ephemeral: true 
            });
        });
    });
}

// وظيفة مساعدة للتحقق من صحة الروابط
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// وظائف معالجة العمليات
async function handleSaveEmbed(interaction) {
    try {
        await saveEmbed(currentEmbed);
        isEditing = false;
        await interaction.reply({ 
            content: 'تم حفظ الإمبد بنجاح!',
            ephemeral: true 
        });
    } catch (error) {
        await interaction.reply({ 
            content: 'حدث خطأ أثناء حفظ الإمبد',
            ephemeral: true 
        });
    }
}

async function handleCancelEdit(interaction) {
    isEditing = false;
    currentEmbed = {};
    await interaction.reply({ 
        content: 'تم إلغاء التحرير',
        ephemeral: true 
    });
}

async function handlePreviewEmbed(interaction) {
    await interaction.reply({ 
        embeds: [currentEmbed],
        ephemeral: true 
    });
}

async function showMainMenu(interaction) {
    const buttons = createMainButtons();
    await interaction.update({ 
        components: buttons
    });
}

// تصدير الوظائف
module.exports = {
    handleButton,
    currentEmbed,
    isEditing
}; 