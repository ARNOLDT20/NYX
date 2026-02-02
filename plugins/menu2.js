const { cmd } = require('../command');
const config = require('../config');
const { getPrefix } = require('../lib/prefix');

cmd({
    pattern: "menu2",
    react: "📂",
    desc: "Check bot Commands.",
    category: "main",
    filename: __filename
}, async (conn, mek, m, { reply, prefix }) => {
    try {

        let teksnya = `
*👋Hello welcome NYX-XD❄️* 
╭──────────────●●►
| *🛠️  Version:* ${require("../package.json").version}
| *📟 Ram usage:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(require('os').totalmem / 1024 / 1024)}MB
| *⏱️  Runtime:* ${runtime(process.uptime())}
| *👨‍💻 Owner*: starboy
╰──────────────●●►
 *❐NYX-XD MENU LIST☣*
> ᴄʀᴇᴀᴛᴇᴅ ʙʏ starboy
 
 `;

        let imageUrl = "https://files.catbox.moe/joo2gt.jpg";

        let vpsOptions = [

            { title: "ᴍᴀɪɴ menu ", description: "Get Bot ᴍᴀɪɴ Menu", id: `${prefix}mainmenu` },
            { title: "ᴅᴏᴡɴʟᴏᴀᴅ menu ", description: "Get Bot Download Menu", id: `${prefix}dlmenu` },
            { title: "ᴍᴏᴠɪᴇ ᴍᴇɴᴜ ", description: "Get Bot Movie Menu", id: `${prefix}moviemenu` },
            { title: "ᴄᴏɴᴠᴇʀᴛ menu ", description: "Get Bot Convert Menu", id: `${prefix}convertmenu` },
            { title: "ɢʀᴏᴜᴘ ᴍᴇɴᴜ ", description: "Get Group Only Commands", id: `${prefix}groupmenu` },
            { title: "ᴀɪ ᴍᴇɴᴜ ", description: "Get Bot AI Commands List", id: `${prefix}aimenu` },
            { title: "ꜱᴇᴀʀᴄʜ menu ", description: "Get Bot Search Menu", id: `${prefix}searchmenu` },
            { title: "ꜰᴜɴ menu ", description: "Fun Joke Menu Bot", id: `${prefix}funmenu` },
            { title: "ᴀɴɪᴍᴇ menu ", description: "Owner Only Bug Menu", id: `${prefix}animemenu` },
            { title: "ʀᴇᴀᴄᴛɪᴏɴ menu ", description: "Get ʀᴇᴀᴄᴛɪᴏɴ Menu", id: `${prefix}reactions` },
            { title: "ᴏᴡɴᴇʀ menu ", description: "Get Bot ᴏᴡɴᴇʀ Menu", id: `${prefix}ownermenu` },
            { title: "ᴏᴛʜᴇʀ ᴍᴇɴᴜ ", description: "ᴏᴛʜᴇʀ Commands Menu", id: `${prefix}othermenu` }
        ];

        let buttonSections = [
            {
                title: "List of NYX-XD Bot Commands",
                highlight_label: "NYX-XD",
                rows: vpsOptions
            }
        ];

        let buttons = [
            {
                buttonId: "action",
                buttonText: { displayText: "Select Menu" },
                type: 4,
                nativeFlowInfo: {
                    name: "single_select",
                    paramsJson: JSON.stringify({
                        title: "MENU📃",
                        sections: buttonSections
                    }),

                }
            }
        ];


        conn.sendMessage(m.chat, {
            buttons,
            headerType: 1,
            viewOnce: true,
            caption: teksnya,
            image: { url: imageUrl },
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363424512102809@newsletter',
                    newsletterName: `blaze tech`,
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply(`Error: ${e.message}`);
    }
});
