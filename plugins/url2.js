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
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        let buffer;
        let filename = 'file';

        // ========= 1. URL =========
        const urlRegex = /(https?:\/\/[^\s]+)/i;

        if (q && urlRegex.test(q)) {
            const url = q.match(urlRegex)[0];

            const res = await axios.get(url, { responseType: 'arraybuffer' });
            buffer = Buffer.from(res.data);

            filename = path.basename(new URL(url).pathname) || 'file';
        }

        // ========= 2. MEDIA (FIXED PART) =========
        else {
            const mediaMsg = m.quoted || m;

            if (!mediaMsg.message)
                return reply('❌ Send or reply to a media file.');

            const type = Object.keys(mediaMsg.message)[0];

            const allowed = [
                'imageMessage',
                'videoMessage',
                'audioMessage',
                'documentMessage',
                'stickerMessage'
            ];

            if (!allowed.includes(type))
                return reply('❌ Unsupported media type.');

            buffer = await conn.downloadMediaMessage(mediaMsg);

            filename =
                mediaMsg.message[type]?.fileName ||
                `${type}.${type.replace('Message', '')}`;
        }

        // ========= 3. UPLOAD =========
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', buffer, { filename });

        const { data } = await axios.post(
            'https://catbox.moe/user/api.php',
            form,
            { headers: form.getHeaders() }
        );

        // ========= 4. RESULT =========
        await reply(`✅ Uploaded Successfully!\n\n${data}`);

    } catch (e) {
        console.error(e);
        reply('❌ Error: ' + e.message);
    }
});
