const config = require('../config');
const moment = require('moment-timezone');
const { cmd } = require('../command');
const { runtime } = require('../lib/functions');
const { getPrefix } = require('../lib/prefix');

cmd({
    pattern: 'menu2',
    alias: ['panel', 'menus'],
    desc: 'Show button menu',
    category: 'menu',
    react: '👌',
    filename: __filename
},
    async (conn, mek, m, { from, sender }) => {

        try {

            const prefix = getPrefix();

            const time = moment().tz(config.TIMEZONE || 'Africa/Nairobi').format('HH:mm:ss');
            const date = moment().format('DD/MM/YYYY');

            const caption = `
╔══════════════════════╗
   ✨ *NYX-XD MENU PANEL* ✨
╚══════════════════════╝

👤 User: @${sender.split("@")[0]}
⏱ Runtime: ${runtime(process.uptime())}
🕒 ${time} | ${date}

_Select a menu below 👇_
`;

            const imageUrl = "https://files.catbox.moe/rw0yfd.png";

            // ✅ NORMAL BUTTONS (NOT type 4)
            const buttons = [

                { buttonId: `${prefix}menu`, buttonText: { displayText: "🏠 MAIN MENU" }, type: 1 },
                { buttonId: `${prefix}dlmenu`, buttonText: { displayText: "⬇️ DOWNLOAD" }, type: 1 },
                { buttonId: `${prefix}groupmenu`, buttonText: { displayText: "👥 GROUP" }, type: 1 },

                { buttonId: `${prefix}aimenu`, buttonText: { displayText: "🤖 AI MENU" }, type: 1 },
                { buttonId: `${prefix}searchmenu`, buttonText: { displayText: "🔍 SEARCH" }, type: 1 },
                { buttonId: `${prefix}funmenu`, buttonText: { displayText: "🎮 FUN" }, type: 1 },

                { buttonId: `${prefix}owner`, buttonText: { displayText: "👑 OWNER" }, type: 1 },
                { buttonId: `${prefix}othermenu`, buttonText: { displayText: "📦 OTHER" }, type: 1 },
                { buttonId: `${prefix}menu`, buttonText: { displayText: "📜 FULL MENU" }, type: 1 }
            ];

            await conn.sendMessage(
                from,
                {
                    image: { url: imageUrl },
                    caption,
                    buttons,
                    headerType: 1,
                    viewOnce: true,
                    contextInfo: {
                        mentionedJid: [sender]
                    }
                },
                { quoted: mek }
            );

        } catch (e) {
            console.log(e);
        }
    });
