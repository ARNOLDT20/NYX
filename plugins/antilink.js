const { cmd } = require('../command');
const config = require("../config");

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
    if (!isGroup || !isBotAdmins) {
      return;
    }

    // Allow admins to send links without penalty
    if (isAdmins) {
      return;
    }

    const containsLink = linkPatterns.some(pattern => pattern.test(body));

    if (containsLink && config.ANTI_LINK === 'true') {
      await conn.sendMessage(from, { 'delete': m.key }, { 'quoted': m });
      await conn.sendMessage(from, {
        'text': `⚠️ Links are not allowed in this group.\n@${sender.split('@')[0]} has been removed. 🚫`,
        'mentions': [sender]
      }, { 'quoted': m });

      await conn.groupParticipantsUpdate(from, [sender], "remove");
    }
  } catch (error) {
    console.error(error);
    reply("An error occurred while processing the message.");
  }
});
