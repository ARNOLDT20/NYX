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
    async (conn, mek, m, { from, sender, isGroup, reply }) => {
        try {
            const prefix = getPrefix();
            const time = moment().tz(config.TIMEZONE || 'Africa/Nairobi').format('HH:mm:ss');
            const date = moment().format('DD/MM/YYYY');

            const caption = `╔══════════════════════╗
   ✨ *NYX-XD MENU PANEL* ✨
╚══════════════════════╝

👤 User: @${sender.split("@")[0]}
⏱ Runtime: ${runtime(process.uptime())}
🕒 ${time} | ${date}

_Select a menu below 👇_`;

            const gifUrl = "https://files.catbox.moe/qmh4d8.mp4";

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

            // Primary: Try GIF with buttons
            try {
                await conn.sendMessage(from, {
                    video: { url: gifUrl },
                    caption,
                    buttons,
                    headerType: 1,
                    gifPlayback: true,
                    mimetype: 'video/mp4',
                    contextInfo: { mentionedJid: [sender] }
                }, { quoted: mek });
                return;
            } catch (err1) {
                console.log('GIF with buttons failed:', err1.message);
            }

            // Fallback 1: Try GIF without buttons
            try {
                await conn.sendMessage(from, {
                    video: { url: gifUrl },
                    caption,
                    gifPlayback: true,
                    mimetype: 'video/mp4',
                    contextInfo: { mentionedJid: [sender] }
                }, { quoted: mek });
                return;
            } catch (err2) {
                console.log('GIF alone failed:', err2.message);
            }

            // Fallback 2: Send text menu
            const textMenu = caption + `\n\n*Quick Access:*\n${buttons.map(b => `• ${b.buttonText.displayText}`).join('\n')}`;
            await conn.sendMessage(from, {
                text: textMenu,
                contextInfo: {
                    externalAdReply: {
                        title: "🔗 NYX-XD MENU",
                        body: "Tap to access menus",
                        mediaType: 1,
                        sourceUrl: "https://chat.whatsapp.com/",
                        thumbnail: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
                    },
                    mentionedJid: [sender]
                }
            }, { quoted: mek });

        } catch (error) {
            console.error('Menu2 Error:', error);
            reply("❌ Error displaying menu. Please try again.");
        }
    }
);
