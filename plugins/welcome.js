const { cmd } = require('../command');
const config = require('../config');

// Export welcome handler function
module.exports.handleWelcome = async (conn, id, participants, groupMetadata) => {
    try {
        // Validation checks
        if (!conn || !id || !participants || !groupMetadata) {
            console.error('❌ Invalid parameters in handleWelcome:', { conn: !!conn, id: !!id, participants: !!participants, groupMetadata: !!groupMetadata });
            return;
        }

        if (config.WELCOME !== 'true') return;

        // Ensure participants is an array and normalize participant IDs
        if (!Array.isArray(participants)) {
            console.error('❌ Participants is not an array:', typeof participants);
            return;
        }

        // Normalize participants to JID strings if provided as objects
        participants = participants.map(p => {
            if (!p) return p;
            if (typeof p === 'string') return p;
            if (p.id) return p.id;
            if (p.jid) return p.jid;
            return String(p);
        }).filter(Boolean);

        // Ensure groupMetadata exists and has participants
        if (!groupMetadata.participants || !Array.isArray(groupMetadata.participants)) {
            console.error('❌ Group metadata is invalid');
            return;
        }

        const groupName = groupMetadata.subject || 'Group';

        // Send welcome messages concurrently for faster response
        const sendPromises = participants.map(async (participant) => {
            try {
                if (!participant || typeof participant !== 'string') {
                    console.warn('⚠️ Invalid participant:', participant);
                    return;
                }

                const userName = (await conn.getName(participant)) || 'New Member';
                const memberNumber = (participant || '').toString().replace('@s.whatsapp.net', '');

                if (!memberNumber || memberNumber.length === 0) {
                    console.warn('⚠️ Invalid member number extracted');
                    return;
                }

                let welcomeMsg = config.WELCOME_MESSAGE || `Welcome ${userName} to ${groupName}!\nYou are member #${groupMetadata.participants.length}.\n\nPlease introduce yourself and follow the group rules.`;

                if (config.WELCOME_MESSAGE && typeof config.WELCOME_MESSAGE === 'string') {
                    welcomeMsg = config.WELCOME_MESSAGE
                        .replace(/{name}/g, userName)
                        .replace(/{number}/g, memberNumber)
                        .replace(/{members}/g, String(groupMetadata.participants.length))
                        .replace(/{group}/g, groupName);
                }

                if (!welcomeMsg || welcomeMsg.length === 0) {
                    console.warn('⚠️ Welcome message is empty');
                    return;
                }

                // Mention the new user for visibility
                await conn.sendMessage(id, { text: welcomeMsg, mentions: [participant] });
                console.log(`✅ Welcome message queued for ${userName} in ${groupName}`);
            } catch (err) {
                console.error('❌ Error sending welcome message for participant:', err && err.message ? err.message : err);
            }
        });

        await Promise.allSettled(sendPromises);
    } catch (err) {
        console.error('❌ Error in welcome handler:', err.message);
        console.error('Stack trace:', err.stack);
    }
};

// Command to set custom welcome message
cmd({
    pattern: "setwelcome",
    desc: "Set a custom welcome message",
    category: "other",
    filename: __filename
}, async (conn, mek, m, { from, args, q, isAdmins, isGroup, reply }) => {
    if (!isGroup) return reply("❌ This command can only be used in groups!");
    if (!isAdmins) return reply("❌ You must be a group admin to set welcome messages!");

    if (!q) return reply(`📝 *Custom Welcome Message Setup*

Use these placeholders:
• {name} - Member name
• {number} - Member number
• {members} - Total members
• {group} - Group name

✅ *Example:*
.setwelcome Welcome {name}! 🎉
You are member #{members} in {group}

📌 *Usage:*
.setwelcome <your custom message>`);

    config.WELCOME_MESSAGE = q;
    return reply(`✅ *Welcome message updated!*

📝 Custom message:
${q}`);
});
