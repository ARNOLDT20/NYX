const config = require('../config');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const os = require('os');
const { getPrefix } = require('../lib/prefix');

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

        const uptimeText = () => {
            let sec = process.uptime();
            let h = Math.floor(sec / 3600);
            let m = Math.floor((sec % 3600) / 60);
            let s = Math.floor(sec % 60);
            return `${h}h ${m}m ${s}s`;
        };

        // Build menu text
        let menuText = `
*👋 Hello, welcome to NYX-XD ❄️*

╭──────────────●●►
│ 🛠️ Version: ${require("../package.json").version}
│ 📟 RAM usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB
│ ⏱️ Runtime: ${runtime(process.uptime())}
│ 👨‍💻 Owner: STARBOY
╰──────────────●●►

*❐ NYX-XD MENU LIST ☣*
> ᴄʀᴇᴀᴛᴇᴅ ʙʏ STARBOY
`;

        // Use the catbox.moe image
        let imageUrl = "https://files.catbox.moe/rw0yfd.png";

        // Define buttons
        let buttons = [
            { buttonId: `${prefix}mainmenu`, buttonText: { displayText: "Main Menu" }, type: 1 },
            { buttonId: `${prefix}dlmenu`, buttonText: { displayText: "Download Menu" }, type: 1 },
            { buttonId: `${prefix}moviemenu`, buttonText: { displayText: "Movie Menu" }, type: 1 },
            { buttonId: `${prefix}convertmenu`, buttonText: { displayText: "Convert Menu" }, type: 1 },
        ];

        await conn.sendMessage(
            from,
            {
                image: { url: imageUrl },
                caption: menuText,
                footer: "🌟 NYX-XD Bot | Blaze Tech 🌟",
                buttons: buttons,
                headerType: 4, // 4 = image + buttons
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
