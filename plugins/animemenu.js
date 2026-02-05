cmd({
    pattern: 'animemenu',
    alias: ['anime'],
    desc: 'Show all Anime commands',
    category: 'anime',
    react: '🍥',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        const prefix = getPrefix();
        const time = moment().tz(config.TIMEZONE || 'Africa/Nairobi').format('HH:mm:ss');
        const date = moment().tz(config.TIMEZONE || 'Africa/Nairobi').format('dddd, DD MMMM YYYY');

        const animeRows = [
            { title: "Random Anime", rowId: `${prefix}ranime`, description: "Get random anime image" },
            { title: "Waifu", rowId: `${prefix}waifu`, description: "Get waifu picture" },
            { title: "Neko", rowId: `${prefix}neko`, description: "Get neko image" }
        ];

        const listMessage = {
            text: "*🍥 ANIME MENU*\n\nSelect a command below:",
            footer: `🌟 NYX-XD Bot | Blaze Tech 🌟\n👤 User: @${sender.split('@')[0]}\n📅 ${time} • ${date}`,
            buttonText: "Open Anime Menu",
            sections: [{ title: "Anime Commands", rows: animeRows }],
            headerType: 1,
            contextInfo: { mentionedJid: [sender] },
            image: { url: "https://files.catbox.moe/rw0yfd.png" }
        };

        await conn.sendMessage(from, listMessage, { quoted: mek });

    } catch (e) {
        console.error('Anime Menu Error:', e);
        await reply(`❌ Error: ${e.message}`);
    }
});
