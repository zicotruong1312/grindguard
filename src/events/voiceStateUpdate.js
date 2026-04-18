const DailyStats = require('../models/DailyStats');
const { getTodayVN } = require('../utils/dateHelper');

// In-memory map: userId → { startTime, guildId }
const voiceSessions = new Map();

module.exports = {
  name: 'voiceStateUpdate',

  async execute(oldState, newState) {
    const userId   = newState.id;
    const guildId  = newState.guild.id;
    const username = newState.member?.user?.username ?? 'Unknown';

    const wasInVoice = oldState.channelId !== null;
    const isInVoice  = newState.channelId !== null;

    // ── User JOINED a voice channel ───────────────────────────────────────────
    if (!wasInVoice && isInVoice) {
      voiceSessions.set(userId, { startTime: Date.now(), guildId });
      console.log(`🎙️  ${username} joined voice → timer started`);
      return;
    }

    // ── User LEFT a voice channel ─────────────────────────────────────────────
    if (wasInVoice && !isInVoice) {
      const session = voiceSessions.get(userId);
      if (!session) return; // bot restarted mid-session, skip

      const durationSeconds = Math.floor((Date.now() - session.startTime) / 1000);
      voiceSessions.delete(userId);

      if (durationSeconds < 1) return;

      const today = getTodayVN();

      try {
        await DailyStats.findOneAndUpdate(
          { userId, guildId: session.guildId, date: today },
          {
            $inc: { voiceDuration: durationSeconds },
            $set: { username }
          },
          { upsert: true, new: true }
        );
        console.log(`🔕 ${username} left voice → +${durationSeconds}s saved`);
      } catch (err) {
        if (err.code !== 11000) {
          console.error('[voiceStateUpdate] Lỗi DB:', err.message);
        }
      }
    }

    // ── User SWITCHED channel (was in voice, still in voice) ──────────────────
    // Nothing to do: timer keeps running from original join time.
  }
};
