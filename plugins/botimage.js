const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');
const path = require('path');

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

cmd({
    pattern: "botimage",
    desc: "Set the menu image by replying to an image or providing an image URL",
    category: "settings",
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
        // If replied to an image
        if (quoted && (quoted.message && (quoted.message.imageMessage || quoted.mtype === 'imageMessage'))) {
            const media = quoted.message ? quoted.message : quoted;
            // download and save media to assets/menu_img
            const targetDir = path.join(__dirname, '..', 'assets');
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
            const baseName = path.join(targetDir, 'menu_image');
            const saved = await conn.downloadAndSaveMediaMessage(media, baseName, true);
            // saved contains the filename with extension
            config.MENU_IMAGE_URL = saved;
            saveConfig('MENU_IMAGE_URL', saved);
            return reply(`✅ Menu image updated and saved as ${saved}`);
        }

        // If an argument provided, treat it as URL
        const url = args && args.length ? args[0].trim() : null;
        const { isUrl } = require('../lib/functions');
        if (url && isUrl(url)) {
            config.MENU_IMAGE_URL = url;
            saveConfig('MENU_IMAGE_URL', url);
            return reply(`✅ Menu image set to URL: ${url}`);
        }

        return reply("❌ Usage:\n - Reply to an image with .botimage to set it as menu image\n - Or: .botimage <image_url>");
    } catch (err) {
        console.error('botimage error', err);
        return reply(`❌ Error setting menu image: ${err.message}`);
    }
});
