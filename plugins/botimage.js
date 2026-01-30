const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Helper to persist a key=value into config.env
function saveConfig(key, value) {
    try {
        const envPath = path.join(__dirname, '..', 'config.env');
        let content = '';
        if (fs.existsSync(envPath)) content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split(/\r?\n/).filter(Boolean);
        const kv = `${key}=${value}`;
        let found = false;
        const out = lines.map(line => {
            if (line.startsWith(key + '=')) {
                found = true;
                return kv;
            }
            return line;
        });
        if (!found) out.push(kv);
        fs.writeFileSync(envPath, out.join('\n'), 'utf8');
        process.env[key] = value;
        return true;
    } catch (e) {
        console.error('Failed to save config', e);
        return false;
    }
}

// PRIMARY COMMAND: Reply to image or provide URL
cmd({
    pattern: "botimage",
    alias: ["setmenuimage", "menuimage"],
    desc: "Set the menu image by replying to an image or providing an image URL",
    category: "settings",
    react: "🖼️",
    filename: __filename
}, async (conn, mek, m, { from, args, quoted, isCreator, isGroup, isAdmins, reply, sender }) => {
    // Allow owner everywhere; in groups allow group admins, creator, or sudo users
    // Load sudo list
    let sudoList = [];
    try {
        const sudoPath = path.join(__dirname, '..', 'assets', 'sudo.json');
        if (fs.existsSync(sudoPath)) sudoList = JSON.parse(fs.readFileSync(sudoPath, 'utf8')) || [];
    } catch (e) {
        console.error('Failed reading sudo.json', e);
    }

    const isSudo = sudoList.includes(sender) || sudoList.includes(sender.replace('@s.whatsapp.net', ''));

    if (isGroup) {
        if (!isAdmins && !isCreator && !isSudo) return reply("❌ Only a group admin, sudo user, or the owner can use this command!");
    } else {
        if (!isCreator && !isSudo) return reply("❌ Only the owner or a sudo user can use this command!");
    }

    try {
        // METHOD 1: If replied to an image
        if (quoted && quoted.mtype === 'imageMessage') {
            await reply("⏳ Processing your image...");
            try {
                const imageBuffer = await conn.downloadMediaMessage(quoted);

                // Save to assets folder
                const targetDir = path.join(__dirname, '..', 'assets');
                if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

                // Save with timestamp to ensure unique filename
                const timestamp = Date.now();
                const imagePath = path.join(targetDir, `menu_${timestamp}.jpg`);
                fs.writeFileSync(imagePath, imageBuffer);

                // Update config with local path (relative for portability)
                const relativePath = `./assets/menu_${timestamp}.jpg`;
                config.MENU_IMAGE_URL = imagePath;
                saveConfig('MENU_IMAGE_URL', imagePath);

                return reply(`✅ *Menu image updated successfully!*\n\n📁 Saved to: ${imagePath}\n💾 Persisted to config.env`);
            } catch (downloadErr) {
                console.error('Download error:', downloadErr);
                return reply(`❌ Failed to download image: ${downloadErr.message}`);
            }
        }

        // METHOD 2: If URL provided as argument
        const url = args && args.length ? args.join(' ').trim() : null;
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            await reply("⏳ Validating image URL...");
            try {
                // Test if URL returns a valid image
                const response = await axios.head(url, { timeout: 10000 });
                const contentType = response.headers['content-type'];

                if (!contentType || !contentType.includes('image')) {
                    return reply("❌ URL does not point to a valid image. Please check and try again.");
                }

                // Update config
                config.MENU_IMAGE_URL = url;
                saveConfig('MENU_IMAGE_URL', url);

                return reply(`✅ *Menu image updated successfully!*\n\n🔗 URL: ${url}\n💾 Persisted to config.env`);
            } catch (urlErr) {
                console.error('URL validation error:', urlErr);
                return reply(`❌ Could not validate URL: ${urlErr.message}`);
            }
        }

        return reply(`❌ *Usage:*\n\n*Method 1:* Reply to an image\n.botimage\n\n*Method 2:* Provide a URL\n.botimage https://example.com/image.jpg`);
    } catch (err) {
        console.error('botimage error', err);
        return reply(`❌ Error setting menu image: ${err.message}`);
    }
});

// SECONDARY COMMAND: Simpler, guaranteed to work
cmd({
    pattern: "setimage",
    alias: ["changeimage", "updateimage", "image"],
    desc: "Quick image URL setter (just paste URL)",
    category: "settings",
    react: "🖼️",
    filename: __filename
}, async (conn, mek, m, { from, args, quoted, isCreator, isGroup, isAdmins, reply, sender }) => {
    // Permission check
    let sudoList = [];
    try {
        const sudoPath = path.join(__dirname, '..', 'assets', 'sudo.json');
        if (fs.existsSync(sudoPath)) sudoList = JSON.parse(fs.readFileSync(sudoPath, 'utf8')) || [];
    } catch (e) { }

    const isSudo = sudoList.includes(sender) || sudoList.includes(sender.replace('@s.whatsapp.net', ''));
    if (isGroup && !isAdmins && !isCreator && !isSudo) return reply("❌ Admin/Owner/Sudo only!");
    if (!isGroup && !isCreator && !isSudo) return reply("❌ Owner/Sudo only!");

    try {
        // Method 1: Replied image
        if (quoted && quoted.mtype === 'imageMessage') {
            const imageBuffer = await conn.downloadMediaMessage(quoted);
            const targetDir = path.join(__dirname, '..', 'assets');
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

            const imagePath = path.join(targetDir, `menu_${Date.now()}.jpg`);
            fs.writeFileSync(imagePath, imageBuffer);

            config.MENU_IMAGE_URL = imagePath;
            saveConfig('MENU_IMAGE_URL', imagePath);

            return reply(`✅ Image changed! (local)\n📁 ${imagePath}`);
        }

        // Method 2: URL argument
        const url = args && args.length ? args.join(' ').trim() : null;
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            try {
                await axios.head(url, { timeout: 5000 });
            } catch (e) {
                return reply(`❌ URL unreachable: ${e.message}`);
            }

            config.MENU_IMAGE_URL = url;
            saveConfig('MENU_IMAGE_URL', url);

            return reply(`✅ Image changed!\n🔗 ${url}`);
        }

        return reply("❌ Reply to image or provide URL\n\nExample: .setimage https://example.com/img.jpg");
    } catch (err) {
        console.error('setimage error:', err);
        return reply(`❌ ${err.message}`);
    }
});
