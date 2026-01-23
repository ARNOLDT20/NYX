const axios = require('axios');
const config = require('../config');
const { cmd, commands } = require('../command');
const { sleep } = require('../lib/functions');
const { triggerHerokuRedeploy } = require('./tool-restart');

cmd({
    pattern: "update",
    alias: ["sync", "up"],
    react: "📡",
    desc: "update the bot",
    category: "owner",
    filename: __filename
},
    async (conn, mek, m, {
        from, quoted, body, isCmd, command, args, q,
        isGroup, sender, senderNumber, botNumber2, botNumber,
        pushname, isMe, isOwner, isCreator, groupMetadata,
        groupName, participants, groupAdmins, isBotAdmins,
        isAdmins, reply
    }) => {
        try {
            if (!isCreator) {
                return reply("🚫 *This command is only for the bot owner (creator).*");
            }

            const { exec } = require("child_process");
            reply("📡 *Syncing & updating bot...\n🚀 Triggering Heroku redeploy...*");
            await sleep(1500);

            // Git pull to sync latest changes
            exec("git pull", (error, stdout, stderr) => {
                if (error) {
                    console.log("Git pull error:", error);
                } else {
                    console.log("Git sync successful");
                }
            });

            // Trigger Heroku redeploy
            const herokuTriggered = await triggerHerokuRedeploy(reply);
            
            // Also restart PM2 locally
            exec("pm2 restart all", (error, stdout, stderr) => {
                if (error) {
                    console.log("Restart error:", error);
                    return;
                }
                console.log("Bot updated and restarted successfully");
            });

            await sleep(2000);
            if (herokuTriggered) {
                reply('✅ *Bot synchronized and Heroku deployment initiated!*');
            } else {
                reply('✅ *Bot synchronized and restarted locally!*');
            }
        } catch (e) {
            console.log(e);
            reply(`${e}`);
        }
    });
