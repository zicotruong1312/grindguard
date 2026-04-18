const DailyStats = require('../models/DailyStats');
const { getTodayVN } = require('../utils/dateHelper');

module.exports = {
  name: 'messageCreate',

  async execute(message) {
    // Bỏ qua bot, DM (không có guild), và system message
    if (message.author.bot) return;
    if (!message.guild) return;

    const today = getTodayVN();

    try {
      await DailyStats.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id, date: today },
        {
          $inc: { messageCount: 1 },
          $set: { username: message.author.username }
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      // Duplicate key on the same request can be safely ignored
      if (err.code !== 11000) {
        console.error('[messageCreate] Lỗi DB:', err.message);
      }
    }
  }
};
