const { cmd } = require('../command');
const config = require('../config');

// Export goodbye handler function
module.exports.handleGoodbye = async (conn, id, participants, groupMetadata) => {
    try {
        // Validation checks
        if (!conn || !id || !participants || !groupMetadata) {
            console.error('❌ Invalid parameters in handleGoodbye:', { conn: !!conn, id: !!id, participants: !!participants, groupMetadata: !!groupMetadata });
            return;
        }

        if (config.GOODBYE !== 'true') return;

        // Ensure participants is an array
        if (!Array.isArray(participants)) {
            console.error('❌ Participants is not an array:', typeof participants);
            return;
        }

        // Ensure groupMetadata exists and has participants
        if (!groupMetadata.participants || !Array.isArray(groupMetadata.participants)) {
            console.error('❌ Group metadata is invalid');
            return;
        }

        const groupName = groupMetadata.subject || 'Group';

        // Send goodbye messages concurrently for faster response
        const sendPromises = participants.map(async (participant) => {
            try {
                if (!participant || typeof participant !== 'string') {
                    console.warn('⚠️ Invalid participant:', participant);
                    return;
                }

                const userName = (await conn.getName(participant)) || 'Member';
                const memberNumber = participant.replace('@s.whatsapp.net', '');

                if (!memberNumber || memberNumber.length === 0) {
                    console.warn('⚠️ Invalid member number extracted');
                    return;
                }

                let goodbyeMsg = config.GOODBYE_MESSAGE || `Goodbye ${userName}.\nWe now have ${groupMetadata.participants.length} members remaining.\n\nHope to see you again!`;

                if (config.GOODBYE_MESSAGE && typeof config.GOODBYE_MESSAGE === 'string') {
                    goodbyeMsg = config.GOODBYE_MESSAGE
                        .replace(/{name}/g, userName)
                        .replace(/{number}/g, memberNumber)
                        .replace(/{members}/g, String(groupMetadata.participants.length))
                        .replace(/{group}/g, groupName);
                }

                if (!goodbyeMsg || goodbyeMsg.length === 0) {
                    console.warn('⚠️ Goodbye message is empty');
                    return;
                }

                // Mention the departing user for clarity
                await conn.sendMessage(id, { text: goodbyeMsg }, { contextInfo: { mentionedJid: [participant] } });
                console.log(`✅ Goodbye message queued for ${userName} in ${groupName}`);
            } catch (err) {
                console.error('❌ Error sending goodbye message for participant:', err && err.message ? err.message : err);
            }
        });

        await Promise.allSettled(sendPromises);
    } catch (err) {
        console.error('❌ Error in goodbye handler:', err.message);
        console.error('Stack trace:', err.stack);
    }
};

// Command to set custom goodbye message
cmd({
    pattern: "setgoodbye",
    desc: "Set a custom goodbye message",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, q, isAdmins, isGroup, reply }) => {
    if (!isGroup) return reply("❌ This command can only be used in groups!");
    if (!isAdmins) return reply("❌ You must be a group admin to set goodbye messages!");

    if (!q) return reply(`📝 *Custom Goodbye Message Setup*

Use these placeholders:
• {name} - Member name
• {number} - Member number
• {members} - Remaining members
• {group} - Group name

✅ *Example:*
.setgoodbye Goodbye {name}! 👋
We had fun together!

📌 *Usage:*
.setgoodbye <your custom message>`);

    config.GOODBYE_MESSAGE = q;
    return reply(`✅ *Goodbye message updated!*

📝 Custom message:
${q}`);
});
