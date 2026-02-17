const { cmd } = require('../command');
const pluginSettings = require('../lib/pluginSettings');

// Handler: detects mass mentions / status mentions and deletes them when enabled for the group
cmd({ on: 'body' }, async (conn, m, store, {
  from,
  body,
  isGroup,
  isAdmins,
  isBotAdmins,
  reply,
  sender
}) => {
  try {
    if (!isGroup) return;

    // Respect admins
    if (isAdmins) return;

    // Check per-group toggle
    let enabled = false;
    try {
      const override = await pluginSettings.get(from, 'mention_ban');
      if (override !== undefined) enabled = (override === true || String(override) === 'true' || String(override).toLowerCase() === 'on');
    } catch (e) {
      console.error('mention-ban: error reading plugin setting', e);
    }
    if (!enabled) return;

    const msg = m.message || {};
    // Collect mentioned JIDs from possible places
    let mentioned = [];
    try {
      if (msg.extendedTextMessage && msg.extendedTextMessage.contextInfo && msg.extendedTextMessage.contextInfo.mentionedJid) mentioned = msg.extendedTextMessage.contextInfo.mentionedJid;
      else if (msg.buttonsResponseMessage && msg.buttonsResponseMessage.contextInfo && msg.buttonsResponseMessage.contextInfo.mentionedJid) mentioned = msg.buttonsResponseMessage.contextInfo.mentionedJid;
      else if (msg.templateButtonReplyMessage && msg.templateButtonReplyMessage.contextInfo && msg.templateButtonReplyMessage.contextInfo.mentionedJid) mentioned = msg.templateButtonReplyMessage.contextInfo.mentionedJid;
    } catch (e) {
      mentioned = [];
    }

    const text = (body || '').toString().toLowerCase();

    // Conditions that qualify as forbidden mention:
    // - mentions include status@broadcast
    // - message contains '@all' or 'status@broadcast'
    // - mentioned list is large (over 6 mentions) — heuristic for mass-mention
    const isStatusMention = mentioned.includes('status@broadcast') || text.includes('status@broadcast');
    const isAllKeyword = text.includes('@all') || text.includes('@everyone');
    const isMassMention = (Array.isArray(mentioned) && mentioned.length >= 6);

    if (!(isStatusMention || isAllKeyword || isMassMention)) return;

    // Attempt to delete the offending message
    try {
      const deleteKey = { remoteJid: from, fromMe: false, id: m.key && m.key.id ? m.key.id : (m.id || ''), participant: m.key && m.key.participant ? m.key.participant : (m.participant || undefined) };
      await conn.sendMessage(from, { delete: deleteKey });
    } catch (e) {
      try { await conn.sendMessage(from, { delete: m.key }); } catch (err) { console.error('mention-ban: delete failed', err); }
    }

    // Notify the sender
    try {
      await conn.sendMessage(from, { text: `⚠️ @${sender.split('@')[0]} Mentioning the group or status is not allowed here. Please avoid mass mentions.`, mentions: [sender] }, { quoted: m });
    } catch (e) {
      try { reply(`⚠️ Mentioning the group is not allowed here.`); } catch (err) { }
    }

  } catch (err) {
    console.error('mention-ban handler error:', err);
  }
});

// Command: toggle mention-ban per group (group admins only)
cmd({
  pattern: 'mentionban',
  desc: 'Toggle mention-ban in this group (admins only)',
  category: 'group',
  filename: __filename
}, async (conn, mek, m, { from, args, isGroup, isAdmins, reply, sender }) => {
  try {
    if (!isGroup) return reply('❌ This command can only be used in groups.');
    if (!isAdmins) return reply('❌ Only group admins can toggle this setting.');

    if (!args || !args.length) return reply('Usage: .mentionban on|off');
    const val = String(args[0]).toLowerCase();
    const enabled = (val === 'on' || val === 'true');

    await pluginSettings.set(from, 'mention_ban', enabled);
    return reply(`✅ Mention-ban for this group is now ${enabled ? 'ON' : 'OFF'}.`);
  } catch (e) {
    console.error('mentionban command error:', e);
    return reply('⚠️ Failed to update setting.');
  }
});

module.exports = {};
