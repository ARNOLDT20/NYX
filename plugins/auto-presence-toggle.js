const fs = require('fs');
const path = require('path');
const { cmd } = require('../command');
const config = require('../config');
const functions2 = require('../lib/functions2');

const AUTO_SETTINGS_DIR = path.join(process.cwd(), 'store');
const AUTO_SETTINGS_FILE = path.join(AUTO_SETTINGS_DIR, 'auto_settings.json');

function ensureSettingsPath() {
  try {
    if (!fs.existsSync(AUTO_SETTINGS_DIR)) fs.mkdirSync(AUTO_SETTINGS_DIR, { recursive: true });
    if (!fs.existsSync(AUTO_SETTINGS_FILE)) fs.writeFileSync(AUTO_SETTINGS_FILE, JSON.stringify({ typing: {}, recording: {}, global: {} }, null, 2));
  } catch (e) {
    console.error('auto-presence-toggle: failed to ensure settings file', e);
  }
}

function readAutoSettings() {
  try {
    ensureSettingsPath();
    const data = fs.readFileSync(AUTO_SETTINGS_FILE, 'utf8');
    return JSON.parse(data || '{}');
  } catch (e) {
    return { typing: {}, recording: {}, global: {} };
  }
}

function writeAutoSettings(settings) {
  try {
    ensureSettingsPath();
    fs.writeFileSync(AUTO_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
  } catch (e) {
    console.error('auto-presence-toggle: failed to write settings', e);
  }
}

function normalizeBool(value) {
  return value === true || String(value).toLowerCase() === 'true';
}

function getEffectiveStatus(type, jid) {
  const settings = readAutoSettings();
  const per = settings[type] && settings[type][jid];
  const global = settings.global && settings.global[type];
  if (per !== undefined) return normalizeBool(per);
  if (global !== undefined) return normalizeBool(global);
  if (type === 'typing') return config.AUTO_TYPING === 'true';
  if (type === 'recording') return config.AUTO_RECORDING === 'true';
  return false;
}

function getConfigKey(type) {
  if (type === 'typing') return 'AUTO_TYPING';
  if (type === 'recording') return 'AUTO_RECORDING';
  return null;
}

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

async function handleToggle({ conn, mek, m, from, args, reply, isGroup, sender, isAdmins }, type, prettyName) {
  if (!args || !args.length) return reply(`Usage: .${type} on|off|status (append "global" for owner/global setting)`);

  const arg0 = String(args[0] || '').toLowerCase();
  const arg1 = String(args[1] || '').toLowerCase();

  let globalFlag = false;
  let modeArg = arg0;
  if (arg0 === 'global' && arg1) {
    globalFlag = true;
    modeArg = arg1;
  } else if (arg1 === 'global') {
    globalFlag = true;
  }

  const isStatus = modeArg === 'status';
  if (isStatus) {
    const status = getEffectiveStatus(type, from);
    return reply(`✅ ${prettyName} is currently ${status ? 'ON' : 'OFF'} (this chat)`);
  }

  const enabled = modeArg === 'on' || modeArg === 'true';
  if (globalFlag) {
    if (!_isOwnerJid(sender)) return reply('❌ Only bot owner can change global settings.');

    const configKey = getConfigKey(type);
    if (configKey) {
      try {
        await functions2.saveConfig(configKey, enabled ? 'true' : 'false');
        config[configKey] = enabled ? 'true' : 'false';
        // Also update global override file so it matches
        const settings = readAutoSettings();
        settings.global = settings.global || {};
        settings.global[type] = enabled ? 'true' : 'false';
        writeAutoSettings(settings);
        return reply(`✅ Global ${prettyName} is now ${enabled ? 'ON' : 'OFF'}.`);
      } catch (e) {
        console.error('auto-presence-toggle: failed to set global setting', e);
        return reply('❌ Failed to update global setting.');
      }
    }
  }

  // Group/Chat override
  if (isGroup && !isAdmins && !_isOwnerJid(sender)) {
    return reply('❌ Only group admins or bot owner can change this setting.');
  }

  const settings = readAutoSettings();
  settings[type] = settings[type] || {};
  settings[type][from] = enabled ? 'true' : 'false';
  writeAutoSettings(settings);

  return reply(`✅ ${prettyName} for this chat is now ${enabled ? 'ON' : 'OFF'}.`);
}

cmd({
  pattern: 'autotyping',
  desc: 'Toggle auto typing presence (group/local/global)',
  category: 'group',
  filename: __filename
}, async (conn, mek, m, extras) => {
  return handleToggle({ ...extras, conn, mek, m }, 'typing', 'Auto typing');
});

cmd({
  pattern: 'autorecording',
  desc: 'Toggle auto recording presence (group/local/global)',
  category: 'group',
  filename: __filename
}, async (conn, mek, m, extras) => {
  return handleToggle({ ...extras, conn, mek, m }, 'recording', 'Auto recording');
});

module.exports = {};