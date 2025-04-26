const storage = require('../database/storage');

class Settings {
    constructor(guildId) {
        this.guildId = guildId;
        this.autoRole = null;
        this.welcomeEnabled = false;
        this.welcomeChannel = null;
        this.welcomeEmbed = {
            title: null,
            description: null,
            color: null
        };
        this.embeds = [];
        this.gifChannels = [];
        this.reactionChannels = new Map();
        this.autoReplies = new Map();
        this.badWords = [];
    }

    static async findOne({ guildId }) {
        const settings = await storage.getSettings(guildId);
        if (!settings) return null;
        return new Settings(guildId, settings);
    }

    async save() {
        const settings = {
            guildId: this.guildId,
            autoRole: this.autoRole,
            welcomeEnabled: this.welcomeEnabled,
            welcomeChannel: this.welcomeChannel,
            welcomeEmbed: this.welcomeEmbed,
            embeds: this.embeds,
            gifChannels: this.gifChannels,
            reactionChannels: Object.fromEntries(this.reactionChannels),
            autoReplies: Object.fromEntries(this.autoReplies),
            badWords: this.badWords
        };
        return await storage.saveSettings(this.guildId, settings);
    }
}

module.exports = Settings; 