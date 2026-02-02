const { cmd, commands } = require('../command');
const os = require('os');
const { runtime } = require('../lib/functions');
const config = require('../config');
const { getPrefix } = require('../lib/prefix');
const moment = require('moment-timezone');

cmd({
    pattern: 'menu2',
    alias: ['menu2'],
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

        // Uptime calculation
        const up = runtime(process.uptime());

        // Memory usage
        const mem = process.memoryUsage();
        const usedMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
        const totalMB = (mem.heapTotal / 1024 / 1024).toFixed(2);

        const platform = `${os.type()} ${os.release()} ${os.arch()}`;
        const cpu = os.cpus()[0].model;

        // Build menu text
        const menuText = `
╔═════════════════════════╗
║     ✨ *NYX-XD MENU* ✨      ║
║   🤖 Bot Command Menu v3.0   ║
╚═════════════════════════╝

╭─────────────────────────╮
│ 👤 User: @${sender.split("@")[0]}
│ ⏱️ Runtime: ${up}
│ 🏷️ Prefix: ${prefix}
│ 🛠️ Developer: Blaze Tech
│ 🖥️ Platform: ${platform}
│ 💾 Memory: ${usedMB}MB / ${totalMB}MB
│ ⏱️ Time: ${time} • ${date}
╰─────────────────────────╯

*❐ NYX-XD MENU LIST ☣*
> Created by STARBOY
`;

        // Buttons for menu categories
        const buttons = [
            { buttonId: `${prefix}mainmenu`, buttonText: { displayText: "Main Menu" }, type: 1 },
            { buttonId: `${prefix}dlmenu`, buttonText: { displayText: "Download Menu" }, type: 1 },
            { buttonId: `${prefix}moviemenu`, buttonText: { displayText: "Movie Menu" }, type: 1 },
            { buttonId: `${prefix}convertmenu`, buttonText: { displayText: "Convert Menu" }, type: 1 },
            { buttonId: `${prefix}groupmenu`, buttonText: { displayText: "Group Menu" }, type: 1 },
            { buttonId: `${prefix}aimenu`, buttonText: { displayText: "AI Menu" }, type: 1 }
        ];

        // Send the menu message
        await conn.sendMessage(
            from,
            {
                image: { url: "https://files.catbox.moe/rw0yfd.png" },
                caption: menuText,
                footer: "🌟 NYX-XD Bot | Blaze Tech 🌟",
                buttons,
                headerType: 1,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363424512102809@newsletter',
                        newsletterName: 'Blaze Tech',
                        serverMessageId: 143
                    }
                }
            },
            { quoted: mek }
        );

    } catch (e) {
        console.error('Menu2 Error:', e);
        await reply(`❌ Error: ${e.message}`);
    }
});
