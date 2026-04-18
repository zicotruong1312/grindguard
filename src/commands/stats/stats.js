const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DailyStats = require('../../models/DailyStats');
const { getTodayVN } = require('../../utils/dateHelper');

/**
 * Format seconds → human-readable "Xh Ym Zs"
 */
function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  let result = '';
  if (h > 0) result += `${h}h `;
  if (m > 0) result += `${m}m `;
  if (s > 0) result += `${s}s`;
  return result.trim();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Xem thống kê tin nhắn & thời gian voice của bạn hoặc một thành viên.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Thành viên muốn xem thống kê (để trống = chính bạn)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('date')
        .setDescription('Ngày muốn xem (định dạng YYYY-MM-DD, để trống = hôm nay)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const target = interaction.options.getUser('user') ?? interaction.user;
    const dateInput = interaction.options.getString('date');
    const date = dateInput ?? getTodayVN();

    // Validate custom date format
    if (dateInput && !/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return interaction.editReply('❌ Định dạng ngày không hợp lệ. Vui lòng dùng `YYYY-MM-DD`.');
    }

    const record = await DailyStats.findOne({
      userId: target.id,
      guildId: interaction.guild.id,
      date
    });

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📊 Thống kê ngày ${date}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 Thành viên',    value: `<@${target.id}>`, inline: true },
        { name: '💬 Tin nhắn',      value: `**${record?.messageCount ?? 0}** tin`, inline: true },
        { name: '🎙️ Thời gian Voice', value: `**${formatDuration(record?.voiceDuration ?? 0)}**`, inline: true }
      )
      .setFooter({ text: 'Statistic Bot • Cập nhật real-time' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
