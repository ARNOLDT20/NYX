const { cmd, commands } = require('../command');
const { getPrefix } = require('../lib/prefix');
const config = require('../config');
const moment = require('moment-timezone');

cmd({
    pattern: 'downloadmenu',
    alias: ['dlmenu', 'download'],
    desc: 'Show all Download commands',
    category: 'download',
    react: '⬇️',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        const prefix = getPrefix();
        const timezone = config.TIMEZONE || 'Africa/Nairobi';
        const time = moment().tz(timezone).format('HH:mm:ss');
        const date = moment().tz(timezone).format('dddd, DD MMMM YYYY');

        // Filter commands in download category
        const downloadCommands = commands
            .filter(c => c.category && c.category.toLowerCase() === 'download')
            .map(c => c.pattern.split('|')[0]);

        if (!downloadCommands.length) return reply('❌ No download commands available.');

        // Build buttons for each download command
        const buttons = downloadCommands.map(cmdName => ({
            buttonId: `${prefix}${cmdName}`,
            buttonText: { displayText: cmdName },
            type: 1
        }));

        const caption = `╔════════════════════╗
📥 *DOWNLOAD MENU*
╚════════════════════╝

👤 User: @${sender.split("@")[0]}
⏱ Runtime: ${process.uptime()}s
📅 ${time} • ${date}
📦 Commands: ${downloadCommands.length}

*Click a button below to run a command:*`;

        // Send buttons message
        await conn.sendMessage(from, {
            image: { url: "https://files.catbox.moe/rw0yfd.png" },
            caption,
            buttons,
            headerType: 1,
            contextInfo: { mentionedJid: [sender] }
        }, { quoted: mek });

    } catch (e) {
        console.error('Download Menu Error:', e);
        await reply(`❌ Error: ${e.message}`);
    }
});
