const { cmd } = require('../command');
const pluginSettings = require('../lib/pluginSettings');
const functions2 = require('../lib/functions2');
const config = require('../config');

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

async function toggleSetting({ conn, mek, m, from, args, reply, isGroup, isAdmins, sender }, key, prettyName) {
  if (!isGroup) return reply(`${prettyName} can only be toggled in groups.`);
  const allowed = isAdmins || _isOwnerJid(sender);
  if (!allowed) return reply('Only group admins or bot owners can change this setting.');

  if (!args || !args.length) return reply(`Usage: .${key} on|off  — add "global" as second arg to persist globally (owner only)
Examples:
.${key} on
.${key} off
.${key} global on`);

  // detect global flag at args[0] or args[1]
  let globalFlag = false;
  let modeArg = args[0];
  if (modeArg === 'global' && args[1]) {
    globalFlag = true;
    modeArg = args[1];
  } else if (args[1] === 'global') {
    globalFlag = true;
  }

  const val = (String(modeArg).toLowerCase() === 'on' || String(modeArg).toLowerCase() === 'true');

  if (globalFlag) {
    if (!_isOwnerJid(sender)) return reply('Only bot owner can change global settings.');
    try {
      await functions2.saveConfig(String(key).toUpperCase(), val ? 'true' : 'false');
      // update runtime config
      config[key.toUpperCase()] = val ? 'true' : 'false';
      return reply(`✅ Global ${prettyName} set to ${val ? 'ON' : 'OFF'}`);
    } catch (e) {
      console.error('Failed to save global setting', e);
      return reply('Failed to save global setting.');
    }
  }

  try {
    await pluginSettings.set(from, key, val);
    return reply(`${prettyName} for this group set to ${val ? 'ON' : 'OFF'}`);
  } catch (e) {
    console.error('Failed to set plugin setting', e);
    return reply('Failed to update group setting.');
  }
}

cmd({
  pattern: 'welcome',
  desc: 'Toggle welcome messages on/off for this group or globally',
  category: 'group',
  filename: __filename
}, async (conn, mek, m, extras) => {
  return toggleSetting({ conn, mek, m, ...extras }, 'welcome', 'Welcome messages');
});

cmd({
  pattern: 'goodbye',
  desc: 'Toggle goodbye messages on/off for this group or globally',
  category: 'group',
  filename: __filename
}, async (conn, mek, m, extras) => {
  return toggleSetting({ conn, mek, m, ...extras }, 'goodbye', 'Goodbye messages');
});

module.exports = {};
