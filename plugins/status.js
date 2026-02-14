const fs = require('fs')
const config = require('../config')
const { cmd } = require('../command')

/*
=====================================
   STATUS POST COMMAND
   Send media → WhatsApp Status
=====================================
*/

cmd({
    pattern: "status",
    alias: ["poststatus", "story"],
    react: "📸",
    desc: "Post replied image/video to WhatsApp status",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, reply }) => {
    try {

        if (!isOwner)
            return reply("❌ Only bot owner can post status.")

        // Must reply to media
        if (!m.quoted)
            return reply("📸 Reply to an image or video.")

        const quoted = m.quoted
        const mime = quoted.mtype || quoted.mimetype || ""

        if (!mime)
            return reply("❌ Unsupported file.")

        reply("⏳ Uploading status...")

        // Download media
        const buffer = await quoted.download()

        // Send to status
        await conn.sendMessage(
            "status@broadcast",
            {
                [mime.startsWith("video") ? "video" : "image"]: buffer,
                caption: quoted.text || "🔥 Posted by bot",
            }
        )

        reply("✅ Status posted successfully!")

    } catch (e) {
        console.log(e)
        reply("❌ Failed to post status.")
    }
})
