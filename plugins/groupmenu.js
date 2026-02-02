cmd({
    pattern: 'groupmenu',
    alias: ['gmenu', 'group'],
    desc: 'Show all Group commands',
    category: 'group',
    react: '👥',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        const prefix = getPrefix();
        const time = moment().tz(config.TIMEZONE || 'Africa/Nairobi').format('HH:mm:ss');
        const date = moment().tz(config.TIMEZONE || 'Africa/Nairobi').format('dddd, DD MMMM YYYY');

        const groupRows = [
            { title: "Group Info", rowId: `${prefix}ginfo`, description: "Get info about the group" },
            { title: "Promote", rowId: `${prefix}promote`, description: "Promote a member" },
            { title: "Demote", rowId: `${prefix}demote`, description: "Demote a member" },
            { title: "Add Member", rowId: `${prefix}add`, description: "Add someone to group" },
            { title: "Remove Member", rowId: `${prefix}kick`, description: "Remove someone from group" }
        ];

        const listMessage = {
            text: "*👥 GROUP MENU*\n\nSelect a command below:",
            footer: `🌟 NYX-XD Bot | Blaze Tech 🌟\n👤 User: @${sender.split('@')[0]}\n📅 ${time} • ${date}`,
            buttonText: "Open Group Menu",
            sections: [{ title: "Group Commands", rows: groupRows }],
            headerType: 1,
            contextInfo: { mentionedJid: [sender] },
            image: { url: "https://files.catbox.moe/rw0yfd.png" }
        };

        await conn.sendMessage(from, listMessage, { quoted: mek });
    } catch (e) {
        console.error('Group Menu Error:', e);
        await reply(`❌ Error: ${e.message}`);
    }
});
