const { cmd } = require('../command');
const config = require('../config');

function _normalize(number) {
    if (!number) return null;
    number = String(number).replace(/[^0-9]/g, '');
    if (number.length === 0) return null;
    return number + '@s.whatsapp.net';
}

cmd({
    pattern: 'add',
    desc: 'Add member(s) to the group. Usage: .add 255XXXXXXXXX or reply to contact',
    category: 'group',
    filename: __filename
}, async (conn, mek, m, { from, args, isGroup, isAdmins, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply('❌ This command can only be used in groups.');
        if (!isAdmins) return reply('❌ Only group admins can add members.');
        if (!isBotAdmins) return reply('❌ I need to be group admin to add members.');

        // If user replied to a contact message, try to extract contact
        let targets = [];
        if (m.quoted && m.quoted.contact) {
            const vcard = m.quoted.contact.vcard || '';
            const match = vcard.match(/waid=([0-9]+)/);
            if (match) targets.push(_normalize(match[1]));
        }

        // If args provided, parse comma/space separated numbers
        if (args && args.length) {
            const raw = args.join(' ');
            const parts = raw.split(/[,\s]+/).filter(Boolean);
            for (const p of parts) {
                const jid = _normalize(p);
                if (jid) targets.push(jid);
            }
        }

        if (!targets.length) return reply('❌ Provide one or more numbers. Example: .add 255712345678');

        // Attempt to add all targets
        try {
            await conn.groupParticipantsUpdate(from, targets, 'add');
            return reply(`✅ Requested to add ${targets.length} member(s).`);
        } catch (err) {
            console.error('Failed to add participants:', err);
            return reply('❌ Could not add members. Ensure numbers are correct and the bot has admin privileges.');
        }
    } catch (e) {
        console.error('Error in .add command:', e);
        reply('⚠️ An error occurred while adding members.');
    }
});

module.exports = {};
const { cmd } = require('../command');

cmd(
  {
    pattern: "add",
    alias: ["invite", "addmember", "a", "summon"],
    desc: "Adds a person to group",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, quoted, args, reply, isGroup, isBotAdmins, isCreator, isAdmins }) => {
    try {
      if (!isCreator && !isAdmins) {
        return await conn.sendMessage(from, {
          text: "*📛 This is an owner or admin command.*"
        }, { quoted: mek });
      }

      if (!isGroup) return reply("_This command is for groups_");
      if (!isBotAdmins) return reply("_I'm not admin_");
      if (!args[0] && !quoted) return reply("_Mention user to add_");

      let jid = m.mentionedJid?.[0]
        || (m.quoted?.sender ?? null)
        || (args[0]?.replace(/[^0-9]/g, '') + "@s.whatsapp.net");

      await conn.groupParticipantsUpdate(from, [jid], "add");
      return reply(`@${jid.split("@")[0]} added`, { mentions: [jid] });
    } catch (e) {
      console.log(e);
      m.reply(`${e}`);
    }
  }
);
