const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const DailyStats = require('../../models/DailyStats');

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
    .setName('weekly')
    .setDescription('Xem thống kê 7 ngày gần nhất của bạn hoặc một thành viên.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Thành viên muốn xem (để trống = chính bạn)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const target = interaction.options.getUser('user') ?? interaction.user;

    // Build array of last 7 days (Vietnam timezone)
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm   = String(d.getMonth() + 1).padStart(2, '0');
      const dd   = String(d.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }

    const records = await DailyStats.find({
      userId:  target.id,
      guildId: interaction.guild.id,
      date:    { $in: dates }
    });

    const recordMap = Object.fromEntries(records.map(r => [r.date, r]));

    let totalMessages = 0;
    let totalVoice    = 0;

    const rows = dates.map(date => {
      const r   = recordMap[date];
      const msg = r?.messageCount  ?? 0;
      const vc  = r?.voiceDuration ?? 0;
      totalMessages += msg;
      totalVoice    += vc;
      return `\`${date}\` — 💬 **${msg}** tin | 🎙️ **${formatDuration(vc)}**`;
    });

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle(`📅 Thống kê 7 ngày — ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(rows.join('\n'))
      .addFields(
        { name: '📊 Tổng tin nhắn',   value: `**${totalMessages}** tin`,            inline: true },
        { name: '⏱️ Tổng Voice',       value: `**${formatDuration(totalVoice)}**`,   inline: true }
      )
      .setFooter({ text: 'Statistic Bot • 7 ngày gần nhất' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
