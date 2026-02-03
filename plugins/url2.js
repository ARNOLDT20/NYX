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
}, async (conn, mek, m, { from, sender, reply, q, args, quoted }) => {
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
            const supportedTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];

            // Check quoted message first
            if (quoted && quoted.mtype && supportedTypes.includes(quoted.mtype)) {
                try {
                    buffer = await conn.downloadMediaMessage(quoted);
                    if (buffer && quoted.msg?.documentMessage?.fileName) {
                        filename = quoted.msg.documentMessage.fileName;
                    }
                } catch (e) {
                    console.error('Error downloading quoted media:', e.message);
                }
            }

            // If not found in quoted, try current message m
            if (!buffer && m.mtype && supportedTypes.includes(m.mtype)) {
                try {
                    buffer = await conn.downloadMediaMessage(m);
                    if (buffer && m.msg?.documentMessage?.fileName) {
                        filename = m.msg.documentMessage.fileName;
                    }
                } catch (e) {
                    console.error('Error downloading current message media:', e.message);
                }
            }

            // If still not found, try mek (original message object)
            if (!buffer && mek && mek.message) {
                const mekType = Object.keys(mek.message)[0];
                if (supportedTypes.includes(mekType)) {
                    try {
                        buffer = await conn.downloadMediaMessage(mek.message[mekType]);
                        if (buffer && mek.message[mekType]?.fileName) {
                            filename = mek.message[mekType].fileName;
                        }
                    } catch (e) {
                        console.error('Error downloading mek media:', e.message);
                    }
                }
            }

            if (!buffer) return reply('❌ Unsupported message type. Please send or reply to: image, video, audio, document, sticker — or provide a URL.');
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
