const axios = require('axios');
const config = require('../config');
const { cmd, commands } = require('../command');
const { sleep } = require('../lib/functions');

// Function to trigger Heroku redeploy
async function triggerHerokuRedeploy(reply) {
    try {
        if (!config.HEROKU_API_KEY || !config.HEROKU_APP_NAME) {
            console.warn('⚠️ Heroku API key or app name not configured');
            return false;
        }

        const response = await axios.post(
            `https://api.heroku.com/apps/${config.HEROKU_APP_NAME}/dynos`,
            { command: 'restart' },
            {
                headers: {
                    'Accept': 'application/vnd.heroku+json;version=3',
                    'Authorization': `Bearer ${config.HEROKU_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.status === 201 || response.status === 200) {
            console.log('✅ Heroku redeploy triggered successfully');
            if (reply) reply('🚀 *Heroku deployment restarting...*');
            return true;
        }
    } catch (error) {
        console.error('❌ Heroku redeploy error:', error.message);
        if (reply && error.response?.status === 401) {
            reply('⚠️ Heroku authentication failed. Check your API key.');
        }
        return false;
    }
}

cmd({
    pattern: "restart",
    alias: ["rebot", "reboot"],
    react: "🕸️",
    desc: "Restart the bot",
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
            reply("♻️ Restarting the bot...\n🚀 Triggering Heroku redeploy...");
            await sleep(1500);

            // Try Heroku redeploy first
            const herokuTriggered = await triggerHerokuRedeploy(null);

            // Also restart PM2 locally
            exec("pm2 restart all");

            if (herokuTriggered) {
                console.log('✅ Both local and Heroku restart initiated');
            }
        } catch (e) {
            console.log(e);
            reply(`${e}`);
        }
    });

module.exports = { triggerHerokuRedeploy };
