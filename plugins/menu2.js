const { cmd, commands } = require('../command');
const { getPrefix } = require('../lib/prefix');
const config = require('../config');
const moment = require('moment-timezone');

cmd({
    pattern: 'menu2',
    alias: ['menu2'],
    desc: 'Show all bot commands (full list menu)',
    category: 'menu',
    react: '👌',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        const prefix = getPrefix();
        const timezone = config.TIMEZONE || 'Africa/Nairobi';
        const time = moment().tz(timezone).format('HH:mm:ss');
        const date = moment().tz(timezone).format('dddd, DD MMMM YYYY');

        // Build the list of menu categories dynamically
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
            owner: 'Owner Menu',
            other: 'Other Menu',
            search: 'Search Menu'
        };

        const rows = Object.keys(categoryMap).map(cat => ({
            title: categoryMap[cat],
            rowId: `${prefix}${cat}menu`,
            description: `Open ${categoryMap[cat]}`
        }));

        // Menu text / caption
        const menuText = `*👋 Hello, welcome to NYX-XD ❄️*\n\nSelect a menu below:`;

        // Build list message
        const listMessage = {
            text: menuText,
            footer: "🌟 NYX-XD Bot | Blaze Tech 🌟",
            buttonText: "Open Menu",
            sections: [
                {
                    title: "NYX-XD Bot Menus",
                    rows: rows
                }
            ],
            headerType: 1,
            contextInfo: { mentionedJid: [sender] },
            // Optional: add image header
            image: { url: "https://files.catbox.moe/rw0yfd.png" }
        };

        // Send list menu
        await conn.sendMessage(from, listMessage, { quoted: mek });

    } catch (e) {
        console.error('Menu2 Error:', e);
        await reply(`❌ Error: ${e.message}`);
    }
});
