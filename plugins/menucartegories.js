const { cmd, commands } = require('../command');
const { getPrefix } = require('../lib/prefix');
const config = require('../config');
const moment = require('moment-timezone');

const menuCategories = {
    main: "Main Menu",
    download: "Download Menu",
    movie: "Movie Menu",
    convert: "Convert Menu",
    group: "Group Menu",
    ai: "AI Menu",
    fun: "Fun Menu",
    anime: "Anime Menu",
    reactions: "Reaction Menu",
    owner: "Owner Menu",
    other: "Other Menu",
    search: "Search Menu"
};

Object.keys(menuCategories).forEach(cat => {
    cmd({
        pattern: `${cat}menu`,
        alias: [cat],
        desc: `Show all ${menuCategories[cat]}`,
        category: cat,
        react: '📂',
        filename: __filename
    }, async (conn, mek, m, { from, sender, reply }) => {
        try {
            const prefix = getPrefix();
            const timezone = config.TIMEZONE || 'Africa/Nairobi';
            const time = moment().tz(timezone).format('HH:mm:ss');
            const date = moment().tz(timezone).format('dddd, DD MMMM YYYY');

            // Filter commands for this category
            const filteredCommands = commands
                .filter(c => c.category && c.category.toLowerCase() === cat.toLowerCase())
                .map(c => c.pattern.split('|')[0]);

            if (!filteredCommands.length) return reply(`❌ No commands available for ${menuCategories[cat]}`);

            // Build buttons for each command
            const buttons = filteredCommands.map(cmdName => ({
                buttonId: `${prefix}${cmdName}`,
                buttonText: { displayText: cmdName },
                type: 1
            }));

            // Caption text
            let caption = `╔═════════════════════════╗
📂 *${menuCategories[cat].toUpperCase()}*
╚═════════════════════════╝

👤 User: @${sender.split("@")[0]}
⏱ Runtime: ${process.uptime()}s
📅 ${time} • ${date}
📦 Commands: ${filteredCommands.length}

*Select a command below:*`;

            // Send buttons message
            await conn.sendMessage(from, {
                image: { url: "https://files.catbox.moe/rw0yfd.png" },
                caption,
                buttons,
                headerType: 1,
                contextInfo: { mentionedJid: [sender] }
            }, { quoted: mek });

        } catch (e) {
            console.error(`${menuCategories[cat]} Menu Error:`, e);
            await reply(`❌ Error: ${e.message}`);
        }
    });
});
