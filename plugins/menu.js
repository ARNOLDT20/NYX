const config = require('../config');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');
const { getPrefix } = require('../lib/prefix');
const fs = require('fs');
const path = require('path');

// Stylized uppercase
function toUpperStylized(str) {
  const map = {
    A: 'ᴀ', B: 'ʙ', C: 'ᴄ', D: 'ᴅ', E: 'ᴇ', F: 'ғ', G: 'ɢ', H: 'ʜ',
    I: 'ɪ', J: 'ᴊ', K: 'ᴋ', L: 'ʟ', M: 'ᴍ', N: 'ɴ', O: 'ᴏ', P: 'ᴘ',
    Q: 'ǫ', R: 'ʀ', S: 's', T: 'ᴛ', U: 'ᴜ', V: 'ᴠ', W: 'ᴡ',
    X: 'x', Y: 'ʏ', Z: 'ᴢ'
  };
  return str.split('').map(c => map[c.toUpperCase()] || c).join('');
}

const normalize = (str) =>
  str.toLowerCase().replace(/\s+menu$/, '').trim();

const emojiByCategory = {
  ai: '🤖', anime: '🍥', audio: '🎧', bible: '📖',
  download: '⬇️', downloader: '📥', fun: '🎮', game: '🕹️',
  group: '👥', img_edit: '🖌️', info: 'ℹ️', information: '🧠',
  logo: '🖼️', main: '🏠', media: '🎞️', misc: '📦',
  music: '🎵', owner: '👑', privacy: '🔒', search: '🔎',
  settings: '⚙️', sticker: '🌟', tools: '🛠️',
  user: '👤', utilities: '🧰', wallpapers: '🖼️',
  whatsapp: '📱'
};

cmd({
  pattern: 'menu',
  alias: ['allmenu'],
  desc: 'Show all bot commands',
  category: 'menu',
  react: '👌',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    const prefix = getPrefix();
    const tz = config.TIMEZONE || 'Africa/Nairobi';

    const time = moment().tz(tz).format('HH:mm:ss');
    const date = moment().tz(tz).format('dddd, DD MMMM YYYY');

    const uptime = () => {
      let s = process.uptime();
      return `${Math.floor(s / 3600)}h ${Math.floor(s % 3600 / 60)}m ${Math.floor(s % 60)}s`;
    };

    // HEADER
    let menu = `╔══════════════════════════════╗
║        ✨ *NYX MD* ✨        ║
║    🤖 Command Menu v3.0.0 🤖 ║
╚══════════════════════════════╝

╭──────────────────────────────╮
│ 👤 User: @${sender.split('@')[0]}
│ ⏱ Runtime: ${uptime()}
│ ⚙ Mode: ${config.MODE?.toUpperCase()}
│ 🔑 Prefix: ${config.PREFIX}
│ 👑 Owner: ${config.OWNER_NAME}
│ 🧩 Plugins: ${commands.length}
│ 📅 ${time} • ${date}
╰──────────────────────────────╯`;

    // GROUP COMMANDS
    const categories = {};
    for (const c of commands) {
      if (!c.category || c.dontAdd || !c.pattern) continue;
      const cat = normalize(c.category);
      categories[cat] ??= [];
      categories[cat].push({
        cmd: c.pattern.split('|')[0],
        desc: c.desc || 'No description'
      });
    }

    // BUILD MENU (SINGLE PAGE)
    for (const cat of Object.keys(categories).sort()) {
      const emoji = emojiByCategory[cat] || '✨';

      menu += `\n\n╭─ ${emoji} *${toUpperStylized(cat)}*\n`;
      for (const c of categories[cat].sort((a, b) => a.cmd.localeCompare(b.cmd))) {
        menu += `│ ▸ ${prefix}${c.cmd} — ${c.desc}\n`;
      }
      menu += `╰──────────────────────────────╯`;
    }

    // FOOTER
    menu += `\n\n╔══════════════════════════════╗
║ 🌟 ${config.DESCRIPTION || 'Explore the power of NYX MD'} 🌟 ║
╚══════════════════════════════╝

🔗 Group: ${config.GROUP_LINK || 'Not set'}
📢 Channel: ${config.CHANNEL_LINK || 'Not set'}

*Made with ❤️ by BLAZE TECH*`;

    // IMAGE SOURCE
    let image = { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/rw0yfd.png' };

    if (!image.url.startsWith('http')) {
      const local = path.resolve(image.url);
      if (fs.existsSync(local)) {
        image = { url: 'data:image/jpeg;base64,' + fs.readFileSync(local).toString('base64') };
      }
    }

    // SEND **ONCE**
    await conn.sendMessage(
      from,
      {
        image,
        caption: menu,
        mentions: [sender]
      },
      { quoted: mek }
    );

  } catch (e) {
    console.error(e);
    reply('❌ Menu failed:\n' + e.message);
  }
});
