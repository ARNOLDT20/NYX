const { cmd, commands } = require('../command');

const pairingURL = "https://queen-jusmy-pair.onrender.com/";


/* ===============================================
   🔥 Helper → Send Visit Site Button Smartly
   Private = Button
   Group   = Text link
================================================ */
async function sendVisitButton(conn, from, mek, isGroup, text = "🌐 Open Pairing Service") {

    if (isGroup) {
        return conn.sendMessage(from, {
            text: `${text}\n\n🔗 ${pairingURL}`
        }, { quoted: mek });
    }

    return conn.sendMessage(from, {
        text: "👇 Tap below to continue",
        footer: "NYX MD Bot",
        buttons: [
            {
                buttonId: "visit_site",
                buttonText: { displayText: "🌐 Visit Site" },
                type: 2,
                url: pairingURL
            }
        ],
        headerType: 0,
        contextInfo: {
            externalAdReply: {
                title: "PAIRING SERVICE",
                body: "Generate WhatsApp Pair Code Instantly",
                sourceUrl: pairingURL,
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: mek });
}



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
}, async (conn, mek, m, { from, reply, isGroup }) => {

    try {

        const message = `╔══════════════════════════════════╗
║    🔗 PAIRING LINK GENERATOR 🔗   ║
╚══════════════════════════════════╝

📱 *Steps:*
1. Tap Visit Site
2. Enter phone number
3. Copy pairing code
4. WhatsApp → Linked Devices
5. Paste the code

⏰ Expires in 15 minutes
🔒 Keep private`;

        await reply(message);

        await sendVisitButton(conn, from, mek, isGroup, "🚀 Open Pairing Service");

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
}, async (conn, mek, m, { from, reply, isGroup }) => {

    const message = `╔════════════════════════════╗
║       📱 QR CODE INFO       ║
╚════════════════════════════╝

QR only shows in terminal.

Use pairing link instead 👇`;

    await reply(message);

    await sendVisitButton(conn, from, mek, isGroup, "🔗 Use Pairing Service");
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
}, async (conn, mek, m, { from, reply, isGroup }) => {

    const message = `╔═════════════════════════════════╗
║   ⛓️ DEVICE LINKING GUIDE ⛓️    ║
╚═════════════════════════════════╝

📋 Steps:
• Tap Visit Site
• Generate code
• WhatsApp → Linked Devices
• Link with phone number
• Paste code

✅ Done in 10 seconds`;

    await reply(message);

    await sendVisitButton(conn, from, mek, isGroup, "⚡ Quick Access");
});
