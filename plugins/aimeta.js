const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "metaai",
    alias: ["nyxai", "meta", "ai"],
    react: "🤖",
    desc: "Talk with Meta AI",
    category: "ai",
    use: '.metaai <your question>',
    filename: __filename
},
    async (conn, mek, m, { from, q, reply }) => {
        try {
            if (!q) return reply("❌ Please provide a question to ask Meta AI.\n\nExample: .metaai What is the capital of France?");

            // React: Processing
            await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

            // Show "typing" presence
            await conn.sendPresenceUpdate("composing", from);

            // Fetch AI response
            const { data } = await axios.get(`https://apis.davidcyriltech.my.id/ai/metaai?text=${encodeURIComponent(q)}`, { timeout: 30000 });

            if (!data.success || !data.response) {
                await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
                return reply("❌ Meta AI failed to respond. Try again later.");
            }

            // React: Success
            await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

            // Reply with AI message
            await reply(`💬 *Meta AI:* ${data.response}`);

        } catch (e) {
            console.error("MetaAI Error:", e.message);
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            reply(`❌ Error: ${e.message || "An error occurred while talking to Meta AI."}`);
        }
    });
