const { cmd } = require('../command');
const { getPrefix } = require('../lib/prefix');
const config = require('../config');
const moment = require('moment-timezone');

cmd({
    pattern: 'aimenu',
    alias: ['ai'],
    desc: 'Show all AI commands',
    category: 'ai',
    react: '🤖',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        const prefix = getPrefix();
        const time = moment().tz(config.TIMEZONE || 'Africa/Nairobi').format('HH:mm:ss');
        const date = moment().tz(config.TIMEZONE || 'Africa/Nairobi').format('dddd, DD MMMM YYYY');

        const aiRows = [
            { title: "Chat with AI", rowId: `${prefix}chatgpt`, description: "Talk with the AI" },
            { title: "Image AI", rowId: `${prefix}aiimg`, description: "Generate AI images" },
            { title: "AI Story", rowId: `${prefix}aistory`, description: "Generate AI story" }
        ];

        const listMessage = {
            text: "*🤖 AI MENU*\n\nSelect a command below:",
            footer: `🌟 NYX-XD Bot | Blaze Tech 🌟\n👤 User: @${sender.split('@')[0]}\n
