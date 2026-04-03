const { cmd } = require("../command");
const axios = require("axios");

// T20-CLASSIC AI API Configuration
const CHATGPT_API = "https://arimuqnlsqzunbqovakc.supabase.co/functions/v1/whatsapp-chat";

// Store chatbot state and conversation history
const chatbotEnabled = new Map();
const lastReplyTime = new Map();
const conversationHistory = new Map();
const REPLY_INTERVAL = 10000;

// Function to get AI response
async function getAIResponse(user, message) {
    try {
        if (!conversationHistory.has(user)) {
            conversationHistory.set(user, []);
        }
        const history = conversationHistory.get(user);

        history.push({ role: "user", content: message });

        if (history.length > 10) {
            history.splice(0, history.length - 10);
        }

        const response = await axios.post(CHATGPT_API, {
            message: message,
            conversation_id: user
        }, {
            timeout: 60000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        let aiResponse = response.data?.reply || "Sorry, I'm having trouble responding right now.";

        if (typeof aiResponse !== "string") {
            aiResponse = String(aiResponse);
        }

        history.push({ role: "assistant", content: aiResponse });

        return aiResponse;

    } catch (error) {
        console.error("Chatbot AI error:", error.message);
        return "Sorry, I'm having trouble responding right now. Please try again later.";
    }
}

// Toggle chatbot command
cmd({
    pattern: "chatbot",
    alias: ["cb"],
    react: "🤖",
    desc: "Toggle AI chatbot for PM conversations",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    const user = sender.split('@')[0];
    const isGroup = from.endsWith('@g.us');

    if (isGroup) {
        return reply("❌ Chatbot can only be used in private messages.");
    }

    const current = chatbotEnabled.get(user) || false;
    chatbotEnabled.set(user, !current);

    if (!current) {
        conversationHistory.set(user, []);
        lastReplyTime.set(user, 0);
        reply("✅ *T20-CLASSIC AI Chatbot Enabled*\n\nI will now respond to your messages in this private chat. Send me anything to start a conversation!\n\nUse .chatbot again to disable.");
    } else {
        reply("❌ *Chatbot Disabled*\n\nI will no longer auto-respond in this chat.");
    }
});

// Auto-reply handler
async function handleChatbotMessage(conn, mek, m, { from, sender, body }) {
    const user = sender.split('@')[0];
    const isGroup = from.endsWith('@g.us');

    if (isGroup || !chatbotEnabled.get(user)) return;
    if (body.startsWith('.')) return;

    const now = Date.now();
    const lastReply = lastReplyTime.get(user) || 0;
    if (now - lastReply < REPLY_INTERVAL) return;

    const aiResponse = await getAIResponse(user, body);
    if (aiResponse) {
        await conn.sendMessage(from, { text: aiResponse }, { quoted: mek });
        lastReplyTime.set(user, now);
    }
}

module.exports.handleChatbotMessage = handleChatbotMessage;
