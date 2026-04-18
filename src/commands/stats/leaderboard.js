const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DailyStats = require('../../models/DailyStats');
const { getTimeframeMatch, formatDuration } = require('../../utils/dateHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Xem bảng xếp hạng điểm số (1 tin/1đ, 1p voice/1đ).')
    .addStringOption(option =>
      option
        .setName('time')
        .setDescription('Khoảng thời gian xếp hạng')
        .setRequired(true)
        .addChoices(
          { name: '📅 Hôm nay', value: 'today' },
          { name: '🗓️ 7 ngày qua', value: 'week' },
          { name: '📆 Tháng này', value: 'month' },
          { name: '🌟 Năm nay', value: 'year' },
          { name: '🔥 Toàn thời gian', value: 'all' }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const timeframe = interaction.options.getString('time');
    const matchDate = getTimeframeMatch(timeframe);

    const pipeline = [
      {
        $match: {
          guildId: interaction.guild.id,
          ...matchDate
        }
      },
      {
        $group: {
          _id: "$userId",
          totalMessages: { $sum: "$messageCount" },
          totalVoice: { $sum: "$voiceDuration" }
        }
      },
      {
        $addFields: {
          points: {
            $add: [
              "$totalMessages",
              { $floor: { $divide: ["$totalVoice", 60] } } // 1 min = 1 pt
            ]
          }
        }
      },
      { $sort: { points: -1 } },
      { $limit: 10 }
    ];

    const top10 = await DailyStats.aggregate(pipeline);

    let timeLabel = '';
    if (timeframe === 'today') timeLabel = 'Hôm nay';
    if (timeframe === 'week') timeLabel = '7 Ngày Qua';
    if (timeframe === 'month') timeLabel = 'Tháng Này';
    if (timeframe === 'year') timeLabel = 'Năm Nay';
    if (timeframe === 'all') timeLabel = 'Toàn Thời Gian';

    if (!top10.length) {
      return interaction.editReply(`📭 Chưa có dữ liệu thống kê cho **${timeLabel}**.`);
    }

    const medals = ['🥇', '🥈', '🥉'];

    const rows = top10.map((entry, i) => {
      const medal = medals[i] ?? `**${i + 1}.**`;
      const pts = entry.points;
      const msgs = entry.totalMessages;
      const vSecs = entry.totalVoice;

      return `${medal} <@${entry._id}> — **${pts} Điểm**\n└ 💬 ${msgs} tin | 🎙️ ${Math.floor(vSecs/60)} phút`;
    });

    const embed = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle(`🏆 BẢNG XẾP HẠNG ĐIỂM SỐ — ${timeLabel}`)
      .setDescription(rows.join('\n\n'))
      .setFooter({ text: '1 tin nhắn = 1đ | 1 phút voice = 1đ' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
