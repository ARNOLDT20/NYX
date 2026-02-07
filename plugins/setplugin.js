const { cmd } = require('../command');
const pluginSettings = require('../lib/pluginSettings');
const config = require('../config');

cmd({
    pattern: 'setplugin',
    desc: 'Set plugin setting for this chat (admin/owner)',
    category: 'admin',
    filename: __filename
}, async (conn, mek, m, { from, args, reply, isGroup, isAdmins, isCreator, isOwner }) => {
    try {
        if (!isGroup) return reply('❌ This command is for groups only.');

        // Only group admins or bot owner may change group settings
        if (!isAdmins && !isCreator && !isOwner) return reply('❌ Only group admins or bot owner can change settings.');

        const key = (args && args[0]) ? args[0].toLowerCase() : '';
        const val = (args && args[1]) ? args[1].toLowerCase() : '';

        if (!key) return reply('Usage: .setplugin <welcome|goodbye|antilink|delete_links> <on|off>');
        if (!['welcome', 'goodbye', 'antilink', 'delete_links'].includes(key)) return reply('Unknown key. Supported: welcome, goodbye, antilink, delete_links');
        if (!['on', 'off', 'true', 'false'].includes(val)) return reply('Usage: .setplugin <key> <on|off>');

        const enabled = ['on', 'true'].includes(val);
        await pluginSettings.set(from, key, enabled);

        return reply(`✅ ${key} has been set to ${enabled ? 'ON' : 'OFF'} for this chat.`);
    } catch (err) {
        console.error(err);
        return reply('❌ Error while setting plugin option');
    }
});
