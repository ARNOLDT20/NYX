const { cmd, commands } = require('../command');

const pairingURL = "https://queen-jusmy-pair.onrender.com/";


/* =================================================
   🔗 PAIR LINK COMMAND
================================================= */
cmd({
    pattern: "pairlink",
    alias: ["genlink", "paircode", "devicelink"],
    react: "🔗",
    desc: "Get pairing link for connecting new devices to the bot",
    category: "tools",
    use: ".pairlink",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {

    try {

        const message = `╔══════════════════════════════════╗
║    🔗 PAIRING LINK GENERATOR 🔗   ║
╚══════════════════════════════════╝

🌐 *Pairing Service Link:*
${pairingURL}

📱 *Steps:*
1. Open the link
2. Enter your phone number
3. Copy generated code
4. WhatsApp → Linked Devices
5. Link with phone number
6. Paste the code

⏰ Code expires after 15 minutes
🔒 Keep your code private`;

        await reply(message);


        /* 🔥 CLICKABLE URL BUTTON + PREVIEW */
        await conn.sendMessage(from, {
            text: "🚀 *Open Pairing Service Instantly*",
            footer: "NYX MD Bot",
            buttons: [
                {
                    buttonId: "open_pair_site",
                    buttonText: { displayText: "🌐 Open Pairing Site" },
                    type: 2,
                    url: pairingURL
                }
            ],
            headerType: 0,
            contextInfo: {
                externalAdReply: {
                    title: "PAIRING SERVICE",
                    body: "Generate WhatsApp Session Code",
                    sourceUrl: pairingURL,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply(pairingURL);
    }
});



/* =================================================
   📱 QR INFO COMMAND
================================================= */
cmd({
    pattern: "pairqr",
    alias: ["qrcode", "scanqr"],
    react: "📱",
    desc: "QR pairing info",
    category: "tools",
    use: ".pairqr",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {

    const message = `╔════════════════════════════╗
║       📱 QR CODE INFO       ║
╚════════════════════════════╝

QR codes show only in terminal.

If not visible, use pairing link instead.`;

    await reply(message);


    /* 🔥 DIRECT LINK BUTTON */
    await conn.sendMessage(from, {
        text: "🔗 Use pairing link instead",
        buttons: [
            {
                buttonId: "open_pair_site",
                buttonText: { displayText: "🌐 Open Pairing Service" },
                type: 2,
                url: pairingURL
            }
        ],
        headerType: 0
    }, { quoted: mek });
});



/* =================================================
   ⛓️ LINK DEVICE GUIDE
================================================= */
cmd({
    pattern: "linkdevice",
    alias: ["adddevice", "connectdevice"],
    react: "⛓️",
    desc: "Device linking guide",
    category: "tools",
    use: ".linkdevice",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {

    const message = `╔═══
