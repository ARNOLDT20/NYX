// Global safety: catch startup exceptions and rejections early to produce clearer logs
process.on('unhandledRejection', (reason) => {
  console.error('Startup unhandledRejection:', reason);
  setTimeout(() => process.exit(1), 1000);
});
process.on('uncaughtException', (err) => {
  console.error('Startup uncaughtException:', err);
  setTimeout(() => process.exit(1), 1000);
});

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  isJidBroadcast,
  getContentType,
  proto,
  generateWAMessageContent,
  generateWAMessage,
  AnyMessageContent,
  prepareWAMessageMedia,
  areJidsSameUser,
  downloadContentFromMessage,
  MessageRetryMap,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  generateMessageID, makeInMemoryStore,
  jidDecode,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys')


const l = console.log
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions')
const { AntiDelDB, initializeAntiDeleteSettings, setAnti, getAnti, getAllAntiDeleteSettings, saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata, saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage } = require('./data')
const { handleWelcome } = require('./plugins/welcome')
const { handleGoodbye } = require('./plugins/goodbye')
const fs = require('fs')
const ff = require('fluent-ffmpeg')
const P = require('pino')
const config = require('./config')
const qrcode = require('qrcode-terminal')
const StickersTypes = require('wa-sticker-formatter')
const util = require('util')
const { sms, downloadMediaMessage, AntiDelete } = require('./lib')
const FileType = require('file-type');
const axios = require('axios')
const { File } = require('megajs')
const { fromBuffer } = require('file-type')
const bodyparser = require('body-parser')
const os = require('os')
const Crypto = require('crypto')
const path = require('path')
const prefix = config.PREFIX
const readline = require('readline')

// Silence non-error console output when requested
// Enable by setting env var `SILENT=true` or `config.SILENT = "true"` in `config.js`
if (process.env.SILENT === 'true' || config.SILENT === 'true') {
  console.log = () => { };
  console.info = () => { };
  console.debug = () => { };
  console.trace = () => { };
}

// Global error handlers to capture crashes and provide stack traces
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason && reason.stack ? reason.stack : reason);
});

const ownerNumber = [config.OWNER_NUMBER, config.OWNER_NUMBER2].filter(n => n)

const tempDir = path.join(os.tmpdir(), 'cache-temp')
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir)
}

const clearTempDir = () => {
  fs.readdir(tempDir, (err, files) => {
    if (err) throw err;
    for (const file of files) {
      fs.unlink(path.join(tempDir, file), err => {
        if (err) throw err;
      });
    }
  });
}

// Clear the temp directory every 5 minutes
setInterval(clearTempDir, 5 * 60 * 1000);

//===================INTERACTIVE SESSION HANDLER============================
// Detect if running on Heroku or other production environment
const isProduction = process.env.NODE_ENV === 'production' ||
  process.env.DYNO ||
  process.env.HEROKU_APP_NAME ||
  process.env.CF_PAGES ||
  process.env.RAILWAY_ENVIRONMENT_NAME;

// Function to prompt user for SESSION_ID (Local only)
const promptSessionID = () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\n');
    console.log('╔════════════════════════════════════════╗');
    console.log('║   🤖 NYX MD BOT - SESSION SETUP 🤖    ║');
    console.log('╚════════════════════════════════════════╝\n');

    rl.question('📝 Please paste your SESSION_ID: ', (sessionId) => {
      rl.close();

      if (!sessionId || sessionId.trim().length === 0) {
        console.log('❌ SESSION_ID cannot be empty!');
        process.exit(1);
      }

      // Save to config
      config.SESSION_ID = sessionId.trim();

      // Also try to save to .env file
      const envPath = path.join(__dirname, 'config.env');
      const envContent = `SESSION_ID=${sessionId.trim()}\n`;

      fs.appendFileSync(envPath, envContent, (err) => {
        if (err) console.log('⚠️ Could not save to config.env, but session is saved in memory');
      });

      console.log('✅ SESSION_ID saved! Starting bot...\n');
      resolve(sessionId.trim());
    });

    // Handle Ctrl+C
    rl.on('close', () => {
      if (!config.SESSION_ID) {
        console.log('\n❌ Setup cancelled');
        process.exit(1);
      }
    });
  });
};

//===================SESSION-AUTH============================
(async () => {
  try {
    // Check if session file exists AND is valid
    const sessionPath = __dirname + '/sessions/creds.json';
    let sessionValid = false;

    if (fs.existsSync(sessionPath)) {
      try {
        // Try to parse the session file to verify it's not corrupted
        const sessionContent = fs.readFileSync(sessionPath, 'utf8');
        JSON.parse(sessionContent);
        sessionValid = true;
        console.log('✅ Session file is valid');
      } catch (e) {
        console.error('❌ Session file is corrupted:', e.message);
        console.log('🔄 Deleting corrupted session...');
        fs.unlinkSync(sessionPath);
        sessionValid = false;
      }
    }

    if (!sessionValid && !fs.existsSync(sessionPath)) {
      if (!config.SESSION_ID) {
        // Only prompt if running locally, not on Heroku/production
        if (isProduction) {
          console.error('❌ SESSION_ID is required for production deployment!');
          console.error('❌ Please set SESSION_ID environment variable on Heroku');
          console.error('❌ Command: heroku config:set SESSION_ID=your_session_id');
          process.exit(1);
        } else {
          console.log('⚠️ SESSION_ID not found in config!');
          await promptSessionID();
        }
      }

      const sessdata = config.SESSION_ID.replace("QJUSMY=", '');
      const filer = File.fromURL(`https://mega.nz/file/${sessdata}`);

      filer.download((err, data) => {
        if (err) {
          console.error('❌ Error downloading session:', err.message);
          console.log('⚠️ Please check your SESSION_ID is correct');
          process.exit(1);
        }
        fs.writeFile(sessionPath, data, () => {
          console.log("✅ SESSION-ID CONNECTED 🙂");
          connectToWA();
        });
      });
    } else if (sessionValid || fs.existsSync(sessionPath)) {
      connectToWA();
    }
  } catch (err) {
    console.error('❌ Error during session setup:', err.message);
    process.exit(1);
  }
})();

const express = require("express");
const app = express();
const port = process.env.PORT || 9090;
// optional external keepalive URL (set this to your app URL or an uptime monitor URL)
const KEEPALIVE_URL = process.env.KEEPALIVE_URL || null;
let presenceInterval = null;
let keepAliveInterval = null;

//=============================================

async function connectToWA() {
  console.log("NYX MD BOT STARTED....🥰");
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/sessions/')
  var { version } = await fetchLatestBaileysVersion()

  const conn = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS("Firefox"),
    syncFullHistory: true,
    auth: state,
    version
  })

  // Helper: detect auth/session errors and exit so Heroku can restart the dyno
  const authErrorRegex = /getUSyncDevices|auth|401|loggedOut|AUTHENTICATION|Expired credentials|BAD_SESSION|Bad MAC|verifyMAC|Bad session|Session error/i;

  function handleAuthError(e) {
    try {
      if (!e) return;
      const msg = (e && (e.message || e.toString())) || '';
      console.error('Auth error check:', msg);

      // Check for Bad MAC error specifically
      if (/Bad MAC|verifyMAC|Bad session/i.test(msg)) {
        console.error('❌ SESSION CORRUPTION DETECTED: Bad MAC Error');
        console.error('🔄 Clearing corrupted session files...');

        // Clear corrupted session files
        try {
          const sessPath = __dirname + '/sessions/';
          if (fs.existsSync(sessPath)) {
            const files = fs.readdirSync(sessPath);
            files.forEach(file => {
              if (file !== '.gitkeep') {
                fs.unlinkSync(sessPath + file);
                console.log(`✅ Deleted: ${file}`);
              }
            });
          }
        } catch (err) {
          console.error('Error clearing sessions:', err.message);
        }

        console.error('⚠️ SESSION RESET: Please generate a new SESSION_ID by scanning the QR code again.');
        console.error('Exiting process to restart...');
        setTimeout(() => process.exit(1), 2000);
        return;
      }

      if (authErrorRegex.test(msg)) {
        console.error('Detected auth/session issue — exiting to allow restart.');
        setTimeout(() => process.exit(1), 1000);
      }
    } catch (err) {
      console.error('Error while handling auth error:', err);
    }
  }

  // Safe send wrapper to avoid unhandled exceptions from failed sends
  async function safeSendMessage(jid, message, opts = {}) {
    try {
      return await conn.sendMessage(jid, message, opts);
    } catch (e) {
      console.error('safeSendMessage failed:', e && (e.message || e.toString()));
      handleAuthError(e);
      return null;
    }
  }

  // Attach global handlers once to catch unexpected promise rejections / exceptions
  if (!process._nyx_global_handlers_attached) {
    process._nyx_global_handlers_attached = true;
    process.on('unhandledRejection', (reason, p) => {
      console.error('Unhandled Rejection at:', p, 'reason:', reason);
      try { handleAuthError(reason); } catch (e) { console.error(e); }
    });
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err && (err.message || err.toString()));
      try { handleAuthError(err); } catch (e) { console.error(e); }
    });
  }

  const { DisconnectReason } = require("@whiskeysockets/baileys");
  const fs = require("fs");
  const path = require("path");

  conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.statusCode;
      const errorMsg = lastDisconnect?.error?.message || '';
      console.log("Connection closed. Reason code:", code, "Error:", errorMsg);

      // clear any keepalive intervals when connection closes
      try {
        if (presenceInterval) {
          clearInterval(presenceInterval);
          presenceInterval = null;
        }
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }
      } catch (e) { }

      // Check for Bad MAC or session corruption errors
      if (/Bad MAC|verifyMAC|Bad session|Session error/i.test(errorMsg)) {
        console.error('❌ BAD MAC ERROR DETECTED: Session is corrupted');
        console.error('🔄 Clearing session and forcing re-authentication...');

        // Clear corrupted session files
        try {
          const sessPath = __dirname + '/sessions/';
          if (fs.existsSync(sessPath)) {
            const files = fs.readdirSync(sessPath);
            files.forEach(file => {
              if (file !== '.gitkeep') {
                fs.unlinkSync(sessPath + file);
                console.log(`✅ Cleared: ${file}`);
              }
            });
          }
        } catch (err) {
          console.error('Error clearing sessions:', err.message);
        }

        console.log('⚠️ Please generate a NEW SESSION_ID and restart the bot.');
        setTimeout(() => process.exit(1), 2000);
        return;
      }

      if (code !== DisconnectReason.loggedOut) {
        console.log("♻️ Reconnecting...");
        connectToWA();
      } else {
        console.log("❌ Logged out. Please scan QR again.");
      }

    } else if (connection === 'open') {
      console.log('loading plugins...🤭');
      fs.readdirSync("./plugins/").forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() === ".js") {
          try {
            require("./plugins/" + plugin);
            console.log(`ADDED :° ${plugin}`);
          } catch (err) {
            console.error(`❌ Failed to load plugin ${plugin}:`, err);
          }
        }
      });

      console.log('plugins loaded succesfully')
      console.log('🥰NYX MD started🥰')

      let up = `╭──〔 𝗰𝗼𝗻𝗻𝗲𝗰𝘁𝗲𝗱 〕───⊷
│ *Prefix* : ${prefix}
│ *Status* : Ready for use
│ *Follow Channel* :
│ https://whatsapp.com/channel/0029VbC49Bb2P59togOaEF2E
╰──────────────⊷*

> *Report any error to the dev*
                                  `;
      await safeSendMessage(conn.user.id, { image: { url: `https://files.catbox.moe/rw0yfd.png` }, caption: up });

      // ALWAYS_ONLINE: send periodic presence updates to keep WA connection active
      try {
        if (presenceInterval) {
          clearInterval(presenceInterval);
          presenceInterval = null;
        }
        if (config.ALWAYS_ONLINE === 'true') {
          presenceInterval = setInterval(async () => {
            try {
              await conn.sendPresenceUpdate('available', conn.user.id);
            } catch (e) { }
          }, 60 * 1000); // every 60 seconds
          console.log('✅ Presence keepalive enabled (ALWAYS_ONLINE=true)');
        }

        // Optional external keepalive ping to prevent host idling (set KEEPALIVE_URL env)
        if (KEEPALIVE_URL) {
          if (keepAliveInterval) clearInterval(keepAliveInterval);
          keepAliveInterval = setInterval(async () => {
            try {
              await axios.get(KEEPALIVE_URL, { timeout: 10000 });
            } catch (e) { }
          }, 4 * 60 * 1000); // every 4 minutes
          console.log(`🔁 External keepalive pinging ${KEEPALIVE_URL}`);
        }
      } catch (e) { console.error(e) }
    }
  })
  conn.ev.on('creds.update', saveCreds)

  //==============================

  conn.ev.on('messages.update', async updates => {
    for (const update of updates) {
      if (update.update.message === null) {
        console.log("Delete Detected:", JSON.stringify(update, null, 2));
        await AntiDelete(conn, updates);
      }
    }
  });
  //============================== 
  // Group Participant Update Handler (Welcome/Goodbye Messages)
  conn.ev.on('group-participants.update', async (update) => {
    try {
      const { id, participants, action } = update;

      // Check if it's a group
      if (!id.endsWith('@g.us')) return;

      // Get group metadata
      const groupMetadata = await conn.groupMetadata(id);

      // Handle member addition (welcome message)
      if (action === 'add') {
        await handleWelcome(conn, id, participants, groupMetadata);
      }

      // Handle member removal (goodbye message)
      if (action === 'remove') {
        await handleGoodbye(conn, id, participants, groupMetadata);
      }
    } catch (err) {
      console.error('Error in group participant update handler:', err);
    }
  });
  //============================== 
  // Auto-join WhatsApp group when bot connects
  // Attempt auto-join and auto-follow when connection opens
  conn.ev.on('connection.update', async (update) => {
    const { connection } = update;
    if (connection === 'open') {
      // Auto-join group from config.GROUP_LINK if available
      try {
        const groupLink = config.GROUP_LINK || '';
        const inviteMatch = groupLink.match(/chat\.whatsapp\.com\/(.+)/i) || groupLink.match(/invite\/(.+)/i);
        const inviteCode = inviteMatch ? inviteMatch[1] : null;
        if (inviteCode) {
          try {
            await conn.groupAcceptInvite(inviteCode);
            console.log('✅ Successfully joined group from GROUP_LINK');
          } catch (err) {
            console.error('❌ Failed to join WhatsApp group (may already be a member or invite invalid):', err.message || err);
          }
        } else {
          console.log('ℹ️ No valid GROUP_LINK found in config to auto-join.');
        }
      } catch (err) {
        console.error('❌ Error during auto-join attempt:', err);
      }

      // Auto-follow channel from config.CHANNEL_LINK if available
      try {
        const channelLink = config.CHANNEL_LINK || '';
        const channelMatch = channelLink.match(/channel\/([0-9A-Za-z-_]+)/i);
        const channelId = channelMatch ? channelMatch[1] : null;

        if (channelId) {
          try {
            // Try to get channel metadata for verification
            let targetId = channelId;

            if (typeof conn.newsletterMetadata === 'function') {
              try {
                const channelMeta = await conn.newsletterMetadata('invite', channelId);
                if (channelMeta?.id) {
                  targetId = channelMeta.id;
                }
              } catch (metaErr) {
                console.warn('⚠️ Could not get channel metadata, using provided ID:', metaErr.message);
                // Continue with original ID
              }
            }

            // Try a few possible follow/subscribe method names supported by different Baileys builds
            let followed = false;

            if (typeof conn.newsletterFollow === 'function') {
              try {
                await conn.newsletterFollow(targetId);
                console.log('✅ Followed channel via newsletterFollow');
                followed = true;
              } catch (followErr) {
                console.warn('⚠️ newsletterFollow failed:', followErr.message);
              }
            }

            if (!followed && typeof conn.newsletterSubscribe === 'function') {
              try {
                await conn.newsletterSubscribe(targetId);
                console.log('✅ Followed channel via newsletterSubscribe');
                followed = true;
              } catch (subErr) {
                console.warn('⚠️ newsletterSubscribe failed:', subErr.message);
              }
            }

            if (!followed && typeof conn.newsletterJoin === 'function') {
              try {
                await conn.newsletterJoin(targetId);
                console.log('✅ Followed channel via newsletterJoin');
                followed = true;
              } catch (joinErr) {
                console.warn('⚠️ newsletterJoin failed:', joinErr.message);
              }
            }

            if (!followed && typeof conn.newsletterAcceptInvite === 'function') {
              try {
                await conn.newsletterAcceptInvite(targetId);
                console.log('✅ Followed channel via newsletterAcceptInvite');
                followed = true;
              } catch (acceptErr) {
                console.warn('⚠️ newsletterAcceptInvite failed:', acceptErr.message);
              }
            }

            if (!followed) {
              console.log('ℹ️ No newsletter follow method available or all methods failed. Channel follow skipped.');
            }

          } catch (err) {
            console.error('❌ Failed to auto-follow channel:', err.message || err);
          }
        } else {
          console.log('ℹ️ No valid CHANNEL_LINK found in config to auto-follow.');
        }
      } catch (err) {
        console.error('❌ Error during auto-follow attempt:', err);
      }
    }
  });
  //=============readstatus=======

  conn.ev.on('messages.upsert', async (mek) => {
    try {
      mek = mek.messages[0]
      if (!mek.message) return
      mek.message = (getContentType(mek.message) === 'ephemeralMessage')
        ? mek.message.ephemeralMessage.message
        : mek.message;
      //console.log("New Message Detected:", JSON.stringify(mek, null, 2));
      if (config.READ_MESSAGE === 'true') {
        await conn.readMessages([mek.key]);  // Mark message as read
        console.log(`Marked message from ${mek.key.remoteJid} as read.`);
      }
      if (mek.message.viewOnceMessageV2)
        mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
      if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN === "true") {
        await conn.readMessages([mek.key])
      }
      if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REACT === "true") {
        const jawadlike = await conn.decodeJid(conn.user.id);
        const emojis = ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🙆', '🚩', '🥰', '💐', '😎', '🤎', '✅', '🫀', '🧡', '😁', '😄', '🌸', '🕊️', '🌷', '⛅', '🌟', '🗿', '🇵🇰', '💜', '💙', '🌝', '🖤', '💚'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        await safeSendMessage(mek.key.remoteJid, {
          react: {
            text: randomEmoji,
            key: mek.key,
          }
        }, { statusJidList: [mek.key.participant, jawadlike] });
      }
      if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REPLY === "true") {
        const user = mek.key.participant
        const text = `${config.AUTO_STATUS_MSG}`
        await safeSendMessage(user, { text: text, react: { text: '💜', key: mek.key } }, { quoted: mek })
      }
      await Promise.all([
        saveMessage(mek),
      ]);
      const m = sms(conn, mek)
      const type = getContentType(mek.message)
      const content = JSON.stringify(mek.message)
      const from = mek.key.remoteJid
      const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : []
      const body =
        (type === 'conversation') ? mek.message.conversation :
          (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text :
            (type === 'imageMessage' && mek.message.imageMessage.caption) ? mek.message.imageMessage.caption :
              (type === 'videoMessage' && mek.message.videoMessage.caption) ? mek.message.videoMessage.caption :
                (type === 'templateButtonReplyMessage' && mek.message.templateButtonReplyMessage.selectedId) ? mek.message.templateButtonReplyMessage.selectedId :
                  (type === 'buttonsResponseMessage' && mek.message.buttonsResponseMessage.selectedButtonId) ? mek.message.buttonsResponseMessage.selectedButtonId :
                    (type === 'listResponseMessage' && mek.message.listResponseMessage.singleSelectReply.selectedRowId) ? mek.message.listResponseMessage.singleSelectReply.selectedRowId :
                      (type === 'interactiveResponseMessage' &&
                        mek.message.interactiveResponseMessage.nativeFlowResponseMessage &&
                        JSON.parse(mek.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson)?.id
                      ) ? JSON.parse(mek.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id :
                        ''
      const isCmd = body.startsWith(prefix)
      var budy = typeof mek.text == 'string' ? mek.text : false;
      const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
      const args = body.trim().split(/ +/).slice(1)
      const q = args.join(' ')
      const text = args.join(' ')
      const isGroup = from.endsWith('@g.us')
      const sender = mek.key.fromMe ? (conn.user.id.split(':')[0] + '@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid)
      const senderNumber = sender.split('@')[0]
      const botNumber = conn.user.id.split(':')[0]
      const botJid = botNumber + '@s.whatsapp.net'
      const pushname = mek.pushName || 'Sin Nombre'
      const isMe = botNumber.includes(senderNumber)
      const isOwner = ownerNumber.includes(senderNumber) || isMe
      const botNumber2 = await jidNormalizedUser(conn.user.id);
      const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(e => { }) : null
      const groupName = isGroup && groupMetadata ? groupMetadata.subject : ''
      const participants = isGroup && groupMetadata ? groupMetadata.participants : []
      const groupAdmins = isGroup ? await getGroupAdmins(participants) : []
      // Normalize checks: groupAdmins usually contains JIDs like '12345@s.whatsapp.net'
      const isBotAdmins = isGroup ? (Array.isArray(groupAdmins) && groupAdmins.some(admin => {
        const adminJid = typeof admin === 'string' ? admin : admin.id || '';
        const normalizedAdmin = adminJid.replace(/:\d+$/, '');
        return normalizedAdmin === botNumber2 ||
          normalizedAdmin === botJid ||
          normalizedAdmin === `${botNumber}@s.whatsapp.net` ||
          normalizedAdmin.includes(botNumber);
      })) : false;

      const isAdmins = isGroup ? (Array.isArray(groupAdmins) && groupAdmins.some(admin => {
        const adminJid = typeof admin === 'string' ? admin : admin.id || '';
        const normalizedAdmin = adminJid.replace(/:\d+$/, '');
        return normalizedAdmin === sender ||
          normalizedAdmin === `${senderNumber}@s.whatsapp.net` ||
          normalizedAdmin.includes(senderNumber);
      })) : false;
      const isReact = m.message.reactionMessage ? true : false
      const reply = (teks) => {
        conn.sendMessage(from, { text: teks }, { quoted: mek })
      }
      const udp = botNumber.split('@')[0];
      const jawad = ('255627417402');
      const pathum = ('255625606354');
      // base creator list from hardcoded numbers and config.DEV
      const baseCreators = [udp, pathum, jawad, config.DEV]
        .map(v => v.replace(/[^0-9]/g));

      // load sudo (super users) from assets/sudo.json
      let sudoList = [];
      try {
        const sudoPath = path.join(__dirname, 'assets', 'sudo.json');
        if (fs.existsSync(sudoPath)) {
          const raw = fs.readFileSync(sudoPath, 'utf8');
          sudoList = JSON.parse(raw || '[]').map(x => ('' + x).replace(/[^0-9]/g));
        }
      } catch (e) {
        console.error('Failed to read sudo.json', e);
      }

      const allCreators = [...new Set([...baseCreators, ...sudoList])];
      let isCreator = allCreators
        .map(v => v + '@s.whatsapp.net')
        .includes(mek.sender || '') || allCreators.includes(senderNumber);

      if (isCreator && mek.text.startsWith('%')) {
        let code = budy.slice(2);
        if (!code) {
          reply(
            `Provide me with a query to run Master!`,
          );
          return;
        }
        try {
          let resultTest = eval(code);
          if (typeof resultTest === 'object')
            reply(util.format(resultTest));
          else reply(util.format(resultTest));
        } catch (err) {
          reply(util.format(err));
        }
        return;
      }
      if (isCreator && mek.text.startsWith('$')) {
        let code = budy.slice(2);
        if (!code) {
          reply(
            `Provide me with a query to run Master!`,
          );
          return;
        }
        try {
          let resultTest = await eval(
            'const a = async()=>{\n' + code + '\n}\na()',
          );
          let h = util.format(resultTest);
          if (h === undefined) return console.log(h);
          else reply(h);
        } catch (err) {
          if (err === undefined)
            return console.log('error');
          else reply(util.format(err));
        }
        return;
      }
      //================ownerreact==============
      // 🥰 OWNER REACT (Multiple Numbers)
      if (
        senderNumber.includes("255627417402") ||
        senderNumber.includes("255625606354")
      ) {
        if (isReact) return;
        await m.react("✅");
      }
      //==========public react============//
      // Auto React - checks AUTO_REACT and CUSTOM_REACT settings
      if (!isReact && senderNumber !== botNumber && config.AUTO_REACT === 'true') {
        // Use custom emojis if CUSTOM_REACT is enabled, otherwise use default set
        let reactions;
        if (config.CUSTOM_REACT === 'true' && config.CUSTOM_REACT_EMOJIS) {
          reactions = config.CUSTOM_REACT_EMOJIS.split(',').map(e => e.trim());
        } else {
          reactions = ['😊', '👍', '😂', '💯', '🔥', '🙏', '🎉', '👏', '😎', '🤖'];
        }
        const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
        m.react(randomReaction);
      }

      // Owner React - checks AUTO_REACT and CUSTOM_REACT settings
      if (!isReact && senderNumber === botNumber && config.AUTO_REACT === 'true') {
        // Use custom emojis if CUSTOM_REACT is enabled, otherwise use default set
        let reactions;
        if (config.CUSTOM_REACT === 'true' && config.CUSTOM_REACT_EMOJIS) {
          reactions = config.CUSTOM_REACT_EMOJIS.split(',').map(e => e.trim());
        } else {
          reactions = ['😊', '👍', '😂', '💯', '🔥', '🙏', '🎉', '👏', '😎', '🤖'];
        }
        const randomOwnerReaction = reactions[Math.floor(Math.random() * reactions.length)];
        m.react(randomOwnerReaction);
      }

      // custum react settings        
      // CUSTOM_REACT and AUTO_REACT are now merged into one system
      // Use AUTO_REACT setting to control all automatic reactions
      // Use CUSTOM_REACT_EMOJIS to set custom emoji list

      //==========WORKTYPE============ 
      if (!isOwner && config.MODE === "private") return
      if (!isOwner && isGroup && config.MODE === "inbox") return
      if (!isOwner && !isGroup && config.MODE === "groups") return

      // take commands 

      const events = require('./command')
      const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false;
      let executedCmd = false;

      if (isCmd) {
        const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName))
        if (cmd) {
          executedCmd = true;
          if (cmd.react) conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } })

          try {
            cmd.function(conn, mek, m, { from, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply });
          } catch (e) {
            console.error("[PLUGIN ERROR] " + e);
          }
        }
      }

      // Only run .map() for non-pattern commands (on: body, text, image, sticker)
      events.commands.map(async (command) => {
        // Skip if this command has a pattern and was already executed
        if (command.pattern && executedCmd) return;

        if (body && command.on === "body" && !command.pattern) {
          command.function(conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
        } else if (mek.q && command.on === "text" && !command.pattern) {
          command.function(conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
        } else if (
          (command.on === "image" || command.on === "photo") &&
          mek.type === "imageMessage" &&
          !command.pattern
        ) {
          command.function(conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
        } else if (
          command.on === "sticker" &&
          mek.type === "stickerMessage" &&
          !command.pattern
        ) {
          command.function(conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply })
        }
      });

    } catch (error) {
      console.error('Error in messages.upsert handler:', error && (error.message || error.toString()));
      handleAuthError(error);
    }
  });
  //===================================================   
  conn.decodeJid = jid => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (
        (decode.user &&
          decode.server &&
          decode.user + '@' + decode.server) ||
        jid
      );
    } else return jid;
  };
  //===================================================
  conn.copyNForward = async (jid, message, forceForward = false, options = {}) => {
    let vtype
    if (options.readViewOnce) {
      message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
      vtype = Object.keys(message.message.viewOnceMessage.message)[0]
      delete (message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
      delete message.message.viewOnceMessage.message[vtype].viewOnce
      message.message = {
        ...message.message.viewOnceMessage.message
      }
    }

    let mtype = Object.keys(message.message)[0]
    let content = await generateForwardMessageContent(message, forceForward)
    let ctype = Object.keys(content)[0]
    let context = {}
    if (mtype != "conversation") context = message.message[mtype].contextInfo
    content[ctype].contextInfo = {
      ...context,
      ...content[ctype].contextInfo
    }
    const waMessage = await generateWAMessageFromContent(jid, content, options ? {
      ...content[ctype],
      ...options,
      ...(options.contextInfo ? {
        contextInfo: {
          ...content[ctype].contextInfo,
          ...options.contextInfo
        }
      } : {})
    } : {})
    await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id })
    return waMessage
  }
  //=================================================
  conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    let quoted = message.msg ? message.msg : message
    let mime = (message.msg || message).mimetype || ''
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
    const stream = await downloadContentFromMessage(quoted, messageType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }
    let type = await FileType.fromBuffer(buffer)
    trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
    // save to file
    await fs.writeFileSync(trueFileName, buffer)
    return trueFileName
  }
  //=================================================
  conn.downloadMediaMessage = async (message) => {
    let mime = (message.msg || message).mimetype || ''
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
    const stream = await downloadContentFromMessage(message, messageType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }

    return buffer
  }

  /**
  *
  * @param {*} jid
  * @param {*} message
  * @param {*} forceForward
  * @param {*} options
  * @returns
  */
  //================================================
  conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
    let mime = '';
    let res = await axios.head(url)
    mime = res.headers['content-type']
    if (mime.split("/")[1] === "gif") {
      return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted, ...options })
    }
    let type = mime.split("/")[0] + "Message"
    if (mime === "application/pdf") {
      return conn.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted, ...options })
    }
    if (mime.split("/")[0] === "image") {
      return conn.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted: quoted, ...options })
    }
    if (mime.split("/")[0] === "video") {
      return conn.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted, ...options })
    }
    if (mime.split("/")[0] === "audio") {
      return conn.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted, ...options })
    }
  }
  //==========================================================
  conn.cMod = (jid, copy, text = '', sender = conn.user.id, options = {}) => {
    //let copy = message.toJSON()
    let mtype = Object.keys(copy.message)[0]
    let isEphemeral = mtype === 'ephemeralMessage'
    if (isEphemeral) {
      mtype = Object.keys(copy.message.ephemeralMessage.message)[0]
    }
    let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
    let content = msg[mtype]
    if (typeof content === 'string') msg[mtype] = text || content
    else if (content.caption) content.caption = text || content.caption
    else if (content.text) content.text = text || content.text
    if (typeof content !== 'string') msg[mtype] = {
      ...content,
      ...options
    }
    if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
    else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
    if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
    else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
    copy.key.remoteJid = jid
    copy.key.fromMe = sender === conn.user.id

    return proto.WebMessageInfo.fromObject(copy)
  }


  /**
  *
  * @param {*} path
  * @returns
  */
  //=====================================================
  conn.getFile = async (PATH, save) => {
    let res
    let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
    //if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
    let type = await FileType.fromBuffer(data) || {
      mime: 'application/octet-stream',
      ext: '.bin'
    }
    let filename = path.join(__filename, __dirname + new Date * 1 + '.' + type.ext)
    if (data && save) fs.promises.writeFile(filename, data)
    return {
      res,
      filename,
      size: await getSizeMedia(data),
      ...type,
      data
    }

  }
  //=====================================================
  conn.sendFile = async (jid, PATH, fileName, quoted = {}, options = {}) => {
    let types = await conn.getFile(PATH, true)
    let { filename, size, ext, mime, data } = types
    let type = '',
      mimetype = mime,
      pathFile = filename
    if (options.asDocument) type = 'document'
    if (options.asSticker || /webp/.test(mime)) {
      let { writeExif } = require('./exif.js')
      let media = { mimetype: mime, data }
      pathFile = await writeExif(media, { packname: Config.packname, author: Config.packname, categories: options.categories ? options.categories : [] })
      await fs.promises.unlink(filename)
      type = 'sticker'
      mimetype = 'image/webp'
    } else if (/image/.test(mime)) type = 'image'
    else if (/video/.test(mime)) type = 'video'
    else if (/audio/.test(mime)) type = 'audio'
    else type = 'document'
    await conn.sendMessage(jid, {
      [type]: { url: pathFile },
      mimetype,
      fileName,
      ...options
    }, { quoted, ...options })
    return fs.promises.unlink(pathFile)
  }
  //=====================================================
  conn.parseMention = async (text) => {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
  }
  //=====================================================
  conn.sendMedia = async (jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
    let types = await conn.getFile(path, true)
    let { mime, ext, res, data, filename } = types
    if (res && res.status !== 200 || file.length <= 65536) {
      try { throw { json: JSON.parse(file.toString()) } } catch (e) { if (e.json) throw e.json }
    }
    let type = '',
      mimetype = mime,
      pathFile = filename
    if (options.asDocument) type = 'document'
    if (options.asSticker || /webp/.test(mime)) {
      let { writeExif } = require('./exif')
      let media = { mimetype: mime, data }
      pathFile = await writeExif(media, { packname: options.packname ? options.packname : Config.packname, author: options.author ? options.author : Config.author, categories: options.categories ? options.categories : [] })
      await fs.promises.unlink(filename)
      type = 'sticker'
      mimetype = 'image/webp'
    } else if (/image/.test(mime)) type = 'image'
    else if (/video/.test(mime)) type = 'video'
    else if (/audio/.test(mime)) type = 'audio'
    else type = 'document'
    await conn.sendMessage(jid, {
      [type]: { url: pathFile },
      caption,
      mimetype,
      fileName,
      ...options
    }, { quoted, ...options })
    return fs.promises.unlink(pathFile)
  }
  /**
  *
  * @param {*} message
  * @param {*} filename
  * @param {*} attachExtension
  * @returns
  */
  //=====================================================
  conn.sendVideoAsSticker = async (jid, buff, options = {}) => {
    let buffer;
    if (options && (options.packname || options.author)) {
      buffer = await writeExifVid(buff, options);
    } else {
      buffer = await videoToWebp(buff);
    }
    await conn.sendMessage(
      jid,
      { sticker: { url: buffer }, ...options },
      options
    );
  };
  //=====================================================
  conn.sendImageAsSticker = async (jid, buff, options = {}) => {
    let buffer;
    if (options && (options.packname || options.author)) {
      buffer = await writeExifImg(buff, options);
    } else {
      buffer = await imageToWebp(buff);
    }
    await conn.sendMessage(
      jid,
      { sticker: { url: buffer }, ...options },
      options
    );
  };
  /**
   *
   * @param {*} jid
   * @param {*} path
   * @param {*} quoted
   * @param {*} options
   * @returns
   */
  //=====================================================
  conn.sendTextWithMentions = async (jid, text, quoted, options = {}) => conn.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted })

  /**
   *
   * @param {*} jid
   * @param {*} path
   * @param {*} quoted
   * @param {*} options
   * @returns
   */
  //=====================================================
  conn.sendImage = async (jid, path, caption = '', quoted = '', options) => {
    let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
    return await conn.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
  }

  /**
  *
  * @param {*} jid
  * @param {*} path
  * @param {*} caption
  * @param {*} quoted
  * @param {*} options
  * @returns
  */
  //=====================================================
  conn.sendText = (jid, text, quoted = '', options) => conn.sendMessage(jid, { text: text, ...options }, { quoted })

  /**
   *
   * @param {*} jid
   * @param {*} path
   * @param {*} caption
   * @param {*} quoted
   * @param {*} options
   * @returns
   */
  //=====================================================
  conn.sendButtonText = (jid, buttons = [], text, footer, quoted = '', options = {}) => {
    let buttonMessage = {
      text,
      footer,
      buttons,
      headerType: 2,
      ...options
    }
    //========================================================================================================================================
    conn.sendMessage(jid, buttonMessage, { quoted, ...options })
  }
  //=====================================================
  conn.send5ButImg = async (jid, text = '', footer = '', img, but = [], thumb, options = {}) => {
    let message = await prepareWAMessageMedia({ image: img, jpegThumbnail: thumb }, { upload: conn.waUploadToServer })
    var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
      templateMessage: {
        hydratedTemplate: {
          imageMessage: message.imageMessage,
          "hydratedContentText": text,
          "hydratedFooterText": footer,
          "hydratedButtons": but
        }
      }
    }), options)
    conn.relayMessage(jid, template.message, { messageId: template.key.id })
  }

  /**
  *
  * @param {*} jid
  * @param {*} buttons
  * @param {*} caption
  * @param {*} footer
  * @param {*} quoted
  * @param {*} options
  */
  //=====================================================
  conn.getName = (jid, withoutContact = false) => {
    id = conn.decodeJid(jid);

    withoutContact = conn.withoutContact || withoutContact;

    let v;

    if (id.endsWith('@g.us'))
      return new Promise(async resolve => {
        v = store.contacts[id] || {};

        if (!(v.name.notify || v.subject))
          v = conn.groupMetadata(id) || {};

        resolve(
          v.name ||
          v.subject ||
          PhoneNumber(
            '+' + id.replace('@s.whatsapp.net', ''),
          ).getNumber('international'),
        );
      });
    else
      v =
        id === '0@s.whatsapp.net'
          ? {
            id,

            name: 'WhatsApp',
          }
          : id === conn.decodeJid(conn.user.id)
            ? conn.user
            : store.contacts[id] || {};

    return (
      (withoutContact ? '' : v.name) ||
      v.subject ||
      v.verifiedName ||
      PhoneNumber(
        '+' + jid.replace('@s.whatsapp.net', ''),
      ).getNumber('international')
    );
  };

  // Vcard Functionality
  conn.sendContact = async (jid, kon, quoted = '', opts = {}) => {
    let list = [];
    for (let i of kon) {
      list.push({
        displayName: await conn.getName(i + '@s.whatsapp.net'),
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await conn.getName(
          i + '@s.whatsapp.net',
        )}\nFN:${global.OwnerName
          }\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nitem2.EMAIL;type=INTERNET:${global.email
          }\nitem2.X-ABLabel:GitHub\nitem3.URL:https://github.com/${global.github
          }/khan-xmd\nitem3.X-ABLabel:GitHub\nitem4.ADR:;;${global.location
          };;;;\nitem4.X-ABLabel:Region\nEND:VCARD`,
      });
    }
    conn.sendMessage(
      jid,
      {
        contacts: {
          displayName: `${list.length} Contact`,
          contacts: list,
        },
        ...opts,
      },
      { quoted },
    );
  };

  // Status aka brio
  conn.setStatus = status => {
    conn.query({
      tag: 'iq',
      attrs: {
        to: '@s.whatsapp.net',
        type: 'set',
        xmlns: 'status',
      },
      content: [
        {
          tag: 'status',
          attrs: {},
          content: Buffer.from(status, 'utf-8'),
        },
      ],
    });
    return status;
  };
  conn.serializeM = mek => sms(conn, mek, store);
}

app.get("/", (req, res) => {
  res.send("NYX MD STARTED ✅");
});
app.listen(port, () => console.log(`Server listening on port http://localhost:${port}`));
