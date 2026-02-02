const { cmd, commands } = require('../command');
const { getPrefix } = require('../lib/prefix');
const config = require('../config');
const moment = require('moment-timezone');

cmd({
    pattern: 'downloadmenu',
    alias: ['dlmenu', 'download'],
    desc: 'Show all Download commands as submenu',
    category: 'download',
    react: '⬇️',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        const prefix = getPrefix();
        const timezone = config.TIMEZONE || 'Africa/Nairobi';
        const time = moment().tz(timezone).format('HH:mm:ss');
        const date = moment().tz(timezone).format('dddd, DD MMMM YYYY');

        // Define download commands manually for the list
        const downloadRows = [
            { title: "YouTube MP3", rowId: `${prefix}ytmp3`, description: "Download YouTube as MP3" },
            { title: "YouTube MP4", rowId: `${prefix}ytmp4`, description: "Download YouTube as MP4" },
            { title: "TikTok", rowId: `${prefix}tiktok`, description: "Download TikTok videos" },
            { title: "Instagram", rowId: `${prefix}igdl`, description: "Download Instagram posts" },
            { title: "Mediafire", rowId: `${prefix}mediafire`, description: "Download Mediafire files" },
            { title: "Twitter", rowId: `${prefix}twitter`, description: "Download Twitter media" }
        ];

        const listMessage = {
            text: `*📥 DOWNLOAD MENU*\n\nSelect a command below:`,
            footer: `🌟 NYX-XD Bot | Blaze Tech 🌟\n👤 User: @${sender.split('@')[0]}\n📅 ${time} • ${date}`,
            buttonText: "Open Download Menu",
            sections: [
                {
                    title: "Download Commands",
                    rows: downloadRows
                }
            ],
            headerType: 1,
            contextInfo: { mentionedJid: [sender] },
            image: { url: "https://files.catbox.moe/rw0yfd.png" }
        };

        await conn.sendMessage(from, listMessage, { quoted: mek });

    } catch (e) {
        console.error('Download Menu Error:', e);
        await reply(`❌ Error: ${e.message}`);
    }
});
