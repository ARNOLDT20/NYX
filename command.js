var commands = [];
const config = require('./config');

function _normalizeJid(num) {
    if (!num) return num;
    if (num.includes('@')) return num;
    return `${num}@s.whatsapp.net`;
}

function _isOwnerJid(jid) {
    if (!jid) return false;
    const owners = [config.OWNER_NUMBER, config.OWNER_NUMBER2, config.DEV].filter(Boolean).map(_normalizeJid);
    return owners.includes(jid);
}

function cmd(info, func) {
    var data = info;
    // wrap provided function to enforce MODE / PUBLIC_MODE restrictions
    const original = func;
    data.function = async function () {
        try {
            const args = Array.from(arguments);
            const meta = args[3] || {};
            const sender = meta.sender || meta.from || (args[2] && args[2].sender) || null;
            const isPrivateMode = (config.MODE === 'private' || String(config.PUBLIC_MODE) === 'false');
            if (isPrivateMode && sender && !_isOwnerJid(sender)) {
                const reply = meta.reply;
                if (typeof reply === 'function') return reply('❌ Bot is in private mode — only the owner may use commands.');
                return;
            }
        } catch (e) {
            console.error('Error in command wrapper:', e);
        }
        return original.apply(this, arguments);
    };
    if (!data.dontAddCommandList) data.dontAddCommandList = false;
    if (!info.desc) info.desc = '';
    if (!data.fromMe) data.fromMe = false;
    if (!info.category) data.category = 'misc';
    if (!info.filename) data.filename = "Not Provided";
    commands.push(data);
    return data;
}
module.exports = {
    cmd,
    AddCommand: cmd,
    Function: cmd,
    Module: cmd,
    commands,
};
