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

const validActions = ['warn', 'delete_warn', 'delete_only', 'delete_kick'];

cmd({
  pattern: 'antilinkaction',
  desc: 'Set anti-link action (warn/delete_warn/delete_only/delete_kick)',
  category: 'owner',
  filename: __filename
}, async (conn, mek, m, { from, args, reply, isGroup, isAdmins, sender, isCreator, isOwner }) => {
  try {
    const action = (args && args[0]) ? String(args[0]).toLowerCase() : 'status';

    const getCurrentAction = async () => {
      const globalAction = (config.ANTI_LINK_ACTION || 'delete_warn').toString().toLowerCase();
      let groupAction;
      try {
        groupAction = await pluginSettings.get(from, 'antilink_action');
      } catch (e) {
        console.error('antilinkaction: failed to read override', e);
      }
      return {
        global: globalAction,
        group: groupAction ? String(groupAction).toLowerCase() : null
      };
    };

    if (!action || action === 'status') {
      const current = await getCurrentAction();
      const replyText = `Anti-link action status:\n• Global: ${current.global}${current.group ? `\n• This group override: ${current.group}` : ''}`;
      return reply(replyText);
    }

    if (action === 'reset' || action === 'default') {
      if (!isGroup) return reply('This command can only be used in groups to reset the group override.');
      if (!isAdmins && !_isOwnerJid(sender)) return reply('Only group admins or bot owner can reset group override.');

      const all = await pluginSettings.readAll();
      if (all[from] && all[from].hasOwnProperty('antilink_action')) {
        delete all[from].antilink_action;
        await pluginSettings.writeAll(all);
      }
      return reply('✅ Anti-link action override has been reset for this group.');
    }

    // Allow global setting (owner only) with keyword 'global'
    if (action === 'global') {
      const target = (args[1] || '').toLowerCase();
      if (!target) return reply(`Usage: .antilinkaction global <${validActions.join('|')}>`);
      if (!validActions.includes(target)) return reply(`Invalid action. Valid values: ${validActions.join(', ')}`);
      if (!isCreator && !isOwner) return reply('❌ Only the bot owner can change global settings.');
      try {
        await functions2.saveConfig('ANTI_LINK_ACTION', target);
        config.ANTI_LINK_ACTION = target;
        return reply(`✅ Global anti-link action set to: ${target}`);
      } catch (e) {
        console.error('antilinkaction: failed to save global action', e);
        return reply('❌ Failed to update global anti-link action.');
      }
    }

    if (!validActions.includes(action)) {
      return reply(`Invalid action. Valid values: ${validActions.join(', ')}`);
    }

    // Group override
    if (!isGroup) return reply('This command can only be used in groups to set a group-specific action.');
    if (!isAdmins && !_isOwnerJid(sender)) return reply('Only group admins or bot owner can set group action.');

    await pluginSettings.set(from, 'antilink_action', action);
    return reply(`✅ Anti-link action for this group has been set to: ${action}`);
  } catch (err) {
    console.error('antilinkaction command error:', err);
    return reply('❌ Error while processing anti-link action command.');
  }
});

module.exports = {};