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
    console.log('[url2] START: sender=' + sender + ', q=' + !!q);

    try {
        let buffer = null;
        let filename = 'file';

        // Step 1: Check for URL in q
        const urlRegex = /(https?:\/\/[^\s]+)/i;
        const urlText = (q && typeof q === 'string') ? q.trim() : '';
        const urlMatch = urlText.match(urlRegex);

        if (urlMatch && urlMatch[0]) {
            console.log('[url2] Found URL:', urlMatch[0]);
            try {
                const res = await axios.get(urlMatch[0], { responseType: 'arraybuffer', timeout: 30000 });
                buffer = Buffer.from(res.data);
                console.log('[url2] Downloaded buffer, size:', buffer.length);
                try {
                    const parsed = new URL(urlMatch[0]);
                    filename = path.basename(parsed.pathname) || 'file';
                } catch (e) {}
            } catch (e) {
                console.error('[url2] URL fetch failed:', e.message);
                return reply('❌ Failed to download from URL.');
            }
        } else {
            console.log('[url2] No URL in q, checking quoted message');
            // Step 2: Try quoted media
            const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg) {
                console.log('[url2] No quoted message found');
                return reply('❌ Reply to media or provide a URL.\n\nExample: .url2 https://example.com/image.jpg');
            }

            const msgType = Object.keys(quotedMsg)[0];
            console.log('[url2] Quoted message type:', msgType);
            const supportedTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];

            if (!supportedTypes.includes(msgType)) {
                return reply('❌ Unsupported media type. Supported: image, video, audio, document, sticker.');
            }

            try {
                console.log('[url2] Downloading quoted media...');
                buffer = await conn.downloadMediaMessage(quotedMsg[msgType]);
                console.log('[url2] Downloaded buffer, size:', buffer ? buffer.length : 'null');
                if (!buffer) return reply('❌ Failed to download media.');
                if (quotedMsg[msgType]?.fileName) {
                    filename = quotedMsg[msgType].fileName;
                }
            } catch (e) {
                console.error('[url2] Media download failed:', e.message);
                return reply('❌ Failed to download media: ' + (e.message || 'Unknown error'));
            }
        }

        if (!buffer) {
            console.log('[url2] Buffer is null after all attempts');
            return reply('❌ Failed to get file buffer.');
        }

        // Step 3: Upload to Catbox
        console.log('[url2] Uploading to Catbox, filename:', filename);
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('userhash', '');
        form.append('fileToUpload', buffer, { filename });

        let uploadRes;
        try {
            uploadRes = await axios.post('https://catbox.moe/user/api.php', form, {
                headers: form.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 120000
            });
        } catch (e) {
            console.error('[url2] Catbox upload failed:', e.message);
            return reply('❌ Upload to Catbox failed: ' + (e.message || 'Unknown error'));
        }

        const uploadedUrl = String(uploadRes.data).trim();
        console.log('[url2] SUCCESS: ' + uploadedUrl);

        // Step 4: Send result with buttons
        const buttons = [
            { buttonId: 'copy', buttonText: { displayText: '📋 Copy URL' }, type: 1 },
            { buttonId: 'visit', buttonText: { displayText: '🔗 Visit' }, type: 1 }
        ];

        const msg = {
            text: '✅ *Uploaded Successfully!*\n\n' + uploadedUrl + '\n\nTap a button to copy or visit.',
            footer: 'NYX-XD Upload',
            buttons: buttons,
            headerType: 1
        };

        try {
            await conn.sendMessage(from, msg, { quoted: m });
        } catch (e) {
            console.log('[url2] Button send failed, using plain text:', e.message);
            await reply('✅ Uploaded!\n\n' + uploadedUrl);
        }

    } catch (err) {
        console.error('[url2] FATAL ERROR:', err.message || err);
        reply('❌ Error: ' + (err.message || 'Unknown error'));
    }
});
