const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DailyStats = require('../../models/DailyStats');
const { getTimeframeMatch, formatDuration } = require('../../utils/dateHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Xem thống kê điểm số (1 tin/1đ, 1p voice/1đ).')
    .addStringOption(option =>
      option
        .setName('time')
        .setDescription('Khoảng thời gian thống kê')
        .setRequired(true)
        .addChoices(
          { name: '📅 Hôm nay', value: 'today' },
          { name: '🗓️ 7 ngày qua', value: 'week' },
          { name: '📆 Tháng này', value: 'month' },
          { name: '🌟 Năm nay', value: 'year' },
          { name: '🔥 Toàn thời gian', value: 'all' }
        )
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Thành viên muốn xem thống kê (để trống = chính bạn)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const target = interaction.options.getUser('user') ?? interaction.user;
    const timeframe = interaction.options.getString('time');

    const matchDate = getTimeframeMatch(timeframe);

    const pipeline = [
      {
        $match: {
          guildId: interaction.guild.id,
          userId: target.id,
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
              { $floor: { $divide: ["$totalVoice", 60] } } // 1 minute = 1 point
            ]
          }
        }
      }
    ];

    const results = await DailyStats.aggregate(pipeline);
    const data = results[0]; // because we filtered by userId, there's max 1 result

    const msgs = data?.totalMessages || 0;
    const voiceSecs = data?.totalVoice || 0;
    const pts = data?.points || 0;

    let timeLabel = '';
    if (timeframe === 'today') timeLabel = 'Hôm nay';
    if (timeframe === 'week') timeLabel = '7 ngày qua';
    if (timeframe === 'month') timeLabel = 'Tháng này';
    if (timeframe === 'year') timeLabel = 'Năm nay';
    if (timeframe === 'all') timeLabel = 'Toàn thời gian';

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📊 Thống kê: ${target.username} (${timeLabel})`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '💬 Tin nhắn', value: `**${msgs}** tin (+${msgs}đ)`, inline: true },
        { name: '🎙️ Thời gian Voice', value: `**${formatDuration(voiceSecs)}** (+${Math.floor(voiceSecs/60)}đ)`, inline: true },
        { name: '🏆 TỔNG ĐIỂM', value: `**${pts} ĐIỂM**`, inline: false }
      )
      .setFooter({ text: '1 tin nhắn = 1 điểm | 1 phút voice = 1 điểm' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
