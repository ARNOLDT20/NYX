const { cmd } = require('../command');
const config = require("../config");
const pluginSettings = require('../lib/pluginSettings');
const fs = require('fs').promises;
const path = require('path');

// Anti-Bad Words System
cmd({
  'on': "body"
}, async (conn, m, store, {
  from,
  body,
  isGroup,
  isAdmins,
  isBotAdmins,
  reply,
  sender
}) => {
  try {
    const badWords = ["wtf", "mia", "xxx", "fuck", 'sex', "huththa", "pakaya", 'ponnaya', "hutto"];

    // Skip if not a group or bot is not admin
    if (!isGroup || !isBotAdmins) {
      return;
    }

    // Allow admins to send bad words without penalty
    if (isAdmins) {
      return;
    }

    const messageText = body.toLowerCase();
    const containsBadWord = badWords.some(word => messageText.includes(word));

    if (containsBadWord && config.ANTI_BAD_WORD === 'true') {
      await conn.sendMessage(from, { 'delete': m.key }, { 'quoted': m });
      await conn.sendMessage(from, { 'text': "🚫 ⚠️ BAD WORDS NOT ALLOWED ⚠️ 🚫" }, { 'quoted': m });
    }
  } catch (error) {
    console.error(error);
    reply("An error occurred while processing the message.");
  }
});

// Anti-Link System
// Generic and specific link patterns (no global flag to avoid lastIndex issues)
const linkPatterns = [
  /(?:https?:\/\/|www\.)\S+/i, // any http(s) or www link
  /https?:\/\/(?:chat\.whatsapp\.com|wa\.me)\/\S+/i,
  /^https?:\/\/(www\.)?whatsapp\.com\/channel\/([a-zA-Z0-9_-]+)$/i,
  /https?:\/\/(?:t\.me|telegram\.me)\/\S+/i,
  /https?:\/\/(?:www\.)?youtube\.com\/\S+/i,
  /https?:\/\/youtu\.be\/\S+/i,
  /https?:\/\/(?:www\.)?facebook\.com\/\S+/i,
  /https?:\/\/fb\.me\/\S+/i,
  /https?:\/\/(?:www\.)?instagram\.com\/\S+/i,
  /https?:\/\/(?:www\.)?twitter\.com\/\S+/i,
  /https?:\/\/(?:www\.)?tiktok\.com\/\S+/i,
  /https?:\/\/(?:www\.)?linkedin\.com\/\S+/i,
  /https?:\/\/(?:www\.)?snapchat\.com\/\S+/i,
  /https?:\/\/(?:www\.)?pinterest\.com\/\S+/i,
  /https?:\/\/(?:www\.)?reddit\.com\/\S+/i,
  /https?:\/\/ngl\/\S+/i,
  /https?:\/\/(?:www\.)?discord\.com\/\S+/i,
  /https?:\/\/(?:www\.)?twitch\.tv\/\S+/i,
  /https?:\/\/(?:www\.)?vimeo\.com\/\S+/i,
  /https?:\/\/(?:www\.)?dailymotion\.com\/\S+/i,
  /https?:\/\/(?:www\.)?medium\.com\/\S+/i
];

cmd({
  'on': "body"
}, async (conn, m, store, {
  from,
  body,
  sender,
  isGroup,
  isAdmins,
  isBotAdmins,
  reply
}) => {
  try {
    // Skip if not a group or bot is not admin
    if (!isGroup || !isBotAdmins) return;

    // Check global setting and per-group override for anti-link
    let antiLinkEnabled = config.ANTI_LINK === 'true';
    try {
      const override = await pluginSettings.get(from, 'antilink');
      if (override !== undefined) antiLinkEnabled = (override === true || String(override) === 'true' || String(override).toLowerCase() === 'on');
    } catch (err) {
      console.error('Error reading plugin setting (antilink):', err);
    }
    if (!antiLinkEnabled) return;

    // Allow admins to send links without penalty
    if (isAdmins) return;

    // Normalize message text to cover captions and extended messages
    let text = (body || '').toString();
    const msg = m.message || {};
    if (!text || text.length === 0) {
      if (msg.conversation) text = msg.conversation;
      else if (msg.extendedTextMessage && msg.extendedTextMessage.text) text = msg.extendedTextMessage.text;
      else if (msg.imageMessage && msg.imageMessage.caption) text = msg.imageMessage.caption;
      else if (msg.videoMessage && msg.videoMessage.caption) text = msg.videoMessage.caption;
      else if (msg.documentMessage && msg.documentMessage.caption) text = msg.documentMessage.caption;
      else if (msg.buttonsResponseMessage && msg.buttonsResponseMessage.selectedButtonId) text = msg.buttonsResponseMessage.selectedButtonId;
      else if (msg.templateButtonReplyMessage && msg.templateButtonReplyMessage.selectedId) text = msg.templateButtonReplyMessage.selectedId;
      else text = '';
    }

    const containsLink = linkPatterns.some(pattern => pattern.test(text || ''));

    if (!containsLink) return;

    // Respect config.DELETE_LINKS or per-group override: if enabled, simply delete the message and skip warns
    let deleteOnly = String(config.DELETE_LINKS) === 'true';
    try {
      const dlOverride = await pluginSettings.get(from, 'delete_links');
      if (dlOverride !== undefined) deleteOnly = (dlOverride === true || String(dlOverride) === 'true');
    } catch (err) {
      console.error('Error reading plugin setting (delete_links):', err);
    }

    if (deleteOnly) {
      try {
        const deleteKey = {
          remoteJid: from,
          fromMe: false,
          id: m.key && m.key.id ? m.key.id : (m.id || ''),
          participant: m.key && m.key.participant ? m.key.participant : (m.participant || undefined)
        };
        await conn.sendMessage(from, { delete: deleteKey });
      } catch (e) {
        try {
          await conn.sendMessage(from, { delete: m.key });
        } catch (err) {
          console.error('Failed to delete link message:', err && err.message ? err.message : err);
        }
      }
      return;
    }

    // If ANTI_LINK_KICK is true, remove the user immediately instead of warns
    const kickImmediately = String(config.ANTI_LINK_KICK) === 'true';

    if (kickImmediately) {
      try {
        await conn.sendMessage(from, {
          text: `🚫 @${sender.split('@')[0]} posted a link and will be removed.`,
          mentions: [sender]
        }, { quoted: m });
        await conn.groupParticipantsUpdate(from, [sender], 'remove');
      } catch (err) {
        console.error('Failed to remove user for link (kickImmediately):', err);
        reply('Could not remove the user, make sure the bot has admin rights.');
      }
      return;
    }

    // Log deletion (optional) and persist warns
    const warnsFile = path.join(process.cwd(), 'store', 'antilink_warns.json');

    const readWarns = async () => {
      try {
        const data = await fs.readFile(warnsFile, 'utf8');
        return JSON.parse(data || '{}');
      } catch (e) {
        return {};
      }
    };

    const writeWarns = async (obj) => {
      await fs.mkdir(path.dirname(warnsFile), { recursive: true });
      await fs.writeFile(warnsFile, JSON.stringify(obj, null, 2), 'utf8');
    };

    const warns = await readWarns();
    // structure: { [groupId]: { [userId]: count } }
    if (!warns[from]) warns[from] = {};
    const current = warns[from][sender] ? Number(warns[from][sender]) : 0;
    const updated = current + 1;
    warns[from][sender] = updated;
    await writeWarns(warns);

    const maxWarns = 5;
    if (updated >= maxWarns) {
      // reset user's warns
      delete warns[from][sender];
      await writeWarns(warns);

      // notify and remove
      try {
        await conn.sendMessage(from, {
          text: `🚫 @${sender.split('@')[0]} has reached ${maxWarns} warnings and will be removed from the group.`,
          mentions: [sender]
        }, { quoted: m });
        await conn.groupParticipantsUpdate(from, [sender], 'remove');
      } catch (err) {
        console.error('Failed to remove user after warns:', err);
        reply('Could not remove the user, make sure the bot has admin rights.');
      }
    } else {
      // send warn message
      try {
        await conn.sendMessage(from, {
          text: `⚠️ @${sender.split('@')[0]} Warning ${updated}/${maxWarns} — Posting links is not allowed. After ${maxWarns} warnings you will be removed.`,
          mentions: [sender]
        }, { quoted: m });
      } catch (err) {
        // fallback to reply
        reply(`Warning ${updated}/${maxWarns} — Posting links is not allowed.`);
      }
    }
  } catch (error) {
    console.error(error);
    reply("An error occurred while processing the message.");
  }
});
