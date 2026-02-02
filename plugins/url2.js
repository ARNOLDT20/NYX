const { cmd } = require('../command');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

cmd({
    pattern: 'url2',
    alias: ['upload'],
    desc: 'Upload media to Catbox and get URL',
    category: 'download',
    react: '📤',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply, q }) => {
    try {
        // Allow either: an URL provided as argument/text OR a media message (direct or quoted)
        const urlRegex = /(https?:\/\/[^\s]+)/i;

        // Attempt to find a URL from `q`, quoted text, or message body
        let possibleText = (q && q.toString().trim()) ||
            (m.quoted && (m.quoted.text || m.quoted.message?.conversation)) ||
            (m.text || m.body || '');

        let buffer = null;
        let filename = 'file';

        // If an URL is present, fetch it and use as upload source
        const urlMatch = possibleText && possibleText.match ? possibleText.match(urlRegex) : null;
        if (urlMatch && urlMatch[0]) {
            const mediaUrl = urlMatch[0];
            try {
                const res = await axios.get(mediaUrl, { responseType: 'arraybuffer', timeout: 30000 });
                buffer = Buffer.from(res.data);
                // Try to infer filename from URL path
                try {
                    const parsed = new URL(mediaUrl);
                    const base = path.basename(parsed.pathname);
                    if (base) filename = base;
                } catch (e) {
                    // ignore
                }
            } catch (e) {
                return reply('❌ Failed to fetch the provided URL.');
            }
        } else {
            // No URL: expect a media message (either quoted or direct)
            let mediaMessage = m.quoted ? m.quoted : m;
            if (!mediaMessage || !mediaMessage.message)
                return reply('❌ Please send or reply to a media file to upload, or provide a direct URL.');

            // Detect media type
            let messageType = Object.keys(mediaMessage.message)[0];
            const supportedTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];

            if (!supportedTypes.includes(messageType))
                return reply('❌ Unsupported message type. Send or reply to an image, video, audio, document or sticker, or provide a URL.');

            // Download media buffer
            buffer = await conn.downloadMediaMessage(mediaMessage).catch(() => null);
            if (!buffer) return reply('❌ Failed to download media.');
            // Try to get filename for documents/stickers
            try {
                if (mediaMessage.message.documentMessage && mediaMessage.message.documentMessage.fileName) {
                    filename = mediaMessage.message.documentMessage.fileName;
                }
            } catch (e) { /* ignore */ }
        }

        // Prepare Catbox upload
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('userhash', '');
        form.append('fileToUpload', buffer, { filename });

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
