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

// Register per-category handlers so selecting a category shows its commands
const normalize = (str) => (str || '').toString().toLowerCase().replace(/\s+menu$/, '').trim();

const registerCategoryHandlers = () => {
    const prefix = getPrefix();
    for (const cat of Object.keys({
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
    })) {
        // pattern like 'downloadmenu'
        const pattern = `${cat}menu`;
        cmd({
            pattern,
            desc: `Show ${cat} commands`,
            category: 'menu',
            filename: __filename,
        }, async (conn2, mek2, m2, { from: from2, sender: sender2, reply: reply2 }) => {
            try {
                const all = commands || [];
                const list = all.filter(c => normalize(c.category) === cat && c.pattern && !c.dontAdd).map(c => c.pattern.split('|')[0]);
                if (!list || !list.length) return reply2(`⚠️ No commands found for ${cat} menu.`);

                const header = `╭─── ${cat.toUpperCase()} MENU ───╮\nSelect a command to run:\n`;
                const body = list.map(p => `• ${prefix}${p}`).join('\n');
                const text = header + '\n' + body + '\n\nUse the command by typing it.`;
                await conn2.sendMessage(from2, { text }, { quoted: mek2 });
            } catch (err) {
                console.error(`Error in ${pattern} handler:`, err);
                await reply2('❌ Failed to build category menu.');
            }
        });
    }
};

registerCategoryHandlers();
