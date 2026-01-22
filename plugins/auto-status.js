const { cmd } = require('../command');
const config = require('../config');

// Auto-handle status updates: view and react with random emoji
cmd({ on: 'body' }, async (conn, mek, m, { from }) => {
    try {
        if (!mek || !mek.key) return;
        if (mek.key.remoteJid !== 'status@broadcast') return;

        // Mark status as seen if enabled
        if (config.AUTO_STATUS_SEEN === 'true') {
            try { await conn.readMessages([mek.key]); } catch (e) { }
        }

        // React with a random emoji if enabled
        if (config.AUTO_STATUS_REACT === 'true') {
            const emojis = ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🚩', '🥰', '💐', '😎', '🤎', '✅', '😁', '😄', '🌸', '🌟', '🎉', '👏'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            try {
                const botJid = await conn.decodeJid(conn.user.id);
                await conn.sendMessage(mek.key.remoteJid, { react: { text: randomEmoji, key: mek.key } }, { statusJidList: [mek.key.participant, botJid] });
            } catch (e) { }
        }
    } catch (err) {
        console.error('auto-status plugin error:', err && (err.message || err));
    }
});
