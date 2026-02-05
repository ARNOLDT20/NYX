const { cmd, commands } = require('../command');
const { getPrefix } = require('../lib/prefix');
const config = require('../config');
const moment = require('moment-timezone');

cmd({
    pattern: 'menu3',
    alias: ['menu3', 'hybridmenu'],
    desc: 'Classic menu style with list + image',
    category: 'menu',
    react: '👌',
    filename: __filename
}, async (conn, mek, m, { from, sender, isGroup, reply }) => {
    try {
        const prefix = getPrefix();
        const timezone = config.TIMEZONE || 'Africa/Nairobi';
        const time = moment().tz(timezone).format('HH:mm:ss');
        const date = moment().tz(timezone).format('dddd, DD MMMM YYYY');

        // Build categories dynamically
        const categoryMap = {
            main: 'Main Menu',
            download: 'Download Menu',
            movie: 'Movie Menu',
            convert: 'Convert Menu',
            group: 'Group Menu',
            ai: 'AI Menu',
            fun: 'Fun Menu',
            anime: 'Anime Menu',
            reactions: 'Reaction Menu',
            owner: 'Owner',
            other: 'Other Menu',
            search: 'Search Menu'
        };

        let menuHeader = `╔══════════════════════════╗
✨ *NYX-XD BOT MENU* ✨
╚══════════════════════════╝

👤 User: @${sender.split("@")[0]}
⏱ Runtime: ${process.uptime()}s
⚙ Mode: ${config.MODE}
🔑 Prefix: ${prefix}
📅 ${time} • ${date}

Select a menu below:
`;

        // For groups: Send simple text menu (lists don't work in groups)
        if (isGroup) {
            let textMenu = menuHeader;
            Object.entries(categoryMap).forEach(([key, value]) => {
                textMenu += `\n▸ ${prefix}${key}menu - ${value}`;
            });
            await conn.sendMessage(from, { text: textMenu }, { quoted: mek });
            return;
        }

        // For DM: Try list message first
        const rows = Object.keys(categoryMap).map(cat => ({
            title: categoryMap[cat],
            rowId: `${prefix}${cat}menu`,
            description: `Open ${categoryMap[cat]}`
        }));

        const listMessage = {
            text: menuHeader,
            footer: "🌟 NYX-XD Bot | Blaze Tech 🌟",
            buttonText: "Open Menu",
            sections: [
                {
                    title: "NYX-XD Bot Menus",
                    rows: rows
                }
            ],
            headerType: 1,
            contextInfo: { mentionedJid: [sender] }
        };

        try {
            await conn.sendMessage(from, listMessage, { quoted: mek });
            return;
        } catch (listErr) {
            // Fallback: Send as text menu
            let textMenu = menuHeader;
            Object.entries(categoryMap).forEach(([key, value]) => {
                textMenu += `\n▸ ${prefix}${key}menu - ${value}`;
            });
            await conn.sendMessage(from, { text: textMenu }, { quoted: mek });
        }

    } catch (e) {
        console.error('Menu3 Error:', e);
        await reply(`❌ Error: ${e.message}`);
    }
});
