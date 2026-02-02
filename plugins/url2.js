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

            // Helper to attempt download from several possible shapes
            const tryDownload = async (obj) => {
                try {
                    return await conn.downloadMediaMessage(obj);
                } catch (e) {
                    return null;
                }
            };

            // First, prefer `quoted` wrapper if present
            if (quoted) {
                // If quoted has mtype (normalized by serializer)
                if (quoted.mtype && supportedTypes.includes(quoted.mtype)) {
                    buffer = await tryDownload(quoted);
                    if (buffer && quoted.msg?.documentMessage?.fileName) filename = quoted.msg.documentMessage.fileName;
                } else {
                    // Try raw inner message shapes
                    const innerKey = quoted.msg ? Object.keys(quoted.msg)[0] : (quoted.message ? Object.keys(quoted.message)[0] : null);
                    if (innerKey && supportedTypes.includes(innerKey)) {
                        const inner = quoted.msg ? quoted.msg : quoted.message;
                        buffer = await tryDownload(inner[innerKey]);
                        if (buffer && inner[innerKey]?.fileName) filename = inner[innerKey].fileName;
                    }
                }
            }

            // If still not found, try the current message `m` wrapper
            if (!buffer) {
                if (m.mtype && supportedTypes.includes(m.mtype)) {
                    buffer = await tryDownload(m);
                    if (buffer && m.msg?.documentMessage?.fileName) filename = m.msg.documentMessage.fileName;
                } else {
                    const innerKey2 = m.msg ? Object.keys(m.msg)[0] : (m.message ? Object.keys(m.message)[0] : null);
                    if (innerKey2 && supportedTypes.includes(innerKey2)) {
                        const inner2 = m.msg ? m.msg : m.message;
                        buffer = await tryDownload(inner2[innerKey2]);
                        if (buffer && inner2[innerKey2]?.fileName) filename = inner2[innerKey2].fileName;
                    }
                }
            }

            if (!buffer) return reply('❌ Unsupported message type. Send or reply to an image, video, audio, document or sticker, or provide a URL.');
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
