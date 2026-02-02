const { cmd } = require('../command');
const { sms } = require('../lib/smsg');
const { getBuffer } = require('../lib/functions');
const FormData = require('form-data');
const axios = require('axios');

cmd({
    pattern: 'url2',
    alias: ['upload'],
    desc: 'Upload media to Catbox and get URL',
    category: 'download',
    react: '📤',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        // Determine media
        let mediaMessage = m.quoted ? m.quoted : m;
        let mediaType = mediaMessage.mtype;
        if (!['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'].includes(mediaType)) {
            return reply('❌ Please send or reply to a media file to upload.');
        }

        // Download media
        let buffer = await mediaMessage.download();
        if (!buffer) return reply('❌ Failed to download media.');

        // Prepare FormData
        let form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('userhash', '');
        form.append('fileToUpload', buffer, { filename: 'file' });

        // Upload to Catbox
        const { data } = await axios.post('https://catbox.moe/user/api.php', form, { headers: form.getHeaders() });

        // Send result with copy button
        const buttons = [
            {
                buttonId: 'copyurl',
                buttonText: { displayText: '📋 Copy URL' },
                type: 1
            }
        ];

        await conn.sendMessage(from, {
            text: `✅ Uploaded Successfully!\n\n${data}`,
            buttons,
            headerType: 1,
            contextInfo: { mentionedJid: [sender] }
        }, { quoted: m });

    } catch (e) {
        console.error('URL2 Error:', e);
        await reply(`❌ Error: ${e.message}`);
    }
});
