const { cmd, commands } = require('../command');
const os = require('os');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson, jsonformat } = require('../lib/functions');
const config = require('../config');

/**
 * Upload file to Catbox and return URL
 * @param {Buffer|String} file Buffer or URL
 * @param {String} filename optional
 * @returns {Promise<String>} Catbox URL
 */
async function uploadToCatbox(file, filename = 'file') {
    try {
        const form = new FormData();

        if (Buffer.isBuffer(file)) {
            form.append('fileToUpload', file, { filename });
        } else if (typeof file === 'string' && /^https?:\/\//.test(file)) {
            // fetch remote URL
            const res = await axios.get(file, { responseType: 'arraybuffer' });
            form.append('fileToUpload', Buffer.from(res.data), { filename });
        } else {
            throw new Error('Invalid file input');
        }

        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: { ...form.getHeaders() }
        });

        return response.data.trim(); // returns Catbox URL
    } catch (e) {
        console.error('Catbox Upload Error:', e);
        throw e;
    }
}

// Command example
cmd({
    pattern: 'url2',
    alias: ['uploadcatbox', 'catbox'],
    desc: 'Upload media to Catbox and get URL with copy button',
    category: 'tools',
    react: '📤',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        let media;
        if (m.quoted) {
            media = await m.quoted.download(); // use your sms download helper
        } else if (m.text && m.text.includes('http')) {
            media = m.text;
        } else {
            return reply('❌ Reply to media or send a URL to upload');
        }

        const catboxUrl = await uploadToCatbox(media, 'uploadfile');

        const buttons = [
            {
                buttonId: `copyurl ${catboxUrl}`,
                buttonText: { displayText: '📋 Copy URL' },
                type: 1
            }
        ];

        await conn.sendMessage(
            from,
            {
                text: `✅ Uploaded to Catbox:\n${catboxUrl}`,
                buttons,
                headerType: 1,
                contextInfo: { mentionedJid: [sender] }
            },
            { quoted: mek }
        );
    } catch (e) {
        console.error('URL2 Command Error:', e);
        reply(`❌ Failed to upload: ${e.message}`);
    }
});

module.exports = { uploadToCatbox };
