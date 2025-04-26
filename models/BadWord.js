const mongoose = require('mongoose');

const badWordSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    word: { type: String, required: true },
    addedBy: { type: String, required: true },
    addedAt: { type: Date, default: Date.now }
});

// Compound index to ensure uniqueness of word per guild
badWordSchema.index({ guildId: 1, word: 1 }, { unique: true });

module.exports = mongoose.model('BadWord', badWordSchema); 