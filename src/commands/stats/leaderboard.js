const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DailyStats = require('../../models/DailyStats');
const { getTodayVN } = require('../../utils/dateHelper');

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  let result = '';
  if (h > 0) result += `${h}h `;
  if (m > 0) result += `${m}m `;
  if (s > 0) result += `${s}s`;
  return result.trim() || '0s';
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Xem bảng xếp hạng tin nhắn hoặc thời gian voice hôm nay.')
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Xếp hạng theo loại nào?')
        .setRequired(false)
        .addChoices(
          { name: '💬 Tin nhắn (mặc định)', value: 'message' },
          { name: '🎙️ Thời gian Voice',     value: 'voice' }
        )
    )
    .addStringOption(option =>
      option
        .setName('date')
        .setDescription('Ngày muốn xem (YYYY-MM-DD, để trống = hôm nay)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const type  = interaction.options.getString('type') ?? 'message';
    const dateInput = interaction.options.getString('date');
    const date  = dateInput ?? getTodayVN();

    if (dateInput && !/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return interaction.editReply('❌ Định dạng ngày không hợp lệ. Vui lòng dùng `YYYY-MM-DD`.');
    }

    const sortField = type === 'voice' ? 'voiceDuration' : 'messageCount';

    const top10 = await DailyStats.find({
      guildId: interaction.guild.id,
      date
    })
      .sort({ [sortField]: -1 })
      .limit(10);

    if (!top10.length) {
      return interaction.editReply(`📭 Chưa có dữ liệu thống kê cho ngày **${date}**.`);
    }

    const medals = ['🥇', '🥈', '🥉'];

    const rows = top10.map((entry, i) => {
      const medal  = medals[i] ?? `**${i + 1}.**`;
      const value  = type === 'voice'
        ? formatDuration(entry.voiceDuration)
        : `${entry.messageCount} tin`;
      return `${medal} <@${entry.userId}> — ${value}`;
    });

    const typeLabel = type === 'voice' ? '🎙️ Thời gian Voice' : '💬 Tin nhắn';

    const embed = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle(`🏆 Bảng xếp hạng ${typeLabel} — ${date}`)
      .setDescription(rows.join('\n'))
      .setFooter({ text: 'Statistic Bot • Top 10' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
