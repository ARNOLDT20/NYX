cmd({
    pattern: 'convertmenu',
    alias: ['convert'],
    desc: 'Show all Convert commands',
    category: 'convert',
    react: '🔄',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        const prefix = getPrefix();
        const time = moment().tz(config.TIMEZONE || 'Africa/Nairobi').format('HH:mm:ss');
        const date = moment().tz(config.TIMEZONE || 'Africa/Nairobi').format('dddd, DD MMMM YYYY');

        const convertRows = [
            { title: "Text to Sticker", rowId: `${prefix}tosticker`, description: "Convert text to sticker" },
            { title: "Image to Sticker", rowId: `${prefix}imgtosticker`, description: "Convert image to sticker" },
            { title: "Sticker to Image", rowId: `${prefix}stktimg`, description: "Convert sticker to image" }
        ];

        const listMessage = {
            text: "*🔄 CONVERT MENU*\n\nSelect a command below:",
            footer: `🌟 NYX-XD Bot | Blaze Tech 🌟\n👤 User: @${sender.split('@')[0]}\n📅 ${time} • ${date}`,
            buttonText: "Open Convert Menu",
            sections: [{ title: "Convert Commands", rows: convertRows }],
            headerType: 1,
            contextInfo: { mentionedJid: [sender] },
            image: { url: "https://files.catbox.moe/rw0yfd.png" }
        };

        await conn.sendMessage(from, listMessage, { quoted: mek });
    } catch (e) {
        console.error('Convert Menu Error:', e);
        await reply(`❌ Error: ${e.message}`);
    }
});
