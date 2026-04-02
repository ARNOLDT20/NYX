const { cmd } = require("../command");
const axios = require("axios");

// ChatGPT API Configuration
const CHATGPT_API = "https://api.cinemind.name.ng/api/chatgpt";
const API_KEY = "Godszeal";

// Store conversation history for each user
const conversationHistory = new Map();

cmd({
    pattern: "chatgpt",
    alias: ["gpt", "ask", "ai"],
    react: "🤖",
    desc: "Chat with AI using ChatGPT",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(
                "❌ *Please provide a question or prompt.*\n\n" +
                "📝 *Example:* .chatgpt What is the capital of France?\n\n" +
                "💡 *Tip:* Use .aiinfo for more commands"
            );
        }

        // Send typing indicator
        await conn.sendPresenceUpdate('composing', from);

        // Show loading message
        await reply("🤖 *Processing your request...*\n⏳ AI is thinking...");

        // Get conversation history for this user
        let history = conversationHistory.get(from) || [];

        // Add user message to history
        history.push({ role: "user", content: q });

        // Keep only last 10 messages to avoid token limits
        if (history.length > 10) {
            history = history.slice(-10);
        }

        // Call ChatGPT API (POST method)
        const response = await axios.post(CHATGPT_API, {
            apikey: API_KEY,
            message: q,
            history: history
        }, {
            timeout: 60000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Extract response from API
        let responseText = "";

        if (response.data) {
            // Try different possible response formats
            responseText = response.data.response ||
                response.data.result ||
                response.data.message ||
                response.data.reply ||
                response.data.text ||
                response.data.answer ||
                response.data.data;

            // If no specific field found, try stringifying
            if (!responseText && typeof response.data === "string") {
                responseText = response.data;
            }
        }

        // Convert to string if needed
        if (responseText && typeof responseText !== "string") {
            responseText = JSON.stringify(responseText);
        }

        // Ensure responseText is a string before calling trim
        responseText = String(responseText || "").trim();

        if (!responseText) {
            return reply("❌ *API returned empty response.*\nPlease try again later.");
        }

        // Add AI response to history
        history.push({ role: "assistant", content: responseText });
        conversationHistory.set(from, history);

        // Format and send response
        const finalMessage = `
╭─────〔 🤖 *CHATGPT* 〕─────◆
│
💬 *Question:* ${q}
│
🎯 *Answer:* 
${responseText}
│
╰───────────────◆
📌 *Tip:* Reply with .resetai to clear history
      `.trim();

        await conn.sendMessage(from, { text: finalMessage }, { quoted: mek });

        // Send success reaction
        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });

    } catch (error) {
        console.error("ChatGPT Command Error:", error);

        let errorMessage = "❌ *Error:* ";

        if (error.code === 'ECONNABORTED') {
            errorMessage += "Request timeout. Please try again.";
        } else if (error.response) {
            errorMessage += `API Error (${error.response.status}). ${error.response.data?.error || "Please try again later."}`;
        } else if (error.request) {
            errorMessage += "No response from server. Check your connection.";
        } else {
            errorMessage += error.message;
        }

        reply(errorMessage);

        await conn.sendMessage(from, {
            react: { text: "❌", key: mek.key }
        });
    }
});

// Advanced mode with longer responses
cmd({
    pattern: "gpt2",
    alias: ["chatgpt2", "aipro"],
    react: "🚀",
    desc: "Chat with AI (Advanced mode - longer responses)",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(
                "🚀 *Advanced AI Mode*\n\n" +
                "📝 *Example:* .gpt2 Explain quantum physics in detail\n\n" +
                "✨ *Features:* Longer, more detailed responses"
            );
        }

        await conn.sendPresenceUpdate('composing', from);
        await reply("🚀 *Processing in advanced mode...*\n⏳ Generating detailed response...");

        // Call ChatGPT API with system prompt for detailed responses
        const detailedPrompt = `${q}\n\n(Please provide a detailed, comprehensive response with examples if possible)`;

        const response = await axios.post(CHATGPT_API, {
            apikey: API_KEY,
            message: detailedPrompt
        }, {
            timeout: 90000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        let responseText = "";

        if (response.data) {
            responseText = response.data.response ||
                response.data.result ||
                response.data.message ||
                response.data.reply ||
                response.data.text ||
                response.data.data;

            if (!responseText && typeof response.data === "string") {
                responseText = response.data;
            }
        }

        // Convert to string if needed
        if (responseText && typeof responseText !== "string") {
            responseText = JSON.stringify(responseText);
        }

        // Ensure responseText is a string
        responseText = String(responseText || "").trim();

        if (!responseText) {
            return reply("❌ *Failed to generate response.* Please try again.");
        }

        const finalMessage = `🚀 *ADVANCED AI RESPONSE*\n\n${responseText}\n\n━━━━━━━━━━━━━━\n💡 *Tip:* Use .gpt for faster responses`;

        await conn.sendMessage(from, { text: finalMessage }, { quoted: mek });

        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });

    } catch (error) {
        console.error("ChatGPT Advanced Error:", error);
        reply(`❌ *Error:* ${error.message || "Please try again later."}`);
    }
});

// Quick AI command
cmd({
    pattern: "gpt",
    alias: ["ai", "askai"],
    react: "💬",
    desc: "Quick AI chat (fast responses)",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("💬 *Quick AI*\n\nExample: .gpt What is AI?");

        await conn.sendPresenceUpdate('composing', from);

        const response = await axios.post(CHATGPT_API, {
            apikey: API_KEY,
            message: q
        }, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        let responseText = response.data?.response ||
            response.data?.result ||
            response.data?.message ||
            response.data?.reply ||
            response.data?.text ||
            response.data?.data ||
            "No response generated";

        // Convert to string if needed
        if (responseText && typeof responseText !== "string") {
            responseText = JSON.stringify(responseText);
        }

        responseText = String(responseText).trim();

        await reply(`💬 *AI:* ${responseText}`);

    } catch (error) {
        console.error("Quick AI error:", error);
        reply("❌ *Quick AI failed.* Please try .chatgpt instead.");
    }
});

// Creative content generator
cmd({
    pattern: "story",
    alias: ["poem", "write", "creative"],
    react: "✨",
    desc: "Generate creative content (stories, poems, etc.)",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(
                "✨ *Creative Content Generator*\n\n" +
                "📝 *Examples:*\n" +
                "• .story Write a story about a dragon\n" +
                "• .poem Write a poem about love\n" +
                "• .write Create a script for a comedy skit\n\n" +
                "💡 *Just tell me what to create!*"
            );
        }

        await reply("✨ *Creating your content...*\n🎨 AI is being creative...");

        const creativePrompt = `Create creative content based on: ${q}\n\nBe imaginative, engaging, and well-formatted.`;

        const response = await axios.post(CHATGPT_API, {
            apikey: API_KEY,
            message: creativePrompt
        }, {
            timeout: 60000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        let responseText = response.data?.response ||
            response.data?.result ||
            response.data?.message ||
            response.data?.reply ||
            response.data?.text ||
            response.data?.data;

        // Convert to string if needed
        if (responseText && typeof responseText !== "string") {
            responseText = JSON.stringify(responseText);
        }

        responseText = String(responseText || "").trim();

        if (!responseText) {
            return reply("❌ *Failed to generate content.* Please try again.");
        }

        const finalMessage = `
✨ *CREATIVE CONTENT* ✨

${responseText}

━━━━━━━━━━━━━━
🎨 *Generated by AI | NYX Bot*
        `.trim();

        await conn.sendMessage(from, { text: finalMessage }, { quoted: mek });

        await conn.sendMessage(from, {
            react: { text: "✨", key: mek.key }
        });

    } catch (error) {
        console.error("Creative error:", error);
        reply("❌ *Failed to generate creative content.* Please try again.");
    }
});

// Reset conversation history
cmd({
    pattern: "resetai",
    alias: ["clearai", "newchat", "resetgpt"],
    react: "🔄",
    desc: "Reset AI conversation history",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        if (conversationHistory.has(from)) {
            conversationHistory.delete(from);
            await reply("🔄 *AI conversation history reset!*\n\nStart a fresh conversation with .chatgpt");
        } else {
            await reply("🤖 *No active conversation history.*\n\nStart chatting with .chatgpt");
        }

        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });
    } catch (error) {
        console.error("Reset error:", error);
        reply(`❌ *Error:* ${error.message}`);
    }
});

// AI Info command
cmd({
    pattern: "aiinfo",
    alias: ["aiguide", "aidev"],
    react: "ℹ️",
    desc: "Get AI assistant information and commands",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const infoText = `
╭─────〔 🤖 *AI ASSISTANT* 〕─────◆
│
📌 *AVAILABLE COMMANDS:*
│
💬 *.chatgpt / .gpt* - Ask anything
│   Example: .gpt What is JavaScript?
│
🚀 *.gpt2 / .chatgpt2* - Advanced mode
│   Example: .gpt2 Explain blockchain
│
✨ *.story / .poem* - Creative content
│   Example: .story Write a short story
│
🔄 *.resetai* - Clear conversation history
│
📋 *.aiinfo* - Show this guide
│
━━━━━━━━━━━━━━
💡 *FEATURES:*
• Conversation memory (remembers context)
• Fast responses
• Creative content generation
• Multi-language support
│
╰───────────────◆
🎯 *Try it now:* .chatgpt Hello!
        `.trim();

        await reply(infoText);
    } catch (error) {
        console.error("AI Info error:", error);
        reply("❌ *Error loading AI info.*");
    }
});

// Handle replies to messages
cmd({
    pattern: "ask",
    alias: ["replyai", "about"],
    react: "💭",
    desc: "Ask AI about a quoted message",
    category: "ai",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        const quotedMsg = m.quoted;

        if (!quotedMsg) {
            return reply(
                "💭 *Ask about a message*\n\n" +
                "Reply to any message with .ask to ask AI about it!\n\n" +
                "📝 *Example:*\n" +
                "1. Reply to a message\n" +
                "2. Type: .ask What do you think about this?"
            );
        }

        if (!q || q.trim() === '') {
            return reply("❌ *Please ask a question about the quoted message!*");
        }

        // Get the quoted message text
        let quotedText = "";

        if (quotedMsg.message?.conversation) {
            quotedText = quotedMsg.message.conversation;
        } else if (quotedMsg.message?.extendedTextMessage?.text) {
            quotedText = quotedMsg.message.extendedTextMessage.text;
        } else if (quotedMsg.message?.imageMessage?.caption) {
            quotedText = quotedMsg.message.imageMessage.caption;
        } else {
            quotedText = "[Non-text message]";
        }

        const question = q.trim();
        const fullPrompt = `Context: "${quotedText}"\n\nQuestion about this context: ${question}\n\nPlease answer based on the context provided.`;

        await reply("💭 *Analyzing message...*");

        const response = await axios.post(CHATGPT_API, {
            apikey: API_KEY,
            message: fullPrompt
        }, {
            timeout: 60000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        let responseText = response.data?.response ||
            response.data?.result ||
            response.data?.message ||
            response.data?.reply ||
            response.data?.text ||
            response.data?.data;

        // Convert to string if needed
        if (responseText && typeof responseText !== "string") {
            responseText = JSON.stringify(responseText);
        }

        responseText = String(responseText || "").trim();

        if (!responseText) {
            return reply("❌ *Failed to analyze message.* Please try again.");
        }

        const formattedResponse = `
💭 *AI RESPONSE*

📝 *Context:* "${quotedText.substring(0, 100)}${quotedText.length > 100 ? '...' : ''}"

❓ *Question:* ${question}

🤖 *Answer:* ${responseText}
        `.trim();

        await reply(formattedResponse);

        await conn.sendMessage(from, {
            react: { text: "✅", key: mek.key }
        });

    } catch (error) {
        console.error("Ask error:", error);
        reply(`❌ *Error:* ${error.message}`);
    }
});