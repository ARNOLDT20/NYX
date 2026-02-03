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
        const urlRegex = /(https?:\/\/[^\s]+)/i;
        let buffer = null;
        let filename = 'file';

        // Check for URL in q argument
        const urlText = (q && q.toString().trim()) || '';
        const urlMatch = urlText ? urlText.match(urlRegex) : null;

        if (urlMatch && urlMatch[0]) {
            // Download from URL
            const mediaUrl = urlMatch[0];
            try {
                const res = await axios.get(mediaUrl, { responseType: 'arraybuffer', timeout: 30000 });
                buffer = Buffer.from(res.data);
                try {
                    const parsed = new URL(mediaUrl);
                    const base = path.basename(parsed.pathname);
                    if (base) filename = base;
                } catch (e) { }
            } catch (e) {
                return reply('❌ Failed to fetch the provided URL.');
            }
        } else {
            // Try to download quoted media
            const supportedTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];
            const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            if (quotedMsg) {
                const msgType = Object.keys(quotedMsg)[0];
                if (supportedTypes.includes(msgType)) {
                    try {
                        buffer = await conn.downloadMediaMessage(quotedMsg[msgType]);
                        if (buffer && quotedMsg[msgType]?.fileName) {
                            filename = quotedMsg[msgType].fileName;
                        }
                    } catch (e) {
                        console.error('Download error:', e.message);
                    }
                }
            }

            if (!buffer) return reply('❌ Reply to media or provide a URL.');
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

        // Prepare buttons for user to copy or visit the uploaded URL
        const uploadedUrl = String(data).trim();
        const buttons = [
            {
                buttonId: `copyurl_${uploadedUrl}`,
                buttonText: { displayText: '📋 Copy URL' },
                type: 1
            },
            {
                buttonId: `visiturl_${uploadedUrl}`,
                buttonText: { displayText: '🔗 Visit' },
                type: 1
            }
        ];

        const message = {
            text: `✅ Uploaded Successfully!\n\n${uploadedUrl}\n\nTap a button to copy or visit the link.`,
            footer: '✨ NYX-XD Upload',
            buttons: buttons,
            headerType: 1
        };

        try {
            await conn.sendMessage(from, message, { quoted: m });
        } catch (e) {
            // Fallback to plain text if buttons fail
            await conn.sendMessage(from, { text: `✅ Uploaded Successfully!\n\n${uploadedUrl}` }, { quoted: m });
        }

    } catch (err) {
        console.error('URL2 Error:', err);
        await reply(`❌ Error: ${err.message}`);
    }
});
