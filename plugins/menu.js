const config = require('../config');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const os = require('os');
const { getPrefix } = require('../lib/prefix');

// Fonction pour styliser les majuscules comme ʜɪ
function toUpperStylized(str) {
  const stylized = {
    A: 'ᴀ', B: 'ʙ', C: 'ᴄ', D: 'ᴅ', E: 'ᴇ', F: 'ғ', G: 'ɢ', H: 'ʜ',
    I: 'ɪ', J: 'ᴊ', K: 'ᴋ', L: 'ʟ', M: 'ᴍ', N: 'ɴ', O: 'ᴏ', P: 'ᴘ',
    Q: 'ǫ', R: 'ʀ', S: 's', T: 'ᴛ', U: 'ᴜ', V: 'ᴠ', W: 'ᴡ', X: 'x',
    Y: 'ʏ', Z: 'ᴢ'
  };
  return str.split('').map(c => stylized[c.toUpperCase()] || c).join('');
}

// Normalisation des catégories
const normalize = (str) => str.toLowerCase().replace(/\s+menu$/, '').trim();

// Emojis par catégorie normalisée
const emojiByCategory = {
  ai: '🤖', anime: '🍥', audio: '🎧', bible: '📖',
  download: '⬇️', downloader: '📥', fun: '🎮', game: '🕹️',
  group: '👥', img_edit: '🖌️', info: 'ℹ️', information: '🧠',
  logo: '🖼️', main: '🏠', media: '🎞️', menu: '📜',
  misc: '📦', music: '🎵', other: '📁', owner: '👑',
  privacy: '🔒', search: '🔎', settings: '⚙️',
  sticker: '🌟', tools: '🛠️', user: '👤',
  utilities: '🧰', utility: '🧮', wallpapers: '🖼️',
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
    const timezone = config.TIMEZONE || 'Africa/Nairobi';
    const time = moment().tz(timezone).format('HH:mm:ss');
    const date = moment().tz(timezone).format('dddd, DD MMMM YYYY');

    const uptime = () => {
      let sec = process.uptime();
      let h = Math.floor(sec / 3600);
      let m = Math.floor((sec % 3600) / 60);
      let s = Math.floor(sec % 60);
      return `${h}h ${m}m ${s}s`;
    };

    // 🌟 BEAUTIFUL HEADER WITH COLORS
    let menu = `╔════════════════════════════════╗
║        ✨ *NYX MD* ✨       ║
║    🤖 Command Menu v3.0.0 🤖   ║
╚════════════════════════════════╝

╭─────────────────────────────────╮
│ 👤 User: @${sender.split("@")[0]}
│ ⏱️  Runtime: ${uptime()}
│ ⚙️  Mode: ${config.MODE.toUpperCase()}
│ 🔑 Prefix: 「 ${config.PREFIX} 」
│ 👑 Owner: ${config.OWNER_NAME}
│ 🧩 Plugins: ${commands.length}
│ 🛠️  Developer: BLAZE TECH
│ 📅 ${time} • ${date}
╰─────────────────────────────────╯`;

    // Group commands by category
    const categories = {};
    for (const cmd of commands) {
      if (cmd.category && !cmd.dontAdd && cmd.pattern) {
        const normalizedCategory = normalize(cmd.category);
        categories[normalizedCategory] = categories[normalizedCategory] || [];
        categories[normalizedCategory].push({
          pattern: cmd.pattern.split('|')[0],
          desc: cmd.desc || 'No description'
        });
      }
    }

    // 🌈 COLORFUL CATEGORY STYLE WITH DESCRIPTIONS AND PAGINATION
    let menuChunks = [];
    let currentMenu = menu;
    let charCount = menu.length;
    const maxChars = 4090; // WhatsApp limit is around 4096

    for (const cat of Object.keys(categories).sort()) {
      const emoji = emojiByCategory[cat] || '✨';
      const categorySection = `\n\n╭─ ${emoji} *${toUpperStylized(cat).toUpperCase()}*\n`;

      let categoryContent = '';
      for (const cmd of categories[cat].sort((a, b) => a.pattern.localeCompare(b.pattern))) {
        const cmdLine = `│ ▸ ${prefix}${cmd.pattern.padEnd(12)} — ${cmd.desc}\n`;
        categoryContent += cmdLine;
      }
      categoryContent += '╰───────────────────────────────────╯';

      const fullSection = categorySection + categoryContent;

      // Check if adding this section exceeds limit
      if (charCount + fullSection.length > maxChars) {
        // Save current chunk and start new one
        currentMenu += `\n\n╔════════════════════════════════╗\n║ 📄 See next page for more...  ║\n╚════════════════════════════════╝`;
        menuChunks.push(currentMenu);
        currentMenu = `╔════════════════════════════════╗\n║   📖 *MENU - PAGE ${menuChunks.length + 1}* 📖   ║\n╚════════════════════════════════╝${fullSection}`;
        charCount = currentMenu.length;
      } else {
        currentMenu += fullSection;
        charCount += fullSection.length;
      }
    }

    // Add footer to last menu chunk
    currentMenu += `\n\n╔════════════════════════════════╗
║   🌟 ${config.DESCRIPTION || toUpperStylized('Explore the power of NYX MD')} 🌟   ║
╚════════════════════════════════╝

*📱 Need help?*
🔗 Group: ${config.GROUP_LINK ? config.GROUP_LINK : 'Not Set'}
📢 Channel: ${config.CHANNEL_LINK ? config.CHANNEL_LINK : 'Not Set'}

*Made with ❤️ by BLAZE TECH* | *v3.0.0*`;

    menuChunks.push(currentMenu);

    // Context info
    const imageContextInfo = {
      mentionedJid: [sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: config.NEWSLETTER_JID || '120363424512102809@newsletter',
        newsletterName: config.OWNER_NAME || toUpperStylized('NYX MD'),
        serverMessageId: 143
      }
    };

    // Send all menu chunks with image on first page only
    for (let i = 0; i < menuChunks.length; i++) {
      if (i === 0) {
        // First page with image
        await conn.sendMessage(
          from,
          {
            image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/rw0yfd.png' },
            caption: menuChunks[i],
            contextInfo: imageContextInfo
          },
          { quoted: mek }
        );
      } else {
        // Subsequent pages as text
        await conn.sendMessage(
          from,
          { text: menuChunks[i], contextInfo: imageContextInfo },
          { quoted: mek }
        );
      }

      // Delay between messages to avoid rate limiting
      if (i < menuChunks.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Optional audio
    if (config.MENU_AUDIO_URL) {
      await new Promise(r => setTimeout(r, 1000));
      await conn.sendMessage(
        from,
        {
          audio: { url: config.MENU_AUDIO_URL },
          mimetype: 'audio/mp4',
          ptt: true,
          contextInfo: imageContextInfo
        },
        { quoted: mek }
      );
    }

  } catch (e) {
    console.error('Menu Error:', e.message);
    await reply(`❌ ${toUpperStylized('Error')}: Menu failed\n${e.message}`);
  }
});
