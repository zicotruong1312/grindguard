/**
 * deploy-commands.js
 * Chạy một lần để đăng ký slash commands lên Discord.
 * Usage: node src/deploy-commands.js
 */

require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const commands = [];

// Auto-discover tất cả file command trong src/commands/**
function loadCommands(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommands(fullPath);
    } else if (entry.name.endsWith('.js')) {
      const command = require(fullPath);
      if (command.data) {
        commands.push(command.data.toJSON());
        console.log(`  ✅ Loaded: /${command.data.name}`);
      }
    }
  }
}

const commandsPath = path.join(__dirname, 'commands');
loadCommands(commandsPath);

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`\n🚀 Đang đăng ký ${commands.length} slash command(s)...`);

    const guildId = process.env.GUILD_ID;

    if (guildId) {
      // Guild-specific (tức thì, dùng khi dev/test)
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID || '', guildId),
        { body: commands }
      );
      console.log(`✅ Đã đăng ký lên Guild ${guildId} (tức thì).`);
    } else {
      // Global (mất ~1h để propagate)
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID || ''),
        { body: commands }
      );
      console.log('✅ Đã đăng ký Global commands (có thể mất ~1 giờ để hiển thị).');
    }
  } catch (err) {
    console.error('❌ Lỗi khi đăng ký commands:', err);
  }
})();
