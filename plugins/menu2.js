const { cmd } = require('../command');
const config = require('../config');
const { getPrefix } = require('../lib/prefix');

cmd({
  pattern: "menu2",
  alias: ["menubtn", "buttons"],
  desc: "Show button-controlled menu",
  category: "menu",
  react: "👌",
  filename: __filename,
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    const prefix = getPrefix();
    const title = `✨ ${config.BOT_NAME || 'NYX MD'} — Quick Menu ✨`;
    const body = `Hi @${sender.split('@')[0]}\n\nUse the buttons below to quickly access commands:\n`;
    const footer = `${config.DESCRIPTION || 'NYX MD Bot'} • ${config.PREFIX}`;

    const buttons = [
      { urlButton: { displayText: 'Support Group', url: config.GROUP_LINK || 'https://chat.whatsapp.com/' } },
      { callButton: { displayText: 'Call Owner', phoneNumber: config.OWNER_NUMBER || '' } },
      { quickReplyButton: { displayText: 'Menu', id: prefix + 'menu' } },
      { quickReplyButton: { displayText: 'Play', id: prefix + 'play' } },
      { quickReplyButton: { displayText: 'Help', id: prefix + 'help' } }
    ];

    const image = { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/rw0yfd.png' };

    // use helper defined in index.js
    if (typeof conn.send5ButImg === 'function') {
      await conn.send5ButImg(from, title + '\n\n' + body, footer, image, buttons, null, { quoted: mek });
    } else {
      // fallback to sending simple image + caption and quick buttons
      await conn.sendMessage(from, { image, caption: title + '\n\n' + body, buttons: [
        { buttonId: prefix + 'menu', buttonText: { displayText: 'Menu' }, type: 1 },
        { buttonId: prefix + 'play', buttonText: { displayText: 'Play' }, type: 1 }
      ], headerType: 4 });
    }
  } catch (e) {
    console.error('menu2 error:', e);
    reply('Failed to send button menu.');
  }
});
