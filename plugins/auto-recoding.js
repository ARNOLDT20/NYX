const fs = require('fs');
const path = require('path');
const config = require('../config')
const {cmd , commands} = require('../command')

const AUTO_SETTINGS_FILE = path.join(process.cwd(), 'store', 'auto_settings.json');
const readAutoSettings = () => {
  try {
    if (!fs.existsSync(AUTO_SETTINGS_FILE)) return { typing: {}, recording: {}, global: {} };
    const data = fs.readFileSync(AUTO_SETTINGS_FILE, 'utf8');
    return JSON.parse(data || '{}');
  } catch (e) {
    return { typing: {}, recording: {}, global: {} };
  }
};

//auto recording
cmd({
  on: "body"
},    
async (conn, mek, m, { from, body, isOwner }) => {       
  try {
    const settings = readAutoSettings();
    const jid = from;
    const per = settings.recording && settings.recording[jid];
    const global = settings.global && settings.global.recording;
    const enabled = per ? per === 'true' : (global ? global === 'true' : config.AUTO_RECORDING === 'true');
    if (enabled) {
      try { await conn.sendPresenceUpdate('recording', from); } catch (e) { }
    }
  } catch (e) {
    console.error('auto-recording error:', e);
  }
});
