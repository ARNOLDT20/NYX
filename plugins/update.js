const { cmd } = require('../command');
const config = require('../config');
const { exec } = require('child_process');
const axios = require('axios');
const util = require('util');
const execPromise = util.promisify(exec);

cmd({
    pattern: "update",
    alias: ["upgrade", "redeploy"],
    desc: "Update and redeploy the bot",
    category: "owner",
    react: "♻️",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, reply }) => {
    if (!isCreator) return reply("❌ Only the owner or sudo user can use this command!");

    try {
        reply("⏳ Starting bot update and redeploy...");

        // Step 1: Git pull latest changes
        console.log('📥 Pulling latest changes from git...');
        try {
            const { stdout, stderr } = await execPromise('git pull origin main 2>&1', {
                cwd: __dirname.replace(/plugins$/, ''),
                timeout: 30000
            });
            console.log('Git pull output:', stdout || stderr);
        } catch (gitError) {
            console.log('⚠️ Git pull warning:', gitError.message);
            // Continue even if git pull fails (might not be a git repo)
        }

        // Step 2: Trigger Heroku redeploy if configured
        if (config.HEROKU_API_KEY && config.HEROKU_APP_NAME) {
            console.log('🚀 Triggering Heroku build...');
            try {
                const herokuBuildResponse = await axios.post(
                    `https://api.heroku.com/apps/${config.HEROKU_APP_NAME}/builds`,
                    {
                        source_blob: {
                            url: `https://github.com/YOUR_USERNAME/YOUR_REPO/archive/main.zip`
                        }
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${config.HEROKU_API_KEY}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/vnd.heroku+json;version=3'
                        }
                    }
                );

                reply(`✅ *Bot Update Initiated!*\n\n🔄 Status: Redeploy in progress\n📱 The bot will restart shortly\n⏱️ Please wait a few moments...`);
                console.log('Heroku build triggered:', herokuBuildResponse.status);
                return;
            } catch (herokuError) {
                console.error('Heroku deploy error:', herokuError.message);
                // If Heroku fails, try local restart
            }
        }

        // Step 3: If no Heroku config, restart locally
        reply(`✅ *Bot Updated!*\n\n📦 Latest code pulled\n🔄 Restarting bot locally...\n⏱️ Please wait...`);

        // Trigger a restart after a short delay
        setTimeout(() => {
            console.log('🔄 Restarting bot...');
            process.exit(0);
        }, 2000);

    } catch (error) {
        console.error('Update error:', error);
        reply(`❌ Error during update: ${error.message}`);
    }
});

