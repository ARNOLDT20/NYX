const { cmd } = require('../lib/command')
const os = require('os')
const { runtime } = require('../lib/functions')

cmd({
    pattern: "alive2",
    react: "🧚‍♂️",
    desc: "Check bot Commands.",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        const senderName = m.pushName || "User"

        let caption = `
*👋 Hello ${senderName}, Welcome to NYX-XD ❄️*

╭──────────────●●►
🛠️ Version: ${require("../package.json").version}
📟 RAM Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB
⏱️ Runtime: ${runtime(process.uptime())}
👨‍💻 Owner: T20_STARBOY
╰──────────────●●►

❐ *NYX-XD BOT MENU LIST ☣*
> Created by Arnold Tarimo
        `;

        const imageUrl = "https://files.catbox.moe/joo2gt.jpg";

        const templateButtons = [
            {
                index: 1,
                urlButton: {
                    displayText: "👨‍💻 Contact Owner",
                    url: "https://wa.me/+255627417402?text=Hello👨‍💻"
                }
            },
            {
                index: 2,
                quickReplyButton: {
                    displayText: "📜 MENU",
                    id: ".menu"
                }
            },
            {
                index: 3,
                quickReplyButton: {
                    displayText: "🏓 PING",
                    id: ".ping"
                }
            }
        ];

        await conn.sendMessage(m.chat, {
            image: { url: imageUrl },
            caption,
            footer: "© NYX-XD Bot",
            templateButtons,
            mentions: [m.sender]
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply(`Error: ${e.message}`);
    }
});
