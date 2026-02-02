const { cmd, commands } = require('../command');
const { getPrefix } = require('../lib/prefix');
const config = require('../config');
const moment = require('moment-timezone');

cmd({
    pattern: 'moviemenu',
    alias: ['movies', 'movie'],
    desc: 'Show all movie-related commands',
    category: 'movie',
    react: '🎬',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        const prefix = getPrefix();
        const timezone = config.TIMEZONE || 'Africa/Nairobi';
        const time = moment().tz(timezone).format('HH:mm:ss');
        const date = moment().tz(timezone).format('dddd, DD MMMM YYYY');

        // Filter all movie category commands dynamically
        const movieCmds = commands
            .filter(c => c.category && c.category.toLowerCase() === 'movie')
            .map(c => c.pattern.split('|')[0]);

        if (movieCmds.length === 0) {
            return reply('❌ No movie commands available yet!');
        }

        let menuText = `╔═════════════════════════╗
🎬 *NYX-XD MOVIE MENU* 🎬
╚═════════════════════════╝

👤 User: @${sender.split("@")[0]}
⏱ Runtime: ${process.uptime()}s
📅 ${time} • ${date}
📦 Commands: ${movieCmds.length}

🎞 *Movie Commands List*:
`;

        for (let cmd of movieCmds) {
            menuText += `│ ▸ ${prefix}${cmd}\n`;
        }

        menuText += `╚═════════════════════════╝`;

        // Send as message with an image header
        await conn.sendMessage(from, {
            image: { url: "https://files.catbox.moe/rw0yfd.png" },
            caption: menuText,
            contextInfo: { mentionedJid: [sender] }
        }, { quoted: mek });

    } catch (e) {
        console.error('Movie Menu Error:', e);
        await reply(`❌ Error: ${e.message}`);
    }
});
