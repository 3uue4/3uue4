const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    welcomeEnabled: {
        type: Boolean,
        default: false
    },
    welcomeChannel: {
        type: String
    },
    welcomeEmbed: {
        title: {
            type: String
        },
        description: {
            type: String
        },
        color: {
            type: String
        }
    },
    embeds: [{
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        color: {
            type: String,
            required: true
        }
    }],
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