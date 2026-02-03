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
}, async (conn, mek, m, { from, sender, reply }) => {
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

        const rows = Object.keys(categoryMap).map(cat => ({
            title: categoryMap[cat],
            rowId: `${prefix}${cat}menu`,
            description: `Open ${categoryMap[cat]}`
        }));

        // Classic header text like menu1
        let menuHeader = `╔══════════════════════════╗
✨ *NYX-XD BOT MENU* ✨
╚══════════════════════════╝

👤 User: @${sender.split("@")[0]}
⏱ Runtime: ${process.uptime()}s
⚙ Mode: ${config.MODE}
🔑 Prefix: ${prefix}
📅 ${time} • ${date}
📦 Commands: ${commands.length}

Select a menu below:
`;

        // Build the list message
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
            contextInfo: { mentionedJid: [sender] },
            image: { url: "https://files.catbox.moe/rw0yfd.png" }
        };

        // Send menu
        await conn.sendMessage(from, listMessage, { quoted: mek });

    } catch (e) {
        console.error('Menu3 Error:', e);
        await reply(`❌ Error: ${e.message}`);
    }
});

// Helper to normalize category names
const normalize = (str) => (str || '').toString().toLowerCase().replace(/\s+menu$/, '').trim();

// Simple category menu handlers
const categories = {
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

Object.entries(categories).forEach(([cat, label]) => {
    cmd({
        pattern: `${cat}menu`,
        desc: `Show ${label} commands`,
        category: 'menu',
        filename: __filename,
    }, async (conn, mek, m, { from, reply }) => {
        try {
            const prefix = getPrefix();
            const list = commands.filter(c => normalize(c.category) === cat && c.pattern && !c.dontAdd).map(c => c.pattern.split('|')[0]);
            if (!list || !list.length) return reply(`⚠️ No commands found for ${label}.`);

            const header = `╭─── ${label.toUpperCase()} ───╮\n`;
            const body = list.map(p => `• ${prefix}${p}`).join('\n');
            const footer = `\n╰──────────────────────╯`;
            const text = header + body + footer;
            await conn.sendMessage(from, { text }, { quoted: mek });
        } catch (err) {
            console.error(`Error in ${cat}menu handler:`, err);
            reply('❌ Failed to build menu.');
        }
    });
});
