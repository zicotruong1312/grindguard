const cron = require('node-cron');

/**
 * Register all scheduled tasks.
 * @param {import('discord.js').Client} client
 */
function registerCronJobs(client) {
  // ─── Midnight reset log (0:00 AM Vietnam time = 17:00 UTC) ───────────────
  // Cronjob ở UTC, 17:00 UTC = 00:00 UTC+7
  cron.schedule('0 17 * * *', () => {
    console.log(`🕛 [CRON] Đã sang ngày mới (UTC+7). Dữ liệu ngày mới bắt đầu tích lũy.`);
    // Không cần xóa dữ liệu cũ – mỗi ngày có bản ghi riêng theo date.
    // Nếu bạn muốn trao role, thêm logic vào đây:
    // await handleWeeklyRoleReward(client);
  }, {
    timezone: 'UTC'
  });

  // ─── Weekly summary (Monday 00:05 AM Vietnam time = Sunday 17:05 UTC) ────
  cron.schedule('5 17 * * 0', async () => {
    console.log('📋 [CRON] Chạy tổng kết tuần...');
    // TODO: Tính tổng tuần qua, gửi embed vào channel thống kê
    // Ví dụ: await postWeeklySummary(client);
  }, {
    timezone: 'UTC'
  });

  console.log('⏰ Cron jobs đã được đăng ký!');
}

module.exports = registerCronJobs;
