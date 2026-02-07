const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');

cmd({
  pattern: 'mode',
  desc: 'Set bot mode: public | private | groups | inbox | toggle',
  category: 'owner',
  filename: __filename
}, async (conn, mek, m, { from, args, reply, isCreator, isOwner }) => {
  try {
    if (!isCreator && !isOwner) return reply('❌ Only the bot owner can change the mode.');

    const wanted = (args && args[0]) ? args[0].toLowerCase() : '';
    const valid = ['public', 'private', 'groups', 'inbox'];

    // Load runtime config object
    const cfgPath = path.join(process.cwd(), 'config.js');
    let cfg = require('../config');

    let newMode = '';
    if (!wanted || wanted === 'toggle') {
      // toggle between public and private
      newMode = cfg.MODE === 'private' ? 'public' : 'private';
    } else if (valid.includes(wanted)) {
      newMode = wanted;
    } else {
      return reply(`Usage: .mode <public|private|groups|inbox|toggle>\nCurrent mode: ${cfg.MODE}`);
    }

    // Persist to config.js by replacing the MODE line
    try {
      const raw = fs.readFileSync(cfgPath, 'utf8');
      const updated = raw.replace(/MODE:\s*process\.env\.MODE\s*\|\|\s*["'].*?["']\s*,/i, `MODE: process.env.MODE || "${newMode}",`);
      // backup then write
      fs.copyFileSync(cfgPath, cfgPath + '.bak');
      fs.writeFileSync(cfgPath, updated, 'utf8');
    } catch (err) {
      console.error('Failed to write config.js:', err);
      return reply('❌ Failed to persist mode to config.js. Check file permissions.');
    }

    // Update in-memory config object so change is immediate
    try {
      cfg.MODE = newMode;
    } catch (err) {
      console.error('Failed to update runtime config:', err);
    }

    return reply(`✅ Bot mode updated to: ${newMode}`);
  } catch (err) {
    console.error(err);
    return reply('❌ An error occurred while changing mode.');
  }
});
