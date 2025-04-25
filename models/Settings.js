const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    gifChannels: {
        type: [String],
        default: []
    },
    reactionChannels: {
        type: Map,
        of: String,
        default: {}
    },
    autoReplies: {
        type: Map,
        of: String,
        default: {}
    },
    badWords: {
        type: [String],
        default: []
    }
});

module.exports = mongoose.model('Settings', settingsSchema); 