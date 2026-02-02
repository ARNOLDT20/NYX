const { cmd, commands } = require('../command');
const os = require('os');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson, jsonformat } = require('../lib/functions');
const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');

cmd({
    pattern: 'url2',
    alias: ['upload'],
    desc: 'Upload media to Catbox and get URL',
    category: 'download',
    react: '📤',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        // Determine actual message containing media
        let mediaMessage = m.quoted ? m.quoted : m;

        if (!mediaMessage.message)
            return reply('❌ Please send or reply to a media file to upload.');

        // Detect media type
        let messageType = Object.keys(mediaMessage.message)[0];
        const supportedTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];

        if (!supportedTypes.includes(messageType))
            return reply('❌ Please send or reply to a media file to upload.');

        // Download media buffer
        const buffer = await conn.downloadMediaMessage(mediaMessage).catch(() => null);
        if (!buffer) return reply('❌ Failed to download media.');

        // Prepare Catbox upload
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('userhash', '');
        form.append('fileToUpload', buffer, { filename: 'file' });

        // Upload to Catbox
        const { data } = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders()
        });

        // Send result
        await conn.sendMessage(from, {
            text: `✅ Uploaded Successfully!\n\n${data}`
        }, { quoted: m });

    } catch (err) {
        console.error('URL2 Error:', err);
        await reply(`❌ Error: ${err.message}`);
    }
});
