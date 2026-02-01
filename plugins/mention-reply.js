const config = require('../config');
const { cmd } = require('../command');

cmd({
  on: "body"
}, async (conn, m, { isGroup }) => {
  try {
    if (config.MENTION_REPLY !== 'true' || !isGroup) return;

    const mentioned = m.mentionedJid || [];
    const botNumber = conn.user.id.split(":")[0] + '@s.whatsapp.net';
    if (!mentioned.includes(botNumber)) return;

    // Beautiful formatted message
    const mentionText = `╔════════════════════════════════╗
║        👋 *MENTION RECEIVED* 👋        ║
╚════════════════════════════════╝

✨ **${config.BOT_NAME || 'NYX MD'}** is here! 

🎯 I'm listening and ready to help you.

╭─────────────────────────────────╮
│ 💬 How can I assist you today?
│ ⚡ Use .menu for commands
│ 🔗 ${config.GROUP_LINK ? config.GROUP_LINK : 'Join our community'}
╰─────────────────────────────────╯

*Made with ❤️ by ${config.OWNER_NAME || 'BLAZE TEAM'}*`;

    // Send image with caption
    await conn.sendMessage(m.chat, {
      image: { url: config.MENU_IMAGE_URL || "https://files.catbox.moe/rw0yfd.png" },
      caption: mentionText,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        externalAdReply: {
          showAdAttribution: true,
          title: config.BOT_NAME || 'NYX MD',
          body: '🤖 Your AI Assistant',
          thumbnailUrl: config.MENU_IMAGE_URL || "https://files.catbox.moe/rw0yfd.png",
          sourceUrl: config.CHANNEL_LINK || '',
          mediaType: 1,
          renderLargerThumbnail: false
        }
      }
    }, { quoted: m });

    // Send audio file
    await conn.sendMessage(m.chat, {
      audio: { url: "https://files.catbox.moe/lu3f94.mp3" },
      mimetype: 'audio/mpeg',
      ptt: false,
      fileName: `${config.BOT_NAME || 'NYX'}-notification.mp3`
    }, { quoted: m });

  } catch (e) {
    console.error('Mention reply error:', e);
  }
});

cmd({
  pattern: "me",
  alias: ["mention", "broken", "x", "xd"],
  desc: "Send a random voice clip",
  category: "fun",
  react: "⚡",
  filename: __filename
}, async (conn, m) => {
  try {
    const voiceClips = [
      "https://cdn.ironman.my.id/i/7p5plg.mp4",
      "https://cdn.ironman.my.id/i/l4dyvg.mp4",
      "https://cdn.ironman.my.id/i/4z93dg.mp4",
      "https://cdn.ironman.my.id/i/m9gwk0.mp4",
      "https://cdn.ironman.my.id/i/gr1jjc.mp4",
      "https://cdn.ironman.my.id/i/lbr8of.mp4",
      "https://cdn.ironman.my.id/i/0z95mz.mp4",
      "https://cdn.ironman.my.id/i/rldpwy.mp4",
      "https://cdn.ironman.my.id/i/lz2z87.mp4",
      "https://cdn.ironman.my.id/i/gg5jct.mp4"
    ];

    const randomClip = voiceClips[Math.floor(Math.random() * voiceClips.length)];

    await conn.sendMessage(m.chat, {
      audio: { url: randomClip },
      mimetype: 'audio/mp4',
      ptt: true
    }, { quoted: m });
  } catch (e) {
    console.error(e);
    await conn.sendMessage(m.chat, { text: "❌ Failed to send random clip." }, { quoted: m });
  }
});
