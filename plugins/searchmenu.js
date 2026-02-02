cmd({
    pattern: 'searchmenu',
    alias: ['search'],
    desc: 'Show all Search commands',
    category: 'search',
    react: '🔎',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        const prefix = getPrefix();
        const time = moment().tz(config.TIMEZONE || 'Africa/Nairobi').format('HH:mm:ss');
        const date = moment().tz(config.TIMEZONE || 'Africa/Nairobi').format('dddd, DD MMMM YYYY');

        const searchRows = [
            { title: "Google Search", rowId: `${prefix}google`, description: "Search on Google" },
            { title: "Wikipedia", rowId: `${prefix}wiki`, description: "Search on Wikipedia" },
            { title: "Yt Search", rowId: `${prefix}ytsearch`, description: "Search on YouTube" }
        ];

        const listMessage = {
            text: "*🔎 SEARCH MENU*\n\nSelect a command below:",
            footer: `🌟 NYX-XD Bot | Blaze Tech 🌟\n👤 User: @${sender.split('@')[0]}\n📅 ${time} • ${date}`,
            buttonText: "Open Search Menu",
            sections: [{ title: "Search Commands", rows: searchRows }],
            headerType: 1,
            contextInfo: { mentionedJid: [sender] },
            image: { url: "https://files.catbox.moe/rw0yfd.png" }
        };

        await conn.sendMessage(from, listMessage, { quoted: mek });

    } catch (e) {
        console.error('Search Menu Error:', e);
        await reply(`❌ Error: ${e.message}`);
    }
});
