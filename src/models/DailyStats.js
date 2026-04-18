const mongoose = require('mongoose');

const dailyStatsSchema = new mongoose.Schema({
  userId:        { type: String, required: true },
  guildId:       { type: String, required: true },
  username:      { type: String },
  date:          { type: String, required: true }, // 'YYYY-MM-DD'
  messageCount:  { type: Number, default: 0 },
  voiceDuration: { type: Number, default: 0 }      // Seconds
});

// Compound index → fast upsert & query
dailyStatsSchema.index({ userId: 1, guildId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyStats', dailyStatsSchema);
