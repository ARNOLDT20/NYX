const { cmd } = require('../command');
const { getPrefix } = require('../lib/prefix');
const config = require('../config');

// This plugin handles user-specific prefix routing
// It modifies messages that start with user prefixes to use the default prefix

cmd({
    on: 'text',
    dontAddCommandList: true,
    priority: 100, // High priority to run before other handlers
    filename: __filename
}, async (conn, mek, m, { from, sender, body }) => {
    try {
        if (!body || !sender) return;

        const userId = sender.split('@')[0];
        const userPrefix = getPrefix(userId);
        const defaultPrefix = config.PREFIX;

        // If user has a custom prefix and message starts with it
        if (userPrefix !== defaultPrefix && body.startsWith(userPrefix)) {
            // Modify the message body to use default prefix
            const modifiedBody = body.replace(new RegExp(`^${userPrefix}`), defaultPrefix);

            // Update the message object
            if (mek.message.conversation) {
                mek.message.conversation = modifiedBody;
            }
            if (mek.message.extendedTextMessage) {
                mek.message.extendedTextMessage.text = modifiedBody;
            }

            // Update the processed message object
            m.body = modifiedBody;
            m.text = modifiedBody;

            // Continue processing with modified message
        }

    } catch (error) {
        console.error('UserPrefixHandler Error:', error);
    }
});