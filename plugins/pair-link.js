const { cmd, commands } = require('../command');

cmd({
    pattern: "pairlink",
    alias: ["genlink", "paircode", "devicelink"],
    react: "🔗",
    desc: "Get pairing link for connecting new devices to the bot",
    category: "owner",
    use: ".pairlink",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, senderNumber, reply, sender }) => {
    try {
        // Check if user is owner
        const config = require('../config');
        const ownerNumbers = [config.OWNER_NUMBER, config.OWNER_NUMBER2].filter(n => n);
        
        if (!ownerNumbers.includes(senderNumber)) {
            return await reply("❌ Only the bot owner can use this command!");
        }

        const pairingURL = "https://queen-jusmy-pair.onrender.com/";

        const message = `
╔══════════════════════════════════╗
║    🔗 PAIRING LINK GENERATOR 🔗   ║
╚══════════════════════════════════╝

*🌐 Visit the pairing service:*

${pairingURL}

*📱 How to Use:*
1. Click or visit the link above
2. Select your WhatsApp account option
3. Enter your phone number when prompted
4. Wait for the pairing code to generate
5. Copy the code from the website
6. Open WhatsApp on your phone
7. Go to: Settings → Linked Devices
8. Tap "Link a device"
9. Select "Link with a phone number"
10. Enter your phone number
11. Paste the code when prompted

*⏰ Important:*
• Keep the code private and secure
• Code expires after 15 minutes
• Only use on trusted devices
• Delete sensitive messages after use

*🔒 Security Tips:*
• Never share your pairing code
• Don't leave it visible on your screen
• Logout unused devices immediately
• Change your WhatsApp password regularly

*📞 Service:* Queen Jusmy Pair Service
*Created:* ${new Date().toLocaleString()}`;

        await reply(message);

        // Send clickable button/link message
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await conn.sendMessage(from, {
            text: "🔗 *Click here to visit:*\n" + pairingURL,
            contextInfo: {
                externalAdReply: {
                    title: "🔗 Pairing Service",
                    body: "Get your Session ID",
                    mediaType: 1,
                    sourceUrl: pairingURL,
                    thumbnail: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
                }
            }
        });

    } catch (error) {
        console.error("Pair link error:", error);
        const pairingURL = "https://queen-jusmy-pair.onrender.com/";
        
        await reply(`╔══════════════════════════════════╗
║    🔗 PAIRING LINK GENERATOR 🔗   ║
╚══════════════════════════════════╝

*Quick Access:*
${pairingURL}

*Cannot load full details, but you can visit the link above directly.*`);
    }
});

cmd({
    pattern: "pairqr",
    alias: ["qrcode", "scanqr"],
    react: "📱",
    desc: "Get QR code for pairing (if available)",
    category: "owner",
    use: ".pairqr",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, senderNumber, reply }) => {
    try {
        // Check if user is owner
        const config = require('../config');
        const ownerNumbers = [config.OWNER_NUMBER, config.OWNER_NUMBER2].filter(n => n);
        
        if (!ownerNumbers.includes(senderNumber)) {
            return await reply("❌ Only the bot owner can use this command!");
        }

        await reply(`╔════════════════════════════╗
║     📱 QR CODE INFO 📱      ║
╚════════════════════════════╝

⚠️ QR Code display requires terminal access.

If the bot was started in a terminal, a QR code should have appeared there for device pairing.

*Alternative Methods:*
• Use \`.pairlink\` command for pairing code
• Use \`.pair\` command for alternative services
• Re-scan QR in terminal if connection is lost

📝 Note: In production environments, QR codes may not be visible. Use the pairing code method instead.`);

    } catch (error) {
        console.error("QR code command error:", error);
        await reply("❌ Error retrieving QR code information.");
    }
});

cmd({
    pattern: "linkdevice",
    alias: ["adddevice", "connectdevice"],
    react: "⛓️",
    desc: "Info on linking devices to the bot",
    category: "owner",
    use: ".linkdevice",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, senderNumber, reply }) => {
    try {
        const config = require('../config');
        const ownerNumbers = [config.OWNER_NUMBER, config.OWNER_NUMBER2].filter(n => n);
        
        if (!ownerNumbers.includes(senderNumber)) {
            return await reply("❌ Only the bot owner can use this command!");
        }

        const message = `
╔═══════════════════════════════════╗
║    ⛓️  DEVICE LINKING GUIDE ⛓️    ║
╚═══════════════════════════════════╝

*📋 Method 1: Using Pairing Code*
1. Run: \`.pairlink\`
2. Copy the generated pairing code
3. Open WhatsApp on your phone
4. Go to: Settings → Linked Devices
5. Tap: "Link a device"
6. Select: "Link with a phone number"
7. Enter your phone number
8. Paste the pairing code when prompted

*📋 Method 2: Using QR Code*
1. The bot shows QR in terminal (if visible)
2. Open WhatsApp on your phone
3. Go to: Settings → Linked Devices
4. Tap: "Link a device"
5. Scan the QR code displayed

*📋 Method 3: Alternative Service*
1. Run: \`.pair <phonenumber>\`
2. Follow the instructions provided

*⏱️ Important Notes:*
• Pairing codes expire after 15 minutes
• Only one device link at a time
• QR codes work only on the same network
• Keep your pairing code private

*🔒 Security Tips:*
• Never share pairing codes
• Logout unused devices immediately
• Check linked devices regularly
• Use strong account passwords

Need help? Check bot logs for details.`;

        await reply(message);

    } catch (error) {
        console.error("Link device info error:", error);
        await reply("❌ Error retrieving device linking information.");
    }
});
