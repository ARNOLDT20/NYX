const fs = require('fs');
const path = require('path');
const config = require('../config')
const { cmd, commands } = require('../command')

const AUTO_SETTINGS_FILE = path.join(process.cwd(), 'store', 'auto_settings.json');
const readAutoSettings = () => {
    try {
        if (!fs.existsSync(AUTO_SETTINGS_FILE)) return { typing: {}, recording: {}, global: {} };
        const data = fs.readFileSync(AUTO_SETTINGS_FILE, 'utf8');
        return JSON.parse(data || '{}');
    } catch (e) {
        return { typing: {}, recording: {}, global: {} };
    }
};

// Composing (Auto Typing)
cmd({
    on: "body"
},
    async (conn, mek, m, { from, body, isOwner }) => {
        try {
            const settings = readAutoSettings();
            const jid = from;
            // per-chat override > global setting > config
            const per = settings.typing && settings.typing[jid];
            const global = settings.global && settings.global.typing;
            const enabled = per ? per === 'true' : (global ? global === 'true' : config.AUTO_TYPING === 'true');
            if (enabled) {
                try { await conn.sendPresenceUpdate('composing', from); } catch (e) { }
            }
        } catch (e) {
            console.error('auto-typing error:', e);
        }
    });
